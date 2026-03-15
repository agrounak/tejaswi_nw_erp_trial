from app import db
from datetime import datetime, timezone


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    product_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    trading_name = db.Column(db.String(100), nullable=False, default="Bharat Green")
    shift = db.Column(db.String(1), nullable=False)  # A or B
    production_date = db.Column(db.Date, nullable=False)
    serial_no = db.Column(db.Integer, nullable=False, default=0)
    quality = db.Column(db.String(50), nullable=False, default="Regular")
    gsm = db.Column(db.Integer, nullable=False)
    colour = db.Column(db.String(50), nullable=False)
    product_type = db.Column(db.String(20), nullable=False)  # Roll or Patti
    gross_weight = db.Column(db.Float, nullable=False, default=0)
    net_weight = db.Column(db.Float, nullable=False, default=0)
    length = db.Column(db.Float, nullable=True)  # meters
    width = db.Column(db.Float, nullable=True)  # inches
    laminated = db.Column(db.Boolean, default=False)
    machine = db.Column(db.String(20), nullable=True)
    location = db.Column(db.String(50), nullable=True)
    status = db.Column(
        db.String(30), nullable=False, default="Manufactured"
    )  # Manufactured, Sticker Printed, In Warehouse, Allocated, Loaded, Dispatched
    dispatch_id = db.Column(db.Integer, db.ForeignKey("dispatches.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    dispatch_items = db.relationship("DispatchItem", back_populates="product")

    def to_dict(self):
        return {
            "id": self.id,
            "product_number": self.product_number,
            "trading_name": self.trading_name,
            "shift": self.shift,
            "production_date": self.production_date.isoformat() if self.production_date else None,
            "serial_no": self.serial_no,
            "quality": self.quality,
            "gsm": self.gsm,
            "colour": self.colour,
            "product_type": self.product_type,
            "gross_weight": self.gross_weight,
            "net_weight": self.net_weight,
            "length": self.length,
            "width": self.width,
            "laminated": self.laminated,
            "machine": self.machine,
            "location": self.location,
            "status": self.status,
            "dispatch_id": self.dispatch_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
