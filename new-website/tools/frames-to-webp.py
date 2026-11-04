"""Convert qa/frames-raw/*.png (transparent) to public/frames/<variant>/<name>-NN.webp for the phone (lite) loops.
Frames are moving, so they are delivered smaller than the still posters: W px wide (default 600), quality Q (default 66)."""
import glob
import os
import sys

from PIL import Image

W = int(os.environ.get('W', 600))
Q = int(os.environ.get('Q', 66))
total = 0
n = 0
for src in sorted(glob.glob('qa/frames-raw/*-??.png')):
    base = os.path.basename(src)[:-4]
    variant, rest = base.split('-', 1)
    os.makedirs(f'public/frames/{variant}', exist_ok=True)
    im = Image.open(src).convert('RGBA')
    im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
    out = f'public/frames/{variant}/{rest}.webp'
    im.save(out, 'WEBP', quality=Q, alpha_quality=Q, method=6)
    total += os.path.getsize(out)
    n += 1
print(n, 'frames,', round(total / 1e6, 2), 'MB,', round(total / max(1, n) / 1000, 1), 'KB each')
