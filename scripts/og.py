"""Render public/og.png — the card shown when a link to the site is shared.

Same rule as the site: fuchsia is Amadunia, grey is English. Needs Pillow and
the Archivo variable font (ARCHIVO_TTF env var, or ./Archivo.ttf next to this
file; download it from google/fonts if missing).

    python3 scripts/og.py
"""
import os
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "og.png"
FONT = Path(os.environ.get("ARCHIVO_TTF", Path(__file__).with_name("Archivo.ttf")))
FONT_URL = "https://github.com/google/fonts/raw/main/ofl/archivo/Archivo%5Bwdth%2Cwght%5D.ttf"

PAPER, INK, INK_SOFT, AM, RULE = "#faf7f0", "#2e2e2c", "#6b6b67", "#b3155f", "#b9b7b0"
W, H, PAD = 1200, 630, 80

SENTENCE = [("Mi", "I"), ("ama", "love"), ("dunia!", "world")]


def font(size, weight, width=100):
    f = ImageFont.truetype(str(FONT), size)
    f.set_variation_by_axes([weight, width])
    return f


def main():
    if not FONT.exists():
        print(f"fetching Archivo → {FONT}", file=sys.stderr)
        urllib.request.urlretrieve(FONT_URL, FONT)

    im = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(im)

    display = font(150, 700, 108)
    gloss = font(30, 500, 100)
    small = font(26, 600, 118)

    # The sentence, word by word, each with its translation under a hairline.
    x, base = PAD, 300
    gap = 44
    for form, sense in SENTENCE:
        d.text((x - 8, base), form, font=display, fill=AM, anchor="ls")
        w = d.textlength(form, font=display) - 10
        d.line([(x, base + 28), (x + w, base + 28)], fill=RULE, width=2)
        d.text((x, base + 44), sense, font=gloss, fill=INK_SOFT, anchor="lt")
        x += w + gap

    d.text(
        (PAD, H - PAD - 46),
        "A world auxiliary language. One sound per letter, no exceptions.",
        font=gloss, fill=INK_SOFT, anchor="ls",
    )
    d.text((PAD, H - PAD), "amadunia.com", font=small, fill=AM, anchor="ls")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    im.save(OUT, optimize=True)
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
