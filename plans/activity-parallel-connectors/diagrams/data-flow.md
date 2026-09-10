# Data flow — the fork coordinate pass after this mission

Who calls whom, in order, for one fork with two branches (one detached).
`hasPointOut` (T1) gates the join edge; the connectors (T2) are vertical
drops at the branch x; the bars (T3) are sized from the inner width; the
margins (T4) come from computeNewFtile; the lane pass (T5) jogs only the
cross-lane parallel edges.

```plantuml
@startuml
participant "tile-layout" as TL
participant "GtileFork" as F
participant "tile-coordinates" as TC
participant "pushEdge" as PE
participant "swimlane-placement" as SP
participant "renderer" as R

TL -> F : new GtileFork(branches)
F -> F : slots = 14 + w + 14 each; height = bar + max + 40 + bar
TL -> TC : assignCoordinates(root)
TC -> TC : pushNode(fork-bar, inner width, height 6)
loop each branch
  TC -> F : branch.getCoord(NORTH_HOOK)
  TC -> PE : in-edge [(x, barBottom), (x, inY)] shape parallel-in
  PE -> PE : drop a point equal to the last (Worm.addPoint)
  TC -> F : branch.hasPointOut()
  alt has out point
    TC -> PE : out-edge [(x, outY), (x, joinY)] shape parallel-out
  else detached
    TC -> TC : no join edge
  end
end
TC -> TC : pushNode(join-bar) only if any branch has an out point
TC -> SP : placeSwimlanes(nodes, edges, edgeMeta)
SP -> SP : parallel-in jog at from.y + 4; parallel-out at to.y - 14
SP -> R : ActivityGeometry
R -> R : one <line> per segment, arrowhead from the last segment
@enduml
```
