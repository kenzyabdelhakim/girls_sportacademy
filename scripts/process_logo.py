"""Process the Habib Swimming Academy logo JPG into web-ready assets.

- Removes the white background (soft alpha based on luminance)
- Auto-crops the full lockup (swimmer + text)
- Splits the swimmer mark from the text by detecting the empty row gap
- Produces white-recolored variants for dark backgrounds
- Generates favicon assets
"""
import os
from PIL import Image

SRC = r"c:\Users\sapera\Downloads\اللوجو تبع البحث.jpg"
ROOT = r"C:\Users\sapera\Downloads\New folder\SportAcademy"
ASSETS = os.path.join(ROOT, "src", "assets")
PUBLIC = os.path.join(ROOT, "public")
os.makedirs(ASSETS, exist_ok=True)
os.makedirs(PUBLIC, exist_ok=True)

OPAQUE_BELOW = 175   # luminance <= this -> fully opaque
CLEAR_ABOVE = 238    # luminance >= this -> fully transparent


def luminance(px):
    r, g, b = px[0], px[1], px[2]
    return 0.299 * r + 0.587 * g + 0.114 * b


def make_transparent(img):
    """Return RGBA with white background turned transparent (soft edges)."""
    img = img.convert("RGB")
    rgba = Image.new("RGBA", img.size)
    src = img.load()
    dst = rgba.load()
    w, h = img.size
    span = CLEAR_ABOVE - OPAQUE_BELOW
    for y in range(h):
        for x in range(w):
            r, g, b = src[x, y]
            L = 0.299 * r + 0.587 * g + 0.114 * b
            if L <= OPAQUE_BELOW:
                a = 255
            elif L >= CLEAR_ABOVE:
                a = 0
            else:
                a = int(255 * (CLEAR_ABOVE - L) / span)
            dst[x, y] = (r, g, b, a)
    return rgba


def alpha_bbox(img):
    return img.getchannel("A").getbbox()


def row_has_content(px, y, w, min_px):
    """A row counts as content only if enough strong pixels are present
    (ignores stray anti-aliasing noise)."""
    n = 0
    for x in range(w):
        if px[x, y] > 60:
            n += 1
            if n >= min_px:
                return True
    return False


def split_mark_text(img):
    """Find the largest empty-row gap and split into (mark, text)."""
    alpha = img.getchannel("A")
    w, h = img.size
    px = alpha.load()
    min_px = max(6, int(w * 0.004))
    rows = [row_has_content(px, y, w, min_px) for y in range(h)]
    # only search between the first and last content rows so the empty
    # top/bottom margins are never chosen as the gap
    content = [y for y in range(h) if rows[y]]
    if not content:
        return img, None
    lo, hi = content[0] + 1, content[-1]
    best = None  # (length, start, end)
    run_start = None
    for y in range(lo, hi):
        if not rows[y]:
            if run_start is None:
                run_start = y
        else:
            if run_start is not None:
                length = y - run_start
                if best is None or length > best[0]:
                    best = (length, run_start, y)
                run_start = None
    if run_start is not None:
        length = hi - run_start
        if best is None or length > best[0]:
            best = (length, run_start, hi)
    if not best:
        return img, None
    _, gs, ge = best
    cut = (gs + ge) // 2
    mark = img.crop((0, 0, w, cut))
    text = img.crop((0, cut, w, h))
    mb = mark.getchannel("A").getbbox()
    if mb:
        mark = mark.crop(mb)
    return mark, text


def to_white(img):
    """Recolor every visible pixel to white, keep alpha."""
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
    base = Image.open(SRC)
    rgba = make_transparent(base)

    def fit_height(img, max_h):
        if img.height <= max_h:
            return img
        w = round(img.width * max_h / img.height)
        return img.resize((w, max_h), Image.LANCZOS)

    full = fit_height(rgba.crop(alpha_bbox(rgba)), 480)
    save(full, "logo-full.png")
    save(to_white(full), "logo-full-white.png")

    mark, _ = split_mark_text(rgba)
    mark = fit_height(mark, 360)
    save(mark, "logo-mark.png")
    save(to_white(mark), "logo-mark-white.png")

    # Favicon from the mark, padded square
    fav = square_pad(mark)
    save(fav.resize((180, 180), Image.LANCZOS), "apple-touch-icon.png", public=True)
    save(fav.resize((32, 32), Image.LANCZOS), "favicon-32.png", public=True)
    fav.resize((48, 48), Image.LANCZOS).save(
        os.path.join(PUBLIC, "favicon.ico"),
        sizes=[(16, 16), (32, 32), (48, 48)],
    )
    print("saved favicon.ico")


if __name__ == "__main__":
    main()
