from sqlalchemy.orm import Session
from models.shipment import Shipment
from schemas.shipment import ShipmentCreate

def create_shipment(db: Session, shipment: ShipmentCreate, user_id: int):
    db_shipment = Shipment(
        name=shipment.name,
        status=shipment.status,
        user_id=user_id
    )
    db.add(db_shipment)
    db.commit()
    db.refresh(db_shipment)
    return db_shipment

def get_shipments_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(Shipment).filter(Shipment.user_id == user_id).offset(skip).limit(limit).all()
