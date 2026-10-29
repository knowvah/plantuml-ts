# Component map — json family style resolution after the mission

Components the mission touches, and how style data flows between them. Old
path (the `StyleMap` projection) is retired in batch 3.

```plantuml
@startuml
skinparam componentStyle rectangle
package "src/core" {
  [preprocessor\n(PreprocessorResult)] as pre
  [style engine\nStyleBuilder / StyleSignatureBasic\n+ plantuml.skin] as engine
  [FromSkinparamToStyle] as f2s
}
package "src/diagrams/json" {
  [json-family-style-input\n(jar cut + mode marker)] as cut
  [json-skin-param\n(JsonSkinParam)] as skin
  [json-style-resolve\n(JsonStyleSet)] as resolve
  [TextBlockJson + layout\n(measurement)] as measure
  [renderer-style + renderer\n(paint, gradient)] as paint
}
package "src/diagrams" {
  [yaml / hcl parsers] as yh
}
pre --> cut : styleSource
cut --> skin : cut source (jar mode)\nor full source (extended)
yh --> skin : same factory\nstyleName yamlDiagram
f2s --> skin : extended-mode skinparams\n+ defaultFontColor wrapper
skin --> engine : builds builder
resolve --> engine : getMergedStyle at\nsix jar signatures
measure --> resolve : per-row font
paint --> resolve : fill, stroke, round corner,\nseparator, arrow, highlight
@enduml
```
