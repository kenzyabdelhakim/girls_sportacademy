"""Process the ballet-dancers logo PNG into web-ready assets for Sport Academy.

The source is already a clean transparent PNG (silhouette art), so this just
crops to content, produces a white-recolored variant for dark/pink
backgrounds, and regenerates the favicon set. Mirrors scripts/process_logo.py
but skips the luminance-based background removal since it isn't needed here.
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "src", "assets")
PUBLIC = os.path.join(ROOT, "public")
SRC = os.path.join(ASSETS, "ballet-logo.png")


def fit_height(img, max_h):
    if img.height <= max_h:
        return img
    w = round(img.width * max_h / img.height)
    return img.resize((w, max_h), Image.LANCZOS)


def to_white(img):
    r, g, b, a = img.split()
    white = Image.new("L", img.size, 255)
    return Image.merge("RGBA", (white, white, white, a))


def square_pad(img, pad_ratio=0.12):
    w, h = img.size
    side = int(max(w, h) * (1 + pad_ratio * 2))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - w) // 2, (side - h) // 2), img)
    return canvas


def save(img, name, public=False):
    out = os.path.join(PUBLIC if public else ASSETS, name)
    img.save(out)
    print(f"saved {out}  {img.size}")


def main():
    base = Image.open(SRC).convert("RGBA")
    bbox = base.getchannel("A").getbbox()
    full = base.crop(bbox) if bbox else base

    # Full 5-dancer strip: used wherever there's horizontal room (brand
    # panel wordmark lockup, large decorative watermark).
    strip = fit_height(full, 360)
    save(strip, "logo-strip.png")
    save(to_white(strip), "logo-strip-white.png")

    # Center dancer alone: used for small square spots (sidebar icon box,
    # mobile topbar icon, favicon) where the wide strip would shrink to an
    # illegible sliver. x=198..289 (in the content-cropped `full` image) is
    # the sparsest column gap isolating just the center figure.
    center = full.crop((198, 0, 289, full.height))
    cb = center.getchannel("A").getbbox()
    center = center.crop(cb) if cb else center
    mark = fit_height(center, 360)

    save(mark, "logo-mark.png")
    save(to_white(mark), "logo-mark-white.png")

    fav = square_pad(mark)
    save(fav.resize((180, 180), Image.LANCZOS), "apple-touch-icon.png", public=True)
    save(fav.resize((32, 32), Image.LANCZOS), "favicon-32.png", public=True)
    fav.resize((48, 48), Image.LANCZOS).save(
        os.path.join(PUBLIC, "favicon.ico"),
        sizes=[(16, 16), (32, 32), (48, 48)],
    )
    print("saved favicon.ico")

    # Old swimmer lockup assets are no longer referenced (Logo.jsx composes
    # the "full" variant from mark + text now that there's no wordmark baked
    # into the source art).
    for stale in ("logo-full.png", "logo-full-white.png"):
        path = os.path.join(ASSETS, stale)
        if os.path.exists(path):
            os.remove(path)
            print(f"removed {path}")


if __name__ == "__main__":
    main()
