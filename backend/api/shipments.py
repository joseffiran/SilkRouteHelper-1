from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from models.user import User
from models.shipment import Shipment
from schemas.shipment import ShipmentCreate, ShipmentResponse
from services.shipment_service import create_shipment, get_shipments_by_user
from api.auth import get_current_user

router = APIRouter()

@router.post("/shipments/", response_model=ShipmentResponse, status_code=status.HTTP_201_CREATED)
async def create_new_shipment(
    shipment: ShipmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return create_shipment(db=db, shipment=shipment, user_id=current_user.id)

@router.get("/shipments/", response_model=List[ShipmentResponse])
async def read_shipments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    shipments = get_shipments_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return shipments

@router.get("/shipments/{shipment_id}", response_model=ShipmentResponse)
async def read_shipment(
    shipment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id,
        Shipment.user_id == current_user.id
    ).first()
    if shipment is None:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment
