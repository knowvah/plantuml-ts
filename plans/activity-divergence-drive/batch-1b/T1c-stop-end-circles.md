# T1c — stop/end circles (D3)

Agent: typescript-pro, worktree `add1-T1c`. Commit:
`fix(activity): port FtileCircleStop/FtileCircleEndCross geometry`.

## Context
`ellipse/@rx|@ry` differ on 160 fixtures and `ellipse/@stroke|@stroke-width`
on 121 (`measurements/b0-classify.json`): the stop draws outer r 14 / inner
7.7 with no stroke where the jar draws r 11 / 6 with `stroke #222 width 1`
(`bareka-88-fusu160`); `end` draws r 14 where the jar draws 10 (`barada-07-
veca157`). `activity-renderer-shapes.ts:206-207` derives `innerR = outerR *
0.55` — a fitted ratio. Upstream: `FtileCircleStop.java:55` `SIZE = 22`,
`:93` geometry `(SIZE, SIZE, SIZE/2, 0)`; its `drawU` draws the outer and
inner `UEllipse` with explicit radii and the `circle { stop { LineColor } }`
stroke; `FtileCircleEndCross.java:61` `SIZE = 20`, cross at `:104-115`, is the crossed circle. `tiles/gtile-
spot.ts` sizes the tile; the `start` circle (r 10) already matches.

## Task
1. Read both Java files whole; quote the radii, the stroke source and the
   geometry constructor in the journal.
2. `gtile-spot.ts`: stop/end tile dimensions per the Java (`SIZE`), with the
   `@see`. `activity-renderer-shapes.ts`: stop = outer + inner ellipses with
   the Java's radii and stroke; end = per `FtileCircleEndCross#drawU` (`:104-115`) (circle +
   cross geometry). Delete the 0.55 ratio. Colours stay on the D9 style path.
3. Tests: `renderer-shapes.test.ts` pins stop (11/6, stroke #222 w1) and end
   (10) with the quotes; `tile-sizing.test.ts` pins the tile sizes.
4. Re-pin `diff-baseline.json` and `style-baseline.json`; diff before/after;
   every ROSE row journaled.

## Write-set
`src/diagrams/activity/tiles/gtile-spot.ts`, `src/diagrams/activity/activity-
renderer-shapes.ts`, `tests/unit/activity/{renderer-shapes,tile-sizing}.test.ts`,
`oracle/goldens/svg-activity/{diff,style}-baseline.json`.

## Read-set
`decisions.md#D3`, `#D9`; `activity-renderer-shapes.ts:160-245`; `tiles/gtile-
spot.ts` (whole, 74); Java `activitydiagram3/ftile/vertical/FtileCircleStop
.java`, `FtileCircleEndCross.java` (whole), `FtileCircleStart.java` (the matching
reference), `plantuml.skin` `circle { stop { … } end { … } }` block.

## Acceptance
- Given `bareka-88-fusu160` and `barada-07-veca157`, when re-measured, then
  `ellipse/@rx|@ry|@stroke|@stroke-width` diffs = 0.
- Given the 311 rows at b1b, then the `circle` family is gone from every row
  or its survivors are journaled, and 0 unexplained rises.
- Given `grep 0.55 activity-renderer-shapes.ts`, then no match.

Quality bar: targeted vitest + typecheck + eslint. Boundaries: `renderer.ts`,
`activity-renderer-text.ts` and layout files are read-only here.
Observability: N/A. Rollback: Reversible.
