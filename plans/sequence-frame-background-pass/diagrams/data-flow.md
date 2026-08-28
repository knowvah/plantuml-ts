# Data flow — the five passes, and where the missing one goes

`teoz/PlayingSpaceWithParticipants#drawU:218-227`. Pass 1 is the one this
mission adds; passes 2-5 already exist as `renderer.ts` steps 1-4.

```plantuml
@startuml
title Sequence render passes (upstream order)

participant "renderSequence" as R
participant "background walk" as BG
participant "lifeline pass" as LL
participant "head/foot pass" as HD
participant "foreground walk" as FG

R -> R : box englober backgrounds
note right : NOT upstream pass 1\nComponentRoseEnglober is unused\nunder sequencediagram/

R -> BG : renderEvent(e, theme, isBackground=true)
activate BG
BG -> BG : frame only\nBlotter band, then header outline
note right : every other kind returns ""\nmirrors the empty default\nAbstractComponent.drawBackgroundInternalU
BG --> R : svg
deactivate BG

R -> LL : lifelines + activations, per participant
LL --> R : svg
R -> HD : heads, then footboxes
HD --> R : svg

R -> FG : renderEvent(e, theme, isBackground=false)
activate FG
FG -> FG : messages, notes, dividers,\nframe tab path + outline + label
FG --> R : svg
deactivate FG
@enduml
```

## Emission order within one grouping frame

`GroupingTile#drawU:256-275` draws its own chrome, then recurses — so the
walk is depth-first **pre-order**, and the frame's header sits between the
messages that precede it and the messages it contains.

```plantuml
@startuml
start
:background walk reaches a frame;
if (frame has a non-transparent colour?) then (yes)
  :emit Blotter band(s);
  note right: split at each else\ngauge min + 1
else (no)
  :emit nothing;
  note right: group BackGroundColor\nis transparent (skin:103)
endif
:emit header outline rect;
note right: fill=none, stroke black 1.5
:recurse into children;
note right: children emit nothing\nin this pass
stop
@enduml
```
