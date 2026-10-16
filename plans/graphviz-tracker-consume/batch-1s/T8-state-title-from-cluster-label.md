# T8 — item 14: state composite title Y from `clusters[].label` (D3)

Prepend [../task-preamble.md](../task-preamble.md). Worktree `gtc-S`. Depends on T7b.

## Context
Upstream reads the title position from graphviz: `DotStringFactory#solve`
(`DotStringFactory.java:436-439`) calls `cluster.setTitlePosition(getMinXY(pointsTitle))`
(`Cluster.java:274`), and `drawUState` draws at `xyTitle.getY()` (`Cluster.java:497`). Ours re-derives
the Y from a fixed `CLUSTER_TITLE_BASELINE_MARGIN = 4` (`src/diagrams/state/state-composite-cluster.ts`).
`svekClusterTitle` (`src/core/graph-layout-svek-read.ts:194`) already publishes
`clusters[].label = {x, y (centre), width, height}` on the layout snapshot, read the way `solve` reads it.
Keep these paths as they are:
- the border-point family (`BORDER_POINT_TITLE_BASELINE_MARGIN`, `Cluster.java:435`)
- the swimlane `drawSwinLinesState` x path (`Cluster.java:439`) unless it is in scope of the same seam
- class/description packages (`USymbolFolder.java:228`)

## Task
1. Trace how the state layout's cluster snapshot reaches `state-composite-cluster.ts`; if the label is
   dropped on the way, carry it through within `src/diagrams/state/**`.
2. Compute the title Y as the label rect's min Y (`label.y - label.height / 2`), then add whatever
   `drawUState` adds after `xyTitle.getY()` (read `Cluster.java:450-500` and quote it).
3. Remove the re-derivation constant, or keep it only where a family still needs it, with the Java cited.
4. Unit test: given a snapshot with a label rect, the title baseline equals the jar-derived value. If
   the label is absent, it falls back to what upstream does when `xyTitle` is null (quote it).

## Write-set
`src/diagrams/state/**`, `tests/unit/state/**`. Needing `src/core/**` is stop 1.

## Acceptance
- Given a ClusterHeader-family composite, when laid out, then the title Y comes from `clusters[].label`,
  and `CLUSTER_TITLE_BASELINE_MARGIN` no longer feeds it.
- Given the state survey and the state golden ratchet, then there are zero conformant losses and the ratchet
  is green.
- Given the state census, then no attribute moves away from the jar. Any mover toward the jar is reported.

**Observability:** N/A. **Rollback:** reversible.
