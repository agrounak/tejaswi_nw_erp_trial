"""QR code and sticker image generator."""

import io
import json
import qrcode
from PIL import Image, ImageDraw, ImageFont


def generate_qr_code(data: dict) -> Image.Image:
    """Generate a QR code image from product data."""
    qr = qrcode.QRCode(version=1, box_size=6, border=2)
    qr.add_data(json.dumps(data))
    qr.make(fit=True)
    return qr.make_image(fill_color="black", back_color="white").convert("RGB")


def generate_sticker_image(product: dict) -> bytes:
    """
    Generate a 4x6 inch thermal sticker image (at 203 DPI ≈ 812x1218 px).
    Returns PNG bytes.
    """
    W, H = 812, 1218
    img = Image.new("RGB", (W, H), "white")
    draw = ImageDraw.Draw(img)

    # Use default font (monospace-like) at various sizes
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
        label_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
        value_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 32)
    except (OSError, IOError):
        title_font = ImageFont.load_default()
        label_font = title_font
        value_font = title_font

    # Border
    draw.rectangle([10, 10, W - 10, H - 10], outline="black", width=3)

    # Title
    draw.text((W // 2, 40), "TEJASWI NONWOVENS", font=title_font, fill="black", anchor="mt")
    draw.line([(30, 85), (W - 30, 85)], fill="black", width=2)

    # Product details
    y = 110
    fields = [
        ("Product ID", product.get("product_number", "")),
        ("Type", product.get("product_type", "")),
        ("GSM", str(product.get("gsm", ""))),
        ("Width", f"{product.get('width', '')} inch"),
        ("Colour", product.get("colour", "")),
        ("Weight", f"{product.get('weight', '')} kg"),
        ("Quality", product.get("quality", "")),
        ("Machine", product.get("machine", "")),
        ("Shift", product.get("shift", "")),
        ("Date", product.get("production_date", "")),
    ]

    for label, value in fields:
        draw.text((40, y), f"{label}:", font=label_font, fill="gray")
        draw.text((280, y), str(value), font=value_font, fill="black")
        y += 50

    # QR Code
    qr_data = {
        "id": product.get("product_number", ""),
        "gsm": product.get("gsm"),
        "type": product.get("product_type", ""),
    }
    qr_img = generate_qr_code(qr_data)
    qr_size = 300
    qr_img = qr_img.resize((qr_size, qr_size))
    qr_x = (W - qr_size) // 2
    qr_y = H - qr_size - 60
    img.paste(qr_img, (qr_x, qr_y))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()
