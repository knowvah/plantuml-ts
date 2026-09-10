# akc-T5 halt — stop 11 and what the Java actually guarantees

Mission `activity-klimt-compress`, 2026-09-10, branch
`feat/activity-klimt-compress` at `99c473c4`; T5 parked at `e925560e`
(`akc/T5-wip`).

## Observation: "no new overlap after compression" is not a jar invariant

- **Context**: T5's invariant test (`overlaps(shapesOf(after)) ⊆
  overlaps(shapesOf(before))` over 268 fixtures) went red on 5 fixtures.
- **Finding**: every violating pair contains a shape that contributes no
  slot on the moved axis: a cross-lane arrowhead with `compressionMode =
  ON_X` (`ftile/Worm.java:159-168`) or a lane title (`CenteredText`, no
  `SlotFinder#draw` branch; re-centred by `UGraphicCompressOnXorY.java:
  100-112` with a possibly negative offset). The jar can and does move
  those onto occupied space; the invariant it keeps is only between shapes
  that both occupy on that axis.
- **Impact**: the mission's stop 11 was written to a premise the Java does
  not hold. A future brief should state the invariant per occupancy class.
- **Confidence**: High — `t5-verify.ts` printed all 7 pairs with flags.

## Observation: the invariant's instrument had a text-box bug

- **Finding**: `overlaps()` used `[y, y+h]` for text kinds whose `y` is the
  baseline (`TextLimitFinder.java:82-90` box is `[y − h + 1.5, y + 1.5]`).
  Two false positives (`rujuxa`, `sopape`) and two masked real ones
  (`maketa`). Fixed in `99c473c4`.
- **Impact**: check the instrument before the finding (memory:
  measurement artifacts outnumber defects).
- **Confidence**: High.

## Observation: the parser lane-capture defect is what collides

- **Finding**: on `bixefi`, both cross-lane elbows (x 262.4 and 376.8)
  sit in lane 3 with only the X-ignored bar between them; the 240-wide gap
  collapses both to 217.75. The jar's elbows are in the target lanes over
  the branch boxes and cannot collapse. `maketa`'s title spills (8.4 < 12)
  because lane 1's content is elsewhere; the jar's lane 1 is 123 wide with
  content in it. Filed since `activity-parallel-connectors` (`node-dispatch
  .ts:261,291`).
- **Confidence**: High.

## Observation: the comparator pins the exit bar above 42511 after T1

- **Finding**: T1 raised Σ to 52956 by turning one count-mismatch diff per
  arrowhead into up to 8 per-index diffs; the tips stay offset from the
  jar's by the unported root margin, so T5's geometrically exact pass moved
  Σ by −2. Families and target dumps are the fidelity evidence here.
- **Confidence**: High (`b1.json` vs `t5.json`).
