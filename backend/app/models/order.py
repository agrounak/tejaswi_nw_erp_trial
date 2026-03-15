from app import db
from datetime import datetime, timezone


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    client_name = db.Column(db.String(200), nullable=False)
    client_phone = db.Column(db.String(20), nullable=True)
    client_address = db.Column(db.Text, nullable=True)
    order_date = db.Column(db.Date, nullable=False, default=lambda: datetime.now(timezone.utc).date())
    required_date = db.Column(db.Date, nullable=True)
    status = db.Column(
        db.String(20), nullable=False, default="Pending"
    )  # Pending, Allocated, Partially Loaded, Loaded, Dispatched, Completed
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    items = db.relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "order_number": self.order_number,
            "client_name": self.client_name,
            "client_phone": self.client_phone,
            "client_address": self.client_address,
            "order_date": self.order_date.isoformat(),
            "required_date": self.required_date.isoformat() if self.required_date else None,
            "status": self.status,
            "notes": self.notes,
            "items": [item.to_dict() for item in self.items],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    product_type = db.Column(db.String(20), nullable=False)  # Roll / Patti
    gsm = db.Column(db.Integer, nullable=False)
    colour = db.Column(db.String(50), nullable=False)
    width = db.Column(db.Float, nullable=True)
    quantity_kg = db.Column(db.Float, nullable=False)
    allocated_kg = db.Column(db.Float, nullable=False, default=0)

    order = db.relationship("Order", back_populates="items")

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "product_type": self.product_type,
            "gsm": self.gsm,
            "colour": self.colour,
            "width": self.width,
            "quantity_kg": self.quantity_kg,
            "allocated_kg": self.allocated_kg,
        }
