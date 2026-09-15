# Where an edge's draw order is decided

One activity render, from parse to SVG. The order of `Out.edges` is set at
`pushEdge` (walk order) and — after this mission — permuted once at the end
of `assignCoordinatesFull` (D1). `walkForkBranches` is where rule (a) lives;
`applyEdgeDrawOrder` is where rule (b) lives.

```plantuml
@startuml
participant "assignCoordinatesFull" as ACF
participant "walkTile" as WT
participant "walkForkBranches" as WFB
participant "placeSwimlanes" as PS
participant "compressGeometry" as CG
participant "edge-draw-order" as EDO
participant "renderActivity" as R

ACF -> WT : walk the tile tree
WT -> WFB : fork or split tile
WFB -> WFB : rule (a) T3: branches,\nthen every in, then every out
WFB --> WT : pushEdge x N (walk order)
WT --> ACF : Out.edges + Out.edgeMeta (index aligned)
ACF -> PS : shift nodes, route cross-lane edges
PS --> ACF : placed.edges (same order)
ACF -> CG : compress on x then y
CG --> ACF : compressed.edges (same order)
ACF -> EDO : rule (b) T2: lanePassOrder(edgeMeta, laneNames)
EDO --> ACF : one index order
ACF -> EDO : applyEdgeDrawOrder(edges, edgeMeta, order)
EDO --> ACF : both arrays permuted together
ACF --> R : geometry.edges in the jar's order
R -> R : chrome, nodes, then every edge, titles last
@enduml
```

The jar reaches the same order differently: connections are Snakes buffered
by `UGraphicForSnake` and flushed after every box
(`svek/UGraphicForSnake.java:137-165`), while the lane passes and the final
`Cross` pass decide which pass draws which connection
(`ftile/Swimlanes.java:318-355`).
