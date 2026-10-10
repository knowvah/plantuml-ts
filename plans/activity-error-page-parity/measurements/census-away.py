#!/usr/bin/env python3
"""aepp D5 (census-away; copied from add4): after a re-pin, list census attributes that moved AWAY from the
jar, and rows whose element-count delta grew (lost/extra elements).

Usage: census-away.py <pre-pin-dir> [<prev-elements.json> <next-elements.json>]
<pre-pin-dir> holds copies of {diff,style,text,swimlane}-baseline.json taken
before `repin-activity-baselines.ts --write`. Exit 1 if anything moved away.
"""
import json, sys
G = 'oracle/goldens/svg-activity/'
def ld(p): return {f['slug']: f for f in json.load(open(p))['fixtures']}
bad = 0
a, b = ld(f'{sys.argv[1]}/diff-baseline.json'), ld(G + 'diff-baseline.json')
for s in b:
    if s in a and (b[s].get('weightedScore') or 0) > (a[s].get('weightedScore') or 0):
        print('ROSE', s, a[s].get('weightedScore'), '->', b[s].get('weightedScore')); bad = 1
for f in ('style', 'text', 'swimlane'):
    a, b = ld(f'{sys.argv[1]}/{f}-baseline.json'), ld(G + f'{f}-baseline.json')
    tow = 0
    for s in b:
        if s not in a or a[s] == b[s] or 'jar' not in b[s]: continue
        for k, n in b[s]['ours'].items():
            o, j = a[s]['ours'].get(k), b[s]['jar'].get(k)
            if o != n:
                if n == j: tow += 1
                elif o == j: print('AWAY', f, s, k, o, '->', n, 'jar', j); bad = 1
    print(f, 'attrs to jar', tow)
if len(sys.argv) > 3:
    e1 = {r['slug']: r['delta'] for r in json.load(open(sys.argv[2]))['rows']}
    for r in json.load(open(sys.argv[3]))['rows']:
        o = e1.get(r['slug'], {})
        w = {k: (o.get(k, 0), v) for k, v in r['delta'].items() if abs(v) > abs(o.get(k, 0))}
        if w: print('ELEMENTS', r['slug'], w); bad = 1
sys.exit(bad)
