from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from .document import DocumentResponse

class ShipmentBase(BaseModel):
    name: str
    status: Optional[str] = "processing"

class ShipmentCreate(ShipmentBase):
    pass

class ShipmentResponse(ShipmentBase):
    id: int
    user_id: int
    extracted_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    documents: List[DocumentResponse] = []
    
    class Config:
        from_attributes = True
