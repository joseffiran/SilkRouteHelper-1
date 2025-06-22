from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from models.document import DocumentType, DocumentStatus

class DocumentBase(BaseModel):
    document_type: DocumentType
    original_filename: str

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: int
    shipment_id: int
    storage_path: str
    status: DocumentStatus
    extracted_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True