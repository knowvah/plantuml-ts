# Component Map — repeat/break/arrow-label

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "ast.ts (T1 read-only, T2+T3 write)" {
  [ActivityNode union] as AN
  [ActivityBreak] as AB
  [ActivityArrowLabel] as AAL
}

package "parser.ts (T1+T2+T3 write)" {
  [RE_REPEATWHILE] as RE_RW
  [stop keywords] as SK
  [break rule] as BR
  [arrow-label rule] as ALR
}

package "layout.ts (T2+T3 write)" {
  [BranchResult] as BR_INT
  [layoutSequence] as LS
  [layoutBreak] as LB
  [layoutRepeat] as LR
  [layoutIf] as LI
  [pendingLabel] as PL
}

package "renderer.ts (T1+T3 write)" {
  [renderNode] as RN
  [renderDiamond] as RD
  [renderEdge] as RE
  [pill: rect+text] as PILL
}

AN --> AB
AN --> AAL
RE_RW --> SK : fixes T1
BR --> AN : T2
ALR --> AN : T3
LB --> BR_INT : T2 new
LS --> BR_INT : accumulates
LI --> BR_INT : propagates
LR --> BR_INT : drains breakGeos
PL --> LS : T3
PL --> RE : T3
RN --> RD : T1 fix
RE --> PILL : T3
@enduml
```
