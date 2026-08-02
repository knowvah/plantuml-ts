# G0b component map

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "src/core/annotations/ (NEW — port of upstream chrome)" {
  [model.ts\nDisplayPositioned, DiagramAnnotations (T1)] as model
  [commands.ts\n11 Command* regexes (T1)] as commands
  [chrome.ts / blocks.ts\nDecorateEntityImage math,\nbordered blocks, applyChrome (T4, T9)] as chrome
}

package "engine parsers (T5/T6)" {
  [class / state / sequence] as p1
  [description / activity / small engines] as p2
  [json / dot / chart (title migrates in T8)] as p3
}

package "src/index.ts (T3, T7)" {
  [plugin.render → RenderFragment (T3)] as renderSeam
  [applyChrome(fragment, ast.annotations,\nstyles, measurer) (T7)] as apply
  [assembleSvg → svgRoot (T3)] as assemble
}

[src/core/skinparam.ts +\nstyle-map-theme.ts (T2 extends)] as skin
[style] as style
[StringMeasurer seam\n(deterministic / jar)] as measurer
[src/core/klimt/\n(TextBlockMarged, +TextBlockBordered)] as klimt
[description klimt renderer\n(T7: same chrome, klimt adapter)] as desc

commands --> model
p1 --> commands : matchAnnotationCommand
p2 --> commands : matchAnnotationCommand
p3 --> commands : matchAnnotationCommand
p1 --> apply : ast.annotations
p2 --> apply : ast.annotations
p3 --> apply : ast.annotations
model --> chrome
chrome --> apply
renderSeam --> apply
apply --> assemble
skin --> style
measurer --> chrome
klimt --> chrome
desc --> apply
@enduml
```

Upstream mirror: `TitledDiagram` fields → `DiagramAnnotations`;
`CommonCommands.addTitleCommands` → `commands.ts`; `DiagramChromeFactory` +
`DecorateEntityImage` + `EntityImageLegend` → `chrome.ts`/`blocks.ts`;
`UgDiagram.getExporter` (getTextBlock → addChrome → exporter) →
`plugin.render → applyChrome → assembleSvg`.
