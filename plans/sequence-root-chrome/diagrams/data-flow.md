# Data flow — document assembly, before and after

The question this answers is *who calls whom, in what order*, so these are
sequence diagrams. The two differ only after the fragment is returned — the
parse and layout stages are untouched by this mission.

## Today

```plantuml
@startuml
participant "sequencePlugin" as P
participant "renderSequence" as R
participant "assembleSvg" as A
participant "svgRoot" as S

P -> R : render(geo, theme)
R -> R : join children\n(marker refs in place)
R --> P : RenderFragment\n(no diagramType)
P -> A : assembleSvg(fragment)
A -> A : diagramType undefined
A -> S : svgRoot(w, h, body, bg)
S -> S : inject 12 arrow markers
S -> S : wrap in ROOT_GROUP_OPEN
S -> S : prepend background rect
S --> A : bare <svg> root
A --> P : SVG string
@enduml
```

## After this mission

```plantuml
@startuml
participant "sequencePlugin" as P
participant "renderSequence" as R
participant "sequence-arrowhead" as H
participant "assembleSvg" as A
participant "assembleDocumentShell" as D

P -> R : render(geo, theme)
R -> H : arrowConfigurationFor(style)
H --> R : ArrowConfiguration
R -> H : headGeometryNormalSide / Self
H --> R : HeadGeometry\n(tip-local points)
R -> R : translate and emit inline shapes
R --> P : RenderFragment\ndiagramType = "SEQUENCE"
P -> A : assembleSvg(fragment)
A -> A : finalizeSequenceBody\n(wrap in bare <g>,\nmaybe background rect)
A -> D : assembleDocumentShell(fragment, "SEQUENCE")
D -> D : 8 root attributes + prolog
D -> D : empty <defs/>
D -> D : upgrade <g> to ROOT_GROUP_OPEN
D --> A : jar-shaped document
A --> P : SVG string
@enduml
```
