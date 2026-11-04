"""Convert qa/posters-raw/*.png (transparent) to public/posters/*.webp. Landscape ('l') 1280 px wide, portrait ('p') 780 px wide (sharp on 2x and 3x phones)."""
import glob
import os

from PIL import Image

os.makedirs('public/posters', exist_ok=True)
total = 0
for src in sorted(glob.glob('qa/posters-raw/*.png')):
    name = os.path.basename(src)[:-4]
    im = Image.open(src).convert('RGBA')
    w = 1280 if name.startswith('l-') else 780
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    out = f'public/posters/{name}.webp'
    im.save(out, 'WEBP', quality=78, alpha_quality=80, method=6)
    total += os.path.getsize(out)
print(len(glob.glob('public/posters/*.webp')), 'posters,', round(total / 1e6, 2), 'MB')

