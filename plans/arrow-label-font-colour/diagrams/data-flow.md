# Data flow — one class edge, `skinparam ArrowFontColor green` then `defaultFontColor red`

Oracle experiment b (`decisions.md`): the LATER `defaultFontColor` wins.
The sequence shows why the port needs no ordering logic — handlers run in
source order and each assignment overwrites (D4).

```plantuml
@startuml
participant "skinparam parser" as P
participant "skinparam-key-handlers" as H
participant "accumulator" as A
participant "theme-builder" as B
participant "resolveArrowLabelFont" as R
participant "class/renderer-edge" as C

P -> H : arrowfontcolor = green
H -> A : arrowFontColor = #008000
P -> H : defaultfontcolor = red
H -> A : text = #FF0000
H -> A : arrowFontColor = #FF0000 (root FontColor\ninherited by arrow, FromSkinparamToStyle.java:157)
A -> B : buildGraphOverride
B -> R : theme.colors.graph.arrowFontColor = #FF0000
R -> C : { family, size, color: #FF0000 }
C -> C : <text fill=#FF0000>, glyph <polygon fill/stroke=#FF0000>,\ntail/head fill = resolveCardinalityFontColor = #FF0000
@enduml
```
