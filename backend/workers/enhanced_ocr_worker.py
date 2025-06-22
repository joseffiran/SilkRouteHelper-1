import re
import os
from celery import Celery
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from PIL import Image
import pytesseract

from core.config import settings
from models.document import Document, DocumentStatus
from models.declaration_template import DeclarationTemplate
from models.template_field import TemplateField

# Celery configuration
celery_app = Celery('enhanced_ocr_worker')
celery_app.conf.broker_url = "redis://localhost:6379/0"
celery_app.conf.result_backend = "redis://localhost:6379/0"

# Database setup
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@celery_app.task(bind=True)
def process_document_with_template(self, document_id: int):
    """
    Enhanced OCR processing with template-based field extraction.
    
    Process Steps:
    1. Set document status to 'processing'
    2. Load document file and perform OCR
    3. Fetch active declaration template and its fields
    4. Apply extraction rules to extract structured data
    5. Update document with extracted data and set status to 'completed'
    """
    db = SessionLocal()
    
    try:
        # Get document
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise Exception(f"Document {document_id} not found")
        
        # Set status to processing
        document.status = DocumentStatus.PROCESSING
        db.commit()
        
        # Perform OCR
        if not os.path.exists(document.storage_path):
            raise Exception(f"File not found: {document.storage_path}")
        
        with Image.open(document.storage_path) as image:
            # Extract raw text using OCR
            raw_text = pytesseract.image_to_string(image, lang='eng+rus')
        
        if not raw_text.strip():
            raise Exception("No text could be extracted from the document")
        
        # Get active declaration template
        active_template = db.query(DeclarationTemplate).filter(
            DeclarationTemplate.is_active == True
        ).first()
        
        extracted_data = {
            "raw_text": raw_text,
            "document_type": document.document_type.value,
            "extraction_timestamp": str(document.updated_at),
            "extracted_fields": {}
        }
        
        if active_template:
            # Get template fields for structured extraction
            template_fields = db.query(TemplateField).filter(
                TemplateField.template_id == active_template.id
            ).all()
            
            # Apply extraction rules for each field
            for field in template_fields:
                try:
                    extracted_value = apply_extraction_rule(raw_text, field.extraction_rules)
                    if extracted_value:
                        extracted_data["extracted_fields"][field.field_name] = {
                            "value": extracted_value,
                            "label_ru": field.label_ru,
                            "extraction_method": field.extraction_rules.get("type", "unknown")
                        }
                except Exception as field_error:
                    print(f"Error extracting field {field.field_name}: {str(field_error)}")
                    continue
        
        # Update document with extracted data
        document.extracted_data = extracted_data
        document.status = DocumentStatus.COMPLETED
        db.commit()
        
        print(f"Successfully processed document {document_id} with {len(extracted_data['extracted_fields'])} extracted fields")
        
    except Exception as e:
        # Set error status
        if 'document' in locals():
            document.status = DocumentStatus.ERROR
            document.extracted_data = {
                "error": str(e),
                "raw_text": locals().get('raw_text', ''),
                "processing_failed": True
            }
            db.commit()
        
        print(f"Error processing document {document_id}: {str(e)}")
        raise e
    
    finally:
        db.close()

def apply_extraction_rule(text: str, extraction_rules: dict) -> str:
    """
    Apply extraction rules to extract specific data from OCR text.
    
    Supported rule types:
    - regex: Extract using regular expression pattern
    - keyword: Extract text after specific keyword
    - position: Extract text at specific position
    """
    rule_type = extraction_rules.get("type")
    
    if rule_type == "regex":
        pattern = extraction_rules.get("pattern")
        if pattern:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                # Return first capturing group if available, otherwise the full match
                return match.group(1) if match.groups() else match.group(0)
    
    elif rule_type == "keyword":
        keyword = extraction_rules.get("keyword")
        if keyword:
            # Find text after keyword
            keyword_pos = text.lower().find(keyword.lower())
            if keyword_pos != -1:
                # Extract next 50 characters after keyword
                start_pos = keyword_pos + len(keyword)
                extracted = text[start_pos:start_pos + 50].strip()
                # Clean up: take only the first line/word depending on context
                if extraction_rules.get("extract_type") == "line":
                    extracted = extracted.split('\n')[0].strip()
                elif extraction_rules.get("extract_type") == "word":
                    extracted = extracted.split()[0] if extracted.split() else ""
                return extracted
    
    elif rule_type == "position":
        # Extract text between specific positions
        start_pos = extraction_rules.get("start_position", 0)
        end_pos = extraction_rules.get("end_position", len(text))
        return text[start_pos:end_pos].strip()
    
    return None

# Test function for manual processing
def process_document_sync(document_id: int):
    """Synchronous version for testing without Celery"""
    return process_document_with_template(document_id)