# Data flow — before and after

## Before: the sizer is told the ink

```plantuml
@startuml
participant "leaf-sizing.ts" as LS
participant "footprintBoxes" as FB
participant "usecase-footprint.ts" as UFP
participant "AtomImageResolver" as AIR
LS -> LS : hasUnroutedUsecaseMarkup? GUARD -> legacy path
LS -> FB : footprintBoxes(display)
FB -> AIR : resolve(atom)
AIR --> FB : {href,width,height, inkX,inkY,inkWidth,inkHeight}
FB -> UFP : analytic box from DECLARED + ink fields
UFP --> LS : FootprintBox[]
note over UFP,AIR : multi-line stacking reuses one resolved\nvalue for both ink and cursor advance -> mis-stacks
@enduml
```

## After: the sizer observes the ink

```plantuml
@startuml
participant "leaf-sizing.ts" as LS
participant "TextBlockInEllipse.ts" as TBIE
participant "Footprint.ts" as FP
participant "MyUGraphic" as UG
LS -> TBIE : new TextBlockInEllipse(text, alpha)
TBIE -> FP : new Footprint(stringBounder)
FP -> UG : draw the text block through a point collector
UG --> FP : XPoint2D per drawn mark
FP --> TBIE : getEllipse(text, alpha)
TBIE --> LS : dimension
note over FP,UG : ink is OBSERVED, not declared --\nno channel needed, stacking dissolves
@enduml
```

The renderer already runs the second flow (`USymbolUsecase.ts` →
`TextBlockInEllipse.ts`). This mission makes the sizer run it too.
