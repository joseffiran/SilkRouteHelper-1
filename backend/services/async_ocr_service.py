"""
Async OCR Service with background processing
Implements non-blocking OCR processing using Celery for production scalability
"""

import asyncio
import json
import logging
import os
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from core.database import get_db
from core.exceptions import ProcessingError, ExternalServiceError
from models.document import Document, DocumentStatus
from services.enhanced_ocr_service import EnhancedOCRService
from workers.celery_app import celery_app

logger = logging.getLogger(__name__)

class AsyncOCRService:
    """
    Async OCR Service for non-blocking document processing
    Handles both immediate processing for small files and background processing for large files
    """
    
    def __init__(self):
        self.sync_ocr_service = EnhancedOCRService()
        self.max_sync_size = 5 * 1024 * 1024  # 5MB limit for synchronous processing
    
    async def process_document_async(
        self, 
        document_id: int, 
        force_background: bool = False
    ) -> Dict[str, Any]:
        """
        Process document asynchronously with automatic sync/background decision
        
        Args:
            document_id: Database ID of document to process
            force_background: Force background processing regardless of file size
        
        Returns:
            Dict with processing status and job information
        """
        db = next(get_db())
        
        try:
            # Get document from database
            document = db.query(Document).filter(Document.id == document_id).first()
            if not document:
                raise ProcessingError(f"Document not found: {document_id}", "document_lookup")
            
            # Check file existence
            if not os.path.exists(document.storage_path):
                raise ProcessingError(f"Document file not found: {document.storage_path}", "file_access")
            
            # Get file size
            file_size = os.path.getsize(document.storage_path)
            
            # Decide processing strategy
            if not force_background and file_size <= self.max_sync_size:
                # Process synchronously for small files
                logger.info(f"Processing document {document_id} synchronously (size: {file_size} bytes)")
                result = await self._process_sync(document)
                return {
                    "status": "completed",
                    "processing_type": "synchronous",
                    "result": result,
                    "document_id": document_id
                }
            else:
                # Queue for background processing
                logger.info(f"Queuing document {document_id} for background processing (size: {file_size} bytes)")
                job_id = await self._queue_background_processing(document)
                return {
                    "status": "queued",
                    "processing_type": "background",
                    "job_id": job_id,
                    "document_id": document_id,
                    "estimated_completion": self._estimate_completion_time(file_size)
                }
                
        except Exception as e:
            logger.error(f"Failed to process document {document_id}: {e}")
            # Update document status to failed
            if 'document' in locals():
                document.status = DocumentStatus.FAILED
                document.extracted_data = {"error": str(e), "failed_at": datetime.utcnow().isoformat()}
                db.commit()
            
            raise ProcessingError(f"Document processing failed: {str(e)}", "ocr_processing")
        
        finally:
            db.close()
    
    async def _process_sync(self, document: Document) -> Dict[str, Any]:
        """Process document synchronously using enhanced OCR service"""
        try:
            # Update status to processing
            db = next(get_db())
            document.status = DocumentStatus.PROCESSING
            db.commit()
            
            # Run OCR processing
            result = await self.sync_ocr_service.process_document(
                image_path=document.storage_path,
                document_type=document.document_type
            )
            
            # Update document with results
            document.extracted_data = result
            document.status = DocumentStatus.COMPLETED if result.get('success') else DocumentStatus.FAILED
            db.commit()
            
            logger.info(f"Synchronous OCR completed for document {document.id}")
            return result
            
        except Exception as e:
            logger.error(f"Synchronous OCR failed for document {document.id}: {e}")
            document.status = DocumentStatus.FAILED
            document.extracted_data = {"error": str(e), "failed_at": datetime.utcnow().isoformat()}
            db.commit()
            raise
        
        finally:
            db.close()
    
    async def _queue_background_processing(self, document: Document) -> str:
        """Queue document for background processing using Celery"""
        try:
            # Update status to queued
            db = next(get_db())
            document.status = DocumentStatus.PROCESSING
            db.commit()
            
            # Queue Celery task
            task = celery_app.send_task(
                'workers.enhanced_ocr_worker.process_document_background',
                args=[document.id],
                kwargs={
                    'document_path': document.storage_path,
                    'document_type': document.document_type
                }
            )
            
            # Store job ID in document metadata
            document.extracted_data = {
                "job_id": task.id,
                "status": "queued",
                "queued_at": datetime.utcnow().isoformat()
            }
            db.commit()
            
            logger.info(f"Document {document.id} queued for background processing with job ID: {task.id}")
            return task.id
            
        except Exception as e:
            logger.error(f"Failed to queue document {document.id}: {e}")
            raise ExternalServiceError("celery", f"Failed to queue processing task: {str(e)}")
        
        finally:
            db.close()
    
    async def get_processing_status(self, document_id: int) -> Dict[str, Any]:
        """Get current processing status for a document"""
        db = next(get_db())
        
        try:
            document = db.query(Document).filter(Document.id == document_id).first()
            if not document:
                raise ProcessingError(f"Document not found: {document_id}", "document_lookup")
            
            status_info = {
                "document_id": document_id,
                "status": document.status,
                "extracted_data": document.extracted_data or {}
            }
            
            # If document has a job ID, get Celery task status
            if document.extracted_data and document.extracted_data.get("job_id"):
                job_id = document.extracted_data["job_id"]
                task_result = celery_app.AsyncResult(job_id)
                
                status_info.update({
                    "job_id": job_id,
                    "job_status": task_result.status,
                    "job_result": task_result.result if task_result.ready() else None
                })
                
                # Update document status if job is complete
                if task_result.ready():
                    if task_result.successful():
                        document.status = DocumentStatus.COMPLETED
                        document.extracted_data = task_result.result
                    else:
                        document.status = DocumentStatus.FAILED
                        document.extracted_data = {
                            "error": str(task_result.result),
                            "failed_at": datetime.utcnow().isoformat()
                        }
                    db.commit()
            
            return status_info
            
        finally:
            db.close()
    
    def _estimate_completion_time(self, file_size: int) -> str:
        """Estimate completion time based on file size"""
        # Rough estimation: 1MB = 2 seconds processing time
        estimated_seconds = max(10, (file_size / 1024 / 1024) * 2)
        completion_time = datetime.utcnow().timestamp() + estimated_seconds
        return datetime.fromtimestamp(completion_time).isoformat()

# Global instance
async_ocr_service = AsyncOCRService()