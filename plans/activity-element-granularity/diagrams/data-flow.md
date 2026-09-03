# Data flow — one edge, before and after T1

The child-count deficit in one picture: upstream draws a `ULine` per segment,
we drew a single `polyline` for the whole path. `compareSvg` short-circuits
on the resulting child-count mismatch and charges the whole subtree.

```plantuml
@startuml
participant "layoutActivity" as L
participant "renderEdge" as R
participant "svg-shapes" as S
participant "compareSvg" as C

L -> R : edge.points (N points)

group before — one element for the whole path
  R -> S : polyline(pts)
  S --> R : one polyline element
  R -> C : root group holds 1 child for this edge
  C -> C : child count differs from jar
  note right of C : short-circuit:\ncharges sumUnits(both sides),\nsubtree never compared
end

group after — one element per segment, per Worm.java:134
  R -> S : line(x1,y1,x2,y2) called N-1 times
  S --> R : N-1 line elements
  R -> C : root group holds N-1 children for this edge
  C -> C : counts align, subtree compared for real
  note right of C : diffCount may RISE here.\nThat is the expected artefact,\nnot a regression.
end
@enduml
```
