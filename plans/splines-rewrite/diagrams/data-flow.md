# Data Flow — splines.ts Routing Pipeline

```plantuml
@startuml
' NOTE: mermaid grouping flattened -- alt/opt/loop/group render the whole
' diagram EMPTY in plantuml-ts today (.agent-notes/plantuml-sequence-group-empty.md).
' Original nesting: loop short edges ; alt self-loop ; else flat (same rank) ; else parallel short ; else single short ; loop long edges
participant "routeEdges" as RE
participant "makeBBoxCorridors" as MBC
participant "routeLongEdgeInCorridor" as RLIC
participant "tailStartPoint" as TSP
participant "routeFlatEdge" as RFE
participant "fitBezier" as FB
RE -> RE : buildObstaclePolygons
RE -> RE : build parallelCount (short edges)
RE -> RE : build longParallelCount (long edges)
RE -> RE : routeSelfLoop
note over RE : ALT: self-loop
RE -> RFE : routeFlatEdge(edge, obstacles, rankDir)
note over RE : ELSE: flat (same rank)
RFE --> RE : Point[] (4 or 6 pts if labelNode)
RE -> RE : routeParallelEdge
note over RE : ELSE: parallel short
RE -> TSP : tailStartPoint(edge, rankDir)
note over RE : ELSE: single short
TSP --> RE : start Point
RE -> FB : fitBezier(routePolyline(...))
RE -> MBC : makeBBoxCorridors(edge, graph)
note over RE : LOOP: long edges
MBC --> RE : BoxCorridor[]
RE -> RLIC : routeLongEdgeInCorridor(edge, corridors, rankDir, fanIdx, fanTotal)
RLIC -> TSP : tailStartPoint(edge, rankDir)
TSP --> RLIC : start Point
RLIC -> FB : fitBezier(smoothPolyline(waypoints))
FB --> RLIC : bezier control points
RLIC --> RE : (sets edge.points)
@enduml
```
