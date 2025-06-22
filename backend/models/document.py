from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base
import enum

class DocumentStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    ERROR = "error"

class DocumentType(str, enum.Enum):
    INVOICE = "invoice"
    PACKING_LIST = "packing_list"
    CERTIFICATE_OF_QUALITY = "certificate_of_quality"
    CUSTOMS_DECLARATION = "customs_declaration"
    BILL_OF_LADING = "bill_of_lading"
    ORIGIN_CERTIFICATE = "origin_certificate"

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=False)
    document_type = Column(Enum(DocumentType), nullable=False)
    original_filename = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.UPLOADED)
    extracted_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    shipment = relationship("Shipment", back_populates="documents")