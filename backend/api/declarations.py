"""
Declaration API endpoints for auto-fill functionality
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from datetime import datetime
import json

from core.database import get_db
from api.auth import get_current_user
from models.user import User
from models.document import Document
from models.declaration_template import DeclarationTemplate
from services.declaration_generation_service import DeclarationGenerationService
from services.enhanced_ocr_service import EnhancedOCRService

router = APIRouter()

@router.post("/generate/{document_id}")
async def generate_declaration_from_document(
    document_id: int,
    template_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate auto-filled declaration from uploaded document using OCR"""
    
    # Get the document
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.shipment.has(user_id=current_user.id)
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get active template if not specified
    if not template_id:
        active_template = db.query(DeclarationTemplate).filter(
            DeclarationTemplate.is_active == True
        ).first()
        if not active_template:
            raise HTTPException(status_code=400, detail="No active template found")
        template_id = active_template.id
    
    # Initialize services
    declaration_service = DeclarationGenerationService(db)
    
    # Get OCR text from document
    ocr_text = ""
    if document.extracted_data:
        # Try to get OCR text from existing extracted data
        extracted_data = json.loads(document.extracted_data) if isinstance(document.extracted_data, str) else document.extracted_data
        ocr_text = extracted_data.get("text", "")
        
        # If no text available, re-process the document
        if not ocr_text and document.storage_path:
            try:
                ocr_service = EnhancedOCRService()
                ocr_result = await ocr_service.process_document(document.storage_path)
                ocr_text = ocr_result.get("text", "")
                
                # Update document with OCR result
                document.extracted_data = json.dumps(ocr_result)
                db.commit()
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")
    
    if not ocr_text:
        raise HTTPException(status_code=400, detail="No OCR text available for declaration generation")
    
    # Generate declaration
    try:
        result = await declaration_service.generate_declaration_from_ocr(ocr_text, template_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Declaration generation failed: {str(e)}")

@router.get("/templates")
async def list_declaration_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List available declaration templates"""
    
    templates = db.query(DeclarationTemplate).all()
    
    result = []
    for template in templates:
        result.append({
            "id": template.id,
            "name": template.name,
            "is_active": template.is_active,
            "field_count": len(template.fields),
            "created_at": template.created_at,
            "updated_at": template.updated_at
        })
    
    return result

@router.get("/templates/{template_id}/preview")
async def preview_empty_declaration(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get empty declaration form preview for a template"""
    
    template = db.query(DeclarationTemplate).filter(
        DeclarationTemplate.id == template_id
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Create empty declaration structure
    empty_declaration = {
        "template_id": template.id,
        "template_name": template.name,
        "extracted_data": {},  # Empty - will be filled by OCR
        "statistics": {
            "total_fields": len(template.fields),
            "filled_fields": 0,
            "completion_percentage": 0.0,
            "high_confidence_fields": 0,
            "extraction_method": "Manual Entry"
        },
        "fields": []
    }
    
    # Add field definitions
    for field in template.fields:
        field_info = {
            "id": field.field_name,
            "label": field.label_ru,
            "section": field.extraction_rules.get("section", "general"),
            "required": field.extraction_rules.get("required", False),
            "description": field.extraction_rules.get("description", ""),
            "keywords": field.extraction_rules.get("keywords", []),
            "value": "",  # Empty - will be filled by OCR
            "confidence": None
        }
        empty_declaration["fields"].append(field_info)
    
    return empty_declaration

@router.post("/test-ocr")
async def test_ocr_extraction(
    request: Dict[str, int],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Test OCR extraction on a document without generating full declaration"""
    
    # Get the document
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.shipment.has(user_id=current_user.id)
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not document.file_path:
        raise HTTPException(status_code=400, detail="Document file not found")
    
    try:
        # Process document with OCR
        ocr_service = EnhancedOCRService()
        ocr_result = await ocr_service.process_document(document.storage_path)
        
        # Update document with OCR result
        document.extracted_data = json.dumps(ocr_result)
        db.commit()
        
        return {
            "document_id": document.id,
            "ocr_result": ocr_result,
            "text_length": len(ocr_result.get("text", "")),
            "confidence": ocr_result.get("confidence", 0.0),
            "language": ocr_result.get("language", "unknown")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR test failed: {str(e)}")

@router.post("/save-declaration")
async def save_declaration_data(
    declaration_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save user-modified declaration data"""
    
    document_id = declaration_data.get("document_id")
    if not document_id:
        raise HTTPException(status_code=400, detail="Document ID required")
    
    # Get the document
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.shipment.has(user_id=current_user.id)
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Update document with declaration data
    try:
        existing_data = json.loads(document.extracted_data) if document.extracted_data else {}
        existing_data.update({
            "declaration_data": declaration_data,
            "last_modified": str(datetime.utcnow()),
            "modified_by": current_user.id
        })
        
        document.extracted_data = json.dumps(existing_data)
        db.commit()
        
        return {
            "success": True,
            "message": "Declaration data saved successfully",
            "document_id": document.id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save declaration data: {str(e)}")