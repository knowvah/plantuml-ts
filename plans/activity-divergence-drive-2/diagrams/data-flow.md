# Data flow: where the snake merge runs (D1)

The merge is a pure pass between the walkers and compression, mirroring
`UGraphicForSnake` sitting between `Swimlanes.drawU` and the compressing
`UGraphic` in the jar.

```plantuml
@startuml
participant "parser + dispatch" as P
participant "tile-layout\n(tiles/)" as T
participant "walkers\n(tile-coordinates, walk-*)" as W
participant "snake-merge\n(new, D1)" as S
participant "compress-geometry" as C
participant "canvas-origin" as O
participant "renderer" as R
P -> T : ActivityDiagramAST
T -> W : Tile tree
W -> S : edges in draw order\n(mergeable per D2)
S -> S : per scope: merge into first\npending snake that accepts;\ndrop touching end arrowheads
S -> C : merged edges + nodes
C -> O : compressed geometry
O -> R : origin-shifted geometry
R -> R : SVG fragment
@enduml
```
