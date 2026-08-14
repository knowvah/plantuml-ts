# T1 — Emit the `a`/`p0`/`i`/`p1` wrapper subgraphs

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the specification. `src/core/svek-dot-emit.ts` serializes a
`DotInputGraph` into the DOT text PlantUML's Svek feeds graphviz. It is used for
**parity inspection only** — it is NOT on the layout path.

Jar wraps each logical cluster in up to four nested protection subgraphs. We emit
only the base, on 56 of 267 state fixtures.

## Task

Emit the wrapper subgraphs, in jar's order: `a`, `p0`, base `cluster<color>`,
`i`, `p1`.

**Mirror the builder's existing conditions — do not re-derive them.**
`graph-layout-build.ts` already computes this correctly via
`DotInputCluster.innerMarginLevels`, including the border-point suppression.
Read that logic and reuse the same input fields.

## Write-set

- `src/core/svek-dot-emit.ts`
- `tests/unit/core/svek-dot-emit.test.ts`

## Read-set

- `src/core/graph-layout-build.ts:366-430` — the `innerMarginLevels` conditions to mirror
- `src/core/graph-layout-build.ts:479-486` — the border-point suppression already implemented
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDotString.java:94-158`
- `test-results/dot-cache/state/bupani-17-puxi938/svek-1.dot` — the oracle
- [decisions.md](../decisions.md) ADR-2, ADR-5

## Architecture decisions (locked)

- Emitter only. Do NOT touch `graph-layout-build.ts` — it is already correct.
- If this task appears to require a builder change, that contradicts ADR-2: STOP.

## Interface contracts

Produces, consumed by T2:

```ts
/** Which wrapper levels a cluster gets, per ClusterDotString.java:94-158. */
interface WrapperLevels {
  a: boolean;   // thereALinkFromOrToGroup1
  p0: boolean;  // protection0(type), false if the cluster has border points
  i: boolean;   // thereALinkFromOrToGroup1
  p1: boolean;  // protection1(type), false if the cluster has border points
}
```

Export it so T2 can call the same function both paths use.

## Acceptance criteria

- Given a cluster with a link from/to the group, when emitting DOT, then both `a`
  and `i` wrappers appear.
- Given a cluster with at least one border point, when emitting DOT, then `p0`
  and `p1` are **suppressed** (`ClusterDotString.java:109-113`).
- Given `bupani-17-puxi938`, when emitting, then exactly 5 cluster subgraphs
  appear, in the order `a p0 base i p1`.
- Given `temuxi-28-cega322` (every cluster pin-bearing), when emitting, then the
  cluster count stays 8.

## Observability requirements

N/A — no new observable operations. But **record the wall-clock of
`npx tsx scripts/svg-conformance-census.ts component usecase state` on the first
run** into the decision journal; no baseline exists and this is the one task that
could plausibly add layout cost.

## Rollback

Reversible — single commit, no persisted state.

## Quality bar

All four gates green. Then both censuses; batch 1's must be **neutral**. A
non-neutral census is a STOP, not something to patch.

## Commit

`feat(T1): emit jar's cluster protection wrappers in the svek DOT`
