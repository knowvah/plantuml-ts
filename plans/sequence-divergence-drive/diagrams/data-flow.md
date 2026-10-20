# Data flow — how a style value reaches a sequence element (after sdd1)

Proposed state. Before sdd1 the layout and renderer read `theme.colors` /
`theme.sequence`, and shadowing came from one per-document resolution in
`build-theme.ts`; batch 3b deletes that path.

```plantuml
@startuml
title sdd1: per-event style capture to SVG paint
participant "preprocessor" as Pre
participant "parseSequence\n(parser.ts)" as Parse
participant "sequence-skin-param.ts\n(style dispatch)" as Dispatch
participant "StyleBuilder\n(src/core/style)" as Builder
participant "layout\n(sequence-layout-*)" as Layout
participant "renderer-*" as Render

Pre -> Parse : UmlSource (lines, styleSource, stylePositions)
Parse -> Dispatch : createSequenceStyleDispatch(source)
Dispatch -> Builder : load plantuml.skin, apply skin line
loop each command line
  Parse -> Dispatch : executeDeclarationsBefore(position)
  Dispatch -> Builder : skinparam via FromSkinparamToStyle, style blocks
  Parse -> Parse : build AST node with styleBuilder = current builder
end
Parse -> Layout : SequenceDiagramAST
Layout -> Builder : merge the node's StyleSignature (constructor or use time)
Builder --> Layout : Style
Layout -> Layout : geo.paint = paintOf(style)
Layout -> Render : SequenceGeometry (scale-geo scales paint)
Render -> Render : stroke, stroke-width, dash, fill, rx/ry, font from geo.paint
@enduml
```
