# Component Map — dot-engine-parity

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "Input" {
  [DotInputGraph] as DIG
}

package "Layout Pipeline (src/core/dot/)" {
  [acyclic.ts\nreverse cycle edges] as ACY
  [rank.ts\nnetwork simplex\nT12] as RNK
  [mincross.ts\nWMEDIAN + flat edges\nT13] as MIN
  [position.ts\naux graph x-coords\nT14] as POS
  [splines.ts\nobstacle polygons T16\nfree-space routing T17\nBezier fitting T18] as SPL
  [edgelabels.ts\nplacement pass\nT15 NEW] as ELB
  [index.ts\norchestrates pipeline] as IDX
}

package "Data Model (src/core/dot/types.ts)" {
  [DotNode / DotEdge\nDotWorkingGraph\nObstaclePolygon T16 NEW\nlabelX/Y T15 NEW] as TYP
}

package "Independent Fixes (Batch 2)" {
  [T6: acyclic.ts\ngreedy cycle removal] as T6
  [T7: rank.ts\nbalance + normalize] as T7
  [T8: mincross.ts\ninit + virtual weighting] as T8
  [T9: position.ts\nnodeSep + virtual centering] as T9
  [T10: splines.ts\nself-loop + flat edge] as T10
  [T11: types.ts\nDotEdge label fields] as T11
}

package "Diagram Renderers" {
  [class/renderer.ts] as CLS
  [sequence/renderer.ts] as SEQ
  [activity/renderer.ts] as ACT
  [component/renderer.ts] as CMP
  [state/renderer.ts] as STA
  [usecase/renderer.ts] as USE
}

DIG --> IDX
IDX --> ACY
ACY --> RNK
RNK --> MIN
MIN --> POS
POS --> SPL
SPL --> ELB
ELB --> IDX
TYP ..> SPL : consumed by
TYP ..> ELB : consumed by
IDX --> CLS : DotLayoutResult
IDX --> ACT : DotLayoutResult
IDX --> CMP : DotLayoutResult
IDX --> STA : DotLayoutResult
IDX --> USE : DotLayoutResult
T6 ..> ACY : fixes
T7 ..> RNK : fixes
T8 ..> MIN : fixes
T9 ..> POS : fixes
T10 ..> SPL : fixes
T11 ..> TYP : extends
@enduml
```
