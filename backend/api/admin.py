from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from core.database import get_db
from models.user import User
from models.declaration_template import DeclarationTemplate
from models.template_field import TemplateField
from models.shipment import Shipment
from models.document import Document
from api.auth import get_current_user
from core.security import get_password_hash

router = APIRouter()

def get_admin_user(current_user: User = Depends(get_current_user)):
    """Dependency to verify user has admin privileges"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Admin privileges required."
        )
    return current_user

# Admin Stats endpoint
@router.get("/stats")
async def get_admin_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Get admin dashboard statistics"""
    
    # Get user statistics
    total_users = db.query(func.count(User.id)).scalar()
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    
    # Get shipment statistics
    total_shipments = db.query(func.count(Shipment.id)).scalar()
    completed_shipments = db.query(func.count(Shipment.id)).filter(Shipment.status == "completed").scalar()
    
    # Get document statistics
    total_documents = db.query(func.count(Document.id)).scalar()
    processed_documents = db.query(func.count(Document.id)).filter(Document.status == "completed").scalar()
    
    # Get template statistics
    total_templates = db.query(func.count(DeclarationTemplate.id)).scalar()
    active_templates = db.query(func.count(DeclarationTemplate.id)).filter(DeclarationTemplate.is_active == True).scalar()
    
    return {
        "users": {
            "total": total_users or 0,
            "active": active_users or 0
        },
        "shipments": {
            "total": total_shipments or 0,
            "completed": completed_shipments or 0
        },
        "documents": {
            "total": total_documents or 0,
            "processed": processed_documents or 0
        },
        "templates": {
            "total": total_templates or 0,
            "active": active_templates or 0
        }
    }

# Declaration Template endpoints
@router.get("/templates/")
async def list_templates(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """List all declaration templates"""
    templates = db.query(DeclarationTemplate).all()
    return templates

@router.get("/templates/{template_id}")
async def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Get a specific template with its fields"""
    template = db.query(DeclarationTemplate).filter(DeclarationTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Get template fields
    fields = db.query(TemplateField).filter(TemplateField.template_id == template_id).all()
    
    return {
        "id": template.id,
        "name": template.name,
        "is_active": template.is_active,
        "created_at": template.created_at,
        "updated_at": template.updated_at,
        "fields": [
            {
                "id": field.id,
                "field_name": field.field_name,
                "label_ru": field.label_ru,
                "extraction_rules": field.extraction_rules,
                "created_at": field.created_at,
                "updated_at": field.updated_at
            }
            for field in fields
        ]
    }

@router.post("/templates/")
async def create_template(
    name: str,
    is_active: bool = False,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Create a new declaration template"""
    
    # If setting as active, deactivate other templates
    if is_active:
        db.query(DeclarationTemplate).update({DeclarationTemplate.is_active: False})
    
    template = DeclarationTemplate(name=name, is_active=is_active)
    db.add(template)
    db.commit()
    db.refresh(template)
    return template

@router.put("/templates/{template_id}")
async def update_template(
    template_id: int,
    name: str = None,
    is_active: bool = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Update a declaration template"""
    template = db.query(DeclarationTemplate).filter(DeclarationTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    if name is not None:
        template.name = name
    
    if is_active is not None:
        if is_active:
            # Deactivate other templates
            db.query(DeclarationTemplate).update({DeclarationTemplate.is_active: False})
        template.is_active = is_active
    
    db.commit()
    db.refresh(template)
    return template

@router.delete("/templates/{template_id}")
async def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Delete a declaration template"""
    template = db.query(DeclarationTemplate).filter(DeclarationTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db.delete(template)
    db.commit()
    return {"message": "Template deleted successfully"}

# Template Field endpoints
@router.get("/templates/{template_id}/fields")
async def list_template_fields(
    template_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """List all fields for a specific template"""
    fields = db.query(TemplateField).filter(TemplateField.template_id == template_id).all()
    return fields

@router.post("/templates/{template_id}/fields")
async def create_template_field(
    template_id: int,
    field_name: str,
    label_ru: str,
    extraction_rules: dict,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Create a new template field"""
    
    # Verify template exists
    template = db.query(DeclarationTemplate).filter(DeclarationTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    field = TemplateField(
        template_id=template_id,
        field_name=field_name,
        label_ru=label_ru,
        extraction_rules=extraction_rules
    )
    db.add(field)
    db.commit()
    db.refresh(field)
    return field

@router.put("/fields/{field_id}")
async def update_template_field(
    field_id: int,
    field_name: str = None,
    label_ru: str = None,
    extraction_rules: dict = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Update a template field"""
    field = db.query(TemplateField).filter(TemplateField.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    if field_name is not None:
        field.field_name = field_name
    if label_ru is not None:
        field.label_ru = label_ru
    if extraction_rules is not None:
        field.extraction_rules = extraction_rules
    
    db.commit()
    db.refresh(field)
    return field

@router.delete("/fields/{field_id}")
async def delete_template_field(
    field_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Delete a template field"""
    field = db.query(TemplateField).filter(TemplateField.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    db.delete(field)
    db.commit()
    return {"message": "Field deleted successfully"}

# User Management endpoints
@router.get("/users/")
async def list_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """List all users"""
    users = db.query(User).all()
    return users

@router.post("/users/")
async def create_user(
    email: str,
    companyName: str,
    password: str,
    is_superuser: bool = False,
    isActive: bool = True,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Create a new user"""
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    hashed_password = get_password_hash(password)
    user = User(
        email=email,
        companyName=companyName,
        hashed_password=hashed_password,
        is_superuser=is_superuser,
        isActive=isActive
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    email: str = None,
    companyName: str = None,
    password: str = None,
    is_superuser: bool = None,
    isActive: bool = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Update a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if email is not None:
        # Check if email is already taken by another user
        existing_user = db.query(User).filter(User.email == email, User.id != user_id).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already taken")
        user.email = email
    
    if companyName is not None:
        user.companyName = companyName
    
    if password is not None:
        user.hashed_password = get_password_hash(password)
    
    if is_superuser is not None:
        user.is_superuser = is_superuser
    
    if isActive is not None:
        user.isActive = isActive
    
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Delete a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent admin from deleting themselves
    if user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}