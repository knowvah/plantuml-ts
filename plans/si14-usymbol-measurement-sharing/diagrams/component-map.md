# Component map — what SI14 touches

Component diagram: the question is *which logical parts talk to what*, not where
anything runs.

```plantuml
@startuml
title SI14 component map

package "src/core/klimt" {
  component "document-shell.ts" as DS
  component "UGraphicSvg" as UGS
  component "TextBlockInEllipse" as TBIE
}

package "src/core/svek/image" {
  component "Footprint.ts" as FP
  component "EntityImageDescription" as EID
}

package "src/diagrams/description" {
  component "leaf-sizing.ts" as LS
  component "usecase-footprint.ts" as UFP
  component "renderer-entity.ts" as RE
}

package "src/diagrams/class" {
  component "index.ts" as CI
  component "renderer.ts" as CR
  component "class-layout-leaf-shapes.ts" as CLLS
}

component "usymbol-shapes.ts" as US

CI --> CR : T3 carries the measurer on the geo
CR --> DS : T4 draws each node to a fragment
DS --> UGS : T1 builds and unwraps
CR --> EID : T4 constructs at draw time
EID --> TBIE : asSmall composes the label
TBIE --> FP : getEllipse fits by drawing
CR --> US : T4 removes the constant label offset
CLLS --> LS : sizes via measureUsecaseOrActorLeaf
CLLS --> CR : T5 stops baking label atoms
LS --> FP : T2 routes the fit here
LS ..> UFP : T2 deletes this duplicate
RE --> EID : existing precedent this mission copies
@enduml
```

## Reading it

Three of these edges are the mission:

- `CI --> CR` (T3) gives the renderer something to measure with.
- `CR --> EID` (T4) makes the renderer construct the object rather than
  reconstruct its output.
- `LS ..> UFP` (T2) is the dashed one — the second, data-based copy of the fit
  goes away, and `LS --> FP` replaces it with the object-based one.

`RE --> EID` is drawn because it is the working precedent: the description
engine has done this since G1, and the class engine is the only holdout.
