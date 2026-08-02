# Component map — state engine before/after

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "Before A4 — greenfield" {
  [state/parser.ts] as P1
  [state/layout.ts\nrecursive layoutLevel\nCOMPOSITE_PAD constants\nno shapes/clusters/labels] as L1
  [core/graph-layout.ts] as GL1
  [state/renderer.ts] as R1
}

package "After A4 — svek-faithful" {
  [state/parser.ts\n+T2: full StateDiagramFactory grammar] as P2
  [state/ast.ts + new kinds] as A2AST
  [state/state-dot-graph.ts NEW\nshapes, minlen, HTML labels,\ncluster envelopes, autonom child passes] as SDG
  [state sizing module NEW\nEntityImageState family] as SZ
  [core/graph-layout.ts\nchild passes in oracle dump order] as GL2
  [core/svek-dot-emit.ts\nadditive envelope support D3] as EMIT
  [state/renderer.ts aligned] as R2
}

[class engine A2/A3\nclass-dot-graph patterns] as CLASS
[class 687 / object 78 / description ratchets] as RATCHETS

P1 --> L1
L1 --> GL1
L1 --> R1
P2 --> A2AST
A2AST --> SDG
SDG --> SZ
SDG --> GL2
SDG --> EMIT
GL2 --> R2
CLASS ..> SDG : mirrored, not shared — SI1 later
RATCHETS ..> EMIT : pin shared emitter
@enduml
```

Oracle comparison flow (unchanged from A2/A3): renderSync →
setLayoutInputObserver captures each layout() call → toSvekDot →
compareStructural vs cached `svek-N.dot` (pairing graph #i ↔ svek-(i+1),
so child-pass ORDER matters — D2).
