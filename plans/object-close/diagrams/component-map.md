# Component map — what object-close touches

Object diagrams have **no separate engine**: upstream's `ClassDiagramFactory`
registers the object/map commands alongside the class ones, so every object
fixture routes through the class engine. That shared path is why a fix here
can move the class census — and why the class ratchet is a hard boundary
(stop condition 6).

```plantuml
@startuml
skinparam componentStyle rectangle

package "Parse + layout (shared with class)" {
  component [class engine\nsrc/diagrams/class/**] as ENGINE
  component [sizing\nclass-object-map-sizing.ts\nclass-map-sizing.ts] as SIZING
  component [@knowvah/dot-engine] as DOTENG
}

package "Render" {
  component [SVG emission seam\ncore/svg.ts, svg-shapes.ts] as SVGSEAM
  component [classifier box\nrenderer-classifier-box.ts] as BOX
  component [style cascade\ncore/skinparam*, theme*] as CASCADE
}

package "Gates + oracle" {
  component [oracle jar\noracle/dist/plantuml-oracle.jar] as JAR
  database "dot-cache/object\n80 in.svg (TRACKED)" as CACHE
  component [SVG census\nsvg-conformance-census.ts] as CENSUS
  component [object ratchet\n24 goldens] as RATCHET
  component [DOT gate\ndot-sync-report.ts] as DOTGATE
  component [freshness guard (T2)] as GUARD
}

ENGINE --> SIZING : asks for node dimensions
SIZING --> DOTENG : emits node width/height in DOT
DOTENG --> BOX : returns coordinates
CASCADE --> BOX : supplies colours, fonts
BOX --> SVGSEAM : all shape markup routes here
SVGSEAM --> CENSUS : rendered SVG under test
JAR --> CACHE : re-captured by T1
CACHE --> CENSUS : expected side
CENSUS --> RATCHET : promotes zero-diff fixtures
JAR --> GUARD : sentinel re-render
CACHE --> GUARD : detects staleness
SIZING --> DOTGATE : structural DOT, frozen at 78/80

note right of CACHE
  Was STALE: predated the 0.2.0
  SVG-reduction port, so the census
  read 0/80. True baseline 23/80.
end note

note bottom of SIZING
  All 8 size-backlog slugs are also
  SVG non-conformant -> fix here first
  (decisions.md D3).
end note
@enduml
```

## The seam that matters

`SIZING → DOTENG → BOX` is the propagation path behind `decisions.md` D3: the
DOT is structurally EQUAL at 78/80, so where geometry differs by hundreds of
pixels the cause is the *dimensions fed in*, not the engine's placement of
identical input. Batch-1's T5 exists to establish which side of that seam each
fixture's defect sits on.
