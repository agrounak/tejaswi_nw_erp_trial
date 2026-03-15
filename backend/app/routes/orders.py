"""Sales order routes."""

from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from app import db
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.services.allocation import allocate_products

orders_bp = Blueprint("orders", __name__)


def _next_order_number():
    today = datetime.now(timezone.utc).strftime("%d%m%y")
    last = (
        Order.query
        .filter(Order.order_number.like(f"ORD-{today}-%"))
        .order_by(Order.order_number.desc())
        .first()
    )
    seq = 1
    if last:
        seq = int(last.order_number.split("-")[-1]) + 1
    return f"ORD-{today}-{seq:03d}"


@orders_bp.route("/", methods=["POST"])
def create_order():
    data = request.get_json()
    if not data.get("client_name") or not data.get("items"):
        return jsonify({"error": "client_name and items required"}), 400

    order = Order(
        order_number=_next_order_number(),
        client_name=data["client_name"],
        client_phone=data.get("client_phone"),
        client_address=data.get("client_address"),
        notes=data.get("notes"),
    )
    if data.get("required_date"):
        order.required_date = datetime.strptime(data["required_date"], "%Y-%m-%d").date()

    for item_data in data["items"]:
        order.items.append(OrderItem(
            product_type=item_data["product_type"],
            gsm=int(item_data["gsm"]),
            colour=item_data["colour"],
            width=float(item_data.get("width", 0)) or None,
            quantity_kg=float(item_data["quantity_kg"]),
        ))

    db.session.add(order)
    db.session.commit()
    return jsonify({"message": "Order created", "order": order.to_dict()}), 201


@orders_bp.route("/", methods=["GET"])
def list_orders():
    status = request.args.get("status")
    query = Order.query
    if status:
        query = query.filter(Order.status == status)
    orders = query.order_by(Order.created_at.desc()).all()
    return jsonify([o.to_dict() for o in orders])


@orders_bp.route("/<int:order_id>", methods=["GET"])
def get_order(order_id):
    order = Order.query.get_or_404(order_id)
    return jsonify(order.to_dict())


@orders_bp.route("/<int:order_id>/allocate", methods=["POST"])
def allocate_order(order_id):
    """Auto-allocate inventory to this order's items."""
    order = Order.query.get_or_404(order_id)
    if order.status not in ("Pending",):
        return jsonify({"error": "Order already allocated"}), 400

    allocation_results = []
    for item in order.items:
        remaining = item.quantity_kg - item.allocated_kg
        if remaining <= 0:
            continue

        products, total = allocate_products(
            item.product_type, item.gsm, item.colour, remaining, item.width
        )
        for p in products:
            p.status = "Allocated"
        item.allocated_kg += total

        allocation_results.append({
            "item_id": item.id,
            "product_type": item.product_type,
            "gsm": item.gsm,
            "colour": item.colour,
            "requested_kg": remaining,
            "allocated_kg": total,
            "products": [p.product_number for p in products],
        })

    order.status = "Allocated"
    db.session.commit()

    return jsonify({
        "message": "Allocation complete",
        "order": order.to_dict(),
        "allocation": allocation_results,
    })
