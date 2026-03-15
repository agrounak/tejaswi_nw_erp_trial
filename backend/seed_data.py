"""Seed the database with sample data and default configs."""

import random
from datetime import date
from app import create_app, db
from app.models.product import Product
from app.models.user import User
from app.models.config import Config
from app.services.product_number import generate_product_number

app = create_app("development")

QUALITIES = ["Premium", "Regular", "Luxury", "Standard"]
COLOURS = ["White", "Blue", "Green", "Yellow", "Red", "Ivory"]
GSMS = [40, 60, 80, 90, 100]
WIDTHS = [36, 40, 44, 48, 60, 63]
LOCATIONS = ["Main Shed", "Warehouse A", "Warehouse B", "Godown 1"]

with app.app_context():
    db.create_all()

    # Seed default admin user
    if not User.query.filter_by(username="admin").first():
        admin = User(username="admin", role="Admin")
        admin.set_password("admin123")
        db.session.add(admin)
        print("Created admin user (admin / admin123)")

    # Seed default configs
    if Config.query.count() == 0:
        defaults = {
            "quality": ["Premium", "Regular", "Luxury", "Standard"],
            "colour": [
                ("White", True), ("Ivory", True), ("Blue", False),
                ("Green", False), ("Yellow", False), ("Red", False),
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
        print("Seeded default configs.")

    # Seed products
    if Product.query.count() == 0:
        today = date.today()
        count = 0
        for shift in ["A", "B"]:
            for _ in range(50):
                ptype = random.choice(["Roll", "Patti"])
                gsm = random.choice(GSMS)
                colour = random.choice(COLOURS)
                width = random.choice(WIDTHS)
                net_weight = round(random.uniform(40, 120), 1)
                gross_weight = round(net_weight + random.uniform(1, 5), 1)
                length = round(random.uniform(50, 200), 1)
                quality = random.choice(QUALITIES)
                loc = random.choice(LOCATIONS)

                pn, serial = generate_product_number(shift, today)

                p = Product(
                    product_number=pn,
                    trading_name="Bharat Green",
                    shift=shift,
                    production_date=today,
                    serial_no=serial,
                    quality=quality,
                    gsm=gsm,
                    colour=colour,
                    product_type=ptype,
                    gross_weight=gross_weight,
                    net_weight=net_weight,
                    length=length,
                    width=width,
                    laminated=random.choice([True, False]),
                    location=loc,
                    status="In Warehouse",
                )
                db.session.add(p)
                count += 1

        print(f"Seeded {count} products.")

    db.session.commit()
    print("Done.")
