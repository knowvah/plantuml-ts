# Component map — before / after

## Before (in-house engines, scattered consumers)
```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "diagrams" {
  [class]; CO[component]; S[state]; U[usecase]; D[dot]; J[json] as C
}

[core/auto-layout] as AL
[CO] as CO
[S] as S
[core/dot] as DOT
[U] as U
[D] as D
[J] as J
[core/neato] as NE
[core/fdp] as FD
[core/sfdp] as SF
[core/twopi] as TW
[core/circo] as CI
[core/osage] as OS
[core/pathplan] as PP
[core/label] as LB
[core/pack]:::dead] as PA
[core/patchwork]:::dead] as PW

C --> AL
CO --> AL
S --> DOT
U --> DOT
D --> DOT
J --> DOT
AL --> DOT
AL --> NE
AL --> FD
AL --> SF
AL --> TW
AL --> CI
AL --> OS
DOT --> PP
DOT --> LB
@enduml
```

## After (single chokepoint, engines gone)
```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "diagrams" {
  [class]; CO[component]; S[state]; U[usecase]; D[dot]; J[json] as C
}

[core/graph-layout.ts] as GL
[CO] as CO
[S] as S
[U] as U
[D] as D
[J] as J
[stub — this mission] as STUB
[dot-engine.getLayout] as GVT

C --> GL
CO --> GL
S --> GL
U --> GL
D --> GL
J --> GL
GL --> STUB : throws PendingGraphvizError
GL ..> GVT : adapter mission
@enduml
```

Deleted: `core/{dot,circo,fdp,neato,osage,pack,patchwork,pathplan,sfdp,twopi,label}`
and `core/auto-layout.ts`. Born: `core/graph-layout.ts` + `core/graph-layout.types.ts`.
