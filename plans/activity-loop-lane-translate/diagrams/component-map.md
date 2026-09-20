# Component map — what this mission touches

```plantuml
@startuml
skinparam componentStyle rectangle
package "src/diagrams/activity/layout" {
  component [tile-coordinates.ts\npushEdge(lanes, shape, loop?)] as TC
  component [walk-while-branch.ts\npushWhileBack tags 'while-back'] as WW
  component [walk-repeat.ts\npushRepeatOut/Back tag repeat shapes] as WR
  component [swimlane-placement.ts\nplaceSwimlanes -> routeEdge] as SP
  component [swimlane-loop-translate.ts\nLoopTranslate union + dispatch] as LT
  component [swimlane-loop-translate-while.ts\nConnectionBackSimple#drawTranslate] as LTW
  component [swimlane-loop-translate-repeat.ts\nOut / Simple1 / Simple2 / Complex1] as LTR
}
package "src/diagrams/activity" {
  component [activity-layout-types.ts\nActivityEdgeGeo.midArrowAt] as TY
  component [renderer.ts\nrenderEdge draws midArrowAt] as RD
}
WW --> TC : pushEdge(..., loop record)
WR --> TC : pushEdge(..., loop record)
TC --> SP : EdgeMeta[] (lane1, lane2, shape, loop?)
SP --> LT : routeEdge dispatch (meta, dx1, dx2)
LT --> LTW : kind 'while-back'
LT --> LTR : kind 'repeat-*'
LT --> SP : { edges[], reservations[] }
SP --> TY : ActivityEdgeGeo with midArrowAt
TY --> RD : rendered as one extra arrowTip
@enduml
```

Untouched but read: `swimlane-lanes.ts` (`laneIn`/`laneOut`),
`swimlane-context.ts` (lane origins), `hexagon-reservations.ts`
(`Reservation`), `tiles/gtile-while.ts`, `tiles/gtile-repeat.ts`.
