"""Production entry & product CRUD routes."""

from datetime import datetime
from flask import Blueprint, request, jsonify
from app import db
from app.models.product import Product
from app.services.product_number import generate_product_number

production_bp = Blueprint("production", __name__)


@production_bp.route("/entry", methods=["POST"])
def create_product():
    """Register a new roll/patti from the production line."""
    data = request.get_json()
    required = ["product_type", "gsm", "width", "colour", "weight", "shift", "machine"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    prod_date = datetime.strptime(data.get("production_date", datetime.utcnow().strftime("%Y-%m-%d")), "%Y-%m-%d").date()
    product_number = generate_product_number(data["shift"], prod_date)

    product = Product(
        product_number=product_number,
        product_type=data["product_type"],
        gsm=int(data["gsm"]),
        width=float(data["width"]),
        colour=data["colour"],
        weight=float(data["weight"]),
        shift=data["shift"],
        machine=data["machine"],
        quality=data.get("quality", "Regular"),
        production_date=prod_date,
        status="Manufactured",
    )
    db.session.add(product)
    db.session.commit()

    return jsonify({"message": "Product created", "product": product.to_dict()}), 201


@production_bp.route("/products", methods=["GET"])
def list_products():
    """List products with optional filters."""
    query = Product.query

    for field in ["product_type", "gsm", "colour", "status", "shift", "machine"]:
        value = request.args.get(field)
        if value:
            if field == "gsm":
                query = query.filter(Product.gsm == int(value))
            else:
                query = query.filter(getattr(Product, field) == value)

    date_str = request.args.get("date")
    if date_str:
        query = query.filter(Product.production_date == datetime.strptime(date_str, "%Y-%m-%d").date())

    products = query.order_by(Product.created_at.desc()).all()
    return jsonify([p.to_dict() for p in products])


@production_bp.route("/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify(product.to_dict())


@production_bp.route("/scan/<product_number>", methods=["GET"])
def scan_product(product_number):
    """Look up a product by its QR / product number."""
    product = Product.query.filter_by(product_number=product_number).first()
    if not product:
        return jsonify({"error": "Product not found"}), 404
    return jsonify(product.to_dict())
