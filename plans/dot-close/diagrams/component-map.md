# Component Map — Affected Functions

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "mincross.ts [mincross.ts — T1]" {
  [sortLayerByMedian\nMODIFY — M-1] as SLM
  [flatMval\nNEW — M-1] as FM
  [edgeWeight\nMODIFY — M-4] as EW
  [buildNeighborMap\nMODIFY — M-4] as BNM
  [countCrossingsForRank\nNEW — M-3] as CFR
  [CrossingCache\nNEW — M-3] as CC
  [transpose\nMODIFY — M-3] as TR
  [minimizeCrossings\nMODIFY — M-3 M-4] as MC
  [countCrossings\nDELETE — M-3] as OLD
}

package "rank.ts [rank.ts — T2]" {
  [TB_balance\nNEW — R-4] as TB
  [assignRanks\nMODIFY — R-4] as AR
}

package "position.ts [position.ts — T3]" {
  [assignTB\nMODIFY — P-4 P-5] as ATB
  [assignLR\nMODIFY — P-4 P-5] as ALR
  [solveAuxNS\nNEW — P-5] as NS
  [solveAuxRanks\nKEEP for initial solve] as SAR
  [centerBySuccessors\nREPLACED by solveAuxNS] as CBS
  [centerByPredecessors\nREPLACED by solveAuxNS] as CBP
}

SLM --> FM
MC --> BNM
BNM --> EW
MC --> CC
TR --> CC
TR --> CFR
MC --> OLD
AR --> TB
ATB --> NS
ALR --> NS
NS --> SAR
@enduml
```

Legend: green = new, red = deleted, yellow = superseded by new function.
