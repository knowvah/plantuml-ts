# T2 — emit edges in swimlane pass order

**Agent:** `typescript-pro` · **Depends on:** T1

## Context

Faithful TypeScript port of PlantUML; the Java is the spec (quote `file:line`;
every ported symbol carries a JSDoc `@see`). Read
[`../README.md`](../README.md) (stops 4–9, red allowance),
[`../decisions.md`](../decisions.md) D1, D2, D3, D6 (locked) and
`.agent-notes/aedo-T1.md` (Q1's `passOf` contract, Q2's numbers).

Upstream draws the whole diagram once per lane through
`UGraphicInterceptorOneSwimlane`, which admits a `Connection` only when both
ends are in that lane or null (`ftile/vcompact/UGraphicInterceptorOneSwimlane
.java:92-103`), then runs a final `Cross` pass admitting only connections
whose ends differ (`ftile/Swimlanes.java:178-216`, called at `:350-352`).
Passes run in declaration order (`:116-124`, D3). Because connections are
buffered Snakes flushed at the end (`svek/UGraphicForSnake.java:137-165`),
this ordering applies to the edge run only — node order is untouched.

Ours emits every edge in walk order. D1: fix it as the LAST step of
`assignCoordinatesFull` (`layout/assign-coordinates-full.ts:182-213`),
permuting `geometry.edges` and `edgeMeta` together — they are read by index
by `compressGeometry` and `shapesOf` (`compress/shapes-of.ts:376-377`).

## Task

Tests first, in the new `edge-draw-order.test.ts`. Then the module, then the
single wiring change. Follow T1's `passOf` rule literally.

## Read-set

- `.agent-notes/aedo-T1.md#q1` — the pass-membership rule (authoritative)
- `src/diagrams/activity/layout/assign-coordinates-full.ts:182-213`
- `src/diagrams/activity/layout/swimlane-placement.ts:63-70` (`EdgeMeta`)
- `src/diagrams/activity/layout/compress/shapes-of.ts:370-382`
- `tests/diagrams/activity/layout/compress/invariant.test.ts:210-280`
  (`ALLOWED_NEW_OVERLAPS`, `hardViolations`)

## Write-set

`src/diagrams/activity/layout/edge-draw-order.ts` (new);
`src/diagrams/activity/layout/assign-coordinates-full.ts`;
`tests/diagrams/activity/layout/edge-draw-order.test.ts` (new);
`tests/diagrams/activity/layout/compress/invariant.test.ts`;
`tests/diagrams/activity/layout/tile-coordinates.test.ts` and
`tests/unit/activity/layout.test.ts` — ONLY assertions the new order breaks,
reordered never deleted (stop 12), with a per-file count journaled;
`plans/activity-edge-draw-order/measurements/t2.json`;
`plans/activity-edge-draw-order/decision-journal.md` (rows);
`docs/catalog.md` on drift.

## Interface contract (consumed by T3 and T4)

```ts
/** Index order in which edges are drawn: each lane's own edges in
 *  declaration order, then every cross-lane edge in walk order. */
export function lanePassOrder(meta: readonly EdgeMeta[], laneNames: readonly string[]): number[];

/** Applies one index order to both arrays, keeping them aligned. */
export function applyEdgeDrawOrder<T>(
  edges: readonly T[],
  meta: readonly EdgeMeta[],
  order: readonly number[],
): { edges: T[]; edgeMeta: EdgeMeta[] };
```

## Acceptance criteria

- Given meta `[A→A, A→B, B→B, A→A]` and lanes `[A, B]`, when `lanePassOrder`
  runs, then it returns `[0, 3, 2, 1]`
- Given `laneNames` empty or one lane, then `lanePassOrder` returns the
  identity order and no non-laned fixture's score changes
- Given any fixture, then after the permutation `edges[i]` still describes
  the edge whose lanes are `edgeMeta[i]` (assert on a laned fixture with at
  least one cross-lane edge)
- Given T1's Q1 rule, then a lane-less edge lands in the pass T1 named
- Given the probe against `measurements/base.json`, then every changed slug
  is a `fixtures.md` row with a `b` delta, and every riser has a journal row
  before the commit
- Given `invariant.test.ts`, then `hardViolations` is empty and
  `ALLOWED_NEW_OVERLAPS` equals the exact new list, each entry carrying its
  per-entry Java cite

## Observability / Rollback

N/A — no new observable operations / **Reversible.**

## Quality bar

`typecheck`, `lint`, `build` exit 0. `npm test` green except the four
activity oracle gates on journaled `fixtures.md` slugs — report each red file
with its slug count. `git diff --name-only HEAD~1` = write-set only. Stage
explicit paths; never `git add -A`.

## Commit

`fix(aedo-T2): draw activity edges in swimlane pass order`
