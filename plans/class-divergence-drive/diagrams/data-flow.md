# Data flow — a batch from first task to close

The same loop runs for every batch. The only variable is which modules the
batch's tasks edit (see `component-map.md`).

```plantuml
@startuml
actor Orchestrator as O
participant "Task agent\n(worktree)" as A
participant "Java spec\n~/git/plantuml" as J
participant "tools/render-diff" as RD
participant "four gates" as G
participant "svg:survey +\ncensus" as S
participant "tools/pin-diff" as PD
database "parity-class.json\nratchet.json\ngoldens" as PIN
participant "decision-journal.md\nfixtures.md" as JN

O -> A : task file (context, read-set, write-set, ACs)
A -> J : read cited method bodies
A -> RD : render sample fixtures, read both SVGs
A -> A : tests first, then edit write-set
A -> G : npm test / typecheck / lint / build
G --> A : green (else stop 2 after two tries)
A --> O : commit id, notes, movers observed

== batch close ==
O -> S : survey class, census class
S --> O : verdict counts, 0-diff set
O -> PD : previous pin vs fresh survey
PD --> O : transitions, dotEqual flips, rises
O -> JN : one row per riser with mechanism\n(stop 5 if none can be named)
O -> PIN : re-pin survey; pin fixtures conformant AND 0-diff
O -> G : full suite again with the new pins
O -> JN : fill `after Bn` column, batch row
O -> O : npm run parity:dashboard, commit
@enduml
```

## Where a mechanism's fix becomes visible

```plantuml
@startuml
start
:edit parser / layout / renderer;
if (changes DOT input?) then (yes)
  :class-dot-parity must stay 710/711;
  :node/edge order and sizes re-checked\nagainst svek-N.dot;
else (no)
endif
:render-diff on the task's sample fixtures;
if (structural diffs left on the named element?) then (yes)
  :diagnose; the report was a lead, not a proof;
  stop
else (no)
endif
:batch close: survey verdict moves\nstructural-match or conformant;
if (census 0-diff too?) then (yes)
  :pin into ratchet.json;
else (no)
  :journal the render-path gap; do not pin;
endif
stop
@enduml
```
