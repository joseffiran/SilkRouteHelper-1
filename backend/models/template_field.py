from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class TemplateField(Base):
    __tablename__ = "template_fields"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("declaration_templates.id"), nullable=False)
    field_name = Column(String, nullable=False)  # System name (e.g., "sender_name")
    label_ru = Column(String, nullable=False)  # User-facing label in Russian (e.g., "Отправитель/Экспортер")
    extraction_rules = Column(JSON, nullable=False)  # Stores rules, e.g., {"type": "regex", "pattern": "ИНН\\s(\\d{10})"}
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    template = relationship("DeclarationTemplate", back_populates="fields")