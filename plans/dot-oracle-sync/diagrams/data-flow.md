# Data flow — oracle vs ours, and where parity is measured

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "PlantUML oracle (patched jar)" {
  [.puml fixture] as P1
  [parse → entities (cucadiagram)] as J1
  [Svek: DotStringFactory\nemit svek DOT] as J2
  [graphviz (native)] as J3
  [read geometry → SVG] as J4
  [svek-N.dot\n(test-results/dot-cache,\noracle/goldens)] as D1
}

package "plantuml-ts" {
  [.puml fixture] as P2
  [parser → diagram model] as T1p
  [diagrams/] as T2p
  [core/graph-layout.ts (seam)] as T3p
  [dot-engine → geometry → SVG] as T4p
  [DotInputGraph] as D2
  [svek-dot-emit.ts\ntoSvekDot()] as E1
}

[tests/oracle/svek-dot.ts\nparseSvekDot both sides\ncompareStructural] as CMP
[scripts/dot-sync-report.ts (discovery, needs jar)] as R1
[ratchet vitest (offline, in npm test)] as R2

P1 --> J1
J1 --> J2
J2 --> J3
J3 --> J4
J2 ..> D1 : -DPLANTUML_DUMP_DOT
P2 --> T1p
T1p --> T2p
T2p --> T3p
T3p --> T4p
T3p ..> D2 : setLayoutInputObserver
D2 --> E1
D1 --> CMP
E1 --> CMP
CMP --> R1
CMP --> R2
@enduml
```

The DOT gate compares the two dashed taps. dot-engine sits BELOW the tap —
its fidelity is a separate concern (measured in ~/git/knowvah/dot-engine itself).
```
