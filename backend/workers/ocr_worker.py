import os
import pytesseract
from PIL import Image
from celery import Celery
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import logging

# Import database components
from core.config import settings
from models.shipment import Shipment

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database engine for worker
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Initialize Celery app
celery_app = Celery(
    "silkroute_worker",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

@celery_app.task(bind=True)
def process_document_ocr(self, file_path: str, shipment_id: int):
    """
    Process uploaded document with OCR to extract text content.
    
    Args:
        file_path: Path to the uploaded file
        shipment_id: ID of the shipment the document belongs to
    """
    try:
        logger.info(f"Starting OCR processing for file: {file_path}")
        
        # Verify file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Open and process image with OCR
        with Image.open(file_path) as image:
            # Extract text using Tesseract OCR
            extracted_text = pytesseract.image_to_string(image)
            
            logger.info(f"OCR extraction completed for shipment {shipment_id}")
            logger.info(f"Extracted text preview: {extracted_text[:200]}...")
            
            # Update shipment with extracted data
            db = SessionLocal()
            try:
                shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
                if shipment:
                    # Store extracted text in shipment's extracted_data field
                    current_data = shipment.extracted_data if shipment.extracted_data else {}
                    current_data["ocr_text"] = extracted_text
                    current_data["processed_files"] = current_data.get("processed_files", [])
                    current_data["processed_files"].append({
                        "file_path": file_path,
                        "extraction_status": "completed",
                        "text_length": len(extracted_text)
                    })
                    
                    # Update the shipment fields
                    db.query(Shipment).filter(Shipment.id == shipment_id).update({
                        "extracted_data": current_data,
                        "status": "completed" if extracted_text.strip() else "failed"
                    })
                    
                    db.commit()
                    logger.info(f"Updated shipment {shipment_id} with OCR results")
                else:
                    logger.error(f"Shipment {shipment_id} not found")
                    
            except Exception as db_error:
                db.rollback()
                logger.error(f"Database error: {str(db_error)}")
                raise
            finally:
                db.close()
            
            return {
                "status": "success",
                "shipment_id": shipment_id,
                "file_path": file_path,
                "text_length": len(extracted_text),
                "preview": extracted_text[:200]
            }
            
    except Exception as e:
        logger.error(f"OCR processing failed for {file_path}: {str(e)}")
        
        # Update shipment status to failed
        db = SessionLocal()
        try:
            shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
            if shipment:
                current_data = shipment.extracted_data if shipment.extracted_data else {}
                current_data["error"] = str(e)
                
                db.query(Shipment).filter(Shipment.id == shipment_id).update({
                    "status": "failed",
                    "extracted_data": current_data
                })
                db.commit()
        except Exception as db_error:
            db.rollback()
            logger.error(f"Failed to update shipment status: {str(db_error)}")
        finally:
            db.close()
        
        raise self.retry(exc=e, countdown=60, max_retries=3)