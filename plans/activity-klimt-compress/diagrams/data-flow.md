# Data flow — the compress pass after this mission

Who calls whom, in order, for one render. The pass (T4) sits where
`ActivityDiagram3#getTextBlock` wraps the swimlanes block: after layout,
before draw; X first, then Y on the result.

```plantuml
@startuml
participant "tile-layout" as TL
participant "assignCoordinates" as AC
participant "placeSwimlanes" as SP
participant "compressGeometry" as CG
participant "shapesOf" as SO
participant "collectSlots" as SF
participant "CompressionTransform" as CT
participant "renderer" as R

TL -> AC : assignCoordinates(root)
AC -> AC : walkTile: nodes, edges, edgeMeta, reservations (hexagons)
AC -> SP : placeSwimlanes
SP -> AC : lanes, divider reservations
AC -> CG : compressGeometry(nodes, edges, edgeMeta, lanes, reservations, bounds)
loop mode in [x, y]
  CG -> SO : shapesOf(geometry)
  SO -> CG : rects, ellipses, polygons (arrowheads via ArrowsRegular), texts, empties
  CG -> SF : collectSlots(shapes, mode)
  SF -> CG : occupied SlotSet (ignore-X bars reserve 2 px ends; parallel arrowheads skipped on x)
  CG -> CG : gaps = occupied.reverse().smaller(5)
  CG -> CT : new CompressionTransform(gaps)
  CG -> CG : rects x' = ct(x), w' = ct(x+w) - ct(x); others translate; edge points, lanes, bounds through ct
end
CG -> AC : geometry', bounds', removed {x, y}
AC -> R : ActivityGeometry (totalWidth = ct(maxX))
R -> R : arrowheads from arrowHeadPoints; titles centred in contentX..contentX+contentWidth
@enduml
```
