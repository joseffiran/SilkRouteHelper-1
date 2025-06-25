"""
PDF Processing Service
Converts PDF files to images for OCR processing
"""

import logging
import os
import tempfile
from typing import List, Tuple
from PIL import Image

logger = logging.getLogger(__name__)

class PDFProcessor:
    """
    Service for converting PDF files to images for OCR processing
    """
    
    def __init__(self):
        self.dpi = 200  # DPI for PDF to image conversion
        self.supported_formats = ['PNG', 'JPEG']
    
    def convert_pdf_to_images(self, pdf_path: str, output_format: str = 'PNG') -> List[str]:
        """
        Convert PDF file to images
        
        Args:
            pdf_path: Path to the PDF file
            output_format: Output image format (PNG or JPEG)
        
        Returns:
            List of paths to converted image files
        """
        try:
            # Try to import pdf2image
            try:
                from pdf2image import convert_from_path
            except ImportError:
                logger.error("pdf2image library not installed. Install with: pip install pdf2image")
                raise Exception("PDF processing not available - pdf2image library not installed")
            
            if not os.path.exists(pdf_path):
                raise FileNotFoundError(f"PDF file not found: {pdf_path}")
            
            # Convert PDF to images
            logger.info(f"Converting PDF to images: {pdf_path}")
            images = convert_from_path(
                pdf_path,
                dpi=self.dpi,
                fmt=output_format.lower()
            )
            
            # Save images to temporary files
            image_paths = []
            temp_dir = tempfile.mkdtemp(prefix='pdf_conversion_')
            
            for i, image in enumerate(images):
                image_filename = f"page_{i+1}.{output_format.lower()}"
                image_path = os.path.join(temp_dir, image_filename)
                
                # Save image
                image.save(image_path, format=output_format)
                image_paths.append(image_path)
                
                logger.info(f"Converted page {i+1} to {image_path}")
            
            logger.info(f"Successfully converted PDF to {len(image_paths)} images")
            return image_paths
            
        except Exception as e:
            logger.error(f"PDF conversion failed: {e}")
            raise Exception(f"Failed to convert PDF: {str(e)}")
    
    def get_pdf_info(self, pdf_path: str) -> dict:
        """
        Get basic information about a PDF file
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Dictionary with PDF information
        """
        try:
            from pdf2image import convert_from_path
            
            if not os.path.exists(pdf_path):
                raise FileNotFoundError(f"PDF file not found: {pdf_path}")
            
            # Get file size
            file_size = os.path.getsize(pdf_path)
            
            # Get number of pages (lightweight check)
            try:
                images = convert_from_path(pdf_path, dpi=50, last_page=1)  # Only first page for counting
                # For accurate page count, we'd need a proper PDF library
                # This is a simplified approach
                page_count = "unknown"  # Would need PyPDF2 or similar for accurate count
            except:
                page_count = "unknown"
            
            return {
                "file_size": file_size,
                "file_size_mb": round(file_size / 1024 / 1024, 2),
                "page_count": page_count,
                "can_convert": True
            }
            
        except ImportError:
            return {
                "file_size": os.path.getsize(pdf_path) if os.path.exists(pdf_path) else 0,
                "can_convert": False,
                "error": "pdf2image library not available"
            }
        except Exception as e:
            return {
                "can_convert": False,
                "error": str(e)
            }
    
    def cleanup_temp_files(self, image_paths: List[str]) -> None:
        """
        Clean up temporary image files created during PDF conversion
        
        Args:
            image_paths: List of image file paths to clean up
        """
        for image_path in image_paths:
            try:
                if os.path.exists(image_path):
                    os.remove(image_path)
                    
                # Also try to remove the directory if it's empty
                directory = os.path.dirname(image_path)
                if os.path.exists(directory) and not os.listdir(directory):
                    os.rmdir(directory)
                    
            except Exception as e:
                logger.warning(f"Failed to cleanup temporary file {image_path}: {e}")

# Global instance
pdf_processor = PDFProcessor()