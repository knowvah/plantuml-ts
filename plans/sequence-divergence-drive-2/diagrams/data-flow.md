# Data flow — sequence render after sdd2

What changes: the layout stage gains the upstream teoz structures (D3) and
labels are measured and drawn through core creole (D5). Parse and render
keep their seams.

```plantuml
@startuml
title sdd2 — sequence render path (proposed)
participant "preprocessor\n(core)" as pre
participant "parser +\ncommands" as parse
participant "layout\n(events, tiles)" as layout
participant "YGauge\n(new)" as gauge
participant "LiveBoxes\n(new)" as live
participant "creole seam\n(core DisplayCreole)" as creole
participant "renderer" as render

pre -> parse : lines (YAML stripped, includedef, style src)
parse -> layout : AST events (parallel, anchor, vmerge, reverseDefine live)
layout -> creole : label Display
creole --> layout : LabelBlock {width, height, primitives}
layout -> gauge : message / note tiles
gauge --> layout : MessageTileGauge {top, height, contactY}
layout -> live : addStep(y, kind) per life event
live --> layout : getStairs(participant, y)
layout -> render : geo nodes + paint
render --> render : SVG string (one pass)
@enduml
```

## Where each batch lands

| Batch | Stage |
|---|---|
| 1 | parser + commands |
| 2 | layout: YGauge, note tiles, LiveBoxes, LinkAnchor draw pass |
| 3, 4, 5 | layout: width, frames, labels, participants |
| 6 | creole seam |
| 7 | renderer (message drawing, chrome, banner) |
| 8 | preprocessor |
