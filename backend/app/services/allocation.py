"""
Allocation service: picks available rolls/pattis to fulfil an order item.
Greedy by weight — picks largest available units first until target is met.
"""

from app.models.product import Product


def allocate_products(product_type: str, gsm: int, colour: str,
                      quantity_kg: float, width: float = None):
    """Return list of Product objects that together satisfy quantity_kg."""
    query = Product.query.filter(
        Product.product_type == product_type,
        Product.gsm == gsm,
        Product.colour == colour,
        Product.status == "In Warehouse",
    )
    if width:
        query = query.filter(Product.width == width)

    available = query.order_by(Product.net_weight.desc()).all()

    selected = []
    total = 0.0
    for product in available:
        if total >= quantity_kg:
            break
        selected.append(product)
        total += product.net_weight

    return selected, total
