"""
OCR Template Engine for SilkRoute OS Declaration Helper
Processes documents using AI-powered OCR with template-based field extraction
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
from PIL import Image
import pytesseract
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.models.document import Document, DocumentStatus
from backend.models.declaration_template import DeclarationTemplate
from backend.models.template_field import TemplateField

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OCRTemplateEngine:
    """
    Advanced OCR processing engine that uses templates to extract specific fields
    from customs declaration documents
    """
    
    def __init__(self):
        self.supported_formats = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff']
        
    def process_document(self, document_id: int, template_name: str = "Russian Customs Declaration 2025") -> Dict[str, Any]:
        """
        Process a document using OCR and template-based field extraction
        
        Args:
            document_id: Database ID of the document to process
            template_name: Name of the template to use for extraction
            
        Returns:
            Dictionary containing extracted field data
        """
        db = next(get_db())
        
        try:
            # Get document from database
            document = db.query(Document).filter(Document.id == document_id).first()
            if not document:
                raise ValueError(f"Document with ID {document_id} not found")
            
            # Update status to processing
            document.status = DocumentStatus.PROCESSING
            db.commit()
            
            # Get template and fields
            template = db.query(DeclarationTemplate).filter(
                DeclarationTemplate.name == template_name,
                DeclarationTemplate.is_active == True
            ).first()
            
            if not template:
                logger.warning(f"Template '{template_name}' not found, using basic OCR")
                return self._basic_ocr_extraction(document)
            
            # Extract text using OCR
            extracted_text = self._extract_text_from_image(document.storage_path)
            
            # Apply template-based field extraction
            extracted_data = self._apply_template_extraction(extracted_text, template.fields)
            
            # Update document with extracted data
            document.extracted_data = extracted_data
            document.status = DocumentStatus.COMPLETED
            db.commit()
            
            logger.info(f"Successfully processed document {document_id} with template {template_name}")
            return extracted_data
            
        except Exception as e:
            logger.error(f"Error processing document {document_id}: {str(e)}")
            if 'document' in locals():
                document.status = DocumentStatus.ERROR
                document.extracted_data = {"error": str(e)}
                db.commit()
            raise
        finally:
            db.close()
    
    def _extract_text_from_image(self, image_path: str) -> str:
        """
        Extract text from image using Tesseract OCR
        """
        try:
            # Check if file exists
            if not os.path.exists(image_path):
                raise FileNotFoundError(f"Image file not found: {image_path}")
            
            # Open and process image
            with Image.open(image_path) as image:
                # Convert to RGB if necessary
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                
                # Use Tesseract to extract text (with Russian language support)
                extracted_text = pytesseract.image_to_string(
                    image, 
                    lang='rus+eng',
                    config='--psm 6'
                )
                
                return extracted_text.strip()
                
        except Exception as e:
            logger.error(f"Error extracting text from {image_path}: {str(e)}")
            return ""
    
    def _apply_template_extraction(self, text: str, template_fields: List[TemplateField]) -> Dict[str, Any]:
        """
        Apply template-based field extraction rules to extracted text
        """
        extracted_data = {}
        
        for field in template_fields:
            try:
                field_value = self._extract_field_value(text, field.extraction_rules)
                extracted_data[field.field_name] = {
                    "value": field_value,
                    "label": field.label_ru,
                    "confidence": self._calculate_confidence(field_value)
                }
            except Exception as e:
                logger.warning(f"Error extracting field {field.field_name}: {str(e)}")
                extracted_data[field.field_name] = {
                    "value": None,
                    "label": field.label_ru,
                    "confidence": 0.0,
                    "error": str(e)
                }
        
        return extracted_data
    
    def _extract_field_value(self, text: str, extraction_rules: Dict[str, Any]) -> Optional[str]:
        """
        Extract field value using specified extraction rules
        """
        import re
        
        rule_type = extraction_rules.get("type", "regex")
        
        if rule_type == "regex":
            pattern = extraction_rules.get("pattern", "")
            flags = extraction_rules.get("flags", 0)
            
            if pattern:
                match = re.search(pattern, text, flags)
                if match:
                    # Return first captured group if available, otherwise full match
                    return match.group(1) if match.groups() else match.group(0)
        
        elif rule_type == "keyword_proximity":
            keywords = extraction_rules.get("keywords", [])
            max_distance = extraction_rules.get("max_distance", 50)
            
            for keyword in keywords:
                keyword_pos = text.find(keyword)
                if keyword_pos != -1:
                    # Extract text near the keyword
                    start = max(0, keyword_pos - max_distance)
                    end = min(len(text), keyword_pos + len(keyword) + max_distance)
                    return text[start:end].strip()
        
        elif rule_type == "line_after_keyword":
            keyword = extraction_rules.get("keyword", "")
            if keyword:
                lines = text.split('\n')
                for i, line in enumerate(lines):
                    if keyword.lower() in line.lower() and i + 1 < len(lines):
                        return lines[i + 1].strip()
        
        return None
    
    def _calculate_confidence(self, value: Optional[str]) -> float:
        """
        Calculate confidence score for extracted value
        """
        if not value:
            return 0.0
        
        # Simple confidence calculation based on value characteristics
        confidence = 0.5  # Base confidence
        
        # Add confidence for non-empty values
        if len(value.strip()) > 0:
            confidence += 0.3
        
        # Add confidence for values with expected patterns (numbers, dates, etc.)
        import re
        if re.search(r'\d', value):  # Contains numbers
            confidence += 0.1
        
        if re.search(r'[A-Za-zА-Яа-я]', value):  # Contains letters
            confidence += 0.1
        
        return min(confidence, 1.0)
    
    def _basic_ocr_extraction(self, document: Document) -> Dict[str, Any]:
        """
        Fallback basic OCR extraction when no template is available
        """
        try:
            extracted_text = self._extract_text_from_image(document.storage_path)
            
            return {
                "raw_text": {
                    "value": extracted_text,
                    "label": "Extracted Text",
                    "confidence": 0.8 if extracted_text else 0.0
                },
                "document_type": {
                    "value": document.document_type.value,
                    "label": "Document Type",
                    "confidence": 1.0
                }
            }
        except Exception as e:
            logger.error(f"Basic OCR extraction failed: {str(e)}")
            return {
                "error": {
                    "value": str(e),
                    "label": "Processing Error",
                    "confidence": 0.0
                }
            }

# Global instance
ocr_engine = OCRTemplateEngine()