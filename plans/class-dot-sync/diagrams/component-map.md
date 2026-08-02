# Component map — what this mission touches

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "class engine [src/diagrams/class — primary write-set]" {
  [parser.ts] as P
  [class-commands.ts\nT1 new, T6 newpage] as CC
  [ast.ts\nT6 pages] as AST
  [layout.ts\nT5 T7] as L
  [class-dot-graph.ts\nT2 new, T5 T8] as CDG
  [renderer.ts\nT7 stacked pages] as R
  [class-html-label.ts]:::dead] as HLX
}

package "src/core — additive only, D3" {
  [graph-layout.types.ts] as GLT
  [svek-dot-emit.ts] as EMIT
}

package "parity harness" {
  [scripts/dot-sync-report.ts\nT4 jar unification] as RPT
  [tests/oracle/svek-dot.ts\nread-only comparator] as CMP
  [tests/oracle/class-dot-parity.test.ts\nT9 ratchet] as RAT
  [oracle/goldens/class/**] as GOLD
}

P --> CC
P --> AST
L --> CDG
L --> R
CDG --> GLT
GLT --> EMIT
EMIT --> CMP
RPT --> CMP
RAT --> GOLD
RAT --> CMP
@enduml
```

`class-html-label.ts` (dashed) is deleted in T3. The description engine's
files are out of write-set entirely; its ratchet is the shared-file
regression gate.
