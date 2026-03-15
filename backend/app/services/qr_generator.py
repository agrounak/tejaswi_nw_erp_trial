"""QR code and sticker image generator."""

import io
import json
import qrcode
from PIL import Image, ImageDraw, ImageFont


def generate_qr_code(data: str) -> Image.Image:
    """Generate a QR code image from product number string."""
    qr = qrcode.QRCode(version=1, box_size=6, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    return qr.make_image(fill_color="black", back_color="white").convert("RGB")


def generate_sticker_image(product: dict) -> bytes:
    """
    Generate a 4x6 inch thermal sticker image (at 203 DPI ~ 812x1218 px).
    Returns PNG bytes.

    Sticker layout matches spec:
    - Trading brand header
    - Tejaswi Nonwovens Pvt Ltd
    - Product details
    - QR code
    """
    W, H = 812, 1218
    img = Image.new("RGB", (W, H), "white")
    draw = ImageDraw.Draw(img)

    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 32)
        subtitle_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
        label_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
        value_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 26)
        small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
    except (OSError, IOError):
        title_font = ImageFont.load_default()
        subtitle_font = title_font
        label_font = title_font
        value_font = title_font
        small_font = title_font

    # Border
    draw.rectangle([8, 8, W - 8, H - 8], outline="black", width=3)

    # Trading name header
    trading_name = product.get("trading_name", "BHARAT GREEN")
    draw.text((W // 2, 30), trading_name.upper(), font=title_font, fill="black", anchor="mt")

    # Made in India
    draw.text((W // 2, 68), "Made in India", font=small_font, fill="gray", anchor="mt")

    # Company name
    draw.line([(30, 92), (W - 30, 92)], fill="black", width=1)
    draw.text((W // 2, 100), "Manufactured by", font=small_font, fill="gray", anchor="mt")
    draw.text((W // 2, 122), "Tejaswi Nonwovens Pvt Ltd", font=subtitle_font, fill="black", anchor="mt")
    draw.line([(30, 150), (W - 30, 150)], fill="black", width=1)

    # Product details
    y = 170
    fields = [
        ("Product No", product.get("product_number", "")),
        ("Colour", product.get("colour", "")),
        ("Quality", product.get("quality", "")),
        ("GSM", str(product.get("gsm", ""))),
        ("Type", product.get("product_type", "")),
        ("Length", f"{product.get('length', '-')} m" if product.get("length") else "-"),
        ("Width", f"{product.get('width', '-')} inch" if product.get("width") else "-"),
        ("Gross Wt", f"{product.get('gross_weight', '-')} kg"),
        ("Net Wt", f"{product.get('net_weight', '-')} kg"),
    ]

    for label, value in fields:
        draw.text((40, y), f"{label}:", font=label_font, fill="#555555")
        draw.text((300, y), str(value), font=value_font, fill="black")
        y += 44

    # Laminated flag
    if product.get("laminated"):
        draw.text((40, y), "Laminated: Yes", font=label_font, fill="#555555")
        y += 44

    # QR Code — contains product_number
    qr_img = generate_qr_code(product.get("product_number", ""))
    qr_size = 300
    qr_img = qr_img.resize((qr_size, qr_size))
    qr_x = (W - qr_size) // 2
    qr_y = H - qr_size - 50
    img.paste(qr_img, (qr_x, qr_y))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()
