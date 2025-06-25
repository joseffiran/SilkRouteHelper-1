import os
import uuid
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session, selectinload

from core.database import get_db
from core.exceptions import NotFoundError
from models.user import User
from models.shipment import Shipment
from models.document import Document, DocumentStatus, DocumentType
from schemas.shipment import ShipmentCreate, ShipmentResponse
from services.shipment_service import create_shipment, get_shipments_by_user
from api.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/shipments/", response_model=ShipmentResponse, status_code=status.HTTP_201_CREATED)
async def create_new_shipment(
    shipment: ShipmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return create_shipment(db=db, shipment=shipment, user_id=current_user.id)

@router.get("/shipments/", response_model=List[ShipmentResponse])
async def read_shipments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    shipments = get_shipments_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return shipments

@router.get("/shipments/{shipment_id}", response_model=ShipmentResponse)
async def read_shipment(
    shipment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shipment = db.query(Shipment).options(
        selectinload(Shipment.documents)
    ).filter(
        Shipment.id == shipment_id,
        Shipment.user_id == current_user.id
    ).first()
    if shipment is None:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment

@router.post("/shipments/{shipment_id}/documents", status_code=status.HTTP_202_ACCEPTED)
async def upload_documents(
    shipment_id: int,
    document_type: str = Form("invoice"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    file: UploadFile = File(...)
):
    """Upload documents for OCR processing to a specific shipment."""
    
    # Verify shipment exists and belongs to current user
    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id,
        Shipment.user_id == current_user.id
    ).first()
    if shipment is None:
        raise NotFoundError("Shipment", str(shipment_id))
    
    # Create upload directory for this shipment
    upload_dir = f"uploads/{shipment_id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    uploaded_files = []
    
    try:
        # Process single file (wrap in list for consistent processing)
        file_list = [file]
        
        for uploaded_file in file_list:
            # Validate file type (images and PDFs)
            if not uploaded_file.content_type or not uploaded_file.content_type.startswith(('image/', 'application/pdf')):
                raise HTTPException(
                    status_code=400, 
                    detail=f"Unsupported file type: {uploaded_file.content_type}. Only images and PDFs are supported."
                )
            
            # Generate unique filename
            file_extension = os.path.splitext(uploaded_file.filename)[1] if uploaded_file.filename else ""
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join(upload_dir, unique_filename)
            
            # Save uploaded file
            with open(file_path, "wb") as buffer:
                content = await uploaded_file.read()
                buffer.write(content)
            
            # Map document type to enum
            try:
                doc_type_enum = DocumentType(document_type.upper())
            except ValueError:
                doc_type_enum = DocumentType.INVOICE  # Default fallback
            
            # Create Document record
            document = Document(
                shipment_id=shipment_id,
                document_type=doc_type_enum,
                original_filename=uploaded_file.filename or "unknown",
                storage_path=file_path,
                status=DocumentStatus.UPLOADED
            )
            db.add(document)
            db.commit()
            db.refresh(document)
            
            uploaded_files.append({
                "original_name": uploaded_file.filename,
                "saved_path": file_path,
                "content_type": uploaded_file.content_type,
                "size": len(content),
                "document_id": document.id
            })
            
            # Process with async OCR service
            try:
                # Import async OCR service to avoid circular dependencies
                from services.async_ocr_service import async_ocr_service
                
                # Use async OCR service for non-blocking processing
                processing_result = await async_ocr_service.process_document_async(
                    document_id=document.id,
                    force_background=False  # Let service decide based on file size
                )
                
                # Log OCR processing result
                logger.info(f"OCR processing result for document {document.id}: {processing_result}")
                    
            except ImportError as import_error:
                logger.error(f"OCR processing unavailable: {str(import_error)}")
                document.status = DocumentStatus.ERROR
                document.extracted_data = {"error": "OCR processing unavailable"}
                db.commit()
            except Exception as ocr_error:
                logger.error(f"OCR processing failed: {str(ocr_error)}")
                document.status = DocumentStatus.ERROR
                document.extracted_data = {"error": str(ocr_error)}
                db.commit()
        
        # Update shipment status to processing
        db.query(Shipment).filter(Shipment.id == shipment_id).update({
            "status": "processing"
        })
        db.commit()
        
        return {
            "message": f"Successfully uploaded {len(uploaded_files)} files for processing",
            "shipment_id": shipment_id,
            "files": uploaded_files,
            "status": "processing"
        }
        
    except Exception as e:
        # Clean up uploaded files on error
        for file_info in uploaded_files:
            if os.path.exists(file_info["saved_path"]):
                os.remove(file_info["saved_path"])
        
        raise HTTPException(
            status_code=500,
            detail=f"File upload failed: {str(e)}"
        )
