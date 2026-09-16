# altp-T7 — close-out observations (`activity-loop-tile-port`, 2026-09-16)

## Observation: a rise on a fixture that matches the golden exactly is the pairing, not the port

- **Context**: T4/T6 risers `cemagu` +35, `fovaja` +111, `camavo` +104,
  `cufega` +99, `biguku` +43.
- **Finding**: each matched the golden on EVERY line segment to 0.01 px
  after a pure canvas offset (`segcmp2.py`, best-of alignment on hexagon
  or action-rect pairs). The score rose because the added elements (4
  lines + 2 polygons per while; 1 line + 1 polygon + a 4-segment back edge
  per repeat) re-pair everything after them positionally, and
  `compare.ts:404` charges a child-count mismatch with the sum of both
  sides (`judatu` +222 while its diff list shrank 439 -> 422).
- **Impact**: classify rises with the segment comparison first; the
  fully-matching set is the proof the class exists, then the rest sort by
  lane/style/if-side residuals. Never chase a rise before comparing
  geometry.
- **Confidence**: High.

## Observation: `--align` per-tag equality is necessary, not sufficient

- **Context**: `cemagu` at T2 had 7/10/6/3 = the jar's counts with a 35 px
  hexagon where the jar draws 24.
- **Finding**: see `altp-T4.md`; the fix is `getCoord(SOUTH_HOOK).y` for
  every hexagon node's pushed height.
- **Impact**: any future `--align` acceptance must be paired with a
  segment/element diff on at least one unlaned representative.
- **Confidence**: High.

## Observation: the six `Complex1` fixtures were visible before Batch 3 began

- **Context**: parsing the 43 repeat rows for `swimlane !== swimlaneOut`
  before dispatching T5.
- **Finding**: a 20-line parser walk over `fixtures.md` found the stop-11
  condition a full batch early, so T4/T5 finished before the halt and the
  human decided with the mission otherwise complete.
- **Impact**: for any brief with a "reachability" scope claim, test the
  claim against the corpus with the parser BEFORE the batch that would
  trigger the stop.
- **Confidence**: High.
