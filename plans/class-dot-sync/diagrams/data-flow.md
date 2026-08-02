# Parity measurement flow

```plantuml
@startuml
participant "dot-sync-report.ts" as RPT
participant "oracle jar (deterministic, T4-unified)" as JAR
participant "renderSync (WidthTableMeasurer)" as TS
participant "layoutInputObserver" as OBS
participant "compareStructural" as CMP
RPT -> JAR : java -DPLANTUML_DETERMINISTIC_TEXT -DPLANTUML_DUMP_DOT fixture
JAR --> RPT : svek-N.dot per page (cached, .done sentinel)
RPT -> TS : renderSync(markup)
TS -> OBS : DotInputGraph per page (T7) / none if degenerate (T5)
OBS --> RPT : captured graphs
RPT -> CMP : parseSvekDot(oracle) vs dotInputToStructural(ours), per graph
CMP --> RPT : 10 checks (node/edge/degree/minlen/shape/label/cluster/rankdir/nodesep/ranksep)
RPT --> RPT : EQUAL | noCandidate | oracleBlind | countMismatch | buckets
@enduml
```

The ratchet (`class-dot-parity.test.ts`) replays the same comparison against
committed goldens inside `npm test` — that's the regression alarm.
