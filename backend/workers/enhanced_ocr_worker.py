"""
Enhanced OCR Worker for background processing
Celery worker that handles OCR processing asynchronously
"""

import logging
import sys
import os
from typing import Dict, Any

# Add backend directory to path for imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

from workers.celery_app import celery_app
from services.enhanced_ocr_service import EnhancedOCRService
from core.database import get_db
from models.document import Document, DocumentStatus
from datetime import datetime

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def process_document_background(self, document_id: int, document_path: str, document_type: str) -> Dict[str, Any]:
    """
    Background task for processing documents with OCR
    
    Args:
        document_id: Database ID of the document
        document_path: File path to the document
        document_type: Type of document (invoice, bill_of_lading, etc.)
    
    Returns:
        Dict containing OCR results and processing metadata
    """
    
    logger.info(f"Starting background OCR processing for document {document_id}")
    
    try:
        # Initialize OCR service
        ocr_service = EnhancedOCRService()
        
        # Update document status in database
        db = next(get_db())
        document = db.query(Document).filter(Document.id == document_id).first()
        
        if not document:
            raise Exception(f"Document {document_id} not found in database")
        
        # Update status to processing
        document.status = DocumentStatus.PROCESSING
        document.extracted_data = {
            "status": "processing",
            "started_at": datetime.utcnow().isoformat(),
            "worker_id": self.request.id,
            "retry_count": self.request.retries
        }
        db.commit()
        
        # Process document with OCR
        logger.info(f"Running OCR on {document_path}")
        import asyncio
        ocr_result = asyncio.run(ocr_service.process_document(document_path, document_type))
        
        # Add processing metadata
        processing_metadata = {
            "processed_at": datetime.utcnow().isoformat(),
            "worker_id": self.request.id,
            "processing_time_seconds": None,  # Could add timing
            "retry_count": self.request.retries
        }
        
        # Merge OCR result with metadata
        final_result = {**ocr_result, "processing_metadata": processing_metadata}
        
        # Update document in database
        document.status = DocumentStatus.COMPLETED if ocr_result.get('success') else DocumentStatus.FAILED
        document.extracted_data = final_result
        db.commit()
        
        logger.info(f"Background OCR processing completed for document {document_id}")
        return final_result
        
    except Exception as exc:
        logger.error(f"Background OCR processing failed for document {document_id}: {exc}")
        
        # Update document status to failed
        try:
            db = next(get_db())
            document = db.query(Document).filter(Document.id == document_id).first()
            if document:
                document.status = DocumentStatus.FAILED
                document.extracted_data = {
                    "error": str(exc),
                    "failed_at": datetime.utcnow().isoformat(),
                    "worker_id": self.request.id,
                    "retry_count": self.request.retries
                }
                db.commit()
        except Exception as db_error:
            logger.error(f"Failed to update document status: {db_error}")
        
        # Retry logic
        if self.request.retries < self.max_retries:
            logger.info(f"Retrying OCR processing for document {document_id} (attempt {self.request.retries + 1})")
            raise self.retry(exc=exc)
        
        # Final failure
        raise exc
    
    finally:
        if 'db' in locals():
            db.close()

@celery_app.task
def cleanup_failed_documents():
    """
    Periodic task to clean up documents that have been stuck in processing status
    """
    logger.info("Running cleanup task for failed documents")
    
    try:
        db = next(get_db())
        
        # Find documents stuck in processing for more than 1 hour
        from datetime import datetime, timedelta
        cutoff_time = datetime.utcnow() - timedelta(hours=1)
        
        stuck_documents = db.query(Document).filter(
            Document.status == DocumentStatus.PROCESSING,
            Document.updated_at < cutoff_time
        ).all()
        
        for document in stuck_documents:
            logger.warning(f"Marking stuck document {document.id} as failed")
            document.status = DocumentStatus.FAILED
            document.extracted_data = {
                "error": "Processing timeout - document was stuck in processing status",
                "failed_at": datetime.utcnow().isoformat(),
                "cleanup_reason": "automatic_timeout"
            }
        
        db.commit()
        logger.info(f"Cleaned up {len(stuck_documents)} stuck documents")
        
    except Exception as e:
        logger.error(f"Cleanup task failed: {e}")
        
    finally:
        if 'db' in locals():
            db.close()

@celery_app.task
def health_check():
    """Health check task for monitoring worker status"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "worker_id": "enhanced_ocr_worker"
    }