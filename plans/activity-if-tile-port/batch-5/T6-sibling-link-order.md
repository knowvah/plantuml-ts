# T6 — push the sibling link after both endpoints

**Agent:** `typescript-pro` · **Depends on:** T5

## Context

Faithful TypeScript port of PlantUML; the Java is the spec (quote
`file:line`). Read [`../README.md`](../README.md) (stops 5, 6, 12),
[`../decisions.md`](../decisions.md) D7 (locked), and
`.agent-notes/aicdo-planning.md` ("the jar draws EVERY sibling link after
BOTH endpoints").

`FtileFactoryDelegatorAssembly#assembly` wraps `FtileAssemblySimple(tile1,
tile2)` and ADDS the `ConnectionVerticalDown` around it with
`FtileUtils.addConnection(result, connection)`
(`vcompact/FtileFactoryDelegatorAssembly.java:57-79`);
`FtileAssemblySimple#drawU` draws only the two tiles
(`FtileAssemblySimple.java:108-112`) and `FtileWithConnection#drawU` draws
its delegate before its connections (`FtileWithConnection.java:69-74`). A
sequence `a, X, c` therefore emits `X's internal edges, a->X, c's internal
edges, X->c`. Ours pushes `a->X` before walking `X`
(`tile-coordinates.ts:162-180`: `walkTile(child)` then the link to
`next`, then the loop walks `next`).

**Fix.** In the `'gtile-top-down'` case, walk child i+1 first, then push
the link i->i+1 (equivalently: push the link to child i from child i-1
AFTER `walkTile(child i)`). Points, lanes, `edgeMeta`, count: unchanged;
only positions in the arrays move (stop 9: `edges` and `edgeMeta` move
together because `pushEdge` pushes both).

## Read-set

- `src/diagrams/activity/layout/tile-coordinates.ts:158-182`
- `src/diagrams/activity/layout/edge-draw-order.ts:88-107` (why the lane
  sort preserves this order within a pass)
- `tests/diagrams/activity/layout/compress/invariant.test.ts` (index-based
  overlap list)

## Write-set

`src/diagrams/activity/layout/tile-coordinates.ts` (top-down case);
`tests/diagrams/activity/layout/tile-coordinates.test.ts`,
`tile-layout.test.ts`, `swimlane-placement.test.ts`,
`compress/compress-geometry.test.ts`, `compress/invariant.test.ts` — ONLY
assertions the new order breaks, reordered never deleted (stop 12), with a
per-file count journaled; `plans/activity-if-tile-port/measurements/
t6.json`; journal rows (including the FULL mover list, since stop 6's
`fixtures.md` bound does not apply to this rule).

## Acceptance criteria

- Given `a, X, c` where `X` is an if/while/repeat/fork, when laid out, then
  the edge run reads X's internal edges, `a->X`, c's internal edges (if
  any), `X->c`
- Given a top-down of leaves only, then the edge run is unchanged
- Given every edge, then its points, lanes and shape tag are byte-identical
  to T5's for the same connector — only the array position changes
- Given `measurements/t6.json` vs `t5.json`, then every mover contains a
  compound with internal edges, and every riser has a journal row
- Given `invariant.test.ts`, then `hardViolations` is empty and
  `ALLOWED_NEW_OVERLAPS` is re-listed with per-entry Java cites (stop 8)

## Observability / Rollback

N/A — no new observable operations / **Reversible.**

## Quality bar

`typecheck`, `lint`, `build` exit 0. `npm test` green except the four
activity oracle gates on journaled slugs. `git diff --name-only HEAD~1` =
write-set only.

## Commit

`fix(aitp-T6): draw a sibling link after both of its endpoints`
