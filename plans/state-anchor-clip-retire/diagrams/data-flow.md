# Data flow — where the clip runs, before and after

## Today (the divergence)

The clip runs inside the ink walk only, so the renderer reads a different
curve from the one that was measured.

```plantuml
@startuml
participant "layout.ts" as L
participant "TransitionGeo" as G
participant "layout-ink-transition" as I
participant "state-renderer-transitions" as R

L -> G: build points (UNCLIPPED)
G -> I: addTransitionInk(points)
I -> I: clipTransitionPoints(points, anchorRects)
note right of I: clip applied HERE only\nSvekEdge.java:671-672
I --> L: ink extent (from clipped curve)
G -> R: points (STILL UNCLIPPED)
R -> R: draw path + arrowhead
note right of R: draws the in-cluster segment\nthe jar discards
@enduml
```

## After (upstream's shape)

One pass clips every transition after node geometry is final; both consumers
read the same clipped curve.

```plantuml
@startuml
participant "layout.ts" as L
participant "solve-pass" as S
participant "TransitionGeo" as G
participant "layout-ink-transition" as I
participant "state-renderer-transitions" as R

L -> L: materialize node geos (positions final)
L -> S: solveTransitions(all transitions)
S -> S: clipSplineStart / clipSplineEnd
note right of S: ports DotStringFactory.solve's\nedge loop (:441-467)
S --> G: points (CLIPPED, once)
G -> I: addTransitionInk(points)
I --> L: ink extent
G -> R: points (same clipped curve)
R -> R: draw path + arrowhead
note right of R: arrowhead from clipped path\nSvekEdge.java:679-684
@enduml
```
