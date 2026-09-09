# Write-set map

Colour marks the owning task. Read-only context is uncoloured.

```plantuml
@startuml
skinparam componentStyle rectangle

package "src/core (read-only)" {
  component "theme-element-resolve.ts\nresolveElementMinimumWidth" as TER
  component "svg.ts\ntext / rect helpers" as SVG
}

package "src/diagrams/activity" {
  component "activity-style-defaults.ts" as SD #LightGreen
  component "tiles/gtile-action.ts" as GA #Khaki
  component "activity-renderer-shapes.ts" as RS #Plum
  component "renderer.ts" as R #Plum
}

package "tests/oracle/svg-conformance" {
  component "text-census.ts + activity.text-baseline.test.ts" as TCEN #LightBlue
}

package "superseded - DO NOT EDIT (stop condition 5)" {
  component "layout.old.ts + activity-layout-*.ts" as OLD #LightGray
}

TER --> SD : T1 activityMinimumWidth reads it
SD --> GA : T2 consumes activityMinimumWidth
SD --> RS : T3 element-tier thickness; T4 activityFontColor; T5 activityHorizontalAlignment
SD --> R : T4 edge-label colour; T5 edge-label x
RS --> SVG : calls only (stop condition 9)
TCEN ..> RS : T0 pins fill / anchor / inset before anything moves
@enduml
```
