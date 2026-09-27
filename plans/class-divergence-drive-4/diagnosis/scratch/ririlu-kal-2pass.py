"""cdd4-T5 ririlu probe (B-6): SvekResult#drawU runs computeKal() on EVERY draw
pass (SvekResult.java:95,104-109) -- pass 0 inside calculateDimension's
LimitFinder (dx=dy=0), pass 1 for the SVG (dx,dy = moveDelta). Kal#moveX moves
the edge start via SvekEdge#moveStartPoint, which moves dotPathInit TOO
(SvekEdge.java:1346-1349), and computeKal re-seeds each Kal from
dotPathInit.getStartPoint() + (dx,dy) (SvekEdge.java:1069-1073). So pass 1's
LineOfSegments starts from pass 0's result and gets another all.size() loops.
Inputs: the jar's -Tsvg 2dp start x (508.12, 520, 531.88) and widths from
cdd3 B-los-trace2.py; pass-1 frame dx = -1 (cdd3 B.md). Expected jar final
boxX [440.54, 501.965, 541.602] - see note on the frame below.
usage: python3 ririlu-kal-2pass.py
"""
widths = [51.425, 29.6375, 64.725]


def solve(starts):
    """LineOfSegments#solveOverlaps (LineOfSegments.java:89-126) over the
    three DOWN Kals (Kal.getX1/getX2, Kal.java:151-157; textDelta DOWN -w/2)."""
    segs = []
    for i, (x, w) in enumerate(zip(starts, widths)):
        x1 = (-w / 2 + x) - 5
        x2 = x1 + w + 10
        segs.append([i, (x1 + x2) / 2, (x2 - x1) / 2, x1])
    mean1 = sum(s[1] for s in segs) / len(segs)
    segs.sort(key=lambda s: s[1])
    log = []
    for it in range(len(segs)):
        did = False
        for i in range(len(segs) - 2, -1, -1):
            a, b = segs[i], segs[i + 1]
            diff = (b[1] - a[1]) - a[2] - b[2]
            ov = 0 if diff > 0 else -diff
            if ov > 0:
                log.append(f'loop{it}: pair {a[0]},{b[0]} push {ov:.4g}')
                for k in range(i + 1, len(segs)):
                    segs[k][1] += ov
                did = True
                break
        if not did:
            log.append(f'loop{it}: stop')
            break
    mean2 = sum(s[1] for s in segs) / len(segs)
    if mean1 - mean2 != 0:
        for s in segs:
            s[1] += mean1 - mean2
    res = {s[0]: s[1] - s[2] for s in segs}
    # moveX(diff) per kal: diff = res[i] - kal.getX1()
    diffs = [res[i] - (starts[i] - widths[i] / 2 - 5) for i in range(len(starts))]
    return diffs, log


def box_x(starts):
    return [round(s - w / 2, 3) for s, w in zip(starts, widths)]


S0 = [508.12, 520.0, 531.88]   # jar pass-0 starts (svek frame)
DX1 = -1.0                     # pass-1 moveDelta x

# ONE pass (what class-kal-overlap.ts does today), evaluated in the pass-1 frame
one = [s + DX1 for s in S0]
d1, log1 = solve(one)
print('one pass (ours):', ' | '.join(log1), '-> boxX', box_x([s + d for s, d in zip(one, d1)]))

# TWO passes (the jar): pass 0 at dx=0 moves dotPathInit; pass 1 re-solves from there at dx=-1
d0, log0 = solve(S0)
init = [s + d for s, d in zip(S0, d0)]              # dotPathInit start after pass 0
p1 = [s + DX1 for s in init]
d1b, log1b = solve(p1)
print('pass 0:', ' | '.join(log0))
print('pass 1:', ' | '.join(log1b), '-> boxX', box_x([s + d for s, d in zip(p1, d1b)]))
print('edge start moved by pass0+pass1 diffs:', [round(a + b, 3) for a, b in zip(d0, d1b)])

# Frame check: the same two-pass replay in OUR exact layout frame
# (cdd3 B-los-trace2.py 'ours exact': 500.125/512/523.875, final = +7 x).
O0 = [500.125, 512.0, 523.875]
e0, _ = solve(O0)
oi = [s + d for s, d in zip(O0, e0)]
e1, lg = solve(oi)
print('ours-frame two-pass:', ' | '.join(lg), '-> final boxX', [round(v + 7, 3) for v in box_x([s + d for s, d in zip(oi, e1)])])

# Current plantuml-ts inputs (post T-D3, 2dp), captured with a temporary
# KAL_TRACE print in class-kal-overlap.ts#fixHoverlap (reverted):
#   KAL [[469.4075,530.8325],[492.18125,531.81875],[486.5175,561.2425]]
# -> starts 500.12 / 512 / 523.88 in our layout frame; svek = ours + 8, final = ours + 7.
OURS = [500.12, 512.0, 523.88]
for name, off0, off1 in [('pass0 svek(+8), pass1 final(+7)', 8.0, 7.0),
                         ('pass0 ours(+0), pass1 final(+7)', 0.0, 7.0),
                         ('pass0 ours(+0), pass1 ours(+0) ', 0.0, 0.0)]:
    a0 = [s + off0 for s in OURS]
    f0, _ = solve(a0)
    moved = [s + d for s, d in zip(OURS, f0)]       # dotPathInit (frame-free)
    a1 = [s + off1 for s in moved]
    f1, lg = solve(a1)
    fin = [s + d - off1 + 7.0 for s, d in zip(a1, f1)]
    print(f'{name}: pass1 {" | ".join(lg)} -> final boxX {box_x(fin)}')
