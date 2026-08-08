# Data flow — note measurement after F1-a

The highest-value change in the mission: `measureNote` currently models a note
body as flat `lineCount × 13`. This is the **proposed** flow, routing it
through the already-ported text-block model (ADR-3).

Sequence diagram: multiple participants exchanging messages, so *who* does what
matters.

```plantuml
@startuml
title F1-a — measureNote through BodyFactory.create3 (proposed)

participant "measureLeafNode" as Caller
participant "measureNote\nleaf-sizing.ts" as Note
participant "BodyFactory\n.create3" as Factory
participant "BodyEnhanced2" as Body
participant "isBlockSeparator\nBodyEnhancedAbstract" as Sep
participant "StringMeasurer" as Measurer

Caller -> Note : measure(display, opts)
note right of Note
  ADR-4: read
  opts.fontSize ?? NOTE_FONT_SIZE.
  Reading fontSpec.size regresses
  every plain note by 1px.
end note

Note -> Factory : create3(display, fontConfig)
Factory -> Body : build text block
Body -> Sep : classify each body line
Sep --> Body : separator | title | text

alt line is a block separator
  Body -> Body : decorate → 8px (untitled)
else separator carries a title
  Body -> Body : decorate → 17px (len > 4)
else embedded diagram opener
  Body -> Body : collapse to 42x42 fallback\n(EmbeddedDiagram.java:149)
else plain text line
  Body -> Measurer : measure run at its own font
  Measurer --> Body : width, height
end

Body --> Factory : block dimensions
Factory --> Note : TextBlock
Note --> Caller : width, height

note over Caller, Measurer
  Verify C1..C4 SEPARATELY (ADR-3).
  Subsumption of C3/C4 by this route
  is an expectation, not a measurement.
end note
@enduml
```

## Why this closes five fixtures

| Cause | Line | Fixtures |
|---|---|---|
| C1 block-separator geometry never applied | `:224` | `xufexu-38`, `pivudu-29` |
| C2 embedded-diagram opener never collapses | `:223` | `kovaxi-11`, `zidebi-71` |
| C3 `NOTE_FONT_SIZE` hardcoded, `opts.fontSize` ignored | `:221` | `tijexo-10` |
| C4 height blind to a run at the img-fallback font | `:224` | `nobiza-91` (residual) |

The jar's own arithmetic, with zero free parameters: note1
`5×13 + (8+17+8+8) + 10 = 116px`; note2 `78 + 41 + 10 = 129px`. Both must
reproduce exactly.
