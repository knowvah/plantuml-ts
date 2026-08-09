# Data flow — the json layout pipeline, both ways

## Today (this port) vs. upstream

The divergence ADR-1 addresses is visible as soon as the two are drawn side by
side: upstream solves a **transposed** graph and rotates the answer; this port
asks the engine for the final orientation directly.

```plantuml
@startuml
title json layout — upstream (jar)

participant "JsonDiagram" as JD
participant "TextBlockJson" as TBJ
participant "SmetanaForJson" as SFJ
participant "Smetana\n(in-process graphviz)" as SM
participant "Mirror" as MIR
participant "JsonCurve" as JC

JD -> TBJ : draw the tree
TBJ -> SFJ : node dims per row
SFJ -> SFJ : swap: height <- width,\nwidth <- height
SFJ -> SFJ : label = <P0>|<P1>|... record cells
SFJ -> SM : graph, NO rankdir (default TB)
SM --> SFJ : positions + splines (transposed space)
SFJ -> MIR : each point
MIR --> SFJ : x = max - y, y = x
SFJ -> JC : mirrored spline points
JC --> TBJ : SVG path
note right of SM
  never leaves the JVM,
  so no svek-N.dot is written
  (this is why ADR-3 exists)
end note
@enduml
```

```plantuml
@startuml
title json layout — this port, today

participant "jsonPlugin" as JP
participant "layoutJson" as LJ
participant "layoutGraph\n(seam)" as SEAM
participant "dot-engine" as DE
participant "renderJson" as RJ

JP -> LJ : JsonDiagramAST
LJ -> LJ : measure rows and columns
LJ -> LJ : tailportY = fraction down\nthe parent's edge
LJ -> SEAM : graph, rankDir = LR,\ndims passed straight through
SEAM -> DE : layout
DE --> SEAM : positions + splines
SEAM --> LJ : DotLayoutResult
LJ -> RJ : JsonGeometry
note right of LJ
  no transpose, no record ports:
  a different graph from the one
  the jar solved
end note
@enduml
```

## After Batch 3

```plantuml
@startuml
title json layout — this port, after ADR-1

participant "layoutJson" as LJ
participant "layoutGraph\n(seam)" as SEAM
participant "Mirror" as MIR
participant "JsonCurve" as JC
participant "renderJson" as RJ

LJ -> LJ : measure rows and columns
LJ -> LJ : swap dims, build <Pn> record label
LJ -> SEAM : graph, no rankDir,\nedges carry tailport=Pn
SEAM --> LJ : positions + splines (transposed)
LJ -> MIR : each point
MIR --> LJ : invAndXYSwitch
LJ -> JC : mirrored spline points
JC --> RJ : SVG path
@enduml
```

## Where the three types converge

```plantuml
@startuml
title yaml and hcl have no layout of their own

start
if (block type?) then (@startjson)
  :parseJson;
elseif (@startyaml) then
  :parseYaml -> monomorph;
else (@starthcl)
  :parseHcl;
endif
:layoutJson;
note right
  ONE layout for all three.
  Every change in Batch 3
  is transitively yaml's and hcl's.
end note
:renderJson;
stop
@enduml
```
