# How a text metric travels

D1 in one picture: **layout measures, the geometry carries, the renderer
formats.** The renderer never holds a measurer, so it can never disagree with
the layout that sized the box.

D8 amends the *carrier* only: the metrics ride on each `TextRun`, not as
scalars on the geometry type. The flow below is unchanged in every other
respect.

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

L -> G : TextRun\n(x, y, textWidth,\ntextAscent, textLineHeight)
note right of G
  Metrics are required ON THE RUN (D8).
  A run is the thing that has a width:
  a stereotyped head is two runs,
  a note body is N.
  scale-geo multiplies all three by k.
end note
G -> R : ParticipantGeo
R -> R : leftX = centerX - run.textWidth / 2
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
