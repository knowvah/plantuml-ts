# Lock modes: what changes

Today every acquirer is exclusive, so 573 reader acquisitions across two
concurrent suites queue behind one another for no safety benefit. After this
mission, readers hold concurrently and only a builder excludes them.

Verified to parse through this repo's own `render()` before the mission was
briefed — see the mission's decision journal for the check.

## Today — one mutex, everybody queues

```plantuml
@startuml
title Today: readers serialise against readers

participant "Reader A1" as A1
participant "Reader A2" as A2
participant "lock file" as L
participant "Builder B" as B

A1 -> L: acquire (exclusive)
L --> A1: granted
A2 -> L: acquire (exclusive)
note right of A2: blocks -- yet A1 and A2\nnever actually conflict
B -> L: acquire (exclusive)
note right of B: blocks (correctly)
A1 -> L: release
L --> A2: granted
A2 -> L: release
L --> B: granted
note over B: measured: 229.6s waiting\nto protect 35.9s of holding
@enduml
```

## After — shared readers, exclusive builder, writer priority

```plantuml
@startuml
title After: readers share; only a builder excludes

participant "Reader A1" as A1
participant "Reader A2" as A2
database "readers dir" as R
participant "writer lock" as W
participant "Builder B" as B

A1 -> W: no writer?
A1 -> R: create entry pid-0
A1 -> W: re-check no writer (D2)
note right of A1: closes the register/observe window

A2 -> W: no writer?
A2 -> R: create entry pid-1
note right of A2: proceeds concurrently\nno wait against A1

B -> W: acquire exclusive + publish intent (D3)
note right of B: new readers now queue\nbehind the intent marker
B -> R: wait for drain
A1 -> R: remove entry
A2 -> R: remove entry
R --> B: empty
note over B: builder proceeds; readers\nwere never blocked by peers
@enduml
```

## The invariant that must survive

A reader is never mid-read while a builder `rmSync`s
`packages/<pkg>/generated/`. That is exactly what SI35's option D bought, and
this mission must preserve it while removing only the reader-versus-reader
waiting. If a change removes waiting *and* weakens that invariant, it has
missed the point.
