# Component Map — Affected Functions

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[routeEdges] as RE
[makeBBoxCorridors\nNEW — S-3] as MBC
[routeLongEdgeInCorridor\nNEW — S-3 + S-6] as RLIC
[routeFlatEdge\nEXTEND — S-5] as RFE
[routeShortEdge\nMODIFY — S-1] as RSE
[edge.virtualNodes] as VN
[graph.nodes at same rank] as GN
[tailStartPoint\nNEW — S-1] as TSP
[smoothPolyline] as SM
[fitBezier] as FB
[ellipseEdgePoint\nfallback when no tailportY] as EEP
[edge.labelNode\nS-5 branch] as LN

RE --> MBC
RE --> RLIC
RE --> RFE
RE --> RSE
MBC --> VN
MBC --> GN
RLIC --> TSP
RLIC --> SM
RLIC --> FB
RSE --> TSP
TSP --> EEP
RFE --> LN
@enduml
```

Legend: green = new function, yellow = modified function, white = unchanged.
