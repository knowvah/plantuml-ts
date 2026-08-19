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
DOTGRAPH --> BUILDEDGES : xlabel attr\n(never read)
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
end note

note bottom of ENGINE
  **G20b** EdgeGeometry has no xlabel,
  so the placed position is never
  published. Filed as issue 16.
  NOT FIXABLE IN THIS REPO.
end note

@enduml
```
