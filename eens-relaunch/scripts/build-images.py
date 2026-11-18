"""Erzeugt optimierte WebP-Bilder (Logo, Poster, Cover, Portraits) mit festen Maßen."""
import sys, os
from PIL import Image, ImageEnhance
src, out = sys.argv[1], sys.argv[2]
A = os.path.join(src, "assets")

def save(im, name, w, q=72):
    im = im.copy()
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(os.path.join(out, name), "WEBP", quality=q, method=6)
    print(name, im.size, os.path.getsize(os.path.join(out, name)))

def silver(im):
    """Bilder in die Schwarz/Silber-Welt ziehen: Sättigung stark runter."""
    im = im.convert("RGB")
    return ImageEnhance.Color(im).enhance(0.18)

logo = Image.open(os.path.join(A, "eens-silver-original-20261104.png")).convert("RGBA")
logo = logo.crop(logo.getbbox())
save(logo, "logo-1200.webp", 1200, 82)
save(logo, "logo-480.webp", 480, 82)

save(Image.open(os.path.join(out, "_hero-poster.png")).convert("RGB"), "hero-poster.webp", 1280, 70)
save(Image.open(os.path.join(out, "_hero-poster-mobile.png")).convert("RGB"), "hero-poster-mobile.webp", 512, 70)
save(Image.open(os.path.join(out, "_band-poster.png")).convert("RGB"), "band-poster.webp", 540, 70)

save(Image.open(os.path.join(out, "_shop.png")).convert("RGB"), "shop-hoodie.webp", 512, 74)
save(Image.open(os.path.join(A, "ein-platz-bleibt-frei.png")).convert("RGB"), "cover-ein-platz-bleibt-frei.webp", 900, 76)
save(silver(Image.open(os.path.join(A, "lafamilia.webp"))), "lafamilia.webp", 900, 72)
for n in ["eens", "nado", "lara"]:
    save(silver(Image.open(os.path.join(A, n + ".webp"))), f"artist-{n}.webp", 720, 72)
save(silver(Image.open(os.path.join(A, "inner.webp"))), "inner.webp", 1050, 70)
save(silver(Image.open(os.path.join(A, "hero.webp"))), "mask.webp", 900, 72)
