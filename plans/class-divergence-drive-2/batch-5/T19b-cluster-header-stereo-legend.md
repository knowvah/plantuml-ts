# T19b — cluster header: displayed stereotype and per-container legend

**Agent:** typescript-pro (opus, effort high) · **Depends on:** T18 ·
parallel with T19a, T19c (disjoint write-sets, worktrees).
Prompt = [`../fix-task.md`](../fix-task.md) + this file.

## Fixtures

xenere-07-kuji864, sijoba-16-rari847 (b4: 8/212, 9/224; first diffs:
`g[1]/g[1]/text[1]` exp `«st»` italic vs act `pack1` bold — the cluster
header's stereotype line is missing).

## Mechanisms

- **Cluster header stereo + legend** (T7b artifact, `.agent-notes/cdd2-T7b.md`,
  journal row 19). Upstream `svek/ClusterHeader.java:173-180`
  `getStereoBlock` merges the group's DISPLAYED stereotype
  (`CommandPackageWithUSymbol.java:204-206` `p.setStereotype(...)`; also
  plain `package <<st>>`) with the group's own legend
  (`abel/Entity.java:101,551-557`, set by a `legend ... end legend`
  written inside the container body) into the cluster header. Ours:
  `class-namespace-usymbol-shape.ts#buildDecoration` passes an empty
  stereotype block, and legends are one global `state.ast.annotations.legend`
  (no `Namespace.legend`). Both the folder (`pack1`) and USymbol
  (`rectangle pack2 <<ddd>>`) paths share the header. Port
  `ClusterHeader` (the whole header block builder) and the per-group
  legend storage; read `CommandLegend`-family Java for how a legend inside
  a group is attached.

## Write-set

`src/diagrams/class/class-namespace-usymbol-shape.ts`,
`class-namespace-shape.ts`, `class-namespace-title-table.ts` (and any
`class-namespace-title*.ts`), `class-container.ts`, `ast.ts`
(`Namespace` fields only), `parser.ts` (legend routing only), a new
`class-cluster-header.ts`, tests beside each, `.agent-notes/cdd2-T19b.md`.

## Acceptance criteria

- Given xenere and sijoba, when rendered, then structural diffs are 0 and
  the remaining numerics are attributed
- Given a class diagram with a top-level legend, when rendered, then
  unchanged (the global legend path keeps working)
- Given the 601 conformant class fixtures, when render-all runs, then none
  leaves conformant

## Observability · Rollback

N/A. Reversible.
