"""User authentication and registration routes."""

from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    """Create a new user (Admin only in production)."""
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "")
    role = data.get("role", "Sticker User")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    if role not in ("Admin", "Sticker User", "Dispatch User"):
        return jsonify({"error": "Invalid role"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 409

    user = User(username=username, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "User created", "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate user and return user info."""
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "")

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid username or password"}), 401

    return jsonify({"message": "Login successful", "user": user.to_dict()})


@auth_bp.route("/users", methods=["GET"])
def list_users():
    """List all users."""
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users])


@auth_bp.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    """Delete a user."""
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted"})
