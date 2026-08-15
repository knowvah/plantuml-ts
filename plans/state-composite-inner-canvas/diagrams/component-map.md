# What this mission touches

Write-sets are disjoint per task. `LimitFinder` and the outer graph-layout
seam are READ, never written — decision D5 makes a write there a stop.

```plantuml
@startuml
title Write-set (solid) vs read-only (dashed)

package "src/diagrams/state" {
  [state-composite-geo.ts] as GEO
  [state-composite-sizing.ts] as SIZ
}

package "src/core (read-only)" {
  [klimt/drawing/LimitFinder.ts] as LF
  [graph-layout.ts] as GL
}

package "scripts" {
  [measure-composite-declared-size.ts] as HARNESS
}

package "oracle (read-only)" {
  [test-results/dot-cache/state/*/svek-N.dot] as ORACLE
}

SIZ -[#green]-> LF : T2 walks ink
GEO -[#green]-> SIZ : T3 consumes extent
GEO -[#green]-> GL : declares composite node
HARNESS ..> GL : T1 observes declared graph
HARNESS ..> ORACLE : T1 compares against jar

note right of GEO
  T3: retire BOX_PAD, use ink + delta(15,15)
  T5: moveDelta(6 - min)
end note

note right of SIZ
  T2: expose innerInkExtent
  T4: InnerStateAutonom margin layer
end note
@enduml
```

## Ownership

| File | Owner | Batch |
|---|---|---|
| `scripts/measure-composite-declared-size.ts` | T1 | 1 |
| `src/diagrams/state/state-composite-sizing.ts` | T2, then T4 | 1, 2 |
| `src/diagrams/state/state-composite-geo.ts` | T3, then T5 | 2, 3 |

No two tasks in the same batch share a file. T2/T4 and T3/T5 share one each
across batches, which is why Batch 2 is serial.
