"""QR code and sticker image generator."""

import io
import qrcode
from PIL import Image, ImageDraw, ImageFont


def generate_qr_code(data: str, box_size: int = 8) -> Image.Image:
    """Generate a QR code image from product number string."""
    qr = qrcode.QRCode(version=1, box_size=box_size, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    return qr.make_image(fill_color="black", back_color="white").convert("RGB")


def generate_qr_png(product_number: str) -> bytes:
    """Generate a standalone QR code PNG (for invoice modal preview)."""
    qr_img = generate_qr_code(product_number, box_size=10)
    buf = io.BytesIO()
    qr_img.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()


def _load_fonts():
    """Try to load system fonts, fall back to default."""
    try:
        return {
            "brand": ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36),
            "subtitle": ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18),
            "company": ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22),
            "label": ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22),
            "value": ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22),
            "small": ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 15),
        }
    except (OSError, IOError):
        default = ImageFont.load_default()
        return {k: default for k in ("brand", "subtitle", "company", "label", "value", "small")}


def generate_sticker_image(product: dict) -> bytes:
    """
    Generate a 4x6 inch thermal sticker image (at 203 DPI ~ 812x1218 px).

    Layout matches the screenshot:
    - BHARAT brand header (top-left)
    - MADE IN INDIA
    - Manufactured by Tejaswi Nonwovens Pvt Ltd
    - QR code (top-right)
    - 2-column detail table below
    """
    W, H = 812, 1218
    img = Image.new("RGB", (W, H), "white")
    draw = ImageDraw.Draw(img)
    fonts = _load_fonts()

    # Outer border
    draw.rectangle([6, 6, W - 6, H - 6], outline="#333333", width=2)

    # ── Header section: Brand left, QR right ──
    trading_name = product.get("trading_name", "BHARAT")
    # Brand name variations
    brand_display = trading_name.upper() if trading_name else "BHARAT"
    if brand_display == "BHARAT GREEN":
        brand_display = "BHARAT"

    draw.text((32, 28), brand_display, font=fonts["brand"], fill="black")
    draw.text((32, 72), "MADE IN INDIA", font=fonts["small"], fill="#666666")
    draw.text((32, 96), "Manufactured by", font=fonts["small"], fill="#888888")
    draw.text((32, 118), "Tejaswi Nonwovens Pvt Ltd", font=fonts["company"], fill="black")

    # QR Code (top-right)
    qr_img = generate_qr_code(product.get("product_number", ""), box_size=6)
    qr_size = 200
    qr_img = qr_img.resize((qr_size, qr_size))
    img.paste(qr_img, (W - qr_size - 32, 20))

    # ── Separator ──
    y_sep = 160
    draw.line([(20, y_sep), (W - 20, y_sep)], fill="#cccccc", width=1)

    # ── 2-column detail table ──
    table_y = y_sep + 16
    col1_label_x = 32
    col1_value_x = 210
    col2_label_x = W // 2 + 16
    col2_value_x = W // 2 + 190
    row_h = 60

    rows = [
        ("Product No", product.get("product_number", ""), "Colour", product.get("colour", "")),
        ("Length", _fmt(product.get("length"), "m"), "Width", _fmt(product.get("width"), "inch")),
        ("Quality", product.get("quality", ""), "GSM", str(product.get("gsm", ""))),
        ("Gross Weight", _fmt(product.get("gross_weight"), "kg"), "Net Weight", _fmt(product.get("net_weight"), "kg")),
    ]

    for i, (l1, v1, l2, v2) in enumerate(rows):
        y = table_y + i * row_h

        # Row background (alternating)
        if i % 2 == 0:
            draw.rectangle([20, y, W - 20, y + row_h], fill="#f8f9fa")

        # Borders
        draw.rectangle([20, y, W - 20, y + row_h], outline="#dddddd", width=1)
        draw.line([(W // 2, y), (W // 2, y + row_h)], fill="#dddddd", width=1)

        # Left column
        text_y = y + (row_h - 24) // 2
        draw.text((col1_label_x, text_y), l1, font=fonts["label"], fill="#777777")
        draw.text((col1_value_x, text_y), f": {v1}", font=fonts["value"], fill="black")

        # Right column
        draw.text((col2_label_x, text_y), l2, font=fonts["label"], fill="#777777")
        draw.text((col2_value_x, text_y), f": {v2}", font=fonts["value"], fill="black")

    # Laminated row (if applicable)
    if product.get("laminated"):
        y = table_y + len(rows) * row_h
        draw.rectangle([20, y, W - 20, y + row_h], outline="#dddddd", width=1)
        text_y = y + (row_h - 24) // 2
        draw.text((col1_label_x, text_y), "Laminated", font=fonts["label"], fill="#777777")
        draw.text((col1_value_x, text_y), ": Yes", font=fonts["value"], fill="black")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()


def _fmt(value, unit: str) -> str:
    """Format a numeric value with unit."""
    if value is None:
        return "-"
    try:
        return f"{float(value):.2f}" if unit != "inch" else f"{float(value):.2f}"
    except (ValueError, TypeError):
        return str(value)
