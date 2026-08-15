# Batch 3 — model class-side `port` declarations

Independent of batches 1–2: different subsystem, no shared write-set. Last only
because it is separable — it could be lifted into its own mission without
touching the label work.

## The gap

`class/sokevu-87-toce485` declares ports inside a node:

```
interface i
node n {
  port p
  port firstportname
  port "name-with-dash" as nwd
}
```

The jar emits every port endpoint with the `:P` compass suffix
(`sh0013:h->sh0010:P`) and chains the ports with
`sh0010->sh0011->sh0012 [arrowhead=none];` followed by `sh0012->zaent0002;` —
`ClusterDotString.printRanks`' rank-chain.

This port's graph carries `isPort: undefined` on all three port nodes and
`portRanks: null` on their cluster. Both signals already exist in
`DotInputNode`/`DotInputCluster` and are already honoured by the emitter
(`svek-dot-emit.ts#edgeRef`, `#portChainLines`) — the class engine simply never
sets them.

**An earlier note claimed "4 edges where the oracle has 6". That was a
miscount** — two of the oracle's six `->` lines are the rank-chain, not edges.
Real edge counts match at 4. Corrected in
`core/graph-layout-build-constraint.ts`'s header.

## Tasks

| id | task | write-set |
|---|---|---|
| [x] T8 | Mark class-side port declarations `isPort` — **landed by SI17** (`class-port-rows.ts#shouldMarkPort`), not by this mission; pinned here (`225107c0`) | `src/diagrams/class/class-dot-graph.ts`, the classifier AST |
| [x] T9 | Emit the cluster's port rank-chain — **landed by SI17**; `sokevu` drill-down shows `sh0010->sh0011->sh0012 [arrowhead=none]` + `constraint=false`, `structurallyEqual` | `src/diagrams/class/class-dot-graph.ts` |
| [x] T10 | Close-out: mission-index row (SI22), comparator widening (D7, `d3ff29be`), journal summary — 2026-08-15 | `planning/mission-index.md`, `tests/oracle/svek-dot.ts` |

## Exit signal

`sokevu`'s `constraint=false` appears **with no change to
`core/graph-layout-build-constraint.ts`**. The same-container predicate already
matches two `isPort` nodes in one cluster; verified against
`state/fukexa-85-cuvi894`, where it fires on both same-cluster port pairs and
correctly does not fire on the pair spanning two clusters.

If it does not follow, STOP (D5) — that would mean the predicate is wrong, and
the state fixtures say it is not.

## Watch-outs

- `sokevu` is **not pinned** in `oracle/goldens/`, so no gate reports it. Add
  a DOT-parity golden as part of this batch or the work is unguarded.
- `port "name-with-dash" as nwd` — the quoted-with-alias form is in the
  fixture on purpose. Do not assume identifier-safe port names.
- The rank-chain terminates at a `zaent` anchor. Check
  `svek-dot-emit.ts#portChainLines` for the exact shape before generating it;
  it is already implemented for the engines that populate `portRanks`.
- T10's comparator widening (D7) must be proven to discriminate: disable
  emission, watch it fail, then restore.
