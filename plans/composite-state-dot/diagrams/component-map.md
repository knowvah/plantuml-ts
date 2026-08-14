# Component map — what this mission touches

One `DotInputGraph` feeds **two independent consumers**. Four defects in this
area were divergences between them, in both directions. Batch 1 changes only the
emitter; batch 2 must change both together.

```plantuml
@startuml
skinparam componentStyle rectangle

package "state engine" {
  component [state-dot-graph.ts] as SDG
  component [state-composite-cluster.ts] as SCC
  component [state-composite-geo.ts] as SCG
  component [state-composite-frontier.ts] as SCF
}

component [DotInputGraph] as DIG

package "the two-consumer seam" {
  component [graph-layout-build.ts] as BUILD
  component [svek-dot-emit.ts] as EMIT
}

component [dot-engine] as ENGINE
component [state DOT-parity ratchet] as GATE

SDG --> DIG : builds flat-pipeline graph
SCC --> DIG : builds composite clusters
DIG --> BUILD : layout path (T4)
DIG --> EMIT : DOT-text path (T1, T3)
BUILD --> ENGINE : builder API, decides geometry
EMIT --> GATE : text compared structurally
ENGINE --> SCG : node and cluster positions
SCG --> SCF : insides and points partition
SCF --> SCG : corrected frame box

note right of EMIT
  Batch 1 (T1) touches this ONLY.
  Builder already correct, so
  geometry must not move.
end note

note right of BUILD
  Batch 2 (T4) is the only
  corpus-wide regression risk.
end note

note bottom of SCF
  Verified faithful to
  Cluster.java manageEntryExitPoint.
  Batch 3 defect is upstream of it.
end note
@enduml
```
