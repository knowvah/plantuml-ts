# Data Flow — dot-pipeline

## End-to-end pipeline after all tasks complete

```plantuml
@startuml
participant "index.ts" as I
participant "acyclic.ts" as A
participant "decomp.ts" as D
participant "cluster.ts" as CL
participant "compound.ts" as CO
participant "rank.ts" as R
participant "class1.ts" as C1
participant "class2.ts" as C2
participant "mincross.ts" as MC
participant "flat.ts" as FL
participant "position.ts" as PO
participant "aspect.ts" as AS
participant "splines.ts" as SP
participant "pathplan/" as PP
participant "label/" as LB
I -> A : removeAcyclic(graph)
I -> D : decompose(graph)
I -> CL : dot_clust(graph)
I -> CO : compoundEdges(graph)
I -> R : assignRanks(graph)
R -> C1 : class1(graph)
I -> C2 : class2(graph)
note over C2 : creates virtual chains + label nodes
I -> MC : minimizeCrossings(graph)
MC -> FL : flat_breakcycles / flat_reorder
I -> PO : assignCoordinates(graph)
I -> AS : setAspect(graph, aspect) [if aspect set]
I -> SP : routeEdges(graph)
SP -> PP : routesplines (obstacle avoidance)
I -> LB : xlabelPositions(graph)
I -> I : extractResult → DotLayoutResult
@enduml
```

## class2 virtual node creation (T4 key flow)

```plantuml
@startuml
' NOTE: mermaid grouping flattened -- alt/opt/loop/group render the whole
' diagram EMPTY in plantuml-ts today (.agent-notes/plantuml-sequence-group-empty.md).
' Original nesting: loop for each edge with span > 1 ; loop for each labeled edge
participant "class2.ts" as C2
participant "DotWorkingGraph" as G
C2 -> G : move edge to longEdges[]
note over C2 : LOOP: for each edge with span > 1
C2 -> G : create N-1 virtual nodes at intermediate ranks
C2 -> G : add N unit-length chain edges to edges[]
C2 -> G : create labelNode (virtual, width=nodeSep+labelWidth)
note over C2 : LOOP: for each labeled edge
C2 -> G : set edge.labelNode
@enduml
```
