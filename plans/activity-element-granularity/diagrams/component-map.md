# Component map — what this mission touches

Only the two activity render files change. The shared primitives are called
differently, never modified — that boundary is [D2] and [D3], and it is what
keeps sequence and json from moving.

```plantuml
@startuml
skinparam componentStyle rectangle

package "activity engine (CHANGED)" {
  component [renderer.ts] as R
  component [activity-renderer-shapes.ts] as S
}

package "core primitives (UNCHANGED)" {
  component [svg-shapes.ts] as P
  component [creole-svg.ts] as C
}

package "other engines (MUST NOT MOVE)" {
  component [sequence] as SEQ
  component [json] as JSON
}

R --> P : "T1 calls line() per segment,\nno longer polyline()"
S --> P : "T2 calls ellipse(cx,cy,r,r),\nno longer circle()"
R --> C : "T3 keeps tspan WITHIN a line"
S --> C : "T3 keeps tspan WITHIN a line"
SEQ --> P : "still calls circle() —\nprimitive unchanged"
JSON --> P : "still calls circle() —\nprimitive unchanged"
SEQ --> C : "shared creole, untouched"

note bottom of P : Five call sites move.\nThe file itself does not.
@enduml
```
