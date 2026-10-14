# T3 — description wrappers, plain family

Prepend [../task-preamble.md](../task-preamble.md). Spawn this agent with the name **`dsw-wrappers`**:
T4 resumes it via `SendMessage` with its context intact.

## Task
Make description's `buildDotClusters` hand the layout builder (and the DOT emitter) the jar's protection
nesting and title TABLE for every **non-port, non-kermor** group (decisions.md D5, D6 plain family).
The core builder already honours these fields for class/state; this task only populates them.

## Write-set
- `src/diagrams/description/layout-dot-tree.ts`: `buildDotClusters` (`:237-266`)
- `src/diagrams/description/layout.ts`: `runLayout` (`:128-210`) threads `theme`/`measurer` (and
  `edgeDotBuild.groupAnchorClusterIds`) into `buildDotClusters`
- `tests/unit/description/description-svek-wrappers.test.ts` (new)

## Read-set
- `decisions.md#d5`, `#d6`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDotString.java:85-204,299-314`.
  Quote `:91-99` (link to group → `a`/`i`), `:107-116` (protection), `:122-125` (label TABLE) and
  `:146-155` (special point before `i`/`p1`) in your commit body.
- `src/core/svek-dot-wrappers.ts` (whole), `src/core/graph-layout-cluster.types.ts:60-170`
- `src/core/graph-layout-build.ts:240-300,370-440,475-500` (how `innerMarginLevels`, `unwrappedNodeId`
  and `titleTable*` are consumed). **Read-only** (stop 7).
- `src/diagrams/class/class-dot-clusters.ts:120-186`: the class precedent, field by field
- `src/diagrams/description/description-cluster-header.ts` (T1c)
- `src/diagrams/description/layout-dot-tree.ts:100-160` (group anchor nodes, `groupAnchorNodeId`)

## Interface contract (input)
`descriptionClusterTitleTable(container, theme, measurer)` from T1c; `layoutParity` from T1a.

## Acceptance
- Given `unknown/bamami-10-lava790`, when rendered and captured, then `layoutParity` is `equal`, and
  the emitted svek DOT (`toSvekDot`) has `cluster<N>p0 > cluster<N>` with `TABLE … WIDTH="17" HEIGHT="23"`
  `> cluster<N>p1`.
- Given `unknown/xagonu-36-sudi116`, then `layoutParity.firstDiff` is absent or past `clusterTree`
  (43 clusters on both sides).
- Given a group that is a link endpoint, then `innerMarginLevels === 2` and the anchor is
  `unwrappedNodeId`, not in `nodeIds`. Pin this against a cached jar DOT with a `cluster<N>a` subgraph
  (`grep -l 'a {label' test-results/dot-cache/component/*/svek-1.dot`).
- Given bobixe, pugodi, rufopi and zosuje, then report layoutParity and render-diff before → after. Any
  row that gets worse in render-diff needs a stated mechanism.
- Given every row in `oracle/goldens/svg-description/ratchet.json`, then the ratchet stays green (none has
  a `p0` group, so none should move). A mover is stop 4.
- Port-child clusters (`portRanksByCluster` non-empty) and `kermor` are left **unchanged** here (T4).
  Assert that in a test.

**Observability:** N/A. **Rollback:** Reversible.
