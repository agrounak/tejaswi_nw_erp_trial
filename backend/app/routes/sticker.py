"""Sticker generation routes."""

from flask import Blueprint, jsonify, send_file
from app.models.product import Product
from app.services.qr_generator import generate_sticker_image
import io

sticker_bp = Blueprint("sticker", __name__)


@sticker_bp.route("/<int:product_id>", methods=["GET"])
def get_sticker(product_id):
    """Generate and return sticker image for a product."""
    product = Product.query.get_or_404(product_id)

    img_bytes = generate_sticker_image(product.to_dict())

    # Update status to Sticker Printed if still Manufactured
    if product.status == "Manufactured":
        from app import db
        product.status = "Sticker Printed"
        db.session.commit()

    return send_file(
        io.BytesIO(img_bytes),
        mimetype="image/png",
        as_attachment=True,
        download_name=f"sticker_{product.product_number}.png",
    )


@sticker_bp.route("/<int:product_id>/preview", methods=["GET"])
def preview_sticker(product_id):
    """Return sticker as inline image (for browser preview)."""
    product = Product.query.get_or_404(product_id)
    img_bytes = generate_sticker_image(product.to_dict())

    return send_file(
        io.BytesIO(img_bytes),
        mimetype="image/png",
    )
