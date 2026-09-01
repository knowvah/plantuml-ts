# How a text metric travels

D1 in one picture: **layout measures, the geometry carries, the renderer
formats.** The renderer never holds a measurer, so it can never disagree with
the layout that sized the box.

```plantuml
@startuml
title Phase A — a participant label, from measurement to markup

participant "StringMeasurer" as M
participant "sequence-layout-\nparticipants.ts" as L
participant "SequenceGeometry" as G
participant "renderer-participant-\nshapes.ts" as R
participant "sequence-text.ts" as T

L -> M : measure(label, fontSpec)
M --> L : width, height
L -> M : getDescent(fontSpec)
M --> L : descent
note right of L
  ascent = height - descent
  Jar-verified: 14pt gives 10.8889
  against the jar's 27.889 - 17
end note

L -> G : textWidth, textAscent, textLineHeight
note right of G : required fields, scaled by scale-geo
G -> R : ParticipantGeo
R -> R : leftX = centerX - textWidth / 2
note right of R : D4 — derived, never stored
R -> T : leftX, baselineY, width, font
T --> R : one text element
note right of T
  D3 — the only emitter.
  No anchor can be reintroduced
  without editing this file.
end note
@enduml
```

## What this replaces

```plantuml
@startuml
title Today — the renderer guesses

participant "renderer-frame-\nheader.ts" as R
participant "svg-shapes.ts" as S

R -> R : textAscent(fontSize)\n= size - size / 4.5
note right of R
  Exact for the three production
  measurers. WRONG for FixedMeasurer,
  which returns lineHeight / 4.5.
  A latent sizer and renderer split.
end note
R -> S : centre, anchored, no width
S --> R : text element with an anchor\nand no textLength
@enduml
```
