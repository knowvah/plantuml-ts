# altp-T4 — orchestrator observations (`activity-loop-tile-port`, 2026-09-16)

## Observation: `--align` per-tag equality does not verify a shape's size

- **Context**: T2 had passed `--align` on `cemagu-66-vazo965` (polygon 7=7,
  line 10=10, text 6=6) and the score rose only +5.
- **Finding**: the `while-header` polygon was 35 px tall (the
  `GtileDiamondInside.height`, which includes the north label per
  `FtileDiamondInside.java:119-124`) where the jar draws 24 px (`drawU`
  uses `calculateDimensionAlone`, `:87-89`). Found only by dumping ours
  and the golden's elements anchored on a body action and diffing the
  segment sets to 0.01. After the fix all 10 segments match.
- **Impact**: for every loop/if hexagon node, the pushed `height` must be
  the alone height (`getCoord(SOUTH_HOOK).y`), never the tile height.
  `if-split` is safe today only because `FtileIfDown` never sets a north
  label.
- **Confidence**: High.

## Observation: laned connections use the jar's `drawTranslate` variants

- **Context**: `ruzica`, `kijazo`, `judatu`, `gesogi`, `xovano` matched few
  segments after T4 while unlaned whiles matched all.
- **Finding**: when the two ftiles of a `ConnectionTranslatable` sit in
  different lanes the jar calls `drawTranslate(ug, t1, t2)`, not `drawU`;
  `ConnectionBackSimple.drawTranslate` (`FtileWhile.java:276-308`) has a
  different shape (`xx = max(t1.dx, t2.dx) + width`, elbow `y1 + 12`, a
  separate `asToUp` arrow at `(xx, (y1+y2)/2)`), `ConnectionIn.drawTranslate`
  (`:200-214`) adds a mid-y dog-leg.
- **Impact**: the while/repeat connection ports cover `drawU` only; a
  follow-on (`activity-loop-lane-translate`) owns the laned shapes.
- **Confidence**: High (Java read; not yet ported).
