# Component map — what G6 touches

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "src/diagrams/state/" {
  [state-composite-cluster.ts\ntitleTableEligible · title height (T7)\nborder-point gate (T9)] as SCC
  [state-composite-sizing.ts\nWithLabel port-block sizing (T9)] as SCS
  [state-dot-graph.ts\nborder-point rank-chain DOT (T9)] as SDG
  [renderer-group.ts /\nrenderer-composite-box.ts\nclass attr (T3)] as RG
  [state-render-colors.ts\nstyle cascade consumption (T4)] as SRC
}

package "src/core/" {
  [graph-layout-build.ts\nvertical margin, if seam-side (T2)] as GLB
  [graph-layout.types.ts\nDotInputCluster seam fields (T2/T7)] as GLT
  [skinparam.ts\nstyle-block selectors (T4)] as SKP
}

[graphviz-ts (pinned .tgz)\nrank-sep fix, if library-side (T2)] as GVTS
[oracle/goldens/state/\npins + size-backlog.json (T5/T7/T10)] as ORACLE

SCC --> GLB : DotInputCluster
GLB --> GVTS : DOT
SDG --> GLB : DOT shape
SKP --> SRC
SRC --> RG
SCC --> SCS
RG ..> ORACLE : byte-compare
@enduml
```

Read-only references: `~/git/plantuml` (svek Cluster/ClusterHeader,
EntityImageStateBorder, net/atmp), `~/git/graphviz/lib/dotgen/
position.c` (cluster rank-sep).
