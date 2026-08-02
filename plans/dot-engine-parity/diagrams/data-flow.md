# Data Flow — dot-engine-parity

## Layout pipeline (per diagram render)

```plantuml
@startuml
participant "diagram renderer" as Caller
participant "index.ts" as IDX
participant "acyclic.ts" as ACY
participant "rank.ts" as RNK
participant "mincross.ts" as MIN
participant "position.ts" as POS
participant "splines.ts" as SPL
participant "edgelabels.ts" as ELB
Caller -> IDX : dotLayout(DotInputGraph)
IDX -> ACY : removeAcyclicEdges(graph)
note over ACY : greedy reverse → DotWorkingGraph
ACY --> IDX : graph (edges may be reversed)
IDX -> RNK : assignRanks(graph)
note over RNK : network simplex (T12)\nfeasible spanning tree + pivots
RNK --> IDX : graph (nodes have .rank)
IDX -> MIN : minimizeCrossings(graph)
note over MIN : WMEDIAN + transpose\nflat edge handling (T13)
MIN --> IDX : graph (nodes have .order)
IDX -> POS : assignCoordinates(graph)
note over POS : aux graph x-coords (T14)\ny-coords from rankSep
POS --> IDX : graph (nodes have .x .y)
IDX -> SPL : routeEdges(graph)
note over SPL : buildObstaclePolygons (T16)\nroutePolyline per edge (T17)\nfitBezier + adjust (T18)
SPL --> IDX : graph (edges have .points[])
IDX -> ELB : placeEdgeLabels(graph)
note over ELB : midpoint + shift away\nfrom nodes (T15)
ELB --> IDX : graph (edges have .labelX .labelY)
IDX --> Caller : DotLayoutResult
@enduml
```

## Spline routing sub-pipeline (T16 → T17 → T18)

```plantuml
@startuml
' NOTE: mermaid grouping flattened -- alt/opt/loop/group render the whole
' diagram EMPTY in plantuml-ts today (.agent-notes/plantuml-sequence-group-empty.md).
' Original nesting: loop per edge
participant "routeEdges()" as RE
participant "buildObstaclePolygons()" as OBS
participant "computeSpreadPoints()" as SP
participant "routePolyline()" as RT
participant "fitBezier()" as BZ
participant "adjustEndpoints()" as ADJ
RE -> OBS : nodes[]
OBS --> RE : ObstaclePolygon[]
RE -> SP : shortEdges, longEdges, rankDir
SP --> RE : MapDotEdge, {start, end}
RE -> RT : start, end, obstacles
note over RE : LOOP: per edge
RT --> RE : Point[] (polyline through free space)
RE -> BZ : polyline
BZ --> RE : Point[] (Bezier control points)
RE -> ADJ : points, from-node, to-node, rankDir
ADJ --> RE : Point[] (endpoints on node boundary)
note over RE : edge.points = adjusted points
@enduml
```

## Batch dependency flow

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[Batch 1\nResearch T1-T5] as B1
[Batch 2\nIndependent Fixes T6-T11] as B2
[Batch 3\nNetwork Simplex T12] as B3
[Batch 4\nMincross+Position T13-T14] as B4
[Batch 5\nEdge Labels+Obstacles T15-T16] as B5
[Batch 6\nRouting+Bezier T17-T18] as B6

B1 --> B2
B1 --> B3
B3 --> B4
B4 --> B5
B5 --> B6
B2 --> B5
@enduml
```
