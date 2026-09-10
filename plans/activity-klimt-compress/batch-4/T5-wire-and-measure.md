# T5 — Wire the pass and measure

**Agent:** `typescript-pro` · **Depends on:** T4

## Context

Read [`../README.md`](../README.md) (stops 7, 10–13),
[`../decisions.md#d1`](../decisions.md), `#d6`, `#d7` (locked),
`.agent-notes/akc-T0.md` (the target dumps). `assignCoordinates`
(`layout/tile-coordinates.ts:451-478`) walks the tiles, calls
`placeSwimlanes`, then `computeBounds(root, …)` from `root.width`/`height`
and `computeSwimlaneChrome`. Upstream applies compression to the whole
swimlanes block after layout (`ActivityDiagram3.java:205-213`) and reports
`transform(width)` as its dimension. `renderSwimlaneTitles`
(`activity-renderer-swimlanes.ts:115-126`) centres each title at
`contentX + (contentWidth − titleWidth) / 2` — T4 transforms those fields,
so the centring follows (`UGraphicCompressOnXorY`'s `CenteredText` rule).

## Read-set

- `src/diagrams/activity/layout/tile-coordinates.ts:426-478`
- `src/diagrams/activity/layout/compress/compress-geometry.ts` (T4)
- `src/diagrams/activity/activity-renderer-swimlanes.ts:40-126`
- the six test files in the write-set (pins that encode uncompressed x,
  widths, divider x's, `totalWidth`)
- Java: `ActivityDiagram3.java:200-215`, `CompressionXorYBuilder.java:63-69`

## Write-set

See the batch table. `docs/catalog.md` only on drift. Lane width
measurement (`measureLanes`, `swimlane-context.ts`) is NOT in it (stop 12).

## Task

Tests first.

1. `assignCoordinates`: after `placeSwimlanes`, compute the pass-1 bounds,
   call `compressGeometry`, and build the result from ITS nodes, edges,
   swimlanes and bounds; `computeSwimlaneChrome` from the transformed lanes
   and `maxY`.
2. The invariant test: over all 268 baseline fixtures, `overlaps(shapesOf(
   before))` ⊇ `overlaps(shapesOf(after))` — no new overlap (stop 11); and
   no fixture throws (stop 10).
3. Re-pin the tests that encoded the uncompressed model, each new number
   with its derivation.
4. Measure with the probe (aggregate, subset, families, per-fixture
   `removed`); dump `simuti`, `zizaki`, `bixefi` and compare with T0's
   targets; time the four activity oracle gates (stop 13). Journal every
   riser with its mechanism BEFORE committing.

## Acceptance criteria

- Given `simuti-16-lece058`, then its branches are 10 apart and its split
  line spans the jar's `32.675..119.375` up to the root margin
- Given `zizaki-04-guvi945`, then the bar is 103.4 wide and branch 2 sits
  at the jar's x up to the root margin
- Given the probe, then the aggregate falls from 42511 and the subset from
  6752; `rect[]/@x`, `text[]/@x`, `line[]/@x1`/`@x2`, `svg/@width` fall on
  the multi-branch fixtures; every riser journaled
- Given the 17 laned fixtures, then divider x's move toward the jar's on
  more fixtures than away, each "away" named with its mechanism
- Given the invariant test, then green on all 268

## Observability / Rollback

The probe's `removed` per fixture and the gate wall-clock / **Reversible**
(one call site).

## Quality bar

All four gates green except the expected activity oracle gates (list each
with counts); the invariant test green.

## Commit

`feat(akc-T5): compress the activity drawing on x then y like the jar`
