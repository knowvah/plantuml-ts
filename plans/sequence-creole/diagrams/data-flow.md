# How a creole label becomes markup

One display string, several runs, several sibling `<text>` elements. The jar
emits creole this way — no `<tspan>` — and the parent mission's `TextRun` array
is already the right carrier (decisions.md D3).

```plantuml
@startuml
title C1 + C3 — `Alice -> Bob : a <b>bold</b> label`

participant "layout\n(text-block-geo)" as L
participant "sequence-creole.ts" as SC
participant "creole engine\n(classify + build)" as CE
participant "creole-atoms-\nmeasure" as M
participant "MessageGeo\nlabelLines" as G
participant "renderer-message" as R
participant "sequence-text.ts" as T

L -> SC : line, fontSpec
SC -> CE : classifyStripeLine + buildLineAtoms
CE --> SC : three atoms\n"a ", "bold", " label"
note right of CE
  Only the middle atom
  carries FontStyle.BOLD
end note
SC -> M : measure each atom
M --> SC : per-atom width
SC -> SC : advance x by\neach preceding width
SC --> L : three TextRuns
L -> G : labelLines
note right of G
  D3 — one atom, one run.
  Each keeps its own
  textWidth, ascent, style.
  scale-geo scales all three.
end note
G -> R : MessageGeo
R -> T : per run: leftX, baselineY,\nwidth, style
T --> R : three sibling text elements
note right of T
  D5 — the renderer never
  measures. A url-bearing run
  wraps in linkWrap here.
end note
@enduml
```

## What this replaces

```plantuml
@startuml
title Today — the markup survives into the output

participant "text-block-geo" as L
participant "sequence-text.ts" as T

L -> L : split on real newlines only
note right of L
  The escaped form is not
  split at all: C2 fixes that
  with DisplayNewlines.
end note
L -> T : ONE run, text unparsed
T --> T : one text element reading\n"a &lt;b&gt;bold&lt;/b&gt; label"
note right of T
  A sequence TITLE does not do
  this: chrome already parses
  creole. Only the engine body
  does.
end note
@enduml
```
