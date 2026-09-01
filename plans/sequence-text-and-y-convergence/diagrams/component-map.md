# What this mission touches

```plantuml
@startuml
title sequence-text-and-y-convergence — affected components

package "core (read-only)" {
  [svg-shapes.ts] as SVG
  [measurer.ts] as MEAS
}

package "sequence engine" {
  [sequence-text.ts] as TEXT #LightYellow
  [ast.ts] as AST
  [scale-geo.ts] as SCALE
  [text-block-geo.ts] as TBG
  [sequence-layout-\nparticipants.ts] as LP
  [sequence-layout-\nevents.ts] as LE
  [layout.ts] as LAY
  [renderer-message.ts] as RM
  [renderer-participant-\nshapes.ts] as RP
  [renderer-frame-\nheader.ts] as RF
  [renderer.ts] as RR
}

package "instruments" {
  [sequence-geometry-\ndistance.ts] as DIST
  [sequence-distance-\nconcentration.ts] as CONC
}

TEXT ..> SVG : emits through
LP ..> MEAS : measures
TBG ..> MEAS : measures
LE ..> MEAS : measures

LP --> AST : populates metrics
TBG --> AST : populates metrics
LE --> AST : populates metrics
AST --> SCALE : scaled by k

RM ..> TEXT : A2
RP ..> TEXT : A3
RF ..> TEXT : A4
RR ..> TEXT : A5

LAY --> LP
LAY --> LE

DIST --> CONC : reports with

note bottom of TEXT
  A1 creates this and changes
  no call site. Its gate is that
  nothing moves.
end note

note bottom of DIST
  C1 splits points by axis.
  76.1 percent of it is Y.
end note
@enduml
```

## Phase C additionally

`layout.ts` and `sequence-layout-participants.ts` gain the vertical document
margin, and `renderer-message.ts` gains the corrected loop height — **as one
change** (C3), because the margin applied alone raises total distance by
35 145.
