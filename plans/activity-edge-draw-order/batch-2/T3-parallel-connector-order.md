# T3 — push every in-connector, then every out-connector

**Agent:** `typescript-pro` · **Depends on:** T2

## Context

Faithful TypeScript port of PlantUML; the Java is the spec (quote `file:line`;
JSDoc `@see` on ported symbols). Read [`../README.md`](../README.md) (stops
4–9, 12, red allowance), [`../decisions.md`](../decisions.md) D4, D6
(locked), `.agent-notes/aedo-T1.md` (Q2, Q5) and T2's commit.

Upstream builds a parallel as `doStep2(inner, doStep1(inner))`
(`ftile/vcompact/AbstractParallelFtilesBuilder.java:166-169`). `doStep1`
collects one `ConnectionIn` per branch and wraps the result
(`ParallelBuilderSplit.java:79-111`; `ParallelBuilderFork#doStep1` the same
shape), and `doStep2` collects one `ConnectionOut` per branch that
`hasPointOut()` (`ParallelBuilderSplit.java:136-179`;
`ParallelBuilderFork#doStep2`). `FtileWithConnection.drawU` draws its
delegate before its own connections (`ftile/FtileWithConnection.java:69-74`).
So the jar's edge run for a parallel is: every branch's internal edges, then
every in-connector, then every out-connector.

Ours walks a branch and immediately pushes that branch's in- and
out-connector (`layout/walk-fork-branches.ts:81-109,121-129`).

**Fix:** `walkForkBranches` runs three loops — walk every branch, then push
every in-connector, then push every out-connector (branches with
`hasPointOut()` only). Lanes, coordinates and counts are unchanged: the
in-connector keeps `ctx.myLane` → `laneIn(branch, ctx.myLane)` and the
out-connector `laneOut(branch, ctx.myLane)` → `ctx.myLaneOut`. Node order is
untouched (top bar, branches, join bar already match, `:208-220`).

## Read-set

- `src/diagrams/activity/layout/walk-fork-branches.ts:74-129`
- `.agent-notes/aedo-T1.md#q5` — whether `misiji`'s +32 survives T2
- `tests/diagrams/activity/layout/compress/invariant.test.ts:210-280`

## Write-set

`src/diagrams/activity/layout/walk-fork-branches.ts`;
`tests/diagrams/activity/layout/tile-layout.test.ts`,
`tile-coordinates.test.ts`, `swimlane-placement.test.ts`,
`compress/compress-geometry.test.ts`, `compress/invariant.test.ts` — ONLY
assertions the new order breaks, reordered never deleted (stop 12), with a
per-file count journaled;
`plans/activity-edge-draw-order/measurements/t3.json`;
`plans/activity-edge-draw-order/decision-journal.md` (rows);
`docs/catalog.md` on drift.

## Acceptance criteria

- Given a 3-branch split, when laid out, then its edges read: every branch's
  internal edges, then in-connectors 1, 2, 3, then out-connectors 1, 2, 3
- Given a fork whose second branch ends in `detach`/`kill`, then that branch
  contributes no out-connector and the remaining out-connectors keep source
  order
- Given a fork and a split with identical branch shapes, then both orders
  match (D4 applies to `ParallelBuilderFork` and `ParallelBuilderSplit`)
- Given every edge, then its points, lanes and shape tag are byte-identical
  to T2's for the same connector — only the array position changes
- Given the probe against `measurements/t2.json`, then every changed slug is
  a split or fork row of `fixtures.md`, and every riser has a journal row
  before the commit
- Given `invariant.test.ts`, then `hardViolations` is empty and
  `ALLOWED_NEW_OVERLAPS` equals the exact remaining list, each entry
  re-attributed with a Java cite (stop 8)

## Observability / Rollback

N/A — no new observable operations / **Reversible.**

## Quality bar

`typecheck`, `lint`, `build` exit 0. `npm test` green except the four
activity oracle gates on journaled `fixtures.md` slugs — report each red file
with its slug count. `git diff --name-only HEAD~1` = write-set only. Stage
explicit paths; never `git add -A`.

## Commit

`fix(aedo-T3): draw parallel in-connectors before out-connectors`
