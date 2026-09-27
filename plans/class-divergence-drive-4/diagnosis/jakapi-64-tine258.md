# jakapi-64-tine258 — diagnosis (cdd4-T5)

Measured on `a21795294` (dot-engine 1.6.1): structural-match, 0 S / 352 N.
All but 13 of the N diffs are one uniform x shift of Δ3.759 (canvas 472 vs 475).
The other 13 are the `groupInheritance` triangles/stubs (`g[1]/polygon[1..2]`,
`line[1..2]`) and one magic-arrow glyph (`g[9]/polygon[2]`).

## Mechanism

There are two defects, both in how the port handles the magic-arrow glyph that
`"... >"`/`"< ..."` labels draw (`TextBlockArrow2`).

1. **Ink (the Δ3.759 frame).** The class ink walk adds the glyph's three
   vertices raw. `LimitFinder` pads every `UPolygon` by `HACK_X_FOR_POLYGON = 10`
   on both x sides. The jar's leftmost ink is therefore the `has >` glyph
   minus 10, not the Activity rect.
2. **Glyph angle.** `magicArrowAngle` reads the UNTRIMMED spline endpoints. The
   jar reads `dotPath` after `solveLine` has trimmed it by the decoration length
   (the `o--` diamond at Group). The result is a 0.04 rad rotation of the glyph.

## Java (quoted)

- `klimt/drawing/LimitFinder.java:169-177`
  ```java
  private final static double HACK_X_FOR_POLYGON = 10;
  private void drawUPolygon(double x, double y, UPolygon shape) {
      if (shape.getPoints().size() == 0) return;
      addPoint(x + shape.getMinX() - HACK_X_FOR_POLYGON, y + shape.getMinY());
      addPoint(x + shape.getMaxX() + HACK_X_FOR_POLYGON, y + shape.getMaxY());
  }
  ```
- `klimt/shape/TextBlockArrow2.java:62-77`: the glyph is a `UPolygon`
  (`final UPolygon triangle = new UPolygon(); ... ug.draw(triangle);`). It is
  reached from `descdiagram/command/StringWithArrow.java:105-108`
  (`addMagicArrow` → `mergeLR(arrow, label, …)`), which is called from
  `svek/SvekEdge.java:303-304`.
- `svek/SvekEdge.java:208-216`
  ```java
  final XPoint2D start = dotPath.getStartPoint();
  final XPoint2D end = dotPath.getEndPoint();
  final double ang = Math.atan2(end.getX() - start.getX(), end.getY() - start.getY());
  return ang;
  ```
  `dotPath` is trimmed in place during `solveLine`. `svek/SvekEdge.java:558-562`
  reads `if (isStart) dotPath.moveStartPoint(translateForKal.compose(new UTranslate(decorationLength, 0).rotate(angle - Math.PI)));`.
- The frame: `svek/SvekResult.java:130-134`
  (`minMax = TextBlockUtils.getMinMax(this, stringBounder, false); clusterManager.moveDelta(6 - minMax.getMinX(), 6 - minMax.getMinY());`).

## TS origin

- `src/diagrams/class/class-ink-box.ts:444-451` adds the glyph ink
  `for (const p of e.arrowGlyph.points) addPoint(box, p.x, p.y);` (and the same
  for `line.glyph`) with no `HACK_X_FOR_POLYGON` pad. The file already imports
  that constant for other polygons (line 22).
- `src/diagrams/class/class-edge-label-attach.ts:229,233,349` compute
  `dotPathOf(fromToPoints, rel)` from the untrimmed `pts`, which feed
  `magicArrowAngle` (`class-magic-arrow.ts:231-235`). The doc comment at
  `class-magic-arrow.ts:199-201` claims these points mirror the post-`solveLine`
  `dotPath`, but they are pre-trim.

## Causal chain

The `has >` glyph (Activity→Item) sits at svek-frame min x 5.241. With the pad,
the jar's ink min is 5.241 − 10 = −4.759, so `dx = 6 − (−4.759) = 10.759`. Ours
has no pad, so the min is the Activity rect's `x − 1 = −1`, giving `dx = 7`.
Every x differs by 3.759, and the canvas is 3 px narrower. The same frame
difference changes the `XPoint2D` doubles that `Neighborhood`'s `HashSet` hashes
on, which swaps the two sametail triangles (`polygon[1]` and `polygon[2]`). The
glyph on Group→Activity is rotated because its angle is taken from start x
183.46 (untrimmed) instead of 171.46 (after the 12 px diamond trim). The
recovered angles are jar −0.90982 vs ours −0.95128, and `atan2` over the
trimmed and untrimmed starts gives −0.90995 and −0.95124.

## Ruled out (with evidence)

- **HashSet order (cdd3 T32):** the port is correct. With only the ink pad
  applied, the triangle and stub order matches the jar (352 → 7, and the 7 left
  are the glyph angle alone).
- **dot-engine / DOT:** after the pad, every node and edge coordinate matches.
  The only diffs are uniform-shift diffs.
- **`together` cluster (E1-6):** DOT equal since cdd3 T18. No y diffs remain.
- **Hidden `PLACEHOLDER`:** it sits at svek x 110.94 and is never leftmost.
- **An undrawn element (T32's lead):** the ink comes from a drawn element, the
  glyph at jar x 16.0. `16.0 − 10.759 = 5.241`, and `5.241 − 10 = −4.759`,
  exactly the jar's ink min.

## Probe

- Instrumentation, reverted: `diagnosis/scratch/jakapi-glyph-probe.diff`, which
  pads the glyph and uses `dotPathOf(drawnEdgePoints(edgeGeo), rel)` for the
  angle.
- `npx jiti plans/class-divergence-drive/tools/render-diff.mts jakapi-64-tine258`
  - baseline: 0 S / 352 N
  - pad only: 0 S / 7 N (all `g[9]/polygon[2]`)
  - pad + trimmed angle: `pass=true structural=0 numeric=0`
- Class survey with both changes, diffed with `scratch/survey-diff.py` against
  `measurements/b0.json`: 1 verdict mover (jakapi → conformant). Output is in
  `scratch/survey-jakapi-probe.out`. Class totals were 702/5/16.

## Fix shape

- Write-set: `src/diagrams/class/class-ink-box.ts` (glyph ink ± `HACK_X_FOR_POLYGON`,
  both glyph kinds), `src/diagrams/class/class-edge-label-attach.ts` (the angle
  reads the trimmed `dotPath` in both the single-line and multi-line arms),
  `src/diagrams/class/class-magic-arrow.ts` (doc correction), tests. The
  autolink arm (`SvekEdge.java:209-211`, `dotPath.getStartAngle()`) reads the
  same trimmed `dotPath`. Check what `DotPath#moveStartPoint` does to the first
  control point before reusing the trimmed points there. Unprobed.
- Task: batch-2 T8.

## Confidence

HIGH. The probe gives 0/0, and the survey shows exactly one mover.
