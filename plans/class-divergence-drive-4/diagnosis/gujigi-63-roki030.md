# gujigi-63-roki030 — diagnosis (cdd4-T5)

Measured on `a21795294`: structural-match, 0 S / 20 N. All 20 diffs are the
`constraint on links` dashed lines and their `enten/eller` labels, in
`g[10]..g[13]` (`lnk10..lnk13`).

## Mechanism

`LinkConstraint` is one mutable object shared by both links. `SvekResult#drawU`
runs twice:

- **Pass 0:** the `calculateDimension` LimitFinder pass, at `dx=dy=0`.
- **Pass 1:** the SVG pass, at `dx,dy = moveDelta D`.

Each `SvekEdge#drawU` picks its square corner and then calls
`setPosition` + `drawMe`. This produces three effects the port lacks.

1. **Stale point.** In pass 1, link2 (the earlier link) draws first. `x1,y1`
   still holds link1's pass-0 point, which is in the un-shifted frame. So link2's
   line runs from that stale point to its own fresh point. link1 then draws with
   both points fresh.
2. **Biased pick.** Pass 1 compares the square at `x + labelXY` (shifted by D)
   against `todraw.sample()`, which is NOT shifted. So the chosen corner depends
   on D.
3. **Samples and corner source.** The samples come from `todraw`, which is
   `dotPath` after the extremity trim plus the magnetic force, not from the raw
   spline. The square corner is the label TABLE polygon's min XY, where the
   table width is `(int)`-truncated.

The port makes one unbiased pick on the untrimmed spline, from
`centre − measuredWidth/2`, and stamps both links with the same fresh pair.

## Java (quoted)

- `svek/SvekEdge.java:994-1012`
  ```java
  if (link.getLinkConstraint() != null) {
      final double xConstraint = x + this.labelXY.getPosition().getX();
      final double yConstraint = y + this.labelXY.getPosition().getY();
      final List<XPoint2D> square = getSquare(xConstraint, yConstraint);
      final Set<XPoint2D> bez = todraw.sample();
      … if (minPt == null || distance < minDist) { minPt = pt; minDist = distance; } …
      link.getLinkConstraint().setPosition(link, minPt);
      link.getLinkConstraint().drawMe(ug, skinParam);
  }
  ```
  Here `x`,`y` are `dx`,`dy` (`:857-872`, `x += dx; y += dy;`). `todraw` is
  `dotPath.copy()` (`:908`) plus the magnetic moves (`:922-942`), and it is drawn
  at `ug.apply(new UTranslate(x, y))` (`:946`), so the path itself is
  un-shifted. `getSquare` is at `:1080-1091`.
- `cucadiagram/LinkConstraint.java:70-104`. `setPosition` writes `x1,y1` for
  `link1` and `x2,y2` for `link2`. `drawMe` returns if either point is `(0,0)`;
  otherwise it draws `new ULine(x2 - x1, y2 - y1)` at `(x1, y1)` and centres the
  label on `((x1+x2)/2, (y1+y2)/2)`.
- `atmp/CucaDiagram.java:682-695` (`getTwoLastLinks`: iterates from the LAST
  link, so `links.get(0)` = last) and `:734-737`, reached from
  `command/note/CommandConstraintOnLinks.java:102-107`
  (`diagram.constraintOnLinks(links.get(0), links.get(1), …)`). So
  `link1` = the later link.
- `svek/SvekResult.java:95-100` (edges drawn in `allLines()` order, i.e. link
  order) and `:130-134`
  (`minMax = TextBlockUtils.getMinMax(this, …); clusterManager.moveDelta(6 - minMax.getMinX(), 6 - minMax.getMinY());`).
  Separately, `klimt/shape/TextBlockUtils.java:138-141` has
  `limitFinder … tb.drawU(limitFinder)`. That LimitFinder call is pass 0.
- `svek/SvekEdge.java:741-747` (`labelXY = … asPositionable(CONSTRAINT_SPOT or labelText, …, getXY(fullSvg, noteLabelColor))`),
  `:808-815` (`getXY` = `SvekUtils.getMinXY` of the label polygon) and
  `:440-443` + `:504-507` (`final int w = (int) dim.getWidth();`).
- `klimt/shape/DotPath.java:131-151` (`sample()`: the recursive subdivision
  collects `ctrlP1`/`ctrlP2`).

## TS origin

- `src/diagrams/class/class-edge-geo.ts:196-218` `attachNoteAndConstraintSpot`:
  `spot = centre − (attrs.labelWidth)/2` (untruncated) and
  `constraintAnchor(edgeGeo.points, spot)` (untrimmed, one unbiased pick). This
  runs inside the per-edge loop, before `fixKalOverlaps` and
  `applyClusterMagneticBorders` (`:388-393`).
- `src/diagrams/class/class-edge-geo.ts:233-242` `attachConstraints`: stamps
  both links with `(own point → partner point)`, all fresh.
- `src/diagrams/class/class-edge-constraint.ts:103-118` `constraintAnchor`: a
  single-frame pick.
- There is no pass-0 frame to pick in. `src/core/graph-layout.ts:244-270`
  `shiftToOrigin` subtracts the node/edge min `m` and does not report it. The
  jar's pass-0 frame is the svek frame, `ours + m`, and D = `S − m`, where `S`
  is `layout-ink-extent.ts#computeClassInkShift`.

## Causal chain

Real `dot -Tsvg` of the jar's `svek-1.dot` gives the label polygon minima. The
jar's `D = (7, −1)`. Replaying `drawU` over both passes with those inputs gives,
for every link, exactly the jar's line:

| link | role | jar line | our line |
|---|---|---|---|
| lnk10 | link2, pair 1 | (96.57,265.5) stale → (130,331) | (135,331) → (103.223,264.5) |
| lnk11 | link1, pair 1 | (103.57,264.5) → (130,331) | (103.223,264.5) → (135,331) |
| lnk12 | link2, pair 2 | (266.12,91) stale → (226.62,208) | (226.62,213) → (273.12,95) |
| lnk13 | link1, pair 2 | (273.12,95) → (226.62,208) | (273.12,95) → (226.62,213) |

The label text x/y follows from each line's midpoint.

- Our (135,331) comes from the untrimmed spline, which picks corner (5,10)
  instead of (0,10).
- Our x 103.223 vs 103.57 (Δ0.347) comes from the width: 72.694 untruncated vs
  the table's `(int) 72`.

## Ruled out (with evidence)

- **dot-engine / layout:** control 1 in the probe (our rule on real-dot data)
  reproduces OUR four points exactly, so the inputs agree and only the rule
  differs.
- **Trim alone (one pass on `todraw`):** control 2 gives lnk13 (273.12,90) where
  the jar has (273.12,95). Only the D-biased pass-1 pick yields (0,10). A single
  pass also can never produce link2's stale line.
- **E3-13/E3-14 (cdd3):** landed. There are 0 S diffs, and the leaf matches.
- **The `drawMe` early return:** reproduced. The pass-0 draw of link2 returns
  (x1 = 0), which is why only link1's line is pass-0 ink.

## Probes

- `python3 plans/class-divergence-drive-4/diagnosis/scratch/gujigi-constraint-2pass.py`
  uses only jar data: real-dot label polygons, the jar's drawn paths − D, and
  `D=(7,−1)`. Output is in `scratch/gujigi-constraint-2pass.out`: all four
  `match=True`, plus controls 1 and 2 above.
- `scratch/gujigi-two-pass-probe.diff` is TS instrumentation, reverted. It
  truncates the table width, moves the constraint resolution after the magnetic
  borders, samples `drawnEdgePoints`, replays pass 0 / pass 1 with
  `GUJ_PROBE=7,-1` (D hardcoded) and stamps link2 with the stale point. With it,
  `render-diff.mts gujigi-63-roki030` gives `pass=true structural=0 numeric=0`.

## Fix shape

- The constraint resolution becomes a two-pass replay that runs after D is
  known:
  1. Pass-0 picks, in our frame, on `drawnEdgePoints` after the Kal and magnetic
     moves.
  2. Pass-0 ink: link1's line and label only.
  3. Compute D = S − m.
  4. Pass-1 picks, with the square offset by D.
  5. Stale point = pass-0 point − D.
- This needs `m` from `graph-layout.ts`, which is T11's batch-1 file. It shares
  the SvekResult two-pass origin with ririlu's Kal stall, so the two are
  collapsed into one task.
- Write-set: `class-edge-geo.ts`, `class-edge-constraint.ts`, a new
  `class-svek-pass0.ts`, `layout.ts` (at its 500-line cap: call only),
  `layout-ink-extent.ts`, `src/core/graph-layout.ts`, and
  `graph-layout-result.types.ts`.
- Task: batch-2 T10.

## Confidence

HIGH. Jar data alone reproduces 4 of 4 lines, and the TS probe gives 0/0. The
general D computation (S − m) is unimplemented; the probe hardcoded D.
