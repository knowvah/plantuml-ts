# Data flow: rendering one `@startwbs` source

```plantuml
@startuml
participant "renderSync" as R
participant "wbsPlugin" as P
participant "WBSDiagramFactory" as F
participant "WBSDiagram" as D
participant "Fork / ITFComposed / ITFLeaf" as T
participant "finalizeTitledDiagramFragment" as C

R -> P : block typed WBS
P -> F : parse(source, preprocessing)
loop each line
  F -> F : common commands, then item / multiline / link regexes (Java order)
  F -> D : addIdea(code, color, getSmartLevel(type), label, dir, shape) / link(...)
  D --> F : ok | error string
end
F --> P : WBSDiagram | refusal
alt refusal or error
  P --> R : error page (stock-error rows stay conformant, D8)
else
  P -> D : calculateDimension(bounder)
  D -> T : new Fork(skinParam, root).calculateDimension() + 20
  P -> D : drawU(ug) once, inside drawBodyAt
  D -> T : fork.drawU(ug.apply(10,10))
  T -> T : applyAutoWidth, main box via FtileBoxOld.createWbs, children, trunk lines
  D -> D : links.drawU(ug.apply(translate.reverse()))
  P -> C : fragment + exportMargin (style Margin | same(10)) + chrome + scale
  C --> R : SVG string
end
@enduml
```

Measurement at every close: `renderFixtureWbs` (same path) → `compareSvg` against
`test-results/dot-cache/wbs/<slug>/in.svg` → survey verdict / ratchet / diff-baseline.
