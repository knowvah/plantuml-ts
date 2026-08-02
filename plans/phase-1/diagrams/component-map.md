# Component Map — Phase 1 Dependencies

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[src/index.ts] as API
[core/preprocessor.ts] as Pre
[core/block-extractor.ts] as Ext
[core/dispatcher.ts] as Dis
[diagrams/sequence/index.ts] as Seq
[core/theme.ts] as Theme
[sequence/parser.ts] as Par
[sequence/layout.ts] as Lay
[sequence/renderer.ts] as Ren
[sequence/ast.ts] as AST
[core/measurer.ts] as Meas
[core/svg.ts] as SVG
[core/creole.ts] as Cre

API --> Pre
API --> Ext
API --> Dis
API --> Seq
API --> Theme
Dis --> Seq
Seq --> Par
Seq --> Lay
Seq --> Ren
Par --> AST
Lay --> AST
Lay --> Meas
Lay --> Theme
Ren --> AST
Ren --> SVG
Ren --> Cre
Ren --> Theme
Ext --> Pre
@enduml
```

## Module responsibilities

| Module | Responsibility |
|--------|---------------|
| `index.ts` | Public API — `render()`, `renderSync()`, `renderAll()` |
| `preprocessor.ts` | `!define`, `!ifdef`, comment stripping |
| `block-extractor.ts` | `@startuml…@enduml` detection + type probe |
| `dispatcher.ts` | Plugin registry + type → plugin lookup |
| `theme.ts` | `Theme` type + `default` and `dark` built-ins |
| `measurer.ts` | `StringMeasurer` interface + `FormulaMeasurer` |
| `svg.ts` | SVG string primitives (rect, line, text, path, group) |
| `creole.ts` | Creole markup → `<tspan>` elements |
| `sequence/ast.ts` | All sequence AST and Geometry types |
| `sequence/parser.ts` | Command dispatch → `SequenceDiagramAST` |
| `sequence/layout.ts` | `SequenceDiagramAST` → `SequenceGeometry` |
| `sequence/renderer.ts` | `SequenceGeometry` → SVG string |
| `sequence/index.ts` | `DiagramPlugin` wiring |
