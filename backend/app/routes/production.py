"""Production entry (Sticker Generator) & product CRUD routes."""

from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from app import db
from app.models.product import Product
from app.services.product_number import generate_product_number

production_bp = Blueprint("production", __name__)


@production_bp.route("/entry", methods=["POST"])
def create_product():
    """Register a new roll/patti from the Sticker Generator form."""
    data = request.get_json()
    required = ["quality", "gsm", "colour", "product_type", "net_weight"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    shift = data.get("shift", "A")
    prod_date_str = data.get("production_date")
    if prod_date_str:
        prod_date = datetime.strptime(prod_date_str, "%Y-%m-%d").date()
    else:
        prod_date = datetime.now(timezone.utc).date()

    product_number, serial_no = generate_product_number(shift, prod_date)

    product = Product(
        product_number=product_number,
        trading_name=data.get("trading_name", "Bharat Green"),
        shift=shift,
        production_date=prod_date,
        serial_no=serial_no,
        quality=data["quality"],
        gsm=int(data["gsm"]),
        colour=data["colour"],
        product_type=data["product_type"],
        gross_weight=float(data.get("gross_weight", 0)),
        net_weight=float(data["net_weight"]),
        length=float(data["length"]) if data.get("length") else None,
        width=float(data["width"]) if data.get("width") else None,
        laminated=bool(data.get("laminated", False)),
        machine=data.get("machine"),
        location=data.get("location"),
        status="Manufactured",
    )
    db.session.add(product)
    db.session.commit()

    return jsonify({"message": "Product created", "product": product.to_dict()}), 201


@production_bp.route("/products", methods=["GET"])
def list_products():
    """List products with optional filters and pagination."""
    query = Product.query

    for field in ["product_type", "gsm", "colour", "status", "shift", "quality"]:
        value = request.args.get(field)
        if value:
            if field == "gsm":
                query = query.filter(Product.gsm == int(value))
            else:
                query = query.filter(getattr(Product, field) == value)

    date_str = request.args.get("date")
    if date_str:
        query = query.filter(Product.production_date == datetime.strptime(date_str, "%Y-%m-%d").date())

    search = request.args.get("search")
    if search:
        query = query.filter(Product.product_number.ilike(f"%{search}%"))

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


@production_bp.route("/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify(product.to_dict())


@production_bp.route("/products/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    """Edit a product's details."""
    product = Product.query.get_or_404(product_id)
    data = request.get_json()

    editable = [
        "product_type", "colour", "quality", "length", "width",
        "gross_weight", "net_weight", "laminated", "status", "location",
    ]
    for field in editable:
        if field in data:
            if field in ("gross_weight", "net_weight", "length", "width"):
                setattr(product, field, float(data[field]) if data[field] else None)
            elif field == "laminated":
                setattr(product, field, bool(data[field]))
            else:
                setattr(product, field, data[field])

    db.session.commit()
    return jsonify({"message": "Product updated", "product": product.to_dict()})


@production_bp.route("/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    """Delete a product."""
    product = Product.query.get_or_404(product_id)
    if product.status in ("Loaded", "Dispatched"):
        return jsonify({"error": "Cannot delete dispatched product"}), 400
    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Product deleted"})


@production_bp.route("/scan/<product_number>", methods=["GET"])
def scan_product(product_number):
    """Look up a product by its QR / product number."""
    product = Product.query.filter_by(product_number=product_number).first()
    if not product:
        return jsonify({"error": "Product not found"}), 404
    return jsonify(product.to_dict())
