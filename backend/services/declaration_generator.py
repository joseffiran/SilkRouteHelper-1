"""
Declaration Generator Service
Generates properly formatted customs declarations based on extracted OCR data
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from templates.russian_customs_declaration import RussianCustomsDeclarationTemplate

logger = logging.getLogger(__name__)

class DeclarationGeneratorService:
    """
    Service for generating formatted customs declarations from OCR data
    """
    
    def __init__(self):
        self.russian_template = RussianCustomsDeclarationTemplate()
    
    def generate_declaration(
        self, 
        extracted_data: Dict[str, Any], 
        template_type: str = "russian_customs"
    ) -> Dict[str, Any]:
        """
        Generate a formatted declaration based on extracted OCR data
        
        Args:
            extracted_data: OCR data extracted from documents
            template_type: Type of declaration template to use
            
        Returns:
            Dictionary containing the formatted declaration and metadata
        """
        try:
            if template_type == "russian_customs":
                return self._generate_russian_declaration(extracted_data)
            else:
                raise ValueError(f"Unsupported template type: {template_type}")
                
        except Exception as e:
            logger.error(f"Failed to generate declaration: {e}")
            return {
                "success": False,
                "error": str(e),
                "declaration_text": "",
                "extracted_fields": {}
            }
    
    def _generate_russian_declaration(self, extracted_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate Russian customs declaration
        """
        try:
            # Extract structured fields from OCR text if needed
            if "text" in extracted_data:
                structured_data = self.russian_template.extract_fields_from_text(
                    extracted_data["text"]
                )
            else:
                structured_data = extracted_data
            
            # Enhance with additional processing
            enhanced_data = self._enhance_extracted_data(structured_data)
            
            # Generate formatted declaration text
            declaration_text = self.russian_template.generate_declaration_text(enhanced_data)
            
            return {
                "success": True,
                "declaration_text": declaration_text,
                "extracted_fields": enhanced_data,
                "template_type": "russian_customs",
                "generated_at": datetime.now().isoformat(),
                "confidence_score": self._calculate_confidence_score(enhanced_data)
            }
            
        except Exception as e:
            logger.error(f"Failed to generate Russian declaration: {e}")
            raise
    
    def _enhance_extracted_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enhance extracted data with additional processing and validation
        """
        enhanced = data.copy()
        
        # Add current date if not present
        if "declaration_date" not in enhanced:
            enhanced["declaration_date"] = datetime.now().strftime("%d.%m.%Y")
        
        # Format declaration number if missing
        if "declaration_number" not in enhanced or not enhanced["declaration_number"]:
            current_date = datetime.now()
            enhanced["declaration_number"] = f"26010 / {current_date.strftime('%d.%m.%Y')} / {current_date.strftime('%H%M%S')}"
        
        # Generate EDN number if missing
        if "edn_number" not in enhanced or not enhanced["edn_number"]:
            import random
            enhanced["edn_number"] = f"EDN{random.randint(100000, 999999)}"
        
        # Ensure required structure exists
        if "recipient_info" not in enhanced:
            enhanced["recipient_info"] = {}
        
        if "goods_info" not in enhanced:
            enhanced["goods_info"] = {}
        
        if "transport_info" not in enhanced:
            enhanced["transport_info"] = {}
        
        # Set default values for common fields
        self._set_default_values(enhanced)
        
        return enhanced
    
    def _set_default_values(self, data: Dict[str, Any]) -> None:
        """
        Set default values for commonly missing fields
        """
        defaults = {
            "declaration_type": "А",
            "td_type": "1",
            "declaration_type_number": "1",
            "departure_country": "КАЗАХСТАН",
            "departure_country_code": "398",
            "destination_country": "УЗБЕКИСТАН",
            "destination_country_code": "860",
            "currency_code": "840",  # USD
            "procedure_code": "40",
            "transport_type": "ЖД"
        }
        
        for key, value in defaults.items():
            if key not in data or not data[key]:
                data[key] = value
    
    def _calculate_confidence_score(self, data: Dict[str, Any]) -> float:
        """
        Calculate confidence score based on completeness of extracted data
        """
        required_fields = [
            "declaration_number",
            "edn_number",
            "recipient_info",
            "goods_info"
        ]
        
        important_fields = [
            "sender_exporter",
            "transport_info",
            "financial_banking_info",
            "cargo_marks_packaging"
        ]
        
        total_score = 0
        max_score = 0
        
        # Check required fields (higher weight)
        for field in required_fields:
            max_score += 2
            if field in data and data[field]:
                if isinstance(data[field], dict):
                    # For nested objects, check if they have any content
                    if any(data[field].values()):
                        total_score += 2
                else:
                    total_score += 2
        
        # Check important fields (lower weight)
        for field in important_fields:
            max_score += 1
            if field in data and data[field]:
                if isinstance(data[field], dict):
                    if any(data[field].values()):
                        total_score += 1
                else:
                    total_score += 1
        
        return round(total_score / max_score, 2) if max_score > 0 else 0.0
    
    def validate_declaration(self, declaration_text: str) -> Dict[str, Any]:
        """
        Validate generated declaration for completeness and accuracy
        """
        validation_results = {
            "is_valid": True,
            "warnings": [],
            "errors": []
        }
        
        # Check for required sections
        required_sections = [
            "ГРУЗОВАЯ ТАМОЖЕННАЯ ДЕКЛАРАЦИЯ",
            "Отправитель/Экспортер",
            "Получатель/Импортер",
            "Транспортное средство",
            "Место печати"
        ]
        
        for section in required_sections:
            if section not in declaration_text:
                validation_results["errors"].append(f"Missing required section: {section}")
                validation_results["is_valid"] = False
        
        # Check for common formatting issues
        lines = declaration_text.split('\n')
        if len(lines) < 10:
            validation_results["warnings"].append("Declaration appears too short")
        
        # Check for placeholder values
        placeholders = ["TODO", "PLACEHOLDER", "TBD", ""]
        for placeholder in placeholders:
            if placeholder in declaration_text:
                validation_results["warnings"].append(f"Contains placeholder value: {placeholder}")
        
        return validation_results

# Global instance
declaration_generator = DeclarationGeneratorService()