"""Dashboard summary and analytics routes."""

from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify
from sqlalchemy import func, and_
from app import db
from app.models.product import Product
from app.models.dispatch import Dispatch, DispatchItem

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
        .filter(Product.status.in_(["In Warehouse"]))
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
        .filter(Product.status.in_(["In Warehouse"]))
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
        .filter(Product.status.in_(["In Warehouse"]))
        .group_by(Product.gsm)
        .order_by(func.count(Product.id).desc())
        .first()
    )

    top_colour = (
        db.session.query(Product.colour, func.count(Product.id).label("cnt"))
        .filter(Product.status.in_(["In Warehouse"]))
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


@dashboard_bp.route("/analytics", methods=["GET"])
def analytics():
    """Advanced analytics with date range, colour, quality, GSM, party filters."""
    # Parse date range
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    colour = request.args.get("colour")
    quality = request.args.get("quality")
    gsm = request.args.get("gsm")
    product_type = request.args.get("product_type")

    today = datetime.now(timezone.utc).date()
    if date_from:
        date_from = datetime.strptime(date_from, "%Y-%m-%d").date()
    else:
        date_from = today - timedelta(days=30)
    if date_to:
        date_to = datetime.strptime(date_to, "%Y-%m-%d").date()
    else:
        date_to = today

    # Base filter for production
    prod_filters = [
        Product.production_date >= date_from,
        Product.production_date <= date_to,
    ]
    if colour:
        prod_filters.append(Product.colour == colour)
    if quality:
        prod_filters.append(Product.quality == quality)
    if gsm:
        prod_filters.append(Product.gsm == int(gsm))
    if product_type:
        prod_filters.append(Product.product_type == product_type)

    # Production summary in date range
    production_by_date = (
        db.session.query(
            Product.production_date,
            func.count(Product.id).label("count"),
            func.coalesce(func.sum(Product.net_weight), 0).label("total_weight"),
        )
        .filter(and_(*prod_filters))
        .group_by(Product.production_date)
        .order_by(Product.production_date)
        .all()
    )

    production_daily = [
        {
            "date": r.production_date.isoformat(),
            "count": r.count,
            "total_weight": round(float(r.total_weight), 2),
        }
        for r in production_by_date
    ]

    # Production totals
    prod_totals = (
        db.session.query(
            func.count(Product.id).label("count"),
            func.coalesce(func.sum(Product.net_weight), 0).label("total_weight"),
        )
        .filter(and_(*prod_filters))
        .first()
    )

    # Breakdown by colour
    by_colour = (
        db.session.query(
            Product.colour,
            func.count(Product.id).label("count"),
            func.coalesce(func.sum(Product.net_weight), 0).label("total_weight"),
        )
        .filter(and_(*prod_filters))
        .group_by(Product.colour)
        .order_by(func.count(Product.id).desc())
        .all()
    )

    # Breakdown by quality
    by_quality = (
        db.session.query(
            Product.quality,
            func.count(Product.id).label("count"),
            func.coalesce(func.sum(Product.net_weight), 0).label("total_weight"),
        )
        .filter(and_(*prod_filters))
        .group_by(Product.quality)
        .order_by(func.count(Product.id).desc())
        .all()
    )

    # Breakdown by GSM
    by_gsm = (
        db.session.query(
            Product.gsm,
            func.count(Product.id).label("count"),
            func.coalesce(func.sum(Product.net_weight), 0).label("total_weight"),
        )
        .filter(and_(*prod_filters))
        .group_by(Product.gsm)
        .order_by(func.count(Product.id).desc())
        .all()
    )

    # Dispatch / party-wise summary in date range
    dispatch_filters = [
        Dispatch.dispatch_date >= date_from,
        Dispatch.dispatch_date <= date_to,
        Dispatch.status == "Dispatched",
    ]

    party_summary = (
        db.session.query(
            Dispatch.client_name,
            func.count(Dispatch.id).label("dispatches"),
            func.coalesce(func.sum(Dispatch.total_items), 0).label("total_items"),
            func.coalesce(func.sum(Dispatch.total_weight), 0).label("total_weight"),
        )
        .filter(and_(*dispatch_filters))
        .group_by(Dispatch.client_name)
        .order_by(func.sum(Dispatch.total_weight).desc())
        .all()
    )

    dispatch_by_date = (
        db.session.query(
            Dispatch.dispatch_date,
            func.count(Dispatch.id).label("vehicles"),
            func.coalesce(func.sum(Dispatch.total_items), 0).label("total_items"),
            func.coalesce(func.sum(Dispatch.total_weight), 0).label("total_weight"),
        )
        .filter(and_(*dispatch_filters))
        .group_by(Dispatch.dispatch_date)
        .order_by(Dispatch.dispatch_date)
        .all()
    )

    dispatch_totals = (
        db.session.query(
            func.count(Dispatch.id).label("vehicles"),
            func.coalesce(func.sum(Dispatch.total_items), 0).label("total_items"),
            func.coalesce(func.sum(Dispatch.total_weight), 0).label("total_weight"),
        )
        .filter(and_(*dispatch_filters))
        .first()
    )

    # Available filter options
    all_colours = [r[0] for r in db.session.query(Product.colour).distinct().all()]
    all_qualities = [r[0] for r in db.session.query(Product.quality).distinct().all()]
    all_gsm = [r[0] for r in db.session.query(Product.gsm).distinct().order_by(Product.gsm).all()]

    return jsonify({
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
        "production": {
            "total_rolls": prod_totals.count if prod_totals else 0,
            "total_weight": round(float(prod_totals.total_weight), 2) if prod_totals else 0,
            "daily": production_daily,
            "by_colour": [
                {"colour": r.colour, "count": r.count, "total_weight": round(float(r.total_weight), 2)}
                for r in by_colour
            ],
            "by_quality": [
                {"quality": r.quality, "count": r.count, "total_weight": round(float(r.total_weight), 2)}
                for r in by_quality
            ],
            "by_gsm": [
                {"gsm": r.gsm, "count": r.count, "total_weight": round(float(r.total_weight), 2)}
                for r in by_gsm
            ],
        },
        "dispatch": {
            "total_vehicles": dispatch_totals.vehicles if dispatch_totals else 0,
            "total_items": int(dispatch_totals.total_items) if dispatch_totals else 0,
            "total_weight": round(float(dispatch_totals.total_weight), 2) if dispatch_totals else 0,
            "daily": [
                {
                    "date": r.dispatch_date.isoformat(),
                    "vehicles": r.vehicles,
                    "total_items": int(r.total_items),
                    "total_weight": round(float(r.total_weight), 2),
                }
                for r in dispatch_by_date
            ],
            "by_party": [
                {
                    "client_name": r.client_name or "Unknown",
                    "dispatches": r.dispatches,
                    "total_items": int(r.total_items),
                    "total_weight": round(float(r.total_weight), 2),
                }
                for r in party_summary
            ],
        },
        "filters": {
            "colours": sorted(all_colours),
            "qualities": sorted(all_qualities),
            "gsm_values": all_gsm,
        },
    })
