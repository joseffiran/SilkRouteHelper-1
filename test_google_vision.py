#!/usr/bin/env python3
"""
Test Google Vision API integration with uploaded test documents
"""

import sys
import os
from PIL import Image

# Add backend directory to path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.append(backend_dir)

from services.google_vision_ocr import GoogleVisionOCRService

def test_google_vision_api():
    """Test Google Vision API with actual uploaded documents"""
    try:
        # Initialize Google Vision OCR
        print("Initializing Google Vision OCR service...")
        ocr_service = GoogleVisionOCRService()
        print("✓ Google Vision OCR service initialized successfully")
        
        # Test with an uploaded document
        test_images = [
            "attached_assets/final declaration_1750680001192.pdf",
            "attached_assets/image_1750680165061.png",
            "attached_assets/image_1750680168132.png",
            "attached_assets/image_1750680171733.png"
        ]
        
        for image_path in test_images:
            if os.path.exists(image_path):
                print(f"\nTesting with: {image_path}")
                try:
                    # Handle PDF files
                    if image_path.endswith('.pdf'):
                        print("PDF files require conversion - skipping for now")
                        continue
                        
                    # Open image
                    image = Image.open(image_path)
                    print(f"✓ Image loaded: {image.size} pixels, mode: {image.mode}")
                    
                    # Extract text using Google Vision API
                    result = ocr_service.extract_text_from_image(image)
                    
                    if result.get('success', False):
                        print(f"✓ OCR Success!")
                        print(f"  Confidence: {result.get('confidence', 0):.2f}")
                        print(f"  Language: {result.get('language_detected', 'unknown')}")
                        print(f"  Text length: {len(result.get('text', ''))} characters")
                        print(f"  First 200 chars: {result.get('text', '')[:200]}...")
                        
                        if 'detailed_results' in result:
                            print(f"  Word count: {len(result['detailed_results'])}")
                            
                    else:
                        print(f"✗ OCR Failed: {result.get('error', 'Unknown error')}")
                        
                except Exception as e:
                    print(f"✗ Error processing {image_path}: {e}")
            else:
                print(f"✗ File not found: {image_path}")
        
        return True
        
    except Exception as e:
        print(f"✗ Google Vision API test failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing Google Vision API Integration")
    print("=" * 40)
    
    success = test_google_vision_api()
    
    if success:
        print("\n✓ Google Vision API integration test completed")
    else:
        print("\n✗ Google Vision API integration test failed")
        sys.exit(1)