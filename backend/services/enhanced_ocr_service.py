"""
Enhanced OCR Service with multi-language support and image preprocessing
for improved accuracy on Russian, Uzbek, and English documents
"""
import pytesseract
from PIL import Image, ImageFilter, ImageEnhance, ImageOps
import cv2
import numpy as np
import logging
from typing import Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)

class EnhancedOCRService:
    def __init__(self):
        # Language combinations for different document types
        self.language_configs = {
            'multi': 'rus+uzb+uzb_cyrl+eng',  # Multi-language documents
            'russian': 'rus+eng',              # Russian documents with English
            'uzbek': 'uzb+uzb_cyrl+eng',      # Uzbek documents with English
            'english': 'eng',                  # English only
        }
        
        # OCR engine configurations for different scenarios
        self.ocr_configs = {
            'default': '--oem 1 --psm 6',           # Standard block text
            'table': '--oem 1 --psm 6',             # Table data
            'invoice': '--oem 1 --psm 4',           # Invoice/form layouts
            'single_line': '--oem 1 --psm 7',      # Single line text
            'sparse': '--oem 1 --psm 11',          # Sparse text
        }

    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """
        Preprocess image to improve OCR accuracy - optimized for performance
        """
        try:
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize large images for faster processing
            max_size = 2000
            if max(image.size) > max_size:
                ratio = max_size / max(image.size)
                new_size = tuple(int(dim * ratio) for dim in image.size)
                image = image.resize(new_size, Image.Resampling.LANCZOS)
            
            # Convert PIL to OpenCV format
            img_array = np.array(image)
            img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            # Convert to grayscale
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
            
            # Simple threshold - faster than adaptive
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Convert back to PIL
            processed_image = Image.fromarray(thresh)
            
            return processed_image
            
        except Exception as e:
            logger.warning(f"Image preprocessing failed: {e}, using original image")
            return image

    def detect_document_language(self, image: Image.Image) -> str:
        """
        Detect the primary language of the document
        """
        try:
            # Quick OCR with confidence scores for language detection
            data = pytesseract.image_to_data(
                image, 
                lang='rus+uzb+eng',
                config='--oem 1 --psm 6',
                output_type=pytesseract.Output.DICT
            )
            
            # Analyze text patterns to determine language
            text_sample = ' '.join([
                data['text'][i] for i in range(len(data['text'])) 
                if int(data['conf'][i]) > 30 and data['text'][i].strip()
            ])
            
            # Simple heuristics for language detection
            cyrillic_chars = sum(1 for c in text_sample if '\u0400' <= c <= '\u04ff')
            latin_chars = sum(1 for c in text_sample if c.isalpha() and c.isascii())
            total_chars = len([c for c in text_sample if c.isalpha()])
            
            if total_chars == 0:
                return 'multi'
            
            cyrillic_ratio = cyrillic_chars / total_chars
            
            if cyrillic_ratio > 0.7:
                return 'russian'
            elif cyrillic_ratio > 0.3:
                return 'multi'
            else:
                return 'english'
                
        except Exception as e:
            logger.warning(f"Language detection failed: {e}, defaulting to multi-language")
            return 'multi'

    def extract_text_with_confidence(
        self, 
        image: Image.Image, 
        language: str = None,
        document_type: str = 'default'
    ) -> Dict[str, Any]:
        """
        Extract text with confidence scores and metadata - optimized for speed
        """
        try:
            # Preprocess image for better OCR
            processed_image = self.preprocess_image(image)
            
            # Use multi-language configuration for best accuracy
            lang_config = self.language_configs['multi']
            ocr_config = self.ocr_configs.get(document_type, self.ocr_configs['default'])
            
            # Single OCR approach for faster processing
            text = pytesseract.image_to_string(
                processed_image,
                lang=lang_config,
                config=ocr_config
            )
            
            # Calculate confidence
            confidence = self._calculate_text_confidence(processed_image, lang_config, ocr_config)
            
            # Detect language from text content
            detected_language = self.detect_document_language(processed_image)
            
            return {
                'text': text,
                'confidence': confidence,
                'detected_language': detected_language,
                'ocr_method': 'enhanced_single_pass',
                'language_config': lang_config,
                'text_length': len(text.strip()),
                'preprocessing_applied': True
            }
            
        except Exception as e:
            logger.error(f"Enhanced OCR failed: {e}")
            # Fallback to basic OCR
            try:
                basic_text = pytesseract.image_to_string(image, lang='rus+eng')
                return {
                    'text': basic_text,
                    'confidence': 0.5,
                    'detected_language': 'russian',
                    'ocr_method': 'basic_fallback',
                    'language_config': 'rus+eng',
                    'error': str(e),
                    'text_length': len(basic_text.strip()),
                    'preprocessing_applied': False
                }
            except Exception as final_error:
                raise Exception(f"All OCR methods failed: {final_error}")

    def _calculate_text_confidence(self, image: Image.Image, lang: str, config: str) -> float:
        """
        Calculate average confidence score for extracted text
        """
        try:
            data = pytesseract.image_to_data(
                image,
                lang=lang,
                config=config,
                output_type=pytesseract.Output.DICT
            )
            
            confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
            if not confidences:
                return 0.0
            
            return sum(confidences) / len(confidences) / 100.0  # Normalize to 0-1
            
        except Exception:
            return 0.5  # Default confidence

    def process_document(self, image_path: str, document_type: str = 'invoice') -> Dict[str, Any]:
        """
        Process a document image and extract text with enhanced accuracy
        """
        try:
            with Image.open(image_path) as image:
                result = self.extract_text_with_confidence(
                    image=image,
                    document_type=document_type
                )
                
                # Add processing metadata
                result['image_path'] = image_path
                result['document_type'] = document_type
                result['processing_timestamp'] = str(cv2.getTickCount())
                
                logger.info(
                    f"OCR completed for {image_path}: "
                    f"method={result['ocr_method']}, "
                    f"confidence={result['confidence']:.2f}, "
                    f"length={result['text_length']}"
                )
                
                return result
                
        except Exception as e:
            logger.error(f"Document processing failed for {image_path}: {e}")
            raise Exception(f"Failed to process document: {e}")

# Global instance
enhanced_ocr = EnhancedOCRService()