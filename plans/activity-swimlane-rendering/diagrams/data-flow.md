# Where the lane is lost

The lane survives parsing and then falls out of the pipeline. Each task
below is marked with where it re-attaches it.

```plantuml
@startuml
title Activity swimlane: today (solid) vs after this mission (T3-T6)

participant "parser.ts" as P
participant "ast.ts" as A
participant "tile-layout.ts" as TL
participant "tiles/Gtile*" as G
participant "tile-coordinates.ts" as TC
participant "swimlane-context.ts" as SC
participant "renderer.ts" as R

P -> A : swimlane on every node kind
note right of A : the lane IS parsed and stored

A -> TL : nodes
TL -> G : construct tiles
note right of G #FFCCCC
  TODAY: the lane is DROPPED here.
  No live tile reads it.
  T3 threads it onto the tile base.
end note

G -> TC : self-sized tiles
TC -> TC : walkTile places one column
note right of TC #FFCCCC
  TODAY: placement is lane-blind.
  T5 offsets x by the lane origin.
end note

TC -> SC : lane names, one width for all
note right of SC #FFCCCC
  TODAY: max(120, root.width / n).
  T4 content-fits per lane.
end note
SC --> TC : SwimlaneGeo

TC -> R : geometry with a decorative lane overlay
R -> R : filled band, bold titles, dividers between lanes only
note right of R #FFCCCC
  T6: transparent band, full-height dividers
  at every boundary, titles centred and LAST.
end note
@enduml
```

## The ordering constraint

[D1]'s two phases exist because of a dependency, not a preference: a lane's
origin is the running sum of the widths before it, so no node can be placed
until every width is known.

```plantuml
@startuml
start
:T3 - tiles carry their lane;
:T4 - measure per-lane content extent
(lane-LOCAL coordinates);
:T4 - width = max(title, content) + padding;
:T5 - origin = sum of preceding widths;
:T5 - place nodes at lane origin + local x;
:T6 - draw dividers, band, then titles;
stop
@enduml
```
