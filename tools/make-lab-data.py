"""Builds the data behind the "Try a sample" panels from the public GitHub repositories (needs the `gh` CLI, logged in).
   python tools/make-lab-data.py
Outputs: public/lab/market.json (real co-purchase aggregates, no raw rows) and public/lab/oulad-*.webp (the repo's own figures).
"""
import collections
import csv
import io
import itertools
import json
import os
import subprocess
import urllib.parse

from PIL import Image

OWNER = 'Charbelto'
os.makedirs('public/lab', exist_ok=True)


def raw(repo, path):
    return subprocess.run(['gh', 'api', f'repos/{OWNER}/{repo}/contents/{urllib.parse.quote(path)}', '-H', 'Accept: application/vnd.github.raw'],
                          capture_output=True, check=True).stdout


# ── supermarket: a basket is one customer on one day; keep the 14 most-bought items and the links between them ──
rows = list(csv.DictReader(io.StringIO(raw('DSA-Supermarket-Analysis', 'Supermarket_dataset_PAI.csv').decode('utf8'))))
baskets = collections.defaultdict(set)
for r in rows:
    baskets[(r['Member_number'], r['Date'])].add(r['itemDescription'].strip().lower())
count = collections.Counter(i for b in baskets.values() for i in b)
top = [i for i, _ in count.most_common(14)]
edges = collections.Counter()
for b in baskets.values():
    for a, c in itertools.combinations(sorted(b), 2):
        edges[(a, c)] += 1
data = {
    'source': 'Groceries dataset (Kaggle), Supermarket_dataset_PAI.csv from the DSA-Supermarket-Analysis repo',
    'transactions': len(baskets), 'rows': len(rows),
    'items': [{'n': i, 'c': count[i]} for i in top],
    'edges': [[top.index(a), top.index(c), w] for (a, c), w in edges.items() if a in top and c in top],
}
json.dump(data, open('public/lab/market.json', 'w'), separators=(',', ':'))
print('market.json', len(data['items']), 'items,', len(data['edges']), 'edges,', data['transactions'], 'baskets')

# ── OULAD: the repository's own figures, re-encoded as WebP (visually lossless) ──
FIGS = {
    'oulad-importance': 'figures/Important features from RFECV XGBClassifier.png',
    'oulad-rfecv': 'figures/RFECV using XGBClassifier.png',
    'oulad-confusion': 'figures/XGB Classifier Confusion matrix proper.png',
}
for name, path in FIGS.items():
    im = Image.open(io.BytesIO(raw('OULAD-Learning-Analytics', path))).convert('RGB')
    im.save(f'public/lab/{name}.webp', 'WEBP', quality=90, method=6)
    print(name, im.size, os.path.getsize(f'public/lab/{name}.webp'), 'bytes')
