"""Inventory management routes."""

import csv
import io
from flask import Blueprint, request, jsonify, make_response
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
    """Get current inventory with filters and pagination."""
    query = Product.query.filter(Product.status.in_(["In Warehouse", "Manufactured", "Sticker Printed"]))

    for field in ["product_type", "gsm", "colour", "quality", "location"]:
        value = request.args.get(field)
        if value:
            if field == "gsm":
                query = query.filter(Product.gsm == int(value))
            else:
                query = query.filter(getattr(Product, field) == value)

    search = request.args.get("search")
    if search:
        query = query.filter(Product.product_number.ilike(f"%{search}%"))

    laminated = request.args.get("laminated")
    if laminated is not None:
        query = query.filter(Product.laminated == (laminated.lower() == "true"))

    # Pagination
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 25, type=int)
    per_page = min(per_page, 100)

    pagination = query.order_by(Product.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "products": [p.to_dict() for p in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
        "per_page": per_page,
    })


@inventory_bp.route("/summary", methods=["GET"])
def inventory_summary():
    """Aggregated inventory summary by GSM + colour + type."""
    results = (
        db.session.query(
            Product.product_type,
            Product.gsm,
            Product.colour,
            Product.quality,
            func.count(Product.id).label("count"),
            func.sum(Product.net_weight).label("total_weight"),
        )
        .filter(Product.status.in_(["In Warehouse", "Manufactured", "Sticker Printed"]))
        .group_by(Product.product_type, Product.gsm, Product.colour, Product.quality)
        .all()
    )

    summary = [
        {
            "product_type": r.product_type,
            "gsm": r.gsm,
            "colour": r.colour,
            "quality": r.quality,
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
            func.sum(Product.net_weight).label("total_weight"),
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


@inventory_bp.route("/export", methods=["GET"])
def export_inventory():
    """Export inventory as CSV."""
    query = Product.query.filter(Product.status.in_(["In Warehouse", "Manufactured", "Sticker Printed"]))
    products = query.order_by(Product.product_number).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Product No", "Color", "Quality", "Type", "Length", "Width",
        "Gross Weight", "Net Weight", "GSM", "Laminated", "Location", "Status",
    ])

    for p in products:
        writer.writerow([
            p.product_number, p.colour, p.quality, p.product_type,
            p.length or "", p.width or "", p.gross_weight, p.net_weight,
            p.gsm, "Yes" if p.laminated else "No", p.location or "", p.status,
        ])

    response = make_response(output.getvalue())
    response.headers["Content-Disposition"] = "attachment; filename=inventory_export.csv"
    response.headers["Content-Type"] = "text/csv"
    return response
