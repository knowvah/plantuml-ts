# One `if` from AST to edge run

After this mission. `conditional-builder.ts` (T3) picks the tile class the
way `FtileFactoryDelegatorIf` + `ConditionalBuilder` do; each `walk-if-*`
module (T3–T5) emits nodes in `drawU` order, then connectors in `conns`
order; `gtile-top-down` (T6) pushes the sibling link after both endpoints;
`edge-draw-order.ts` (parent mission) still permutes by lane pass last.

```plantuml
@startuml
participant "tile-layout.ts\ntileIf" as TL
participant "conditional-builder.ts\nbuildIf" as CB
participant "GtileIfWithLinks /\nGtileIfDown /\nGtileIfLongHorizontal" as TILE
participant "tile-coordinates.ts\nwalkTile" as WT
participant "walk-if-*.ts" as WIF
participant "assignCoordinatesFull" as ACF
participant "edge-draw-order.ts" as EDO

TL -> CB : ActivityIf
CB -> CB : ifBuilderOf(node)\n(ConditionalBuilder.create :144-161)
CB -> TILE : construct (sizing per D4)
TILE --> TL : Tile
ACF -> WT : walk the tile tree
WT -> WIF : gtile-if-* case
WIF -> WIF : nodes in drawU order\n(hexagon, if-labels, branches, if-merge)
WIF -> WT : pushEdge x N in conns order\n(In/Else/Out ... per builder)
WT -> WT : top-down: walk child i+1,\nTHEN push link i->i+1 (T6)
WT --> ACF : Out.nodes, Out.edges + edgeMeta
ACF -> EDO : lanePassOrder (parent D1)
EDO --> ACF : both arrays permuted together
@enduml
```
