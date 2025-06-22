#!/usr/bin/env python3

import requests
import os

# Test file upload with proper multipart form data
def test_file_upload():
    url = "http://localhost:5000/api/v1/shipments/1/documents"
    headers = {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjb25uZWN0aW9uLXRlc3RAZXhhbXBsZS5jb20iLCJleHAiOjE3NTA1ODIxMTF9.7zI63EcP1IY1CgRgeHBlphLLSKnssqrEx1MFgrTj8SY"
    }
    
    # Prepare file for upload with single file parameter
    with open("test_shipping_document.png", "rb") as f:
        files = {"files": ("test_shipping_document.png", f, "image/png")}
        
        response = requests.post(url, headers=headers, files=files)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    test_file_upload()