# Component map — what this mission touches

Component diagram: the declared-size path for a state composite, with each
group's defect marked at the component that owns it. G20b is drawn outside the
repo boundary because its fix is not ours to make.

```plantuml
@startuml
title SI31 — components on the state composite declared-size path

package "src/diagrams/state" {
  component "state-composite-autonom.ts\nbuildPlainAutonomSpec" as AUTONOM
  component "state-composite-concurrent.ts\nregionInkGeometry\nbuildConcurrentBranchAcc" as CONC
  component "state-composite-pseudo.ts\naddLocalPseudoNodes" as PSEUDO
  component "state-composite-pass.ts\nnewAccumulator / runPass" as PASS
  component "state-composite-geo.ts\nmaterializeSpecs" as GEO
  component "layout-ink-extent.ts\naddNodeInk" as INK
  component "state-geo-types.ts\nStateNodeGeo" as TYPES
  component "state-transition-label.ts\nattachInlineTransitionLabel" as TLABEL
  component "state-dot-graph.ts\nmoveLabelToXlabel" as DOTGRAPH
}

package "src/diagrams/description" {
  component "spline-clip.ts\nsimulateCompound port" as CLIP
}

package "src/core" {
  component "graph-layout.ts\nthe single engine seam" as GLAYOUT
  component "graph-layout-build-edges.ts\naddEdges" as BUILDEDGES
}

package "npm" {
  component "@knowvah/dot-engine 1.5.0\ngetLayout / EdgeGeometry" as ENGINE
}

AUTONOM --> PASS : pushes acc.nodes,\nthen runPass
CONC --> PASS : same shape,\nno labelFont/measurer
AUTONOM --> PSEUDO : addLocalPseudoNodes\nappends after members
CONC --> PSEUDO : same
PASS --> GLAYOUT : layoutGraph(acc)
GLAYOUT --> BUILDEDGES : addEdges
BUILDEDGES --> ENGINE : createGraph / render / getLayout
DOTGRAPH --> BUILDEDGES : xlabel attr\n(Batch 1 forwards it)
PASS --> GEO : materializeSpecs
GEO --> TYPES : builds StateNodeGeo
GEO --> INK : states + transitions
TLABEL --> INK : label ink box
INK --> TYPES : reads node fields

note right of CONC
  **G17** degenerate ink falls back to
  the raw canvas (+12) instead of
  SvekResult +15 — 6 rows
  **G21** newAccumulator() with no
  measurer — 1-2 rows
end note

note bottom of AUTONOM
  **G20a** members pushed before the
  [*] pseudo; jar creates the pseudo
  first — 1 row, up to 83 fixtures
end note

note right of INK
  **G5** no south-cap term; needs a
  south-opacity bit on StateNodeGeo
  — 5 rows
  **G15** composite-anchor splines are
  folded UNCLIPPED — 1 row, +7.820 px
end note

note bottom of CLIP
  **G15** the clip state needs already
  exists here. Rule 2 forbids state
  importing it, so Batch 4 moves it to
  src/core/ first (D9).
end note

note bottom of ENGINE
  **G20b** EdgeGeometry had no xlabel,
  so the placed position was never
  published. Filed as issue 16,
  RELEASED in 1.6.0 — Batch 1 bumps
  the pin and consumes it.
end note

@enduml
```
