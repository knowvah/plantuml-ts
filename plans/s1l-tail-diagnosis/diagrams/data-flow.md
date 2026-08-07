# The diagnosis loop (per fixture)

Sequence rather than activity: the point is *which participant supplies which
evidence*, not merely the order of steps. The jar oracle is the arbiter — no
mechanism claim is admissible without a number that came from it.

```plantuml
@startuml
title Diagnosing one fixture to a file:line mechanism

actor Orchestrator
participant "Diagnosis agent\n(T1..T7)" as Agent
participant "measure-description-\nsize-deltas.ts" as Measure
participant "renderFixtureDescription\n+ DeterministicMeasurer" as Render
database "test-results/dot-cache\n(cached jar oracle)" as Oracle
participant "scripts_scratch/\ntemporary probe" as Probe
collections "findings/<bucket>.md" as Findings

Orchestrator -> Agent : task spec (fixtures + read-set)
Agent -> Measure : run
Measure --> Agent : delta per fixture + cause label
note right of Agent
  The cause label is a hypothesis
  (ADR-3), never carried forward
  as a finding.
end note

Agent -> Oracle : read in.puml + jar in.svg
Oracle --> Agent : the authoritative numbers
Agent -> Render : render the same fixture
Render --> Agent : our numbers

Agent -> Agent : locate the max-delta node

group instrument before hypothesizing (diagnosis.md)
  Agent -> Probe : write probe
  Probe -> Render : re-render with tracing
  Render --> Probe : intermediate values
  Probe --> Agent : observed arithmetic
end

alt mechanism isolated to file:line
  Agent -> Findings : record mechanism + causalChain + ruledOut
else cause not yet certain
  Agent -> Findings : record status=unresolved + ruledOut + nextStep
  note right of Findings
    A valid outcome. Never
    fabricate a mechanism to
    appear complete.
  end note
end

Agent -> Probe : delete (ADR-2)
Agent --> Orchestrator : findings file
@enduml
```

## Why the probe is deleted, not kept

ADR-2 makes `src/` read-only and the exit bar mechanically checkable
(`git diff --name-only` contains no `src/` path). A probe left behind under
`scripts_scratch/` is untracked clutter that the next mission would have to
re-verify; the arithmetic it produced belongs in `causalChain`, where it is
reviewable without being re-run.
