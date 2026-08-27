# Data flow — an exo arrow, end to end

The mission's largest bucket (77 fixtures) and its only feature that crosses
parse, layout and render. Sequence diagram: who calls whom, in order, for
`[-> Bob : hello`.

```plantuml
@startuml
title exo arrow "[-> Bob : hello" — parse to SVG

participant "parser.ts" as P
participant "sequence-command-\nregistry.ts" as REG
participant "command-arrow.ts" as CA
participant "command-exo-arrow.ts" as CE
participant "ast.ts\n(MessageExoEvent)" as AST
participant "sequence-layout-exo.ts" as LE
participant "layout.ts" as L
participant "renderer-message.ts" as R

P -> REG : dispatch trimmed line
note right of REG
  Registration order mirrors
  initCommandsList:99-155 and
  is FROZEN (D2). CommandArrow
  is registered BEFORE the exo
  commands.
end note
REG -> CA : pattern.exec(line)
CA --> REG : no match\n(PART1 is absent)
REG -> CE : pattern.exec(line)
CE -> CE : getMessageExoType(arg)\nARROW_SUPPCIRCLE2 has no "]",\nARROW_DRESSING1 matched
CE -> AST : emit MessageExoEvent\nexoType FROM_LEFT,\nshortArrow false
AST --> P : event appended

P -> L : AST complete
L -> LE : place exo message
LE -> LE : getLeftStartInternal\nFROM_LEFT and not short\nso x starts at 0\n(or diamCircle if decoration1 CIRCLE)
LE -> LE : getRightEndInternal\nlifeline pos1 of the participant
LE --> L : MessageGeo with border-anchored x
note right of L
  A TO_RIGHT exo instead extends
  the diagram: Math.max(maxX, ...)
  in getRightEndInternal.
end note

L -> R : geometry
R -> R : draw arrow body + head\nfrom ArrowConfiguration (D1)
R --> P : SVG string
@enduml
```

## The dispatch fact this diagram encodes

`CommandArrow` declines `[-> Bob` because its `PART1` group is **absent
entirely** — a leading bare arrow has no left participant to match. That is why
the exo commands are registered after it and still get the line. Six fixtures
are pinned on exactly this reading (`CommandExoArrowLeft.java:60`).

Before the endpoint token was tightened to `PART1CODE`, `\S+` let `PART1`
swallow the `[` and invent a participant named `[` — see
`prior-observations.md#5`. Fifteen fixtures drew a wrong diagram rather than
refusing. Any loosening reintroduces it.
