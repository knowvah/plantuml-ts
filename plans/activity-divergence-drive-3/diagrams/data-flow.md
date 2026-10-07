# Data flow: where add3's two lead mechanisms run

Edge labels (D1) and cross-lane routing (D2) both sit between the walkers and
the renderer; the label anchor is computed on pre-compression points and
carried through compression, like add2's emphasize anchor.

```plantuml
@startuml
participant "walkers\n(walk-*, labelAlign)" as W
participant "swimlane-placement\n(routeEdge, LoopTranslate kinds)" as S
participant "snake-merge" as M
participant "snake-text-position\n(new, D1)" as T
participant "compress-geometry" as C
participant "canvas-origin" as O
participant "renderer\n(renderEdgeLabel)" as R
W -> S : edges + meta (lane, loop kind)
S -> M : routed edges (per-class drawTranslate)
M -> T : merged edges with labelAlign
T -> C : label anchor (pre-compression)
C -> O : compressed geometry + anchor ct()
O -> R : canvas incl. label boxes
@enduml
```
