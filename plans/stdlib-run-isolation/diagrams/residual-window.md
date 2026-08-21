# The residual window

Why the lock cannot close it: it is released when the *build* finishes, but
run A's readers start *after* that. Run B then acquires it legally and, if
the source genuinely changed, rebuilds — deleting the tree under A.

Verified to parse: rendered through this repo's own `render()` (9733-char
SVG, no syntax-error diagram) on 2026-08-21.

```plantuml
@startuml
title Residual window: changed inputs across two concurrent runs

participant "Run A\nglobalSetup" as AG
participant "build lock" as L
database "packages/*/generated/" as T
participant "Run A\nvitest worker" as AW
participant "Run B\nglobalSetup" as BG

AG -> L: acquire
AG -> T: rebuild (tree now complete)
AG -> L: release
note right of L: released BEFORE A's workers run\n(D3: holding it longer was rejected)
AG -> AW: spawn workers
AW -> T: import tupadr3.remote.js

BG -> L: acquire (legal, lock is free)
BG -> T: up-to-date check
note right of BG: source CHANGED, so the\ncontent hash mismatches
BG -> T: rmSync + rewrite
T --> AW: ENOENT or mid-rewrite body
note over AW: Cannot find module ...\nor a silently mismatched module
@enduml
```

**Unchanged inputs take a different path** and are already safe: B's
up-to-date check matches, so B skips and deletes nothing. That is the case
SI34 closed, and the case its committed repro exercises.
