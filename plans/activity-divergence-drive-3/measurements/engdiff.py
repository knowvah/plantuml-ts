#!/usr/bin/env python3
"""add2: diff two all-engine survey dirs (verdict + dotEqual per slug).

Usage: engdiff.py <prev-dir> <next-dir> [--skip activity]
Prints one line per mover and a per-engine summary; flags conformant losses.
"""
import json, os, sys

def load(d):
    out = {}
    for f in sorted(os.listdir(d)):
        if f.startswith('parity-') and f.endswith('.json'):
            e = f[len('parity-'):-5]
            out[e] = {x['slug']: (x['verdict'], x.get('dotEqual')) for x in json.load(open(os.path.join(d, f)))['fixtures']}
    return out

a, b = load(sys.argv[1]), load(sys.argv[2])
skip = set(sys.argv[sys.argv.index('--skip') + 1].split(',')) if '--skip' in sys.argv else set()
movers = losses = 0
for e in sorted(set(a) | set(b)):
    if e in skip:
        continue
    pa, pb = a.get(e, {}), b.get(e, {})
    for s in sorted(set(pa) | set(pb)):
        if pa.get(s) != pb.get(s):
            movers += 1
            lost = pa.get(s, ('',))[0] == 'conformant' and pb.get(s, ('',))[0] != 'conformant'
            losses += lost
            print(f"{'LOSS ' if lost else ''}{e} {s}: {pa.get(s)} -> {pb.get(s)}")
print(f"movers={movers} conformant-losses={losses}")
