# How an edge label becomes a reserved box

Both batches 1 and 2 sit on this path. Batch 1 fixes what the measurement
produces; batch 2 fixes how it reaches the engine.

Colour and formatting tags are described in prose below rather than written
literally, because a creole tag inside a diagram is parsed as markup.

```plantuml
@startuml
title Edge label to reserved box

start
:link label text;
note right
  may carry newlines
  and inline formatting tags
end note

if (which engine?) then (state)
  :computeReservedLabelBox;
  note right: already correct
else (class / description)
  :measureLineWithAtoms;
  note right
    single line only
    tags counted as glyphs
    default font size
  end note
endif

:width and height;

if (labelBox fields set?) then (yes)
  :emit FIXEDSIZE table;
  note right: engine reserves the declared size
else (no)
  :emit plain text label;
  note right
    engine measures the text
    and reserves 16.5 per line
  end note
endif

:DOT handed to the layout engine;
stop
@enduml
```

**Batch 1** removes the left-hand branch: class and description join state on
`computeReservedLabelBox`, with markup stripped and the arrow font size
honoured.

**Batch 2** removes the lower branch: every engine populates the box fields, so
the engine reserves the declared size instead of measuring text.
