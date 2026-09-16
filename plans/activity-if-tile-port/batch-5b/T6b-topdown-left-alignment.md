# T6b — align siblings on `left`; trailing notes do not decide `hasPointOut`

**Agent:** `typescript-pro` · **Depends on:** T6

## Context

Faithful TypeScript port of PlantUML; the Java is the spec (quote
`file:line`; JSDoc `@see`; port the arithmetic verbatim). Read
[`../README.md`](../README.md) (stops 5, 8, 9, 12; red allowance; gates),
[`../decisions.md`](../decisions.md) D4, D7, and the journal row
"T7 | HALT (stop 1)" in [`../decision-journal.md`](../decision-journal.md),
which states both mechanisms with their evidence.

Java paths are under `~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/`.

**(a) Sibling alignment.** The jar assembles a sequence pairwise as
`FtileAssemblySimple(tile1, tile2)` whose geometry is
`tile1.appendBottom(tile2)` (`FtileAssemblySimple.java:124-129`) and whose
children are translated by `left - tile.left` — `getTranslateFor(tile1) =
dx(left - tile1.left)`, `getTranslateFor(tile2) = (left - tile2.left,
dim1.height)` (`:131-141`). `FtileGeometryMerger` defines the merge: `left =
max(left1, left2)`, `width = max(w1 + (left - left1), w2 + (left - left2))`,
`height = h1 + h2`, `inY = geo1.inY`, `outY = h1 + geo2.outY` when geo2 has
a point out (`FtileGeometryMerger.java:44-56`). A tile's `left` is its in/out
x: `pointIn = (left, inY)`, `pointOut = (left, outY)`
(`FtileGeometry.java:48-82`). Ours: `GtileTopDown` takes `width =
max(child.width)` and the walker places each child at `centerX -
child.width/2` (`tiles/gtile-top-down.ts:24-33`; `layout/tile-coordinates.ts`
`'gtile-top-down'` case), then links `child.getCoord(SOUTH_HOOK)` to
`next.getCoord(NORTH_HOOK)`. Every tile's `NORTH_HOOK.x` IS its `left`
(leaves: `width/2`; `GtileWhile`: the content centre; the three if tiles:
`diamond1`'s centre), so wherever `left != width/2` the link is diagonal —
101 baseline fixtures today (88 with an `if`, 13 with a `while`).

**(b) Trailing notes.** A note is a sibling `ActivityNode` in our AST
(`ast.ts`, `GtileNote` in the child list) but an ATTACHMENT in the jar's:
`FtileWithNotes#calculateDimensionFtile` keeps the wrapped tile's out state
(`vcompact/FtileWithNotes.java:202-210`), and `InstructionList` never holds
a note as an element. `GtileTopDown.hasPointOut` returns the LAST child's
state (`gtile-top-down.ts:56-66`), so a branch `[stop, note]` reports a point
out and the with-links builder draws a merge rhombus and out-connectors the
jar omits (`pifoni-76-duxa505`: ours 11 polygons vs the jar's 4).

## Fix

1. `GtileTopDown`: `left = max_i child_i.getCoord(NORTH_HOOK).x`; `width =
   max_i (left - child_i.left + child_i.width)`; a new `childOffsetsX[i] =
   left - child_i.left`; `height` and `childOffsets` (y) unchanged;
   `getCoord(NORTH_HOOK) = (left, firstChild.getCoord(NORTH_HOOK).y)` and
   `SOUTH_HOOK = (left, height)`; `EAST/WEST_HOOK` keep `height/2` with
   `x = width` / `0`. Empty top-down unchanged. Cite the merger per line.
2. `tile-coordinates.ts` top-down case: `childX = x + t.childOffsetsX[i]`
   instead of `centerX - child.width/2`; nothing else in the case changes
   (T6's link-after-both-endpoints order stays).
3. `GtileTopDown.hasPointOut`: the out state of the last child whose `kind`
   is not `'gtile-note'`; `true` when no such child exists (an empty
   sequence, `FtileEmpty.java:91-92`). Do NOT change `laneIn`/`laneOut`
   (`swimlane-lanes.ts`) here — journal whether they have the same
   trailing-note exposure, for T7 to file.
4. Do not touch any if/while/fork/repeat tile or walker: their `getCoord`
   hooks already ARE their `left`.

## Read-set

- `src/diagrams/activity/tiles/gtile-top-down.ts` (whole, ~70 lines)
- `src/diagrams/activity/layout/tile-coordinates.ts` (top-down case; the
  if/while cases only to confirm no change is needed)
- `src/diagrams/activity/tiles/tile.ts`, `points.ts`
- `src/diagrams/activity/tiles/gtile-while.ts:getCoord`,
  `gtile-if-with-links.ts:240-250`, `gtile-if-down.ts:274-282`
- `tests/diagrams/activity/tiles/gtile-top-down.test.ts`
- Java: `FtileAssemblySimple.java:56-141`; `FtileGeometryMerger.java:40-60`;
  `FtileGeometry.java:48-82,190-192`; `vcompact/FtileWithNotes.java:195-212`;
  `FtileEmpty.java:85-93`

## Write-set

`src/diagrams/activity/tiles/gtile-top-down.ts`;
`src/diagrams/activity/layout/tile-coordinates.ts` (top-down case only);
`tests/diagrams/activity/tiles/gtile-top-down.test.ts`,
`tests/diagrams/activity/layout/tile-coordinates.test.ts`,
`layout/tile-layout.test.ts`, `tests/unit/activity/layout.test.ts`,
`layout/compress/invariant.test.ts` — ONLY assertions the new geometry
breaks, re-asserted with a Java cite, never deleted (stop 12), per-file
counts journaled; `plans/activity-if-tile-port/measurements/t6b.json`;
journal rows; `docs/catalog.md` on drift.

## Acceptance criteria

- Given children `[start, if]` where the if's `left` is 20 px right of its
  `width/2`, when laid out, then the start sits so its centre x equals the
  if's `left`, and the link `start -> if` is a single vertical segment
- Given children with `left` values 10, 30, 15 and widths 40, 50, 30, then
  the top-down's `left` is 30 and its `width` is `max(30-10+40,
  30-30+50, 30-15+30) = 60` (`FtileGeometryMerger.java:44-49`)
- Given children of equal `left == width/2`, then every position and the
  width are byte-identical to before (no symmetric fixture moves)
- Given a branch `[stop, note]`, then the top-down has no point out; given
  `[action, note]`, it has one; given `[note]` alone, it has one
- Given `pifoni-76-duxa505`, when `--align` runs, then no `if-merge` node
  and no out-connectors are emitted (polygon count moves toward the jar's 4)
- Given the scratchpad `diag-scan.ts` (or an equivalent count of edge
  segments with both `dx` and `dy` non-zero) over all 268 baseline slugs,
  then the count of fixtures with a diagonal segment drops from 101 to 0,
  or every remaining one is named with its mechanism
- Given `measurements/t6b.json` vs `final.json`, then every mover contains
  an `if` or `while` whose `left != width/2` or a trailing-note branch, and
  every riser has a journal row with its mechanism
- Given `invariant.test.ts`, then `hardViolations` is empty and the two
  allowed lists are re-attributed per entry (stop 8)

## Observability / Rollback

N/A — no new observable operations / **Reversible.**

## Quality bar

`typecheck`, `lint`, `build` exit 0; targeted tests green; `npm test` is run
by the orchestrator (red only on the four activity oracle gates, on
`fixtures.md` slugs plus this task's journaled list). `git diff --name-only
HEAD~1` = write-set only.

## Commit

`fix(aitp-T6b): align top-down siblings on left and ignore trailing notes`
