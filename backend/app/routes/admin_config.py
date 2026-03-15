"""Admin configuration routes — manage dropdown options."""

from flask import Blueprint, request, jsonify
from app import db
from app.models.config import Config

admin_config_bp = Blueprint("admin_config", __name__)

VALID_TYPES = ("quality", "colour", "product_type", "location")


@admin_config_bp.route("/", methods=["GET"])
def list_configs():
    """Get all config options, optionally filtered by type."""
    config_type = request.args.get("type")
    query = Config.query
    if config_type and config_type in VALID_TYPES:
        query = query.filter(Config.config_type == config_type)
    configs = query.order_by(Config.config_type, Config.value).all()
    return jsonify([c.to_dict() for c in configs])


@admin_config_bp.route("/", methods=["POST"])
def add_config():
    """Add a new dropdown option."""
    data = request.get_json()
    config_type = data.get("config_type", "").strip()
    value = data.get("value", "").strip()

    if config_type not in VALID_TYPES:
        return jsonify({"error": f"Invalid type. Must be one of: {', '.join(VALID_TYPES)}"}), 400

    if not value:
        return jsonify({"error": "Value required"}), 400

    existing = Config.query.filter_by(config_type=config_type, value=value).first()
    if existing:
        return jsonify({"error": f"'{value}' already exists for {config_type}"}), 409

    config = Config(
        config_type=config_type,
        value=value,
        is_white=bool(data.get("is_white", False)),
    )
    db.session.add(config)
    db.session.commit()

    return jsonify({"message": "Config added", "config": config.to_dict()}), 201


@admin_config_bp.route("/<int:config_id>", methods=["DELETE"])
def delete_config(config_id):
    """Delete a config option."""
    config = Config.query.get_or_404(config_id)
    db.session.delete(config)
    db.session.commit()
    return jsonify({"message": "Config deleted"})


@admin_config_bp.route("/seed", methods=["POST"])
def seed_defaults():
    """Seed default config options if empty."""
    if Config.query.count() > 0:
        return jsonify({"message": "Config already has data"})

    defaults = {
        "quality": ["Premium", "Regular", "Luxury", "Standard"],
        "colour": [
            ("White", True), ("Ivory", True), ("Blue", False),
            ("Green", False), ("Yellow", False), ("Red", False),
            ("Black", False), ("Grey", False),
        ],
        "product_type": ["Roll", "Patti"],
        "location": ["Main Shed", "Warehouse A", "Warehouse B", "Godown 1"],
    }

    for config_type, values in defaults.items():
        for val in values:
            if config_type == "colour":
                name, is_white = val
                db.session.add(Config(config_type=config_type, value=name, is_white=is_white))
            else:
                db.session.add(Config(config_type=config_type, value=val))

    db.session.commit()
    return jsonify({"message": "Default configs seeded"}), 201
