"""Erzeugt optimierte WebP-Bilder (Logo, Poster, Cover, Portraits) mit festen Maßen."""
import sys, os, glob
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
A = os.path.join(src, "assets")

def save(im, name, w, q=72):
    im = im.copy()
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(os.path.join(out, name), "WEBP", quality=q, method=6)
    print(name, im.size, os.path.getsize(os.path.join(out, name)))

logo = Image.open(os.path.join(A, "eens-silver-original-20261104.png")).convert("RGBA")
logo = logo.crop(logo.getbbox())
save(logo, "logo-1200.webp", 1200, 82)
save(logo, "logo-480.webp", 480, 82)

save(Image.open(os.path.join(out, "_hero-poster.png")).convert("RGB"), "hero-poster.webp", 1280, 72)
save(Image.open(os.path.join(out, "_hero-poster-mobile.png")).convert("RGB"), "hero-poster-mobile.webp", 512, 72)
for p in sorted(glob.glob(os.path.join(out, "_reel-*.png"))):
    n = os.path.basename(p)[1:-4]
    save(Image.open(p).convert("RGB"), n + ".webp", 480, 72)

save(Image.open(os.path.join(A, "ein-platz-bleibt-frei.png")).convert("RGB"), "cover-ein-platz-bleibt-frei.webp", 900, 76)
for n in ["eens", "nado", "lara"]:
    save(Image.open(os.path.join(A, n + ".webp")).convert("RGB"), f"artist-{n}.webp", 720, 72)
save(Image.open(os.path.join(A, "inner.webp")).convert("RGB"), "inner.webp", 1050, 70)
