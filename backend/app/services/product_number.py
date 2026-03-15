"""
Product Number Generator for Tejaswi Nonwovens.

Format: {Shift}{Day}{MonthCode}{SequenceNumber}
Example: A15MY038

Parts:
  A       = Shift (A or B)
  15      = Day of month
  MY      = Month code
  038     = Sequence number within that shift+day
"""

from datetime import date
from app.models.product import Product

MONTH_CODES = {
    1: "JA", 2: "FE", 3: "MR", 4: "AP", 5: "MY", 6: "JN",
    7: "JL", 8: "AU", 9: "SE", 10: "OC", 11: "NV", 12: "DE",
}


def generate_product_number(shift: str, production_date: date) -> tuple:
    """Generate product number and return (product_number, serial_no)."""
    day = production_date.day
    month_code = MONTH_CODES[production_date.month]

    prefix = f"{shift}{day:02d}{month_code}"

    last_product = (
        Product.query
        .filter(Product.product_number.like(f"{prefix}%"))
        .order_by(Product.serial_no.desc())
        .first()
    )

    if last_product:
        next_seq = last_product.serial_no + 1
    else:
        next_seq = 1

    product_number = f"{prefix}{next_seq:03d}"
    return product_number, next_seq
