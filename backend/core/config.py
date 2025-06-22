import os
from typing import Optional

class Settings:
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/silkroute_db")
    
    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # App
    PROJECT_NAME: str = "SilkRoute OS Declaration Helper"
    VERSION: str = "1.0.0"
    
    # CORS
    ALLOWED_HOSTS: list = ["http://localhost:5000", "http://127.0.0.1:5000"]

settings = Settings()
