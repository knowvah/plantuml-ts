"""cdd6 b3 close: per-engine verdict + dotEqual movers, b2-eng -> b3-eng."""
import json, os, sys
M = os.path.dirname(os.path.abspath(__file__))
PREV = os.path.join(M, '..', sys.argv[1] if len(sys.argv) > 1 else 'b2-eng')
RANK = {'conformant': 0, 'structural-match': 1, 'diverged': 2}
def load(p):
    return {f"{x['type']}/{x['slug']}": x for x in json.load(open(p))['fixtures']}
for fn in sorted(os.listdir(M)):
    if not fn.startswith('parity-'): continue
    e = fn[7:-5]; a = load(os.path.join(PREV, fn)); b = load(os.path.join(M, fn))
    rows = []
    for k in sorted(set(a) | set(b)):
        x, y = a.get(k), b.get(k)
        if x is None or y is None: rows.append(f"  {k}: {'added' if x is None else 'removed'}"); continue
        if x['verdict'] != y['verdict'] or x.get('dotEqual') != y.get('dotEqual'):
            tag = 'RISE' if RANK.get(y['verdict'], 9) < RANK.get(x['verdict'], 9) else ('LOSS' if RANK.get(y['verdict'], 9) > RANK.get(x['verdict'], 9) else 'same')
            rows.append(f"  {tag} {k}: {x['verdict']} -> {y['verdict']} dotEqual {x.get('dotEqual')} -> {y.get('dotEqual')}")
    print(f"{e}: {len(rows)} movers"); print('\n'.join(rows)) if rows else None
