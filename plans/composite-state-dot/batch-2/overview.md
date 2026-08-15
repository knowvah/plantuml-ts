# Batch 2 — declaration order + the `za` anchor

**The only batch that can move conformance, and the only one that can regress
it.** It changes `graph-layout-build.ts`, which every diagram type routes
through. See [decisions.md](../decisions.md) ADR-3, ADR-4.

## The gap

Two divergences at the same emission site:

1. **Declaration order (46 fixtures).** Jar prints its `minlen==0` edge batch
   (`lines0`) BEFORE any node declaration; we print nodes first. In real DOT
   text a `lines0` edge statement implicitly creates its endpoints, so graphviz's
   cycle-breaking DFS (`dotgen/acyclic.c`, run before rank assignment) roots at a
   different node — which can pick a different back-edge for any pass whose edge
   set contains a cycle.
2. **The `za` anchor.** Jar emits the group anchor as
   `Cluster.getSpecialPointId(group)` = `"za" + uid`
   (`Cluster.java:104,653`; emitted at `ClusterDotString.java:~150`, gated on
   `thereALinkFromOrToGroup2`), INSIDE the base cluster block. We emit it as a
   regular `sh####` at the top of the file, which also consumes an `sh` number
   jar never allocates, shifting every subsequent id.

Node counts match on 264/267, so the anchor already exists — this is identity and
position, not a missing node.

## Tasks

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3 | Emitter: `za` identity + anchor position + `lines0` ordering | typescript-pro | `src/core/svek-dot-emit.ts`, `src/core/svek-dot-sequence.ts`, `tests/unit/core/svek-dot-emit.test.ts` | — | [x] |
| T4 | Builder: mirror the same insertion order | typescript-pro | `src/core/graph-layout-build.ts`, `src/core/graph-layout-build-edges.ts`, `tests/unit/core/graph-layout.test.ts` | T3 | [x] |

T3 and T1 both write `svek-dot-emit.ts`, which is why they are in different
batches. Do not merge them: T1 is census-neutral and T3 is not.

## Exit bar

The SVG census improves with **no fixture rising**, on all five diagram types.
`graph-layout-build.ts` is shared, so class/object and component/usecase must be
censused too — not just state.
