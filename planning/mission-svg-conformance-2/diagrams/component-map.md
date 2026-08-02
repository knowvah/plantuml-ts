# Component map — Brief 2 module graph

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "Existing (Brief 1 + core)" {
  [src/core/klimt/**\nUGraphic model + shapes + SvgGraphics + drivers] as klimt
  [tests/oracle/svg-conformance/\nnormalizeSvg / compareSvg] as harness
  [src/core/measurer.ts\nStringMeasurer DI] as measurer
  [src/diagrams/description/layout*.ts\n(NOT touched)] as layout
}

package "New in Brief 2" {
  [T1 bigint seed\n(svg-graphics-core.ts)] as seed
  [T2/T4 jar metrics\nmeasurer-jar.data.ts + measurer-jar.ts] as metrics
  [T3,T5–T10 src/core/decoration/symbol/\nUSymbol* complete set + registry] as symbols
  [T11–T13 src/core/svek/\nDecorateEntityImage, Cluster, SvekEdge draw + extremities] as svek
  [T14 src/core/svek/image/\nEntityImageDescription] as eid
  [T17 src/diagrams/description/renderer*.ts\n(rewritten: klimt draw sequences)] as renderer
  [T18/T19 oracle/goldens/svg-description/\nratchet.json + goldens + ratchet test] as ratchet
  [T15/T16 scripts/\nsvg-parity-survey, dashboard, overlay] as tooling
}

seed --> klimt
metrics --> measurer
symbols --> klimt
svek --> klimt
svek --> symbols
eid --> symbols
eid --> svek
renderer --> eid
renderer --> svek
renderer --> klimt
renderer --> metrics
layout --> renderer
ratchet --> harness
ratchet --> renderer
tooling --> harness
tooling --> renderer
@enduml
```

Retired at the end (T20): `tests/visual/{compare.spec.ts,
playwright-visual.config.ts, capture-reference.ts, reference/**}`,
`scripts/visual-qa-svg.ts`, `visual:compare` script.
