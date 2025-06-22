from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    company_name: str = Field(alias="companyName")
    
    class Config:
        populate_by_name = True

class UserCreate(UserBase):
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    company_name: str
    is_active: bool
    is_superuser: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserInDB(UserResponse):
    hashed_password: str
