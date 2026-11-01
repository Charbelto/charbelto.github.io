"""Convert qa/posters-raw/*.png (transparent) to public/posters/*.webp. Landscape ('l') 960 px wide, portrait ('p') 460 px wide."""
import glob
import os

from PIL import Image

os.makedirs('public/posters', exist_ok=True)
total = 0
for src in sorted(glob.glob('qa/posters-raw/*.png')):
    name = os.path.basename(src)[:-4]
    im = Image.open(src).convert('RGBA')
    w = 960 if name.startswith('l-') else 460
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    out = f'public/posters/{name}.webp'
    im.save(out, 'WEBP', quality=66, method=6)
    total += os.path.getsize(out)
print(len(glob.glob('public/posters/*.webp')), 'posters,', round(total / 1e6, 2), 'MB')

