# Data flow — where each rule applies

Two diagrams: where an attribute value acquires its final form (the
double-rounding hazard ADR-1 removes), and how the mission reaches a green
gate.

## Emission path — before and after ADR-1

The defect is that geometry rounds to 4 and emission would then round to 3.
Rounding twice is not rounding once: `1.2345` → 4dp `1.2345` → 3dp `1.235`,
but straight to 3dp is `1.234`.

```plantuml
@startuml
title Attribute value — before ADR-1 (class/state via core/svg.ts)

participant "measurer" as M
participant "geometry\n(diagrams/class)" as G
participant "attrs()\ncore/svg.ts" as A
participant "SVG text" as S

M -> G : 19.418750000000003
G -> G : javaRound4()\nHALF_UP to 4dp
G -> A : 19.4188
A -> A : String(value)\nNO formatting
A -> S : 19.4188
note over G, A
  Pre-rounding was the ONLY
  rounding. Correct while the
  jar emitted 4 decimals.
end note
@enduml
```

```plantuml
@startuml
title Attribute value — after ADR-1

participant "measurer" as M
participant "geometry\n(diagrams/class)" as G
participant "attrs()\ncore/svg.ts" as A
participant "svg-format.ts" as F
participant "SVG text" as S

M -> G : 19.418750000000003
G -> A : 19.418750000000003\n(no pre-rounding)
A -> F : formatDecimal(x, 3)
F -> F : HALF_UP on shortest\nround-trip decimal,\nthen trim zeros
F -> A : 19.419
A -> S : 19.419
note over G
  T6a-T6e / T7 delete
  the javaRound4 call.
end note
note over F
  One rounding, at emission.
  Matches SvgGraphics.format.
end note
@enduml
```

## Mission flow to a green gate

The ungated region is deliberate (ADR-5): goldens and emitters are only
consistent together, so there is no ordering without a red window.

```plantuml
@startuml
title Batch flow — the single gate point

start
:batch-1 — T1 shared rules, T2 script;
note right: additive; gates GREEN
:**gates run**;

partition "ungated region (ADR-5)" {
  :batch-2a — T3, T4 (klimt), T5 (core/svg.ts);
  note right: suite goes RED here\nby design
  :batch-2b — T6a..T6e delete class pre-rounding;
  :batch-2c — T7 state, T8 retire formatter, T9 regenerate 450 goldens;
}

:batch-2d — T10..T13 repair ~150 test files;
:**FULL GATES** — typecheck, lint, build,\ncold-tree npm test twice;
if (green?) then (yes)
  :batch-3 — T14 no-svg fixture, T15 docs + 0.2.0;
  :**gates run**;
  stop
else (no)
  if (>20 goldens failing?) then (yes)
    :STOP — a rule was missed in 2a;
    stop
  else (a few, last-digit)
    :STOP — pre-rounding survived 2b/2c;
    stop
  endif
endif
@enduml
```

## Reading the failure signal

| Symptom at batch-2d | Cause | Response |
|---|---|---|
| Hundreds of goldens fail uniformly | A rule missed in batch-2a | Fix the emitter |
| A handful fail on one last digit | Pre-rounding survived batch-2b/2c | Find the call site |
| One emitter's goldens pass, the other's fail | The two emitters diverged | ADR-3 was violated |
| A test asserts the old literal form | Expectation churn | Update it, push forward |
