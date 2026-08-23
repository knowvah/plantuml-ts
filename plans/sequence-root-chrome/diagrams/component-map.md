# Component map — what routes where

Today the sequence engine is the only one that reaches `svgRoot`. After this
mission it joins the five engines that reach `assembleDocumentShell`, and the
generic `svgRoot` path is left for the engines that genuinely have no jar
chrome to match (chart, dot passthrough).

```plantuml
@startuml
skinparam componentStyle rectangle

package "src/diagrams" {
  component [sequence/renderer.ts] as SeqR
  component [sequence/sequence-arrowhead.ts] as SeqA #LightYellow
  component [class/renderer.ts] as ClsR
  component [state/renderer.ts] as StR
}

package "src/core" {
  component [dispatcher.ts\nRenderFragment] as Frag
  component [assemble-svg.ts\nfinalizeShellFragment] as Asm
  component [klimt/document-shell.ts\nassembleDocumentShell] as Shell
  component [svg.ts\nsvgRoot] as Root
  component [svg.ts\nshape emitters] as Emit
}

SeqA --> SeqR : head geometry\n(tip-local points)
SeqR --> Emit : polygon / line / ellipse
SeqR --> Frag : diagramType = "SEQUENCE"
ClsR --> Frag : diagramType = "CLASS"
StR --> Frag : diagramType = "STATE"

Frag --> Asm : every fragment
Asm --> Shell : diagramType set\n(after finalize)
Asm --> Root : diagramType absent\n(chart, dot passthrough)

note right of Asm
  T2 adds the SEQUENCE case here.
  Shared by six diagram types --
  a mistake here is cross-engine,
  which is what T5 guards.
end note

note bottom of Root
  Supplies the content <g>, the
  arrow markers and the background
  rect. The shell supplies none of
  those -- hence finalizeSequenceBody.
end note
@enduml
```
