# Component map — class sizing pipeline (files touched by A2s)

```plantuml
@startuml
component [class-layout-helpers.ts\nmeasureClassifier :388] as helpers
component [class-layout-generic-classifier.ts\ncomputeClassifierGeoPipeline :167] as generic
component [class-layout-header-geo.ts\nheader dims] as header
component [class-badge.ts\ncircled char] as badge
component [class-stereotype.ts\nstereo block] as stereo
component [class-member-rows.ts\nbody rows] as rows
component [class-layout-leaf-shapes.ts\nusecase/actor leaves] as leaves
component [class-namespace-shape.ts +\nclass-geo-builders.ts\ncluster footprint] as cluster
component [class-dot-graph.ts\nbuildOneDotNode :235] as dotgraph
component [core/graph-layout-build.ts\npx/72 -> inches :150] as build
component [graphviz-ts\nDOT layout] as gv
component [renderer-classifier-box.ts\nreads SAME geo] as renderer

helpers --> generic : dispatch classifier kinds
helpers --> leaves : dispatch mixed-type leaves
generic --> header : headerWidth / headerRowHeight
header --> badge : badge box dims
header --> stereo : stereo block dims
generic --> rows : fieldsH / methodsH / memberAreaWidth
generic --> dotgraph : ClassifierGeo (width, height)
cluster --> dotgraph : cluster footprint
dotgraph --> build : DotInputNode px
build --> gv : node dims inches
generic --> renderer : shared ClassifierGeo (no re-measure)
@enduml
```

Oracle side (spec, read-only): `EntityImageClass.calculateDimensionSlow` →
`EntityImageClassHeader`/`HeaderLayout` + `MethodsOrFieldsArea` → SvekNode
`width=`/`height=` in svek DOT. See README "Key code map" for file:line.
