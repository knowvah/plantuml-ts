# Data Flow — dot Layout Pipeline

```plantuml
@startuml
participant "layout.ts (diagram)" as Caller
participant "dot/index.ts" as Index
participant "acyclic.ts" as Acyclic
participant "rank.ts" as Rank
participant "mincross.ts" as Mincross
participant "position.ts" as Position
participant "splines.ts" as Splines
Caller -> Index : layout(DotInputGraph)
Index -> Index : buildWorkingGraph(input) → DotWorkingGraph
Index -> Acyclic : removeAcyclic(wg)
Acyclic --> Index : (mutates edge.reversed)
Index -> Rank : assignRanks(wg)
Rank --> Index : (mutates node.rank, adds virtual nodes/edges)
Index -> Mincross : minimizeCrossings(wg)
Mincross --> Index : (mutates node.order)
Index -> Position : assignCoordinates(wg)
Position --> Index : (mutates node.x, node.y)
Index -> Splines : routeEdges(wg)
Splines --> Index : (mutates edge.points)
Index -> Index : extractResult(wg) → DotLayoutResult
Index --> Caller : DotLayoutResult
@enduml
```

## Phase 4 migration flow

```plantuml
@startuml
participant "DiagramPlugin" as Plugin
participant "diagram/layout.ts" as Layout
participant "dot/index.ts" as Dot
Plugin -> Layout : layoutXxx(ast, theme, measurer)
Layout -> Layout : measure nodes via StringMeasurer
Layout -> Layout : build DotInputGraph
Layout -> Dot : layout(dotGraph) [synchronous]
Dot --> Layout : DotLayoutResult
Layout -> Layout : extract XxxGeometry from result
Layout --> Plugin : XxxGeometry
@enduml
```
