# Data flow

## Dispatch (Phase 1 guard)

```plantuml
@startuml
participant "block" as B
participant "dispatcher.resolve" as R
participant "class.accepts" as C
participant "sequence.accepts" as S
participant "description.accepts" as D
B -> R : UmlSource (type unknown)
R -> C : accepts(lines)?
C -> C : hasDescriptiveSignal(lines)?
alt has node/cloud/usecase/[..]/(..)
  C --> R : false (guard)
  R -> S : accepts(lines)?
  S --> R : false (guard)
  R -> D : accepts(lines)?
  D --> R : true
else pure interface / actor+messages
  C --> R : true (class) or S true (sequence)
end
@enduml
```

## Engine pipeline (Phase 2)

```plantuml
@startuml
participant "parseDescription" as P
participant "layoutDescription" as L
participant "renderDescription" as Rn
participant "graph-layout seam" as G
P -> P : keyword -> USymbol (KEYWORD_TO_SYMBOL)
P --> L : DescriptionDiagramAST {nodes[symbol], links}
L -> L : size per symbol (actor/ellipse/box/...)
L -> G : layoutGraph(DotInputGraph)
G --> L : positions + routed edges
L --> Rn : DescriptionGeometry
Rn -> Rn : switch(symbol) -> shape | rect fallback
Rn --> P : SVG string
@enduml
```
