# Component map — what this mission touches

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "Batch 1 (harness)" {
  [tests/oracle/svek-dot.ts (T1)] as SD
  [scripts/dot-sync-report.ts (T2)] as RP
  [tests/oracle/*-parity.ratchet.test.ts (T3)] as RT
  [oracle/goldens/type/ (T3, grows each iteration)] as GO
}

package "Phases 2–5 (fix targets, per diagnosis)" {
  [diagrams/description/{parser,layout,ast}] as DP
  [diagrams/class/layout.ts (+model)] as CP
  [diagrams/state/layout.ts (+model)] as SP
  [core/svek-dot-emit.ts] as EM
  [core/graph-layout.types.ts (additive attrs only)] as GT
}

[READ-ONLY: core/graph-layout.ts seam,\n~/git/plantuml Java, dot-engine] as RO

DP --> RT
CP --> RT
SP --> RT
EM --> SD
@enduml
```

Not touched: renderers (geometry consumption unchanged), dot-engine,
sequence/activity/timing and other non-svek types, the visual-QA SVG tools
(parked until DOT syncs).
