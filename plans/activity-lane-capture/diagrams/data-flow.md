# Data flow — where a fork's lanes are read (after the mission)

Sequence, because the question is who reads the current lane, and when. The
same shape holds for split (Out read at `end split`) and repeat (Out read at
`repeat while`); `if` and `while` read only the opener lane.

```plantuml
@startuml
title Lane capture for a laned fork, after activity-lane-capture
participant "node-dispatch.ts\ntryFork" as D
participant "ParseContext" as C
participant "ast.ts\nActivityFork" as A
participant "tile-layout.ts\ntileFork" as L
participant "walk-fork-branches.ts" as W
participant "swimlane-lanes.ts" as S

D -> C : read currentSwimlane at "fork"
D -> C : parseNodes(branch) until "fork again"
D -> C : read currentSwimlane at "fork again"
D -> C : read currentSwimlane at "end fork"
D -> A : build swimlane (at fork) and swimlaneOut (at end fork)
A -> L : ActivityFork node
L -> W : GtileFork carrying swimlane and swimlaneOut
W -> S : laneIn(fork) for the top bar and in-connectors
S --> W : swimlane
W -> S : laneOut(fork) for the join bar and out-connectors
S --> W : swimlaneOut
@enduml
```
