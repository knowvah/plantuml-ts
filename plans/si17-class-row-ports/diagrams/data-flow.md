# Data flow — how a `A::member` edge acquires its port

Sequence: *who* calls whom matters here (several components exchange the
port name and its md5), so this is a sequence diagram rather than an
activity one.

## Target flow (what T2 builds)

```plantuml
@startuml
title Class member-row port — target flow

participant "class parser" as P
participant "shieldedClassifierIds\n(class-layout-helpers)" as H
participant "applyShapeAndPorts\n(class-port-rows)" as A
participant "classPortRows\n(T1)" as C
participant "MethodsOrFieldsArea\n#getPorts" as M
participant "buildDotEdgeAttrs\n(class-dot-graph)" as E
participant "edgeRef / rowPortTable\n(svek-dot-emit)" as S

P -> H : relationship carries fromPort / toPort
note right of H
  ADR-2: member ports no longer
  mark isPort. Qualifiers unchanged.
end note

P -> A : classifier + measured geometry
A -> C : has port short names?  (ADR-4: count, not election)
C -> M : elect a member row per short name
M --> C : PortGeometry(position, height, score)
C --> A : DotInputPortRow[]
A -> S : node.portRows  =>  shape=plaintext

P -> E : relationship with port name
E -> E : encodePortNameToId(shortName)
note right of E
  ADR-3: emitted unconditionally,
  even when no row matches.
end note
E -> S : tailport / headport
S --> S : sh0007 colon p<md5>
@enduml
```

## The dangling-port case (`bicabi-42`, jar-proven)

The node declares **no** port row, and the edge still carries the suffix.
This is upstream behavior, not a bug to guard against — see
[ADR-3](../decisions.md).

```plantuml
@startuml
title Zero-election control — bicabi-42-coto932

start
:link names port "Window";
:entity Gtk gains a port short name;
if (any member elected?) then (no)
  :table is ONE filler row\nheight = (int)(nodeHeight - 0);
  :no PORT attribute anywhere;
else (yes)
  :one TR per elected band;
endif
:edge endpoint still gets\ncolon p<md5> suffix;
stop
@enduml
```
