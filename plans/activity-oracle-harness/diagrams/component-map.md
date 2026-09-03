# Component map — what this mission touches

Logical structure: which modules talk to which, and which the mission
changes. `renderActivity` is the only `src/` component that changes.

```plantuml
@startuml
title activity-oracle-harness — affected components

package "src/diagrams/activity" {
  component [parser.ts] as Parser
  component [layout] as Layout
  component [renderer.ts] as Renderer #Gold
}

package "src/core" {
  component [klimt/document-shell.ts] as Shell
  component [svg.ts (svgRoot)] as SvgRoot
  component [svg-markers.ts] as Markers
}

package "tests/oracle/svg-conformance" {
  component [render-fixture-activity.ts] as Helper #LightGreen
  component [activity.diff-baseline\n.ratchet.test.ts] as Ratchet #LightGreen
  component [oracle-freshness.test.ts] as Fresh
  component [compare.ts] as Compare
}

package "committed data" {
  database "dot-cache/activity" as Cache #LightGreen
  database "goldens/svg-activity" as Goldens #LightGreen
}

Parser --> Layout : activity AST
Layout --> Renderer : geometry
Renderer ..> SvgRoot : "TODAY: bare root,\n12 unreferenced markers"
SvgRoot --> Markers : injects ALL_ARROW_TYPES
Renderer --> Shell : "T5: jar-shaped root,\nempty defs"

Helper --> Parser : drives
Helper --> Renderer : drives
Ratchet --> Helper : renders ours
Ratchet --> Cache : reads jar oracle
Ratchet --> Compare : weightedScore
Ratchet --> Goldens : pins baseline
Fresh --> Cache : staleness scan

legend right
  Gold = changed by T5
  Green = created by this mission
endlegend
@enduml
```

## Why `svgRoot` is the defect, not the arrowheads

`svgRoot` embeds arrowhead defs automatically for every caller. Activity
draws its arrowheads as inline polygons (`renderer.ts:44`), so all twelve
injected markers are unreferenced — while the jar emits an empty defs
element. Routing through the shell removes the injection; no arrowhead port
is required. This is the whole difference from SI34's sequence equivalent.
