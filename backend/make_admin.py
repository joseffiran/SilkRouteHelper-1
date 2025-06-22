"""
Make a user admin by email
"""
import sys
from sqlalchemy import create_engine, text
from core.config import settings

def make_user_admin(email: str):
    """Make a user admin by setting is_superuser to True"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Update user to be superuser
        result = conn.execute(
            text("UPDATE users SET is_superuser = true WHERE email = :email"),
            {"email": email}
        )
        conn.commit()
        
        if result.rowcount > 0:
            print(f"Successfully made {email} an admin")
        else:
            print(f"User {email} not found")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python make_admin.py <email>")
        sys.exit(1)
    
    email = sys.argv[1]
    make_user_admin(email)