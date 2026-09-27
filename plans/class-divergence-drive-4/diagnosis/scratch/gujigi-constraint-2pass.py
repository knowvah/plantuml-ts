"""cdd4-T5 gujigi probe: replay SvekEdge#drawU's constraint block
(SvekEdge.java:994-1012) + LinkConstraint#setPosition/drawMe
(LinkConstraint.java:70-104) over BOTH SvekResult#drawU passes
(pass 0: LimitFinder in calculateDimension, dx=dy=0; pass 1: SVG, dx,dy =
moveDelta D = 6 - inkMin, SvekResult.java:130-134), using ONLY jar data:
  - labelXY_svek: min XY of each label TABLE polygon in real `dot -Tsvg` of the
    jar's own svek-1.dot, y through YDelta (628 - y)  (SvekEdge.java:741-747,808-815)
  - todraw: each link's drawn path from the jar SVG, minus D (the path is drawn
    at ug.apply(UTranslate(x,y)) with x=dx,y=dy, SvekEdge.java:946)
Prints the predicted dashed <line> per link and the jar's.
usage: python3 gujigi-constraint-2pass.py
"""
import math

D = (7.0, -1.0)  # jar moveDelta; checked below against lnk11's fresh corner
FULL_H = 628.0
# min XY of the label polygons (real dot 16.1.0 -Tsvg of svek-1.dot)
LABEL_SVEK = {
    'lnk10': (123.0, FULL_H - 306.0),     # #000010 CONSTRAINT_SPOT
    'lnk11': (96.57, FULL_H - 372.5),     # #000014 'underarkiv' text table
    'lnk12': (219.62, FULL_H - 424.0),    # #000018 CONSTRAINT_SPOT
    'lnk13': (266.12, FULL_H - 542.0),    # #00001c CONSTRAINT_SPOT
}
PATHS_FINAL = {
    'lnk10': [(78.885, 295.396), (109.185, 315.596), (145.19, 339.6), (176.76, 360.65)],
    'lnk11': [(80.836, 255.129), (98.786, 252.989), (103.57, 257.9), (103.57, 267),
              (103.57, 276.1), (86.87, 279.59), (68.92, 277.45)],
    'lnk12': [(238.86, 55.37), (233.59, 119.4), (219.937, 285.161), (214.677, 348.911)],
    'lnk13': [(258.713, 66.092), (269.293, 86.222), (278.88, 104.45), (289.46, 124.56)],
}
# getTwoLastLinks (CucaDiagram.java:682-695): link1 = LAST link, link2 = the one before
PAIRS = [('lnk11', 'lnk10'), ('lnk13', 'lnk12')]  # (link1, link2)
DRAW_ORDER = ['lnk10', 'lnk11', 'lnk12', 'lnk13']  # allLines order = link order
JAR_LINES = {
    'lnk10': ((96.57, 265.5), (130, 331)), 'lnk11': ((103.57, 264.5), (130, 331)),
    'lnk12': ((266.12, 91), (226.62, 208)), 'lnk13': ((273.12, 95), (226.62, 208)),
}


def seg_dist_sq(x1, y1, x2, y2, px, py):
    # java.awt.geom.Line2D.ptSegDistSq
    x2 -= x1; y2 -= y1; px -= x1; py -= y1
    dot = px * x2 + py * y2
    if dot <= 0:
        proj = 0.0
    else:
        px = x2 - px; py = y2 - py
        dot = px * x2 + py * y2
        proj = 0.0 if dot <= 0 else dot * dot / (x2 * x2 + y2 * y2)
    return max(0.0, px * px + py * py - proj)


def sample(bez, out):
    (x1, y1), (c1x, c1y), (c2x, c2y), (x2, y2) = bez
    flat = max(seg_dist_sq(x1, y1, x2, y2, c1x, c1y), seg_dist_sq(x1, y1, x2, y2, c2x, c2y))
    if flat > 0.5 or math.hypot(c1x - c2x, c1y - c2y) > 4:
        cx, cy = (c1x + c2x) / 2, (c1y + c2y) / 2
        l1 = ((x1 + c1x) / 2, (y1 + c1y) / 2); r2 = ((x2 + c2x) / 2, (y2 + c2y) / 2)
        l2 = ((l1[0] + cx) / 2, (l1[1] + cy) / 2); r1 = ((r2[0] + cx) / 2, (r2[1] + cy) / 2)
        m = ((l2[0] + r1[0]) / 2, (l2[1] + r1[1]) / 2)
        sample(((x1, y1), l1, l2, m), out)
        sample((m, r1, r2, (x2, y2)), out)
    else:
        out.append((c1x, c1y)); out.append((c2x, c2y))


def samples_svek(link):
    pts = [(x - D[0], y - D[1]) for x, y in PATHS_FINAL[link]]
    out = []
    for i in range(0, len(pts) - 1, 3):
        sample(tuple(pts[i:i + 4]), out)
    return out


CORNERS = [(0, 0), (5, 0), (10, 0), (0, 5), (10, 5), (0, 10), (5, 10), (10, 10)]  # getSquare


def pick(link, dx, dy):
    lx, ly = LABEL_SVEK[link]
    bez = samples_svek(link)
    best = None; bd = None
    for cx, cy in CORNERS:
        pt = (dx + lx + cx, dy + ly + cy)
        for b in bez:
            d = math.hypot(b[0] - pt[0], b[1] - pt[1])
            if best is None or d < bd:
                best, bd = pt, d
    return best


def run():
    state = {}
    lines = {}
    for pass_no, (dx, dy) in enumerate([(0.0, 0.0), D]):
        for link in DRAW_ORDER:
            for l1, l2 in PAIRS:
                if link in (l1, l2):
                    st = state.setdefault(l1, {'x1': (0, 0), 'x2': (0, 0)})
                    pt = pick(link, dx, dy)
                    st['x1' if link == l1 else 'x2'] = pt
                    if st['x1'] != (0, 0) and st['x2'] != (0, 0) and pass_no == 1:
                        lines[link] = (st['x1'], st['x2'])
                    if pass_no == 0 and st['x1'] != (0, 0) and st['x2'] != (0, 0):
                        print(f'pass0 {link}: ink line {st["x1"]} -> {st["x2"]}')
    for link in DRAW_ORDER:
        p = lines.get(link)
        pr = None if p is None else tuple(tuple(round(v, 3) for v in q) for q in p)
        print(f'{link}: predicted {pr}  jar {JAR_LINES[link]}  match={pr == tuple(tuple(float(v) for v in q) for q in JAR_LINES[link])}')


run()

# --- control: OUR current rule (class-edge-constraint.ts#constraintAnchor over
# EdgeGeo.points): ONE unbiased pick on the UNTRIMMED graphviz spline.
RAW_SVEK = {  # real dot -Tsvg d= of each edge, y -> 628 - y (untrimmed)
    'lnk10': [(61.9, 338.26), (92.2, 318.06), (138.19, 287.4), (169.76, 266.35)],
    'lnk11': [(61.92, 370.45), (79.87, 372.59), (96.57, 369.1), (96.57, 360), (96.57, 350.9), (79.87, 347.41), (61.92, 349.55)],
    'lnk12': [(231.86, 571.63), (226.59, 507.6), (211.95, 329.88), (206.69, 266.13)],
    'lnk13': [(246.13, 571.53), (256.71, 551.4), (271.88, 522.55), (282.46, 502.44)],
}
print('control (untrimmed, unbiased, final frame):')
for link, pts in RAW_SVEK.items():
    pts = [(x, FULL_H - y) for x, y in pts]
    out = []
    for i in range(0, len(pts) - 1, 3):
        sample(tuple(pts[i:i + 4]), out)
    lx, ly = LABEL_SVEK[link]
    best = None; bd = None
    for cx, cy in CORNERS:
        pt = (lx + cx, ly + cy)
        for b in out:
            d = math.hypot(b[0] - pt[0], b[1] - pt[1])
            if best is None or d < bd:
                best, bd = pt, d
    print(f'  {link}: corner {(round(best[0]-lx,3), round(best[1]-ly,3))} -> final {(round(best[0]+D[0],3), round(best[1]+D[1],3))}')

# control 2: trimmed/magnetic path (todraw) but ONE unbiased pass -- is the
# trim alone enough? (it is not: lnk12 still picks (0,10), jar (0,5))
print('control 2 (trimmed, unbiased, one pass):')
for link in DRAW_ORDER:
    p = pick(link, 0.0, 0.0)
    lx, ly = LABEL_SVEK[link]
    print(f'  {link}: corner {(round(p[0]-lx,3), round(p[1]-ly,3))} -> final {(round(p[0]+D[0],3), round(p[1]+D[1],3))}')
