#!/usr/bin/env python3
"""
Test script to verify document upload functionality
"""

import requests
import json

# Test admin login first
def test_admin_login():
    login_data = {
        "email": "joseffiran@gmail.com",
        "password": "Megalodon2208"
    }
    
    response = requests.post(
        "http://localhost:8000/api/v1/login/access-token",
        json=login_data,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        print(f"Admin login successful, token: {token[:20]}...")
        return token
    else:
        print(f"Admin login failed: {response.status_code} - {response.text}")
        return None

# Test creating a shipment
def test_create_shipment(token):
    shipment_data = {
        "name": "Test Shipment for Document Upload"
    }
    
    response = requests.post(
        "http://localhost:8000/api/v1/shipments/",
        json=shipment_data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    
    if response.status_code in [200, 201]:
        shipment = response.json()
        print(f"Shipment created successfully: ID {shipment['id']}")
        return shipment['id']
    else:
        print(f"Shipment creation failed: {response.status_code} - {response.text}")
        return None

# Test document upload
def test_document_upload(token, shipment_id):
    # Create a simple test image file (1x1 pixel PNG)
    import base64
    # Minimal PNG image data (1x1 black pixel)
    png_data = base64.b64decode(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9GtJDwgAAAABJRU5ErkJggg=='
    )
    
    files = {
        'file': ('test_invoice.png', png_data, 'image/png')
    }
    data = {
        'document_type': 'invoice'
    }
    
    response = requests.post(
        f"http://localhost:8000/api/v1/shipments/{shipment_id}/documents",
        files=files,
        data=data,
        headers={
            "Authorization": f"Bearer {token}"
        }
    )
    
    if response.status_code in [200, 202]:
        result = response.json()
        print(f"Document upload successful: {response.status_code} - {result.get('message', 'Upload completed')}")
        return True
    else:
        print(f"Document upload failed: {response.status_code} - {response.text}")
        return None

if __name__ == "__main__":
    print("Testing SilkRoute OS Document Upload System")
    print("=" * 50)
    
    # Test admin login
    token = test_admin_login()
    if not token:
        exit(1)
    
    # Test shipment creation
    shipment_id = test_create_shipment(token)
    if not shipment_id:
        exit(1)
    
    # Test document upload
    document_id = test_document_upload(token, shipment_id)
    if not document_id:
        exit(1)
    
    print("\nAll tests passed successfully!")
    print(f"Admin can now manage shipment {shipment_id} with document {document_id}")