# Data flow — measurement, before and after

Sequence diagrams: the question is *who calls whom, in what order*, across
several participants.

## Today — the faithful object is used as a calculator, then discarded

```plantuml
@startuml
title Class engine today
participant "class/index.ts" as Plugin
participant "class-layout-leaf-shapes" as Sizer
participant "EntityImageDescription" as EID
participant "TextBlockInEllipse" as TBIE
participant "class/renderer.ts" as Renderer
participant "usymbol-shapes.ts" as Shapes

Plugin -> Sizer : measureUsecaseOrActor(classifier, font, measurer)
Sizer -> EID : construct, then calculateDimensionSlow(bounder)
EID -> TBIE : calculateDimension()
TBIE --> EID : dimension only; fit centre stays internal
EID --> Sizer : XDimension2D
Sizer --> Plugin : width and height
note over Plugin
  the fitted centre is discarded here
  and the object is dropped
end note

Plugin -> Renderer : render(geo, theme)
Renderer -> Shapes : renderUseCaseIcon(node, theme)
note over Shapes
  label placed at the constant cy - 2 + fontSize/3
  the jar's offset is content-dependent
end note
Shapes --> Renderer : ellipse plus label markup
@enduml
```

## After SI14 — the object draws itself, as upstream does

```plantuml
@startuml
title Class engine after SI14
participant "class/index.ts" as Plugin
participant "class/renderer.ts" as Renderer
participant "document-shell.ts" as Frag
participant "UGraphicSvg" as UG
participant "EntityImageDescription" as EID
participant "TextBlockInEllipse" as TBIE

Plugin -> Renderer : render(geo, theme) with geo.measurer
Renderer -> EID : construct from the same params the sizer used
Renderer -> Frag : renderDrawableToFragment(image, uid, measurer)
Frag -> UG : build(...)
Frag -> EID : drawU(ug)
EID -> TBIE : drawU(ug)
TBIE -> UG : draw ellipse, then translate by dx and dy - 2
note over TBIE
  dx and dy come from the fit this same
  object computed in its constructor
end note
TBIE -> UG : getStringBounder() for text measurement
Frag --> Renderer : body and extraDefs
Renderer --> Plugin : RenderFragment
@enduml
```

## Why the second diagram has no "pass the centre" arrow

That is the point of the mission. Upstream shares the **object**
(`IEntityImage extends TextBlock`, fit computed once in the constructor) and the
**measurer** (`ug.getStringBounder()`). No coordinate crosses a boundary. If an
implementation finds itself adding an arrow carrying a number from the sizer to
the renderer, it has taken the wrong approach — see `../decisions.md`.
