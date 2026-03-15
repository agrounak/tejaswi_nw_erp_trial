from app import db
from datetime import datetime, timezone


class Config(db.Model):
    __tablename__ = "configs"

    id = db.Column(db.Integer, primary_key=True)
    config_type = db.Column(db.String(30), nullable=False, index=True)
    # Types: quality, colour, product_type, location
    value = db.Column(db.String(100), nullable=False)
    is_white = db.Column(db.Boolean, default=False)  # For colour billing logic
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "config_type": self.config_type,
            "value": self.value,
            "is_white": self.is_white,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
