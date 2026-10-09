#!/usr/bin/env python3
"""isw (D5): compare two elements.mts outputs. A fixture moves AWAY from the jar
when, for some tag, |ours - jar| grew. Prints every such move and a summary.

Usage: elements-diff.py <prev.json> <next.json>
"""
import json, sys

a, b = json.load(open(sys.argv[1])), json.load(open(sys.argv[2]))
away = toward = 0
for k in sorted(set(a) & set(b)):
    pa, pb = a[k], b[k]
    if 'err' in pa or 'err' in pb:
        if ('err' in pa) != ('err' in pb):
            print(f"ERR-CHANGE {k}: {pa.get('err', 'ok')!s:.60} -> {pb.get('err', 'ok')!s:.60}")
        continue
    for t in sorted(set(pa['o']) | set(pb['o']) | set(pa['j']) | set(pb['j'])):
        da = abs(pa['o'].get(t, 0) - pa['j'].get(t, 0))
        db = abs(pb['o'].get(t, 0) - pb['j'].get(t, 0))
        if db > da:
            away += 1
            print(f"AWAY {k} <{t}>: ours {pa['o'].get(t, 0)}->{pb['o'].get(t, 0)} jar {pb['j'].get(t, 0)}")
        elif db < da:
            toward += 1
print(f"away={away} toward={toward}")
