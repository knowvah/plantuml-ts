# Data flow — how a source picks its engine

Two procedures for the same decision. Upstream **attempts the parse**; we
**match regexes**. D2 keeps our shape this mission and defers the re-mirror.

## Upstream — `PSystemBuilder.createPSystem`

```plantuml
@startuml
autonumber
participant Caller
participant PSystemBuilder as PB
participant "SequenceDiagramFactory" as SEQ
participant "ClassDiagramFactory" as CLS

Caller -> PB : createPSystem(source)
PB -> PB : findStartTypes(first line)
note right of PB
  yields a SET of candidate
  DiagramType values
end note
PB -> SEQ : getDiagramType() in candidates?
SEQ --> PB : yes
PB -> SEQ : createSystem(source)
note right of SEQ
  runs the real command parse;
  a line matching no Command
  fails the whole build
end note
SEQ --> PB : null (parse failed)
PB -> CLS : createSystem(source)
CLS --> PB : Diagram (isOk)
PB --> Caller : ClassDiagram
@enduml
```

The decisive property: **failure to parse is the signal**. A source full of
`map`/`!procedure` syntax cannot build a sequence diagram, so sequence
declines itself without any pattern needing to know about `map`.

## Ours — `DiagramRegistry.resolve`

```plantuml
@startuml
autonumber
participant Caller
participant "DiagramRegistry" as REG
participant classPlugin as CLS
participant jsonPlugin as JSN
participant sequencePlugin as SEQ

Caller -> REG : resolve(source)
REG -> REG : source.type in AMBIGUOUS_TYPES?
REG -> CLS : accepts(lines)
CLS --> REG : false
REG -> JSN : accepts(lines)
JSN --> REG : false
note over REG
  eleven more plugins, then:
  sequence is registered LAST
end note
REG -> SEQ : accepts(lines)
note right of SEQ
  unanchored arrow pattern
  matches inside a string
  literal argument
end note
SEQ --> REG : true
REG --> Caller : sequencePlugin
@enduml
```

Nothing here ever attempts a parse, so a regex hit on prose or on a string
literal is indistinguishable from a real arrow.

## What each batch changes

```plantuml
@startuml
start
:T1 -- build the routing gate;
note right: pins today's 86 misroutes
:T2 -- reorder registration;
note right: sequence first, per upstream
if (any fixture NEWLY misroutes?) then (yes)
  :STOP and name it;
  stop
else (no)
endif
:T3 -- candidate-type filter;
:measure the residual per bucket;
if (residual bucket empty?) then (yes)
  :close T4-T7 as measured no-ops;
else (no)
  :T4-T7 -- narrow the heuristics;
endif
:T8/T9 -- re-pin and prove integrity;
stop
@enduml
```
