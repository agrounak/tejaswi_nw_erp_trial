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
            func.coalesce(func.sum(Product.weight), 0).label("total_weight"),
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

    # Inventory summary
    inventory = (
        db.session.query(
            Product.colour,
            Product.gsm,
            func.count(Product.id).label("count"),
            func.coalesce(func.sum(Product.weight), 0).label("total_weight"),
        )
        .filter(Product.status == "In Warehouse")
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
        for r in inventory
    ]

    # Dispatch today
    dispatch_today = (
        db.session.query(
            func.count(Dispatch.id).label("vehicles"),
            func.coalesce(func.sum(Dispatch.total_weight), 0).label("total_weight"),
        )
        .filter(Dispatch.dispatch_date == today)
        .first()
    )

    dispatch = {
        "vehicles": dispatch_today.vehicles if dispatch_today else 0,
        "total_weight": round(float(dispatch_today.total_weight), 2) if dispatch_today else 0,
    }

    # Status distribution
    status_counts = (
        db.session.query(Product.status, func.count(Product.id))
        .group_by(Product.status)
        .all()
    )

    return jsonify({
        "date": today.isoformat(),
        "production": production,
        "inventory": inventory_data,
        "dispatch": dispatch,
        "status_distribution": {s: c for s, c in status_counts},
    })
