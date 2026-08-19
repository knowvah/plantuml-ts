# Data flow — where each defect fires

Sequence diagram: one concurrent-region sizing pass, the flow that carries
G17, G21 and G20a. Participants are modules, and each `x` marks where the
current code diverges from the jar.

```plantuml
@startuml
title SI31 — concurrent-region declared-size pass

participant "state-composite-\nconcurrent.ts" as CONC
participant "state-composite-\npass.ts" as PASS
participant "state-composite-\npseudo.ts" as PSEUDO
participant "graph-layout.ts\n(engine seam)" as GL
participant "state-transition-\nlabel.ts" as TL
participant "layout-ink-\nextent.ts" as INK

CONC -> PASS : newAccumulator()
note right
  **G21** called with no arguments,
  so labelFont and measurer are
  absent from the accumulator
end note
PASS --> CONC : acc (no measurer)

CONC -> CONC : states.map(resolveMember)\npushes member nodes
CONC -> PSEUDO : addLocalPseudoNodes(...)
PSEUDO --> CONC : appends [*] circles AFTER members
note right
  **G20a** the jar registers the [*]
  pseudo FIRST when it is the first
  reference (StateDiagram.java:92-107)
end note

CONC -> PASS : runPass(acc)
PASS -> GL : layoutGraph(acc.nodes verbatim)
GL --> PASS : result (nodes, edges, canvas w/h)
PASS --> CONC : p.result

CONC -> TL : attachTransitionLabel(...)
TL -> TL : measured = measureLabel(acc.measurer)
note right
  measurer is absent, so measured is
  undefined: the real labelX/labelY
  are discarded and the legacy
  perpendicularOffsetLabel is used;
  label.inkBox is never set
end note
TL --> CONC : anchor point only, no box

CONC -> INK : computeSvekResultGeometry(states, transitions)
INK --> CONC : ink (missing the label box;\n{0,0} when the region is note-only)

CONC -> CONC : regionInkGeometry:\nmax(ink, p.result)
note right
  **G17** for a note-only region ink is
  {0,0}, so the raw graph canvas wins —
  and it carries dot-engine's flat +12,
  not the jar's SvekResult +15
  (SvekResult.java:130-135)
end note

@enduml
```

## Reading it

All three defects are on one pass, which is why the batches are serial: each
changes an input the next one reads. G21 restores the label box that G17's
`Math.max` then compares against, and G20a changes the node order that
produces `p.result` in the first place.
