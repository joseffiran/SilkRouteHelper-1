#!/usr/bin/env python3
"""
Fix database connectivity issues and clean up corrupted data
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from sqlalchemy.orm import Session
from core.database import get_db, engine
from models.user import User
from models.shipment import Shipment
from models.document import Document
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def fix_database():
    """Fix database issues and clean up corrupted data"""
    
    # Get database session
    db = next(get_db())
    
    try:
        print("🔧 Fixing database connectivity issues...")
        
        # 1. Clean up corrupted shipments
        print("📋 Cleaning up corrupted shipments...")
        corrupted_shipments = db.query(Shipment).all()
        for shipment in corrupted_shipments:
            if shipment.extracted_data:
                # If extracted_data is a string with unicode escapes, clean it
                if isinstance(shipment.extracted_data, str) and '\\u' in str(shipment.extracted_data):
                    shipment.extracted_data = None
                    print(f"   ✓ Cleaned shipment {shipment.id}")
        
        db.commit()
        
        # 2. Fix user password
        print("👤 Updating user authentication...")
        user = db.query(User).filter(User.email == "joseffiran@gmail.com").first()
        if user:
            # Create a fresh password hash
            new_hash = pwd_context.hash("password123")
            user.hashed_password = new_hash
            db.commit()
            print(f"   ✓ Updated password for {user.email}")
        else:
            print("   ❌ User not found")
        
        # 3. Verify database connectivity
        print("🔍 Verifying database connectivity...")
        user_count = db.query(User).count()
        shipment_count = db.query(Shipment).count()
        document_count = db.query(Document).count()
        
        print(f"   ✓ Users: {user_count}")
        print(f"   ✓ Shipments: {shipment_count}")
        print(f"   ✓ Documents: {document_count}")
        
        print("✅ Database connectivity restored!")
        
    except Exception as e:
        print(f"❌ Error fixing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_database()