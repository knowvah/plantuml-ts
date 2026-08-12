# Engine boundary — before / after

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "Before — diverged" {
  [dispatcher] as dispA
  [objectPlugin\nown 272-line parser] as objP
  [class engine\n43-command mirror] as clsA
  [class layout+renderer] as layA
}

dispA --> objP : accepts: object …
dispA --> clsA : accepts: class …
objP --> layA : reuses
clsA --> layA
@enduml
```

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "After — mirrors ClassDiagramFactory" {
  [dispatcher] as dispB
  [class engine\n+ CommandCreateEntityObject\n+ …Multilines + AddData\n+ CommandCreateMap] as clsB
  [class layout+renderer\n+ object/map sizing] as layB
  [class-dot-graph → dot-engine] as dotB
}

dispB --> clsB : accepts: class object map …
clsB --> layB
layB --> dotB
@enduml
```

Upstream reference: `ClassDiagramFactory.java:81-85,116-117` registers
the object commands; `objectdiagram/` holds only
`AbstractClassOrObjectDiagram` + commands. Object diagrams are
`DiagramType.CLASS` (SVG `data-diagram-type="CLASS"`).
