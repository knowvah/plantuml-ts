# lad — data flow

One value, three carriers. The diagram shows the target (post-lad) path of
`skinparam lengthAdjust` for the two engine shapes; the jar lines each hop
mirrors are in the notes.

```plantuml
@startuml
title skinparam lengthAdjust, source to SVG (target state)
participant "parser +\nskinparam chain" as SP
participant "Theme /\nport SkinParam" as TH
participant "engine render()" as EN
participant "klimt UGraphicSvg\n(option.lengthAdjust)" as UG
participant "RenderFragment\n.lengthAdjust" as FR
participant "document shell" as SH

SP -> TH : lookup over the 3 names\n(SkinParam.java:1258-1269)
note right of TH : theme.lengthAdjust, or\ngetSkinParam().getlengthAdjust()\n(mindmap, wbs, salt)
TH -> EN : value or undefined (= spacing, D4)
alt klimt-shaped engine (D3)
  EN -> UG : basicSvgOption({ lengthAdjust })
  UG -> UG : textLength per <text> only when\nlength > 1 and SPACING | SPACING_AND_GLYPHS\n(SvgGraphics.java:703-705)
  UG --> EN : body (unwrapped by the engine)
end
EN -> FR : { ...fragment, lengthAdjust } when defined
FR -> SH : assembleDocumentShell(fragment)
SH -> SH : withLengthAdjustApplied: strip textLength under none
SH -> SH : withRootGroupAttributes -> rootGroupOpen(lengthAdjust)\n(SvgGraphics.java:155-158)
SH --> EN : <svg ...><g font-family lengthAdjust?>...</g></svg>
@enduml
```

The four re-routed engines (D2) enter this diagram at `RenderFragment` for
the first time: today they reach the generic `svgRoot`, which has no
`lengthAdjust` input and writes no `data-diagram-type`.
