from app import db
from datetime import datetime, timezone


class Dispatch(db.Model):
    __tablename__ = "dispatches"

    id = db.Column(db.Integer, primary_key=True)
    dispatch_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    client_name = db.Column(db.String(200), nullable=True)
    vehicle_number = db.Column(db.String(50), nullable=True)
    driver_name = db.Column(db.String(100), nullable=True)
    driver_phone = db.Column(db.String(20), nullable=True)
    dispatch_date = db.Column(db.Date, nullable=False, default=lambda: datetime.now(timezone.utc).date())
    status = db.Column(
        db.String(20), nullable=False, default="Loading"
    )  # Loading, Dispatched
    total_items = db.Column(db.Integer, default=0)
    total_weight = db.Column(db.Float, default=0)
    created_by = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    items = db.relationship("DispatchItem", back_populates="dispatch", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "dispatch_number": self.dispatch_number,
            "client_name": self.client_name or "",
            "vehicle_number": self.vehicle_number or "",
            "driver_name": self.driver_name,
            "driver_phone": self.driver_phone,
            "dispatch_date": self.dispatch_date.isoformat(),
            "status": self.status,
            "total_items": self.total_items,
            "total_weight": self.total_weight,
            "created_by": self.created_by,
            "items": [item.to_dict() for item in self.items],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class DispatchItem(db.Model):
    __tablename__ = "dispatch_items"

    id = db.Column(db.Integer, primary_key=True)
    dispatch_id = db.Column(db.Integer, db.ForeignKey("dispatches.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    weight = db.Column(db.Float, nullable=False)
    scanned_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    dispatch = db.relationship("Dispatch", back_populates="items")
    product = db.relationship("Product", back_populates="dispatch_items")

    def to_dict(self):
        p = self.product
        return {
            "id": self.id,
            "dispatch_id": self.dispatch_id,
            "product_id": self.product_id,
            "product_number": p.product_number if p else None,
            "colour": p.colour if p else None,
            "quality": p.quality if p else None,
            "product_type": p.product_type if p else None,
            "gsm": p.gsm if p else None,
            "gross_weight": p.gross_weight if p else None,
            "net_weight": p.net_weight if p else None,
            "length": p.length if p else None,
            "width": p.width if p else None,
            "weight": self.weight,
            "scanned_at": self.scanned_at.isoformat() if self.scanned_at else None,
        }
