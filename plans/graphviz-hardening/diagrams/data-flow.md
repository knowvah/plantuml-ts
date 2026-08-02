# Data Flow — Affected Pipeline Stages

```plantuml
@startuml
' NOTE: mermaid grouping flattened -- alt/opt/loop/group render the whole
' diagram EMPTY in plantuml-ts today (.agent-notes/plantuml-sequence-group-empty.md).
' Original nesting: loop MAX_ITER
participant "index.ts (pipeline)" as I
participant "rank.ts" as R
participant "mincross.ts" as M
participant "splines.ts" as S
I -> R : assignRanks(graph)
note over R : minmax_edges() — existing
note over R : minmax_edges2() ← R-3 NEW
note over R : rank1() — existing
I -> M : minimizeCrossings(graph)
note over M : findWCCs() ← M-6 NEW
note over M : bfsOrderPass(down) ← M-5 NEW
note over M : flat_reorder()
note over M : bfsOrderPass(up) ← M-5 NEW
note over M : flat_reorder()
note over M : snapshot bestCrossings
note over M : sortLayerByMedian(..., flatMatrix) ← M-2 UPDATED
note over M : flat_reorder()
note over M : transpose()
I -> S : routeEdges(graph)
note over I : LOOP: MAX_ITER
note over S : adjustEndpoints REMOVED ← S-4
@enduml
```
