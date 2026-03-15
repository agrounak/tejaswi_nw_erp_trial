"""Seed the database with sample data for testing."""

import random
from datetime import date
from app import create_app, db
from app.models.product import Product
from app.services.product_number import generate_product_number

app = create_app("development")

COLOURS = ["White", "Blue", "Green", "Yellow", "Red"]
GSMS = [40, 60, 80, 90, 100]
WIDTHS = [36, 40, 44, 48, 60, 63]
LOCATIONS = [f"{rack}-{row:02d}" for rack in "ABCD" for row in range(1, 6)]

with app.app_context():
    db.create_all()

    if Product.query.count() > 0:
        print("Database already has data. Skipping seed.")
    else:
        today = date.today()
        count = 0
        for shift in ["A", "B"]:
            for _ in range(50):
                ptype = random.choice(["Roll", "Patti"])
                gsm = random.choice(GSMS)
                colour = random.choice(COLOURS)
                width = random.choice(WIDTHS)
                weight = round(random.uniform(40, 120), 1)
                machine = random.choice(["S1", "S2"])
                quality = random.choice(["Premium", "Regular"])

                pn = generate_product_number(shift, today)
                loc = random.choice(LOCATIONS)

                p = Product(
                    product_number=pn,
                    product_type=ptype,
                    gsm=gsm,
                    width=width,
                    colour=colour,
                    weight=weight,
                    shift=shift,
                    machine=machine,
                    quality=quality,
                    production_date=today,
                    location=loc,
                    status="In Warehouse",
                )
                db.session.add(p)
                count += 1

        db.session.commit()
        print(f"Seeded {count} products.")
