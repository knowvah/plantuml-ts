# Data flow — how a census number is produced, and how it lied

## The stale-oracle mechanism (what T1 and T2 fix)

```plantuml
@startuml
autonumber
actor Executor
participant "census\nsvg-conformance-census.ts" as CENSUS
participant "class engine\n(object routes here)" as ENGINE
database "dot-cache/object\nin.svg" as CACHE
participant "compareSvg\n(deterministic)" as CMP

Executor -> CENSUS : run for type=object
CENSUS -> ENGINE : render in.puml (DeterministicMeasurer)
ENGINE --> CENSUS : ours (0.2.0 reduced form)
CENSUS -> CACHE : read expected
CACHE --> CENSUS : PRE-0.2.0 verbose form
CENSUS -> CMP : compare(ours, expected)
CMP --> CENSUS : 5 diffs on the simplest fixture
note over CMP
  font-family + lengthAdjust hoisted to <g>,
  fill #000 vs #000000 — an emission-format
  delta, not a rendering defect
end note
CENSUS --> Executor : 0/80 zero-diff  <b>(artifact)</b>
@enduml
```

The ratchet stayed green throughout, because its goldens were re-captured with
the 0.2.0 port and the cache was not. **Two gates, one stale, no alarm** —
that gap is what `decisions.md` D4 closes.

## After T1 + T2

```plantuml
@startuml
autonumber
actor Executor
participant "freshness guard\n(T2)" as GUARD
participant "oracle jar" as JAR
database "dot-cache/object" as CACHE
participant "census" as CENSUS

Executor -> GUARD : preflight
GUARD -> JAR : re-render sentinel fixture
JAR --> GUARD : fresh bytes
GUARD -> CACHE : read cached bytes
alt bytes differ
  GUARD --> Executor : FAIL, naming the slug
else identical
  GUARD --> CENSUS : proceed
  CENSUS --> Executor : true count (>= 23/80)
end
@enduml
```

Byte comparison, not DOM comparison — a parsed DOM hides exactly the
entity-form and colour-form differences that caused the original miss.

## Iteration flow (batch-2)

```plantuml
@startuml
start
:pick top actionable queue item\n(highest shared-mechanism reach);
:read the Java — method body\n+ the constructor that built its inputs;
:write mechanism / origin / causal chain / ruled-out\nto the journal;
note right: BEFORE any code change\n(rules/diagnosis.md)
:TDD — failing unit test first;
:fix at origin, every constant cited;
:re-measure census;
if (was it a size fix?) then (yes)
  :re-measure SVG, reorder the queue;
else (no)
endif
if (census dropped, or a frozen count moved\nin EITHER direction?) then (yes)
  :STOP — log and wait;
  stop
else (no)
endif
:ratchet newly zero-diff slugs;
:all four gates, unpiped;
:commit — one per iteration;
:update ledger; file engine findings;
if (actionable queue empty?) then (yes)
  :batch-2 exit;
  stop
else (no)
endif
:next iteration;
stop
@enduml
```
