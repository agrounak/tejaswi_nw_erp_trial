"""
Product Number Generator for Tejaswi Nonwovens.

Format: {Shift}-{Day}{MonthCode}-{SequenceNumber}
Example: A-15MY-023

Parts:
  A       = Shift (A or B)
  15      = Day of month
  MY      = Month code (JA, FE, MR, AP, MY, JN, JL, AU, SE, OC, NV, DE)
  023     = Sequence number within that shift+day
"""

from datetime import date
from app import db
from app.models.product import Product

MONTH_CODES = {
    1: "JA", 2: "FE", 3: "MR", 4: "AP", 5: "MY", 6: "JN",
    7: "JL", 8: "AU", 9: "SE", 10: "OC", 11: "NV", 12: "DE",
}


def generate_product_number(shift: str, production_date: date) -> str:
    day = production_date.day
    month_code = MONTH_CODES[production_date.month]

    prefix = f"{shift}-{day:02d}{month_code}"

    last_product = (
        Product.query
        .filter(Product.product_number.like(f"{prefix}-%"))
        .order_by(Product.product_number.desc())
        .first()
    )

    if last_product:
        last_seq = int(last_product.product_number.split("-")[-1])
        next_seq = last_seq + 1
    else:
        next_seq = 1

    return f"{prefix}-{next_seq:03d}"
