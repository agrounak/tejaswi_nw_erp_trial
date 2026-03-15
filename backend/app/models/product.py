from app import db
from datetime import datetime, timezone


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    product_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    product_type = db.Column(db.String(20), nullable=False)  # Roll / Patti
    gsm = db.Column(db.Integer, nullable=False)
    width = db.Column(db.Float, nullable=False)  # in inches
    colour = db.Column(db.String(50), nullable=False)
    weight = db.Column(db.Float, nullable=False)  # in kg
    shift = db.Column(db.String(1), nullable=False)  # A / B
    machine = db.Column(db.String(10), nullable=False)  # S1 / S2
    quality = db.Column(db.String(20), nullable=False, default="Regular")
    production_date = db.Column(db.Date, nullable=False, default=datetime.now(timezone.utc).date)
    location = db.Column(db.String(20), nullable=True)  # Warehouse location e.g. A-01
    status = db.Column(
        db.String(20), nullable=False, default="Manufactured"
    )  # Manufactured, Sticker Printed, In Warehouse, Allocated, Loaded, Dispatched
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    dispatch_items = db.relationship("DispatchItem", back_populates="product")

    def to_dict(self):
        return {
            "id": self.id,
            "product_number": self.product_number,
            "product_type": self.product_type,
            "gsm": self.gsm,
            "width": self.width,
            "colour": self.colour,
            "weight": self.weight,
            "shift": self.shift,
            "machine": self.machine,
            "quality": self.quality,
            "production_date": self.production_date.isoformat(),
            "location": self.location,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
