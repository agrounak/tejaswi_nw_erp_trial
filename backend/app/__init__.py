from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()


def create_app(config_name="development"):
    app = Flask(__name__)

    from config import config_by_name
    app.config.from_object(config_by_name[config_name])

    CORS(app)
    db.init_app(app)
    migrate.init_app(app, db)

    from app.routes.production import production_bp
    from app.routes.inventory import inventory_bp
    from app.routes.orders import orders_bp
    from app.routes.dispatch import dispatch_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.sticker import sticker_bp

    app.register_blueprint(production_bp, url_prefix="/api/production")
    app.register_blueprint(inventory_bp, url_prefix="/api/inventory")
    app.register_blueprint(orders_bp, url_prefix="/api/orders")
    app.register_blueprint(dispatch_bp, url_prefix="/api/dispatch")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(sticker_bp, url_prefix="/api/sticker")

    return app
