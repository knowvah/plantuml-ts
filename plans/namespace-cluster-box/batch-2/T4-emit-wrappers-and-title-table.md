# T4 — emit protection wrappers and the HTML title table for class clusters

## Context

Jar's DOT for `cidepu-54-bemo048`:

```
subgraph cluster6p0 {label="";subgraph cluster6 {style=solid;color="#000006";
labeljust="c";label=<<TABLE FIXEDSIZE="TRUE" WIDTH="29" HEIGHT="9"><TR><TD></TD></TR></TABLE>>;
subgraph cluster6p1 {label="";
  ... members ...
}}}
```

Ours:

```
subgraph cluster0 {style=solid;color="#000006";label="";
```

Two things missing: the `p0`/`p1` protection wrappers (and `a`/`i` at level
2), and the HTML title table. Both matter because each `subgraph cluster*`
level adds graphviz's 8pt `CL_OFFSET` inside the box, and the title table is
what reserves the title band — together they decide where the cluster
polygon lands, which is the value the whole mission depends on.

The machinery already exists and is shared. `graph-layout-build.ts#addClusters`
(around `:320-390`) emits `a`/`p0`/`i`/`p1` and the title table **when the
input cluster carries `innerMarginLevels` and `titleTableWidth`/`Height`**,
and `svek-dot-emit-clusters.ts` is the emitter half. `class-dot-graph.ts
#buildDotClusters:84-104` sets neither. This task is wiring, not new
mechanism.

## Task

In `buildDotClusters`, set on each cluster:

- `innerMarginLevels` from T2's `clusterWrapperLevel`
- `titleTableWidth` / `titleTableHeight` from the measured title, using T3's
  shared `computeTitleTableHeight`

Both dims are `(int)`-truncated by jar at `ClusterDotString.java:124` via
`SvekEdge.appendTable`'s own casts (`SvekEdge.java:504-507`). The builder
already applies `Math.floor`; supply real numbers and let it truncate — do
not pre-round.

Then extend `tests/oracle/wrapper-parity.test.ts`, which today covers state
only, to assert the class emitter and the class layout builder agree on
wrapper levels. Mirror the shape of `tests/oracle/declaration-order-parity.test.ts`.

Also expose the namespace-id to cluster-id mapping that `buildDotClusters`
already computes internally (`clusterIdByNs`), returning it alongside
`anchors` from `buildDotGraph`. T5 needs it to look a namespace up in
`DotLayoutResult.clusters`, which is keyed by our synthetic `clusterN`.

## Write-set

- `src/diagrams/class/class-dot-graph.ts`
- `tests/oracle/wrapper-parity.test.ts`

## Read-set

- `src/diagrams/class/class-dot-graph.ts:76-104` — `buildDotClusters`
- `src/diagrams/class/class-dot-graph.ts:393-400` — the `buildDotGraph` return
- `src/core/graph-layout-build.ts:320-390` — what consumes the two fields
- `src/core/svek-dot-wrappers.ts:44-76`
- `src/diagrams/state/layout-dot-tree.ts` — `buildDotClusters`, the worked
  example that already sets both fields
- `tests/oracle/wrapper-parity.test.ts`
- `test-results/dot-cache/class/cidepu-54-bemo048/svek-1.dot` — ground truth

## Interface contracts

Consumed by T5:

```ts
// added to buildDotGraph's return
clusterIdByNs: Map<string, string>;   // ns.id -> "cluster0" | "cluster1" | ...
```

## Acceptance criteria

- Given a class package, when the DOT is emitted, then it carries the
  wrapper subgraphs for its derived level and an HTML title table, matching
  the shape of the cached oracle for that fixture.
- Given `cidepu-54-bemo048`, when our emitted DOT is compared with
  `svek-1.dot`, then the wrapper nesting matches (`p0` / base / `p1`) and the
  title table dims match jar's `WIDTH="29" HEIGHT="9"`.
- Given the class emitter and the class layout builder, when
  `wrapper-parity.test.ts` runs, then both report the same wrapper levels for
  every cached class fixture.
- Given the class DOT-parity ratchet, when it runs, then it is still 712/712.
- Given T1's harness, when it runs, then the numbers are recorded in the
  decision journal — **a dip here is expected and is not a stop** (see
  `batch-2/overview.md`).

## Observability requirements

N/A — no new observable operations. T1's harness is the measurement.

## Rollback

Reversible.

## Quality bar

All four gates green. Never pipe `npm test`.

## Boundaries

- **Always:** reuse `wrapperLevels` and `addClusters`. If you find yourself
  writing subgraph-emission code, stop — it exists.
- **Ask first:** if the title table needs a width the class engine cannot
  measure without new plumbing, that is a scope change; log it and stop.
- **Never:** change `src/core/svek-dot-wrappers.ts` or
  `graph-layout-build.ts` — they are correct and shared with state. If they
  seem wrong, that is a STOP, not an edit.
- **Never:** run any git command.
