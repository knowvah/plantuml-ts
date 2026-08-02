# Data flow

## Dispatch (Phase 1 guard)

```plantuml
@startuml
' NOTE: mermaid grouping flattened -- alt/opt/loop/group render the whole
' diagram EMPTY in plantuml-ts today (.agent-notes/plantuml-sequence-group-empty.md).
' Original nesting: alt has node/cloud/usecase/[..]/(..) ; else pure interface / actor+messages
participant "block" as B
participant "dispatcher.resolve" as R
participant "class.accepts" as C
participant "sequence.accepts" as S
participant "description.accepts" as D
B -> R : UmlSource (type unknown)
R -> C : accepts(lines)?
C -> C : hasDescriptiveSignal(lines)?
C --> R : false (guard)
note over C : ALT: has node/cloud/usecase/[..]/(..)
R -> S : accepts(lines)?
S --> R : false (guard)
R -> D : accepts(lines)?
D --> R : true
C --> R : true (class) or S true (sequence)
note over C : ELSE: pure interface / actor+messages
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
