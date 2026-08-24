# Where each bucket falls out

One diagram, one question: **on the path from source text to a stamped
`data-diagram-type`, where does each of the 75 defects occur?** Every label
names the task that owns it.

Read it alongside the scope table in [../README.md](../README.md#the-measured-scope--verify-do-not-re-derive),
which names the mechanism and the file for each.

```plantuml
@startuml
title Routing path, and the stage each bucket fails at

start

:buildBlockUmls -- run the preprocessor over the block;

if (block usable?) then (no)
  :T9 -- preprocessor failure (1);
  note right
    nuvoja-46-dezu541.
    No mechanism yet: this task
    is scoped as diagnosis and
    may end in a stop.
  end note
  stop
endif

:detectUmlType -- probe the first 20 PREPROCESSED lines;
note right
  T5 owns two defects here (9):
  * the window is spent on sprite
    data or !include expansion
    before the body starts (6)
  * left-pointing arrows and the
    activate / note over family
    are never probed (3)
end note

if (any plugin accepts, in registration order?) then (yes)
  :the first accepting plugin wins;
  note right
    Five over-claims, five tasks (65):
    * T2 activity's swimlane pattern (9)
    * T3 json and yaml on brace text (16)
    * T4 the descriptive-signal veto (36)
    * T6 classAccepts inside {{ }} (3)
    * T7 the unanchored arrow (1)
  end note
else (no)
  :fall back to the plugin for the DETECTED type;
  note right
    Why T7 cannot close
    zuvila-56-nuda425 alone: the
    block is detected as sequence,
    so declining here routes it
    straight back to sequence.
    T6 must claim it positively.
  end note
endif

:the winning engine renders and stamps its type;
note right
  Engines that stamp nothing --
  activity among them -- read as
  NONE, which is why T2's bucket
  shows SEQUENCE to NONE rather
  than to ACTIVITY.
end note

:routing gate compares ours against the jar's;

stop

@enduml
```

## What the diagram is not saying

**Registration order is not a stage you can edit.** It is frozen
([../decisions.md#d1](../decisions.md#d1)): mirroring upstream's order moves
the gate 79 to 469. The order is compensating for the over-claim rates that
the five `accepts()` tasks reduce.

**A narrowing does not choose a destination.** The "first accepting plugin
wins" box is a loop over an ordered list, so removing one claimant hands the
fixture to the next, not to the right one. That is
[D2](../decisions.md#d2), and it is why three fixtures need two tasks each.
