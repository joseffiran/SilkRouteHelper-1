"""
Test script to verify declaration generation from actual Russian customs documents
"""

import os
import sys
from PIL import Image
import logging

# Add backend directory to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)

from services.enhanced_ocr_service import EnhancedOCRService
from templates.russian_customs_declaration import RussianCustomsDeclarationTemplate

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_declaration_generation():
    """Test declaration generation with actual Russian customs document"""
    
    # Initialize services
    ocr_service = EnhancedOCRService()
    declaration_template = RussianCustomsDeclarationTemplate()
    
    # Test with attached image files
    test_images = [
        "../attached_assets/image_1750680165061.png",
        "../attached_assets/image_1750680168132.png"
    ]
    
    for image_path in test_images:
        if os.path.exists(image_path):
            logger.info(f"Testing with image: {image_path}")
            
            try:
                # Load and process image
                image = Image.open(image_path)
                
                # Extract text with enhanced OCR
                ocr_result = ocr_service.extract_text_with_confidence(
                    image, 
                    language='russian',
                    document_type='customs_declaration'
                )
                
                logger.info(f"OCR Text Length: {len(ocr_result['text'])}")
                logger.info(f"OCR Confidence: {ocr_result['confidence']}")
                logger.info(f"Detected Language: {ocr_result['detected_language']}")
                
                # Check if declaration was generated
                if 'declaration' in ocr_result:
                    declaration = ocr_result['declaration']
                    logger.info(f"Declaration Generated: {declaration['success']}")
                    
                    if declaration['success']:
                        logger.info(f"Declaration Confidence: {declaration['confidence_score']}")
                        logger.info("Generated Declaration Preview:")
                        print("-" * 50)
                        print(declaration['declaration_text'][:500] + "...")
                        print("-" * 50)
                        
                        # Show extracted fields
                        extracted_fields = declaration['extracted_fields']
                        logger.info(f"Extracted Fields: {list(extracted_fields.keys())}")
                        
                        if 'recipient_info' in extracted_fields:
                            recipient = extracted_fields['recipient_info']
                            logger.info(f"Recipient Company: {recipient.get('company_name', 'Not found')}")
                            logger.info(f"Recipient INN: {recipient.get('inn', 'Not found')}")
                
                # Print sample of OCR text
                print("\nOCR Text Sample:")
                print("-" * 30)
                print(ocr_result['text'][:300] + "...")
                print("-" * 30)
                
            except Exception as e:
                logger.error(f"Error processing {image_path}: {e}")
                
        else:
            logger.warning(f"Image not found: {image_path}")

def test_template_extraction():
    """Test the template extraction functionality"""
    
    # Sample Russian customs text from the document
    sample_text = """
    Копия / 26010 / 18.06.2025 / 0034784. 1/ 1
    ГРУЗОВАЯ ТАМОЖЕННАЯ ДЕКЛАРАЦИЯ А EDN635126 ТД 1 Тип декларации
    
    2 Отправитель/Экспортер №
    по поручению: "GIGAFLEX ASIA LIMITED", Гонконг
    АО "КОНДЕНСАТ"
    
    8 Получатель/Импортер №
    ООО "GAZ-NEFT-AVTO BENZIN"
    г. Ташкент, Мирабадский район, ул. А. Фитрат, 157/7
    ИНН: 302637691 Регион: 1726273
    
    32 Товар № 1
    33 Код товара 2710124500
    35 Вес брутто (кг) 58276
    38 Вес нетто (кг) 58276
    42 Фактур. стоим. т-ра 45105.63
    """
    
    template = RussianCustomsDeclarationTemplate()
    extracted = template.extract_fields_from_text(sample_text)
    
    logger.info("Template Extraction Test:")
    for key, value in extracted.items():
        logger.info(f"{key}: {value}")
    
    # Generate declaration
    declaration_text = template.generate_declaration_text(extracted)
    
    print("\nGenerated Declaration:")
    print("=" * 50)
    print(declaration_text[:800] + "...")
    print("=" * 50)

if __name__ == "__main__":
    logger.info("Starting declaration generation tests...")
    
    # Test template extraction
    test_template_extraction()
    
    # Test with actual images
    test_declaration_generation()
    
    logger.info("Tests completed!")