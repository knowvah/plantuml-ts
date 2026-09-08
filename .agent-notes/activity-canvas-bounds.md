# activity-canvas-bounds — 2026-09-08

Opened as `activity-canvas-margin`; that mission's premise was false, and
the investigation found a different, larger defect instead.

## Observation: a filed follow-on's headline number was a golden value

- **Context**: about to retune `LAYOUT_MARGIN` from 12 toward "the jar's
  16", per a filing I had written myself the previous day.
- **Finding**: upstream's activity margin is **10**.
  `ActivityDiagram3 extends TitledDiagram`, and
  `TitledDiagram#getDefaultMargins()` returns
  `ClockwiseTopRightBottomLeft.same(10)` (`TitledDiagram.java:275`).
  `ActivityDiagram3` declares no override. The 16 was measured off a
  golden, not read from the spec.
- **Impact**: the fix the filing proposed would have been *fitting a
  constant to an observed value* — the thing CLAUDE.md forbids most
  explicitly — and would additionally have been the wrong number. The
  filing's own hedge ("confirm against the jar's own layout margin rather
  than the observed 16") is what saved it, and it survived only because the
  filing carried that hedge in the same sentence as the number.
- **Confidence**: High.

## Observation: the leading offset is not a constant on either side

- **Context**: measuring ink extents over all 268 goldens rather than
  eyeballing one fixture.
- **Finding**: jar left = `16`×123 / `20`×56 / `25`×40; top = `15`×139 /
  `17.5`×52 / `16`×50; bottom = `20`×134 / `20.5`×44 / `21`×33. Ours is a
  flat **12** everywhere. A 10px spread on the jar's side cannot be a
  margin constant.
- **Impact**: the gap between upstream's `same(10)` and its observed
  offsets is FTile bounding-box structure we do not model. Any future
  `activity-canvas-margin` work starts there, not at `LAYOUT_MARGIN`.
- **Confidence**: High for the measurement; Medium for the attribution to
  FTile bounds specifically — I have not yet read what `UgDiagram.java:145`
  applies the margin to.

## Observation: 32 of 268 fixtures drew outside their own canvas

- **Context**: measuring OUR offsets with the same instrument, which
  reported NEGATIVE right margins.
- **Finding**: `assignCoordinates` (`layout/tile-coordinates.ts`) returns
  `nodes`, `edges` AND `swimlanes`, and `renderActivity` draws all three,
  but the `maxX`/`maxY` bounds iterated only nodes and edges. Lanes are
  built six lines above the bounds loop and never consulted. On
  `pakema-21-xema183`: lanes to x=252, nodes to 132, `totalWidth` 144 —
  **108px of lane drawn outside a 144px viewport**; worst case 216px.
- **Impact**: a real user-visible clipping bug that the oracle ratchet
  **cannot see** — `svg/@width` costs one unit whether the number is a
  little wrong or catastrophically wrong. Fixing it moved the aggregate
  score by 2 units while moving 34 canvases, 28 of them closer to the jar.
  **The general lesson: a per-attribute diff score is blind to magnitude on
  single-valued attributes.** Containment is now asserted directly in
  `tests/diagrams/activity/layout/canvas-bounds.test.ts`, verified to fail
  without the fix.
- **Confidence**: High — mechanism read from the code, reproduced by
  direct geometry inspection, and the count went 32 → 0.

## Note

The 6 fixtures whose width got *further* from the jar are ones where
`SWIMLANE_MIN_WIDTH = 120` forces lanes wider than the jar's content-fitted
lanes. That is `activity-swimlane-rendering`, not this fix, and it was left
alone deliberately.
