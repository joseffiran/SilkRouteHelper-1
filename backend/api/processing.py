"""
Processing API endpoints for monitoring async operations
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from core.database import get_db
from core.exceptions import NotFoundError, AuthorizationError
from models.user import User
from models.document import Document
from services.async_ocr_service import async_ocr_service
from api.auth import get_current_user

router = APIRouter()

@router.get("/documents/{document_id}/status")
async def get_document_processing_status(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get processing status for a specific document
    """
    # Verify document belongs to current user
    document = db.query(Document).join(Document.shipment).filter(
        Document.id == document_id,
        Document.shipment.has(user_id=current_user.id)
    ).first()
    
    if not document:
        raise NotFoundError("Document", str(document_id))
    
    # Get detailed processing status
    status_info = await async_ocr_service.get_processing_status(document_id)
    
    return {
        "document": {
            "id": document.id,
            "filename": document.original_filename,
            "document_type": document.document_type,
            "shipment_id": document.shipment_id
        },
        "processing": status_info
    }

@router.post("/documents/{document_id}/reprocess")
async def reprocess_document(
    document_id: int,
    force_background: bool = Query(False, description="Force background processing"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Reprocess a document (useful for failed documents or retrying with different settings)
    """
    # Verify document belongs to current user
    document = db.query(Document).join(Document.shipment).filter(
        Document.id == document_id,
        Document.shipment.has(user_id=current_user.id)
    ).first()
    
    if not document:
        raise NotFoundError("Document", str(document_id))
    
    # Start reprocessing
    processing_result = await async_ocr_service.process_document_async(
        document_id=document_id,
        force_background=force_background
    )
    
    return {
        "message": "Document reprocessing started",
        "document_id": document_id,
        "processing": processing_result
    }

@router.get("/processing/health")
async def get_processing_health() -> Dict[str, Any]:
    """
    Get health status of processing workers
    """
    from workers.celery_app import celery_app
    
    # Check Celery worker status
    inspect = celery_app.control.inspect()
    
    try:
        stats = inspect.stats()
        active_tasks = inspect.active()
        
        worker_count = len(stats) if stats else 0
        total_active_tasks = sum(len(tasks) for tasks in active_tasks.values()) if active_tasks else 0
        
        return {
            "status": "healthy" if worker_count > 0 else "unhealthy",
            "workers": {
                "count": worker_count,
                "active_tasks": total_active_tasks,
                "worker_details": stats
            },
            "queues": {
                "enhanced_ocr": "available",
                "template_processing": "available"
            }
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": f"Failed to connect to workers: {str(e)}",
            "workers": {
                "count": 0,
                "active_tasks": 0
            }
        }