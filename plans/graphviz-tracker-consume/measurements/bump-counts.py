#!/usr/bin/env python3
"""gtc: after a description re-pin of N golden clone rows (all DESCRIPTION ->
DESCRIPTION `agree`, rendering on both sides), bump the manifest-size, agree
and rendering count pins in the routing and refusal gates, each with a
derivation comment, the way every earlier mission did by hand.

Usage: bump-counts.py <N> "<label>" "<breakdown>"
  e.g. bump-counts.py 1 "gtc T1" "unknown 1: rufopi-30-roro642"
"""
import re
import sys

n, label, breakdown = int(sys.argv[1]), sys.argv[2], sys.argv[3]
kind = sys.argv[4] if len(sys.argv) > 4 else 'svg-description'
T = 'tests/oracle/svg-conformance/'


def bump(path, expect_re, comment):
    src = open(path).read()
    m = re.search(expect_re, src)
    assert m, (path, expect_re)
    old = int(m.group(2))
    new = old + n
    line = m.group(0)
    indent = m.group(1)
    text = comment(old, new)
    block = ''.join(f'{indent}// {t}\n' for t in text)
    src = src.replace(line, block + line.replace(str(old), str(new)), 1)
    open(path, 'w').write(src)
    print(path, old, '->', new)


R = T + 'routing-conformance.test.ts'
F = T + 'refusal-coverage.test.ts'
bump(R, r'( *)expect\(pinnedAgree\.length\)\.toBe\((\d+)\);\n',
     lambda o, w: [f'{o} -> {w} agree at {label}: +{n} {kind} golden',
                   f'clones ({breakdown}) of agree-classified dot-cache rows.',
                   f'Derivation: {w} + 642 + 86 = {w + 728}.'])
bump(R, r'( *)expect\(manifest\.fixtures\.length\)\.toBe\((\d+)\);\n',
     lambda o, w: [f'{o} -> {w} at {label} (see the agree derivation above).'])
bump(F, r'( *)expect\(manifest\.fixtures\.length\)\.toBe\((\d+)\);\n',
     lambda o, w: [f'{o} -> {w} at {label}: {n} {kind} golden clone',
                   f'row(s) ({breakdown}), rendering on both sides.',
                   f'Derivation: {o} + {n} = {w}.'])
bump(F, r'( *)expect\(pinnedRendering\.length\)\.toBe\((\d+)\);\n',
     lambda o, w: [f'{o} -> {w} at {label}: +{n} rendering {kind}',
                   f'golden clone row(s). Derivation: {o} + {n} = {w}.'])
