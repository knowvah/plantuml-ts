# Data flow — render and conformance paths

## Render path after cutover (T17)

```plantuml
@startuml
participant "plugin.render()" as P
participant "renderDescription (rewritten)" as R
participant "EntityImageDescription / Cluster / SvekEdge" as E
participant "USymbol* (decoration/symbol)" as S
participant "UGraphicSvg (klimt)" as U
participant "SvgGraphics" as G
P -> R : DescriptionGeometry + Theme
R -> U : UGraphicSvg.build(seed, option, version, jarMeasurer)
loop per entity
  R -> E : drawU(ug) — entity wrapper
  E -> U : startGroup({class:'entity', data-qualified-name})
  E -> U : draw(UComment('entity X'))
  E -> S : symbol.asBig(...).drawU(ug)
  S -> U : apply(translate/stroke/color).draw(URectangle/UPath/…)
  U -> G : svgRectangle / svgPath / text …
  E -> U : closeGroup()
end
loop per edge
  R -> E : SvekEdge.drawU(ug)
  E -> U : draw(DotPath spline) + draw(UPolygon arrowhead)
end
R -> U : getSvgString()
U --> P : conformant SVG document
@enduml
```

## Conformance paths (T18 ratchet, T15 survey)

```plantuml
@startuml
participant "ratchet.json manifest" as M
participant "ratchet test / survey script" as T
participant "renderSync (ours)" as RE
participant "committed jar golden.svg" as J
participant "compareSvg (0.01 band)" as H
T -> M : read locked slugs (test) / full corpus (survey)
T -> RE : render fixture .puml
T -> J : read golden
T -> H : compareSvg(ours, golden, 'deterministic')
H --> T : {pass, diffs}
note over T : test: pass required for locked slugs\nsurvey: verdict row → parity.json → PARITY-SVG.md
@enduml
```
