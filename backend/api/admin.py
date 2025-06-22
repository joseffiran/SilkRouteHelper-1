from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from models.user import User
from models.declaration_template import DeclarationTemplate
from models.template_field import TemplateField
from api.auth import get_current_user

router = APIRouter()

def get_admin_user(current_user: User = Depends(get_current_user)):
    """Dependency to verify user has admin privileges"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Admin privileges required."
        )
    return current_user

# Declaration Template endpoints
@router.get("/templates/")
async def list_templates(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """List all declaration templates"""
    templates = db.query(DeclarationTemplate).all()
    return templates

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