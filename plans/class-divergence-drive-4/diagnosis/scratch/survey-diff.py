"""cdd4-T5: verdict diff of a class survey JSON (`svg-parity-survey.ts class
--out`) against the mission baseline measurements/b0.json.
usage: python3 survey-diff.py <survey.json>"""
import json, sys
base = {r['slug']: r['verdict'] for r in json.load(open('plans/class-divergence-drive-4/measurements/b0.json'))}
new = {r['slug']: r['verdict'] for r in json.load(open(sys.argv[1]))['fixtures']}
moved = [(s, base[s], new.get(s)) for s in sorted(base) if base[s] != new.get(s)]
for s, a, b in moved:
    print(f'{s}: {a} -> {b}')
print(f'{len(moved)} verdict movers')
