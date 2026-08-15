# T4 — Builder: mirror the same insertion order

## Context

`src/core/graph-layout-build.ts` is the OTHER consumer of `DotInputGraph` — it
builds the graph handed to `@knowvah/dot-engine`. It is a separate code path from
the DOT-text emitter, and four defects in this area were divergences between the
two.

T3 changed the emitter's declaration order. Order reaches geometry: graphviz's
cycle-breaking DFS roots at the first node encountered, so the builder's insertion
order must match or the two paths lay out different graphs.

**This is the highest-risk task in the mission.** `graph-layout-build.ts` is
shared by every diagram type.

## Task

Register nodes and edges with the builder in the same order T3 emits them:
`lines0` edges (and the endpoints they implicitly create) first, then the
remaining nodes and clusters, then `lines1` edges.

`reorderNodes` (G7 T16) already implements part of this reasoning — extend it
rather than adding a parallel mechanism.

## Write-set

- `src/core/graph-layout-build.ts`
- `src/core/graph-layout-build-edges.ts`
- `tests/unit/core/graph-layout.test.ts`

## Read-set

- `src/core/graph-layout-build.ts:57-110` — `reorderNodes` and its derivation
- `batch-2/T3-emitter-anchor-and-order.md#interface-contracts` — the order to mirror
- `~/git/plantuml/.../svek/DotStringFactory.java:187-198`
- [decisions.md](../decisions.md) ADR-3, ADR-5

## Architecture decisions (locked)

- Builder and emitter change together (ADR-3). If the census moves in a direction
  T3's DOT text does not explain, STOP — that means the two paths still disagree.

## Interface contracts

Consumes T3's `SvekEmitOrder`. The builder has no implicit-node-creation phase, so
reproduce the EFFECTIVE first-encountered order, not the literal text.

## Acceptance criteria

- Given a graph with `minlen=0` edges, when building, then their endpoints are
  registered before any other node.
- Given all five diagram types, when the census runs, then no fixture's diff count
  rises.
- Given the state corpus, when the census runs, then the 46 order-divergent
  fixtures show a net improvement.

## Observability requirements

N/A — no new observable operations.

## Rollback

Reversible — single commit. If a regression is found after the fact, revert this
task alone; T3 is independently valid (DOT text only).

## Quality bar

All four gates green. **Full census on class, object, component, usecase and
state** — this task touches the shared layout path.

## Commit

`feat(T4): mirror jar's node/edge insertion order on the layout path`
