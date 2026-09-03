# Data flow — how the gate measures a fixture

Who calls whom, in order, for one fixture. The measurement is pure and
synchronous; the only external process is the pinned jar, and it runs at
capture time (T0), never inside the suite.

```plantuml
@startuml
title One fixture through the activity conformance gate

participant "T0 capture" as T0
participant "oracle-render.sh" as Sh
participant "pinned jar" as Jar
database "dot-cache/activity" as Cache
participant "ratchet test" as Test
participant "renderFixtureActivity" as Helper
participant "compareSvg" as Cmp
database "diff-baseline.json" as Pin

== capture, once (T0) ==
T0 -> T0 : registry.resolve -> type
note right of T0
  only plugin.type = activity
  373 of 452, measured
end note
T0 -> Sh : render fixture
Sh -> Jar : DETERMINISTIC_TEXT=true
Jar --> Sh : oracle SVG
Sh --> T0 : SVG
T0 -> Cache : write in.puml, in.svg, .done
note right of Cache : committed — CI cannot regenerate

== every suite run ==
Test -> Cache : read in.puml + in.svg
Test -> Helper : render ours (one measurer,\nboth stages)
Helper --> Test : our SVG
Test -> Cmp : compare ours vs oracle
Cmp --> Test : diffs + weightedScore
Test -> Pin : read pinned score

alt score rose
  Test --> Test : FAIL — name slug, baseline, new score
else score fell
  Test --> Test : PASS [IMPROVED]
else score is zero
  Test --> Test : PASS [PROMOTION READY]
  note right : reports only — writes no golden
else our parser rejects it
  Test --> Test : status error + reason,\nnever a number
end
@enduml
```

## The ordering that makes the fix provable

T2 pins the pre-chrome floor; T5 changes the renderer; T6 re-pins. Pinning
after the fix would make the descent unmeasurable, and a re-pin that raises
a score without a stated mechanism is an adopted regression — which has
happened in this repo before.
