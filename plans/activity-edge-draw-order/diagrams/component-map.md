# Write-set map

What each task owns. `edge-draw-order.ts` is new (T2); everything else exists.
Nothing outside `src/diagrams/activity/layout/` changes.

```plantuml
@startuml
package "src/diagrams/activity/layout" {
  [tile-coordinates.ts] as TC
  [walk-fork-branches.ts] as WFB
  [swimlane-placement.ts] as SP
  [compress/compress-geometry.ts] as CG
  [assign-coordinates-full.ts] as ACF
  [edge-draw-order.ts] as EDO
}
package "src/diagrams/activity" {
  [renderer.ts] as R
}
package "oracle/goldens/svg-activity" {
  [diff-baseline.json] as PINS
}

TC -[#green]-> WFB : fork/split case
WFB -[#green]-> TC : pushEdge (edges + edgeMeta)
ACF -[#green]-> TC : walkTile
ACF -[#green]-> SP : placeSwimlanes
ACF -[#green]-> CG : compressGeometry
ACF -[#blue]-> EDO : permute both arrays (D1)
ACF -[#green]-> R : geometry
R -[#green]-> PINS : scored by the probe

note right of WFB : T3 owns this file (rule a)
note right of EDO : T2 creates this file (rule b)
note bottom of ACF : T2 edits only the final step
note bottom of PINS : T4 re-pins once
@enduml
```

Read-only for every task: `renderer.ts`, `swimlane-placement.ts` (its
`EdgeMeta` type only), `compress/shapes-of.ts`. Out of scope entirely:
`layout.old.ts`, `activity-layout-*.ts`, `src/core/**`, lane widths, and any
node position.
