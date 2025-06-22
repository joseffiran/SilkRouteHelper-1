import os
import uuid
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from core.database import get_db
from models.user import User
from models.shipment import Shipment
from models.document import Document, DocumentType, DocumentStatus
from schemas.document import DocumentResponse
from api.auth import get_current_user
from storage.file_manager import file_storage

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/shipments/{shipment_id}/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    shipment_id: int,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a single document with specified type for OCR processing."""
    
    # Verify shipment exists and belongs to user
    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id,
        Shipment.user_id == current_user.id
    ).first()
    
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith(('image/', 'application/pdf')):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Only images and PDFs are supported."
        )
    
    # Convert string to enum
    try:
        doc_type_enum = DocumentType(document_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid document type: {document_type}")
    
    # Save file using file storage manager
    try:
        file_path = file_storage.save_uploaded_file(file, shipment_id, document_type)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Create document record
    document = Document(
        shipment_id=shipment_id,
        document_type=doc_type_enum,
        original_filename=file.filename or "unknown",
        storage_path=file_path,
        status=DocumentStatus.UPLOADED
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    # Process document with OCR template engine
    try:
        from backend.workers.ocr_template_engine import ocr_engine
        # Process immediately for demo purposes (could be moved to background task)
        extracted_data = ocr_engine.process_document(document.id)
        logger.info(f"Document {document.id} processed successfully with OCR template engine")
    except Exception as e:
        logger.error(f"OCR processing failed for document {document.id}: {str(e)}")
        # Document status will be updated by the OCR engine
    
    return document

@router.get("/shipments/{shipment_id}/documents", response_model=List[DocumentResponse])
async def get_shipment_documents(
    shipment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all documents for a specific shipment."""
    
    # Verify shipment exists and belongs to user
    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id,
        Shipment.user_id == current_user.id
    ).first()
    
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    documents = db.query(Document).filter(Document.shipment_id == shipment_id).all()
    return documents

@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific document with its extracted data."""
    
    document = db.query(Document).join(Shipment).filter(
        Document.id == document_id,
        Shipment.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document