"""Dispatch and loading routes — scan-first workflow."""

from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from app import db
from app.models.product import Product
from app.models.dispatch import Dispatch, DispatchItem

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


@dispatch_bp.route("/start", methods=["POST"])
def start_dispatch():
    """Start a new dispatch session — no party details required yet."""
    data = request.get_json() or {}
    dispatch = Dispatch(
        dispatch_number=_next_dispatch_number(),
        created_by=data.get("created_by"),
    )
    db.session.add(dispatch)
    db.session.commit()
    return jsonify({"message": "Dispatch session started", "dispatch": dispatch.to_dict()}), 201


@dispatch_bp.route("/<int:dispatch_id>/details", methods=["PUT"])
def update_dispatch_details(dispatch_id):
    """Update party / vehicle details on an existing dispatch."""
    dispatch = Dispatch.query.get_or_404(dispatch_id)
    if dispatch.status == "Dispatched":
        return jsonify({"error": "Cannot modify completed dispatch"}), 400

    data = request.get_json()
    if data.get("client_name"):
        dispatch.client_name = data["client_name"]
    if data.get("vehicle_number"):
        dispatch.vehicle_number = data["vehicle_number"]
    if "driver_name" in data:
        dispatch.driver_name = data.get("driver_name")
    if "driver_phone" in data:
        dispatch.driver_phone = data.get("driver_phone")

    db.session.commit()
    return jsonify({"message": "Details updated", "dispatch": dispatch.to_dict()})


@dispatch_bp.route("/create", methods=["POST"])
def create_dispatch():
    """Legacy create — also supports scan-first (client_name optional)."""
    data = request.get_json() or {}
    dispatch = Dispatch(
        dispatch_number=_next_dispatch_number(),
        client_name=data.get("client_name"),
        vehicle_number=data.get("vehicle_number"),
        driver_name=data.get("driver_name"),
        driver_phone=data.get("driver_phone"),
        created_by=data.get("created_by"),
    )
    db.session.add(dispatch)
    db.session.commit()
    return jsonify({"message": "Dispatch created", "dispatch": dispatch.to_dict()}), 201


@dispatch_bp.route("/<int:dispatch_id>/scan", methods=["POST"])
def scan_load(dispatch_id):
    """Scan a product QR code to load it onto the dispatch."""
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

    if product.status == "Loaded":
        return jsonify({"error": "Already loaded on another dispatch", "valid": False}), 400

    existing = DispatchItem.query.filter_by(dispatch_id=dispatch.id, product_id=product.id).first()
    if existing:
        return jsonify({"error": "Duplicate scan — already scanned for this dispatch", "valid": False}), 400

    item = DispatchItem(dispatch_id=dispatch.id, product_id=product.id, weight=product.net_weight)
    db.session.add(item)

    product.status = "Loaded"
    product.dispatch_id = dispatch.id
    dispatch.total_items = len(dispatch.items) + 1
    dispatch.total_weight = sum(di.weight for di in dispatch.items) + product.net_weight
    dispatch.status = "Loading"
    db.session.commit()

    return jsonify({
        "message": "Product loaded successfully",
        "valid": True,
        "product": product.to_dict(),
        "dispatch": dispatch.to_dict(),
    })


@dispatch_bp.route("/<int:dispatch_id>/remove/<int:item_id>", methods=["DELETE"])
def remove_item(dispatch_id, item_id):
    """Remove a scanned item from the dispatch."""
    dispatch = Dispatch.query.get_or_404(dispatch_id)
    if dispatch.status == "Dispatched":
        return jsonify({"error": "Cannot modify completed dispatch"}), 400

    item = DispatchItem.query.get_or_404(item_id)
    if item.dispatch_id != dispatch.id:
        return jsonify({"error": "Item does not belong to this dispatch"}), 400

    product = Product.query.get(item.product_id)
    if product:
        product.status = "In Warehouse"
        product.dispatch_id = None

    db.session.delete(item)
    dispatch.total_items = max(0, len(dispatch.items) - 1)
    dispatch.total_weight = max(0, sum(di.weight for di in dispatch.items) - item.weight)
    db.session.commit()

    return jsonify({"message": "Item removed", "dispatch": dispatch.to_dict()})


@dispatch_bp.route("/<int:dispatch_id>/rough-slip", methods=["POST"])
def rough_packing_slip(dispatch_id):
    """Generate rough packing slip data — does NOT alter inventory."""
    dispatch = Dispatch.query.get_or_404(dispatch_id)
    if not dispatch.items:
        return jsonify({"error": "No items loaded"}), 400

    return _build_sheet_response(dispatch, is_final=False)


@dispatch_bp.route("/<int:dispatch_id>/final-slip", methods=["POST"])
def final_packing_slip(dispatch_id):
    """Generate final packing slip — marks products as Dispatched and removes from inventory."""
    dispatch = Dispatch.query.get_or_404(dispatch_id)
    if not dispatch.items:
        return jsonify({"error": "No items loaded"}), 400

    if not dispatch.client_name or not dispatch.vehicle_number:
        return jsonify({"error": "Client name and vehicle number required before final dispatch"}), 400

    for item in dispatch.items:
        item.product.status = "Dispatched"

    dispatch.status = "Dispatched"
    db.session.commit()

    return _build_sheet_response(dispatch, is_final=True)


@dispatch_bp.route("/<int:dispatch_id>/finalize", methods=["POST"])
def finalize_dispatch(dispatch_id):
    """Legacy finalize — same as final-slip."""
    dispatch = Dispatch.query.get_or_404(dispatch_id)
    if not dispatch.items:
        return jsonify({"error": "No items loaded"}), 400

    for item in dispatch.items:
        item.product.status = "Dispatched"

    dispatch.status = "Dispatched"
    db.session.commit()

    return jsonify({"message": "Dispatch finalized", "dispatch": dispatch.to_dict()})


def _build_sheet_response(dispatch, is_final=False):
    """Build packing slip response data."""
    products = []
    summary = {}
    for item in dispatch.items:
        p = item.product
        prod_data = {
            "product_number": p.product_number,
            "product_type": p.product_type,
            "gsm": p.gsm,
            "colour": p.colour,
            "quality": p.quality,
            "width": p.width,
            "length": p.length,
            "gross_weight": p.gross_weight,
            "net_weight": item.weight,
        }
        products.append(prod_data)

        key = f"{p.quality}|{p.colour}|{p.product_type}"
        if key not in summary:
            summary[key] = {
                "quality": p.quality,
                "colour": p.colour,
                "product_type": p.product_type,
                "count": 0,
                "total_weight": 0,
            }
        summary[key]["count"] += 1
        summary[key]["total_weight"] = round(summary[key]["total_weight"] + item.weight, 2)

    return jsonify({
        "dispatch_number": dispatch.dispatch_number,
        "client_name": dispatch.client_name or "",
        "vehicle_number": dispatch.vehicle_number or "",
        "driver_name": dispatch.driver_name,
        "driver_phone": dispatch.driver_phone,
        "dispatch_date": dispatch.dispatch_date.isoformat(),
        "status": dispatch.status,
        "is_final": is_final,
        "products": products,
        "summary": list(summary.values()),
        "total_weight": dispatch.total_weight,
        "total_items": dispatch.total_items,
    })


@dispatch_bp.route("/", methods=["GET"])
def list_dispatches():
    status = request.args.get("status")
    query = Dispatch.query
    if status:
        query = query.filter(Dispatch.status == status)
    dispatches = query.order_by(Dispatch.created_at.desc()).all()
    return jsonify([d.to_dict() for d in dispatches])


@dispatch_bp.route("/history", methods=["GET"])
def dispatch_history():
    """Get dispatched (completed) dispatches for history page."""
    query = Dispatch.query.filter(Dispatch.status == "Dispatched")
    dispatches = query.order_by(Dispatch.created_at.desc()).all()
    return jsonify([d.to_dict() for d in dispatches])


@dispatch_bp.route("/<int:dispatch_id>", methods=["GET"])
def get_dispatch(dispatch_id):
    dispatch = Dispatch.query.get_or_404(dispatch_id)
    return jsonify(dispatch.to_dict())


@dispatch_bp.route("/<int:dispatch_id>/sheet", methods=["GET"])
def dispatch_sheet(dispatch_id):
    """Generate packing slip / dispatch summary data."""
    dispatch = Dispatch.query.get_or_404(dispatch_id)
    return _build_sheet_response(dispatch, is_final=False)
