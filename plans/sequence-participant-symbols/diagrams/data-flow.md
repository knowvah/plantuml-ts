# Data flow — a `database` participant, head to SVG

The parse and AST layers are already correct: `command-participant.ts:32`
matches all eight keywords and `ParticipantType` (`ast.ts:15-24`) carries all
eight values. Everything this mission changes is downstream of the AST.

```plantuml
@startuml
title database participant: layout and render (after this mission)

participant "parser" as P
participant "sequence-layout-participants" as L
participant "renderer-participant-symbol\n(T1 seam)" as S
participant "USymbolDatabase" as U
participant "renderer" as R

P -> L : Participant{ type: database, display }
note right of P
  already correct today:
  command-participant.ts:32
end note

L -> S : measureParticipantSymbol(database)
S -> U : asSmall(null, empty(16,17),\nempty(0,0), ctx, CENTER)
U --> S : XDimension2D
S --> L : { width, height }
L -> L : max(symbolW, textW)\nComponentRoseDatabase:102-105
note right of L
  replaces the fitted
  DB_MIN_WIDTH = 40 (T3)
end note
L --> R : ParticipantGeo{ x, width, height }

R -> S : renderParticipantSymbol(database, geo, head)
S -> U : drawDatabase() + getClosingPath()\nvia UGraphicSvg
U --> S : two path elements
S --> R : svg string
note right of R
  replaces rect+line+line+ellipse (T2)
end note
@enduml
```

## The invariant this flow must produce

`junaxa-14-biko373` reaches the golden's 41 top-level children with histogram
`g 7, rect 6, ellipse 2, path 7, text 13, line 3, polygon 3`. Measured
before-state: 47 children, `+2 rect, +4 line, +2 ellipse, -2 path`.
