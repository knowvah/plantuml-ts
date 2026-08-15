# Data flow — how a package box is produced

## Today, and after the mission

The break is at step 6: the box is invented rather than read. Everything
before it is already correct except the two missing DOT attributes.

```plantuml
@startuml
title Package box: today (red) vs after the mission (green)

participant "class-dot-graph\nbuildDotClusters" as B
participant "graph-layout-build\naddClusters" as A
participant "dot-engine" as E
participant "graph-layout\nmapClusters" as M
participant "class-geo-builders\nbuildNamespaceGeos" as G
participant "class-ink-box\n+ renderer" as R

B -> A : DotInputCluster\n(id, nodeIds, label, parentId)
note right of B #FFD9D9
  T4 adds the two missing fields:
  innerMarginLevels (from T2)
  titleTableWidth / Height (from T3)
end note

A -> E : subgraph clusterN\n(+ p0/p1 wrappers, + HTML title table)
note right of A
  each subgraph level adds
  graphviz CL_OFFSET = 8pt
end note

E -> M : laid-out graph
M -> G : DotLayoutResult.clusters\n(x, y, width, height)

G -> G : <color:red>min/max over member nodes</color>\n<color:red>+ NAMESPACE_SIDE_PADDING</color>
note right of G #FFD9D9
  TODAY: the cluster box arrives
  and is ignored
end note

G -> G : <color:green>read clusters[clusterIdByNs.get(ns)]</color>
note right of G #D9FFD9
  T5: mirrors Cluster#setPosition
  (Cluster.java:511-512) - verbatim,
  no padding
end note

G -> R : NamespaceGeo
note right of R
  feeds computeClassDocumentDims
  AND computeClassInkShift, so the
  whole drawing moves with the box
end note
@enduml
```

## Upstream, for comparison

```plantuml
@startuml
title Upstream: DotStringFactory#solve reads what graphviz drew

participant "DotStringFactory\nsolve" as S
participant "graphviz SVG" as V
participant Cluster as C
participant ClusterDecoration as D

S -> V : getClusterIndex(svg, cluster.getColor())
note right of S
  the BASE clusterN - protection
  wrappers carry no color and are
  invisible to this lookup
end note
V --> S : points="..." polygon
S -> C : setPosition(min, max)
note right of C
  Cluster.java:511-512
  RectangleArea.build(min, max)
  no padding at all
end note

S -> V : getClusterIndex(svg, cluster.getTitleColor())
V --> S : title polygon
S -> C : setTitlePosition(min)
note right of S #FFF3D9
  Batch 4 - needs
  ClusterGeometry.label
end note

C -> D : rectangleArea
D -> D : drawU
@enduml
```
