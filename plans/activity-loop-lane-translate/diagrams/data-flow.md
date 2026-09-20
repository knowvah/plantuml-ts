# Data flow — a cross-lane while back edge, before and after

Before (main): the walker pushes the five-point `drawU` shape and
`routeEdge` replaces it with the generic four-point elbow whenever the two
lanes differ.

```plantuml
@startuml
participant "walkWhile" as W
participant "pushEdge" as P
participant "placeSwimlanes" as S
participant "routeEdge" as R
W -> P : backEdgePoints(5 pts), [bodyOutLane, headerInLane]
P -> S : edge + EdgeMeta{shape:'default'}
S -> R : edge, meta, lane deltas
R -> R : lane1 != lane2 -> middle-Y elbow (4 pts)
R --> S : ActivityEdgeGeo (wrong shape)
@enduml
```

After (this mission): the walker tags the edge with the tile-local
quantities `ConnectionBackSimple#drawTranslate` reads; placement supplies
the two lane translates and produces the jar's snake, its separate up-arrow
and its reservation.

```plantuml
@startuml
participant "walkWhile" as W
participant "pushEdge" as P
participant "placeSwimlanes" as S
participant "routeEdge" as R
participant "whileBackTranslate" as T
W -> P : points, lanes, shape 'while-back',\nloop{p1,p2,dimTotalWidth,diamond}
P -> S : edge + EdgeMeta{shape, loop}
S -> R : edge, meta, dx1, dx2
R -> T : (loop, dx1, dx2)
T -> T : x1,y1 = p1+dx1; xx = max(dx1,dx2)+dimTotalWidth\n(x1,y1)->(x1,y1+12)->(xx,y1+12)->(xx,y2)->(x2,y2)
T --> R : { edges:[snake + midArrowAt(xx,(y1+y2)/2,'up')],\nreservations:[UEmpty(5,12)@(x1,y1+12)] }
R --> S : flat-mapped into PlacementResult
@enduml
```

Java: `vcompact/FtileWhile.java:277-308`; dispatch `ftile/ConnectionCross.java:47-63`.
