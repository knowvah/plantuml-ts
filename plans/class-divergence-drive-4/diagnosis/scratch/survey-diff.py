"""cdd4-T5: verdict diff of a class survey JSON (`svg-parity-survey.ts class
--out`) against the mission baseline measurements/b0.json.
usage: python3 survey-diff.py <survey.json>"""
import json, sys
from pathlib import Path
base = {r['slug']: r['verdict'] for r in json.loads(Path('plans/class-divergence-drive-4/measurements/b0.json').read_text())}
new = {r['slug']: r['verdict'] for r in json.loads(Path(sys.argv[1]).read_text())['fixtures']}
moved = [(s, base[s], new.get(s)) for s in sorted(base) if base[s] != new.get(s)]
for s, a, b in moved:
    print(f'{s}: {a} -> {b}')
print(f'{len(moved)} verdict movers')
