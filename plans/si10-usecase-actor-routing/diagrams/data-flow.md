# Data flow — before and after

Labels say "latex branch" and "sprite atom" rather than the literal markup:
inside a PlantUML diagram `<latex>` is typeset and `<$name>` resolves as a
sprite. See CLAUDE.md § Diagrams.

## Before: two engines, two answers for one shape

```plantuml
@startuml
title CLASS engine — no guard, no sprites
participant "class-layout-helpers" as CH
participant "measureUsecaseOrActor" as CLS
participant "measureUsecase (analytic)" as SUB
participant "usecase-footprint" as FP

CH -> CLS : measureUsecaseOrActor(classifier, fontSpec, measurer)
note right of CH : sprites IS in scope here — never passed
CLS -> SUB : measureUsecase(display, ...)
SUB -> FP : footprintBoxes / containingEllipse
FP --> CLS : Dim
CLS --> CH : MeasuredClassifier { rows, dividerYs }
@enduml
```

```plantuml
@startuml
title DESCRIPTION engine — guarded
participant "measureLeafNode" as MLN
participant "hasUnroutedUsecaseMarkup" as G
participant "measureUsecase (analytic)" as SUB
participant "measureEntityLeaf" as MEL
participant "EntityImageDescription" as EID

MLN -> G : display?
alt latex branch only — the multi-line sprite arm was removed by T1
  G --> MLN : true
  MLN -> SUB : analytic substitute
else everything else
  G --> MLN : false
  MLN -> MEL : faithful path
  MEL -> EID : calculateDimensionSlow
end
@enduml
```

## After: one owner, one formula

```plantuml
@startuml
title After SI10 — the class engine calls the description engine
participant "class-layout-helpers" as CH
participant "measureUsecaseOrActor" as CLS
participant "NEW entry point (T1)" as ENTRY
participant "measureEntityLeaf" as MEL
participant "EntityImageDescription" as EID

CH -> CLS : (classifier, fontSpec, measurer, sprites)
note right of CH : sprites now threaded (T2)
CLS -> ENTRY : (display, symbol, fontSpec, measurer, sprites)
ENTRY -> MEL : the same faithful path the description engine uses
MEL -> EID : calculateDimensionSlow
EID --> ENTRY : Dim
ENTRY --> CLS : Dim
note over CLS : rows / dividerYs composition UNCHANGED
CLS --> CH : MeasuredClassifier
@enduml
```

The description engine's guard keeps only its latex arm — measured
load-bearing at `widened 2`. The multi-line sprite arm is gone, measured
inert at `widened 0`.

## Why the sprite arm could be removed and the latex arm could not

| probe | `widened` |
|---|---|
| baseline | 0 |
| sprite arm disabled | **0** — inert |
| both arms disabled | **2** — latex is load-bearing |

Both named fixtures (`bootstrap-0`, `ruziru-69-xixo434`) report `delta 0,
conformant true` with and without the sprite arm.
