"""Inventory management routes."""

from flask import Blueprint, request, jsonify
from sqlalchemy import func
from app import db
from app.models.product import Product

inventory_bp = Blueprint("inventory", __name__)


@inventory_bp.route("/receive", methods=["POST"])
def receive_to_warehouse():
    """Scan product into warehouse and assign location."""
    data = request.get_json()
    product_number = data.get("product_number")
    location = data.get("location")

    if not product_number or not location:
        return jsonify({"error": "product_number and location required"}), 400

    product = Product.query.filter_by(product_number=product_number).first()
    if not product:
        return jsonify({"error": "Product not found"}), 404

    if product.status not in ("Manufactured", "Sticker Printed"):
        return jsonify({"error": f"Product status is '{product.status}', cannot receive"}), 400

    product.location = location
    product.status = "In Warehouse"
    db.session.commit()

    return jsonify({"message": "Product received into warehouse", "product": product.to_dict()})


@inventory_bp.route("/stock", methods=["GET"])
def get_stock():
    """Get current inventory with filters."""
    query = Product.query.filter(Product.status == "In Warehouse")

    for field in ["product_type", "gsm", "colour", "width", "location"]:
        value = request.args.get(field)
        if value:
            if field in ("gsm",):
                query = query.filter(Product.gsm == int(value))
            elif field == "width":
                query = query.filter(Product.width == float(value))
            else:
                query = query.filter(getattr(Product, field) == value)

    products = query.order_by(Product.location, Product.product_number).all()
    return jsonify([p.to_dict() for p in products])


@inventory_bp.route("/summary", methods=["GET"])
def inventory_summary():
    """Aggregated inventory summary by GSM + colour + type."""
    results = (
        db.session.query(
            Product.product_type,
            Product.gsm,
            Product.colour,
            func.count(Product.id).label("count"),
            func.sum(Product.weight).label("total_weight"),
        )
        .filter(Product.status == "In Warehouse")
        .group_by(Product.product_type, Product.gsm, Product.colour)
        .all()
    )

    summary = [
        {
            "product_type": r.product_type,
            "gsm": r.gsm,
            "colour": r.colour,
            "count": r.count,
            "total_weight": round(r.total_weight, 2) if r.total_weight else 0,
        }
        for r in results
    ]
    return jsonify(summary)


@inventory_bp.route("/locations", methods=["GET"])
def warehouse_map():
    """Get all occupied locations with product counts."""
    results = (
        db.session.query(
            Product.location,
            func.count(Product.id).label("count"),
            func.sum(Product.weight).label("total_weight"),
        )
        .filter(Product.status == "In Warehouse", Product.location.isnot(None))
        .group_by(Product.location)
        .all()
    )

    locations = [
        {
            "location": r.location,
            "count": r.count,
            "total_weight": round(r.total_weight, 2) if r.total_weight else 0,
        }
        for r in results
    ]
    return jsonify(locations)
