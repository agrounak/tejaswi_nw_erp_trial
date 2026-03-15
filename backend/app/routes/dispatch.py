"""Dispatch and loading routes."""

from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from app import db
from app.models.product import Product
from app.models.dispatch import Dispatch, DispatchItem
from app.models.order import Order

dispatch_bp = Blueprint("dispatch", __name__)


def _next_dispatch_number():
    today = datetime.now(timezone.utc).strftime("%d%m%y")
    last = (
        Dispatch.query
        .filter(Dispatch.dispatch_number.like(f"DSP-{today}-%"))
        .order_by(Dispatch.dispatch_number.desc())
        .first()
    )
    seq = 1
    if last:
        seq = int(last.dispatch_number.split("-")[-1]) + 1
    return f"DSP-{today}-{seq:03d}"


@dispatch_bp.route("/create", methods=["POST"])
def create_dispatch():
    """Start a new dispatch / loading session."""
    data = request.get_json()
    required = ["order_id", "vehicle_number"]
    for f in required:
        if f not in data:
            return jsonify({"error": f"Missing: {f}"}), 400

    order = Order.query.get_or_404(data["order_id"])

    dispatch = Dispatch(
        dispatch_number=_next_dispatch_number(),
        order_id=order.id,
        client_name=order.client_name,
        vehicle_number=data["vehicle_number"],
        driver_name=data.get("driver_name"),
        driver_phone=data.get("driver_phone"),
    )
    db.session.add(dispatch)
    db.session.commit()

    return jsonify({"message": "Dispatch created", "dispatch": dispatch.to_dict()}), 201


@dispatch_bp.route("/<int:dispatch_id>/scan", methods=["POST"])
def scan_load(dispatch_id):
    """Scan a product QR code to load it onto the vehicle."""
    dispatch = Dispatch.query.get_or_404(dispatch_id)
    if dispatch.status == "Dispatched":
        return jsonify({"error": "Dispatch already completed"}), 400

    data = request.get_json()
    product_number = data.get("product_number")
    if not product_number:
        return jsonify({"error": "product_number required"}), 400

    product = Product.query.filter_by(product_number=product_number).first()
    if not product:
        return jsonify({"error": "Product not found", "valid": False}), 404

    if product.status == "Dispatched":
        return jsonify({"error": "Already dispatched", "valid": False}), 400

    if product.status not in ("Allocated", "In Warehouse"):
        return jsonify({"error": f"Product status '{product.status}' cannot be loaded", "valid": False}), 400

    # Check not already in this dispatch
    existing = DispatchItem.query.filter_by(dispatch_id=dispatch.id, product_id=product.id).first()
    if existing:
        return jsonify({"error": "Already scanned for this dispatch", "valid": False}), 400

    item = DispatchItem(dispatch_id=dispatch.id, product_id=product.id, weight=product.weight)
    db.session.add(item)

    product.status = "Loaded"
    dispatch.total_weight = sum(di.weight for di in dispatch.items) + product.weight
    dispatch.status = "Loading"
    db.session.commit()

    return jsonify({
        "message": "Product loaded",
        "valid": True,
        "product": product.to_dict(),
        "dispatch": dispatch.to_dict(),
    })


@dispatch_bp.route("/<int:dispatch_id>/complete", methods=["POST"])
def complete_dispatch(dispatch_id):
    """Mark dispatch as complete — vehicle leaves."""
    dispatch = Dispatch.query.get_or_404(dispatch_id)

    for item in dispatch.items:
        item.product.status = "Dispatched"

    dispatch.status = "Dispatched"

    # Update order status
    order = Order.query.get(dispatch.order_id)
    if order:
        order.status = "Dispatched"

    db.session.commit()

    return jsonify({"message": "Dispatch completed", "dispatch": dispatch.to_dict()})


@dispatch_bp.route("/", methods=["GET"])
def list_dispatches():
    status = request.args.get("status")
    query = Dispatch.query
    if status:
        query = query.filter(Dispatch.status == status)
    dispatches = query.order_by(Dispatch.created_at.desc()).all()
    return jsonify([d.to_dict() for d in dispatches])


@dispatch_bp.route("/<int:dispatch_id>", methods=["GET"])
def get_dispatch(dispatch_id):
    dispatch = Dispatch.query.get_or_404(dispatch_id)
    return jsonify(dispatch.to_dict())


@dispatch_bp.route("/<int:dispatch_id>/sheet", methods=["GET"])
def dispatch_sheet(dispatch_id):
    """Generate dispatch summary document data."""
    dispatch = Dispatch.query.get_or_404(dispatch_id)

    products = []
    for item in dispatch.items:
        products.append({
            "product_number": item.product.product_number,
            "product_type": item.product.product_type,
            "gsm": item.product.gsm,
            "colour": item.product.colour,
            "width": item.product.width,
            "weight": item.weight,
        })

    return jsonify({
        "dispatch_number": dispatch.dispatch_number,
        "client_name": dispatch.client_name,
        "vehicle_number": dispatch.vehicle_number,
        "driver_name": dispatch.driver_name,
        "dispatch_date": dispatch.dispatch_date.isoformat(),
        "status": dispatch.status,
        "products": products,
        "total_weight": dispatch.total_weight,
        "total_items": len(products),
    })
