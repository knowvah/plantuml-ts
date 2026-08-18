#!/usr/bin/env python3
"""manifest-diff.py — collateral gate for `scripts/render-manifest.ts` output
(plans/state-declared-size-fix README quality gate 6, stop 4).

usage: manifest-diff.py <baseline.json> <now.json> <expected-moves.txt>

A fixture "moves" when its entry (any hash) differs, appears or disappears
between baseline and now. `expected-moves.txt` lists one fixture slug per line
(`#` comments and blank lines ignored; a slug matches any manifest key that
contains it, e.g. `bujuta-44-rovo666`). Prints every moved fixture tagged
EXPECTED / UNEXPECTED, then `OK: N expected moves, 0 unexpected` (exit 0) or
`FAIL: ...` (exit 1). Also warns about expected slugs that did NOT move.
"""
import json
import sys


def load(path):
    with open(path, encoding='utf-8') as fh:
        return json.load(fh)


def load_expected(path):
    out = []
    with open(path, encoding='utf-8') as fh:
        for line in fh:
            line = line.split('#', 1)[0].strip()
            if line:
                out.append(line)
    return out


def main(argv):
    if len(argv) != 4:
        print(__doc__)
        return 2
    base, now, expected = load(argv[1]), load(argv[2]), load_expected(argv[3])
    moved = sorted(k for k in set(base) | set(now) if base.get(k) != now.get(k))
    unexpected = []
    hit = set()
    for key in moved:
        tags = [s for s in expected if s in key]
        if tags:
            hit.update(tags)
            print(f'EXPECTED   {key}')
        else:
            unexpected.append(key)
            print(f'UNEXPECTED {key}')
    for s in expected:
        if s not in hit:
            print(f'note: expected slug did not move: {s}')
    n_exp = len(moved) - len(unexpected)
    if unexpected:
        print(f'FAIL: {n_exp} expected moves, {len(unexpected)} unexpected')
        return 1
    print(f'OK: {n_exp} expected moves, 0 unexpected')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
