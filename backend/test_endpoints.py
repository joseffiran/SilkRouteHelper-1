#!/usr/bin/env python3
"""
Test FastAPI endpoints connectivity
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_endpoints():
    """Test all critical endpoints"""
    
    print("🧪 Testing FastAPI endpoint connectivity...")
    
    # 1. Test authentication
    print("\n👤 Testing authentication...")
    auth_data = {
        "email": "joseffiran@gmail.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login/access-token", json=auth_data)
        print(f"   Login status: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            token = token_data.get("access_token")
            print(f"   ✓ Token obtained: {token[:20]}...")
            
            # Headers for authenticated requests
            headers = {"Authorization": f"Bearer {token}"}
            
            # 2. Test user info
            print("\n📋 Testing user info...")
            user_response = requests.get(f"{BASE_URL}/me", headers=headers)
            print(f"   User info status: {user_response.status_code}")
            if user_response.status_code == 200:
                user_data = user_response.json()
                print(f"   ✓ User: {user_data.get('email')}")
            
            # 3. Test shipments
            print("\n🚢 Testing shipments...")
            shipments_response = requests.get(f"{BASE_URL}/shipments/", headers=headers)
            print(f"   Shipments status: {shipments_response.status_code}")
            if shipments_response.status_code == 200:
                shipments_data = shipments_response.json()
                print(f"   ✓ Shipments count: {len(shipments_data)}")
            else:
                print(f"   ❌ Error: {shipments_response.text}")
            
            # 4. Test templates
            print("\n📝 Testing templates...")
            templates_response = requests.get(f"{BASE_URL}/declarations/templates", headers=headers)
            print(f"   Templates status: {templates_response.status_code}")
            if templates_response.status_code == 200:
                templates_data = templates_response.json()
                print(f"   ✓ Templates count: {len(templates_data)}")
            
            # 5. Test admin endpoints (if user is admin)
            print("\n🔧 Testing admin endpoints...")
            admin_response = requests.get(f"{BASE_URL}/admin/templates", headers=headers)
            print(f"   Admin templates status: {admin_response.status_code}")
            if admin_response.status_code == 200:
                admin_data = admin_response.json()
                print(f"   ✓ Admin templates count: {len(admin_data)}")
            
        else:
            print(f"   ❌ Authentication failed: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Connection error: {e}")
    
    print("\n✅ Endpoint testing complete!")

if __name__ == "__main__":
    test_endpoints()