# Where owners live, and where they must not

The rule is D1: an owner module mirrors the upstream package and file that
declares the field. D6 forbids the shortcut of one engine importing from
another.

```plantuml
@startuml
title Allowed (green) vs forbidden (red) constant ownership

package "src/core (owners mirror upstream packages)" {
  [svek/SvekResult.ts] as SR
  [<new owner modules>] as NEW
}

package "src/diagrams" {
  [class] as CLASS
  [description] as DESC
  [state] as STATE
  [activity] as ACT
}

CLASS -[#green]-> SR : INK_DELTA, JAR_INK_MARGIN
DESC  -[#green]-> SR
STATE -[#green]-> SR

CLASS -[#green]-> NEW : batch 2
DESC  -[#green]-> NEW
STATE -[#green]-> NEW

ACT   -[#green]-> ACT : batch 3, owner INSIDE the engine

STATE -[#red]-> CLASS : FORBIDDEN (decision D6)

note bottom of NEW
  One module per upstream FILE.
  Never a src/core/constants.ts
  grab-bag (decision D1).
end note

note right of ACT
  Intra-engine clusters need no
  core owner at all (decision D3).
end note
@enduml
```

## The three outcomes a duplicate can have

```plantuml
@startuml
title Classifying one duplicated constant

start
:read the Java for every site;
if (one upstream field?) then (yes)
  if (all sites in ONE engine?) then (yes)
    :owner inside that engine;
    note right: batch 3
  else (no)
    :owner in src/core, mirroring
    the upstream package;
    note right: batch 2
  endif
  :replace duplicates with imports;
else (no / cannot establish)
  if (same name, different values?) then (yes)
    :RENAME so they stop
    reading as duplication;
    note right: batch 4
  else (no)
    :leave duplicated,
    record the reason;
    note right: a NO is a result
  endif
endif
stop
@enduml
```
