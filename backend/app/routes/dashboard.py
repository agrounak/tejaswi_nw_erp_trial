"""Dashboard summary routes."""

from datetime import datetime, timezone
from flask import Blueprint, jsonify
from sqlalchemy import func
from app import db
from app.models.product import Product
from app.models.dispatch import Dispatch

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/summary", methods=["GET"])
def daily_summary():
    today = datetime.now(timezone.utc).date()

    # Production today
    prod_today = (
        db.session.query(
            Product.product_type,
            func.count(Product.id).label("count"),
            func.coalesce(func.sum(Product.net_weight), 0).label("total_weight"),
        )
        .filter(Product.production_date == today)
        .group_by(Product.product_type)
        .all()
    )

    production = {
        "rolls": 0, "pattis": 0,
        "rolls_weight": 0, "pattis_weight": 0,
        "total_weight": 0,
    }
    for r in prod_today:
        if r.product_type == "Roll":
            production["rolls"] = r.count
            production["rolls_weight"] = round(float(r.total_weight), 2)
        elif r.product_type == "Patti":
            production["pattis"] = r.count
            production["pattis_weight"] = round(float(r.total_weight), 2)
    production["total_weight"] = production["rolls_weight"] + production["pattis_weight"]

    # Total inventory
    inv_totals = (
        db.session.query(
            func.count(Product.id).label("count"),
            func.coalesce(func.sum(Product.net_weight), 0).label("total_weight"),
        )
        .filter(Product.status.in_(["In Warehouse", "Manufactured", "Sticker Printed"]))
        .first()
    )

    inventory_total = {
        "count": inv_totals.count if inv_totals else 0,
        "total_weight": round(float(inv_totals.total_weight), 2) if inv_totals else 0,
    }

    # Inventory breakdown by colour + gsm
    inventory_breakdown = (
        db.session.query(
            Product.colour,
            Product.gsm,
            func.count(Product.id).label("count"),
            func.coalesce(func.sum(Product.net_weight), 0).label("total_weight"),
        )
        .filter(Product.status.in_(["In Warehouse", "Manufactured", "Sticker Printed"]))
        .group_by(Product.colour, Product.gsm)
        .all()
    )

    inventory_data = [
        {
            "colour": r.colour,
            "gsm": r.gsm,
            "count": r.count,
            "total_weight": round(float(r.total_weight), 2),
        }
        for r in inventory_breakdown
    ]

    # Dispatch today
    dispatch_today = (
        db.session.query(
            func.count(Dispatch.id).label("vehicles"),
            func.coalesce(func.sum(Dispatch.total_weight), 0).label("total_weight"),
            func.coalesce(func.sum(Dispatch.total_items), 0).label("total_items"),
        )
        .filter(Dispatch.dispatch_date == today, Dispatch.status == "Dispatched")
        .first()
    )

    dispatch = {
        "vehicles": dispatch_today.vehicles if dispatch_today else 0,
        "total_weight": round(float(dispatch_today.total_weight), 2) if dispatch_today else 0,
        "total_items": int(dispatch_today.total_items) if dispatch_today else 0,
    }

    # Status distribution
    status_counts = (
        db.session.query(Product.status, func.count(Product.id))
        .group_by(Product.status)
        .all()
    )

    # Top stats
    top_gsm = (
        db.session.query(Product.gsm, func.count(Product.id).label("cnt"))
        .filter(Product.status.in_(["In Warehouse", "Manufactured", "Sticker Printed"]))
        .group_by(Product.gsm)
        .order_by(func.count(Product.id).desc())
        .first()
    )

    top_colour = (
        db.session.query(Product.colour, func.count(Product.id).label("cnt"))
        .filter(Product.status.in_(["In Warehouse", "Manufactured", "Sticker Printed"]))
        .group_by(Product.colour)
        .order_by(func.count(Product.id).desc())
        .first()
    )

    return jsonify({
        "date": today.isoformat(),
        "production": production,
        "inventory_total": inventory_total,
        "inventory": inventory_data,
        "dispatch": dispatch,
        "status_distribution": {s: c for s, c in status_counts},
        "top_gsm": top_gsm.gsm if top_gsm else None,
        "top_colour": top_colour.colour if top_colour else None,
    })
