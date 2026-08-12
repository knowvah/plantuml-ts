# Component map — what SI17 touches

Component diagram: the question is *what talks to what* (logical
structure), not where anything runs.

```plantuml
@startuml
title SI17 blast radius

package "class engine (src/diagrams/class)" {
  [class-layout-helpers] as H
  [class-port-rows] as R
  [class-dot-graph] as G
  [class-*-sizing] as Z
}

package "shared core (src/core)" {
  [svek-dot-emit] as S
  [svek-dot-emit-labels] as L
  [graph-layout-build] as B
  [cucadiagram/MethodsOrFieldsArea] as M
  [svek/Ports] as P
  [abel/EntityBase] as EB
}

package "consumers of the shared emitters" {
  [object / map / json] as OBJ
  [description] as DESC
}

H --> R : shield + port marks
Z --> R : measured geometry
R --> G : node.portRows
G --> S : nodes + edges
R ..> M : elect member rows
R ..> P : encodePortNameToId
G ..> EB : usePortP (ADR-2)
S --> L : rowPortTable
B --> L : layout-side table

S --> OBJ : same emitter
S --> DESC : same emitter
L --> OBJ
L --> DESC

note bottom of S
  IN SCOPE by maintainer ruling.
  Any change here is cross-type:
  run all five DOT gates and all
  three censuses in the same pass.
end note

note right of M
  Already ported and faithful.
  Zero callers from the class
  engine — that is the gap.
end note
@enduml
```

## Ownership, for parallel safety

| Component | Written by |
|---|---|
| `class-port-rows` | T1, then T2 — **sequential, one writer at a time** |
| `class-layout-helpers` | T2 only |
| `class-dot-graph` | T2 only |
| `svek-dot-emit` / `-labels` | T2 only, and only if genuinely required |
| `MethodsOrFieldsArea`, `Ports`, `EntityBase` | **read-only** — already faithful |
