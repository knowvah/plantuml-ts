# Data flow — the race, and what closes it

## Today: two concurrent runs share one mutable tree

Run A's `globalSetup` writes the tree, then its workers import out of it. Run
B's `globalSetup` deletes the tree to rebuild it. Nothing coordinates them,
because each run's guarantee is scoped to its own process.

```plantuml
@startuml
title Concurrent npm test runs racing on packages/*/generated/

participant "Run A\nglobalSetup" as AG
participant "Run A\nworker" as AW
participant "packages/stdlib-tupadr3\n/generated/" as FS
participant "Run B\nglobalSetup" as BG

AG -> FS : rmSync + mkdirSync\n(freshGeneratedDir)
AG -> FS : write tupadr3.remote.js
note right of FS : mtime is inside Run A
AG -> AW : workers spawn (A's guarantee holds\nwithin A's process only)
BG -> FS : rmSync (freshGeneratedDir)
note right of FS : tree deleted while A still needs it
AW -> FS : import tupadr3.remote.js
FS --> AW : ENOENT
AW --> AW : Cannot find module
@enduml
```

## After the fix: the lock serializes, the predicate makes B a no-op

The second builder waits, re-checks inside the lock, finds the tree complete,
and skips — so no `rmSync` ever runs while another run's workers are reading.

```plantuml
@startuml
title Lock plus content-derived skip

participant "Run A\nglobalSetup" as AG
participant "Run A\nworker" as AW
participant "build lock" as LK
participant "packages/stdlib-tupadr3\n/generated/" as FS
participant "Run B\nglobalSetup" as BG

AG -> LK : acquire
AG -> FS : rmSync + build
AG -> LK : release
AG -> AW : workers spawn
BG -> LK : acquire (waits if held)
BG -> BG : re-check up-to-date\n(content hash) INSIDE the lock
BG -> LK : release
note right of BG : skips: no rmSync
AW -> FS : import tupadr3.remote.js
FS --> AW : module
@enduml
```

## The residual hole (D3, accepted)

If Run B's inputs genuinely differ, its content hash will not match and it
rebuilds for real — `rmSync` included — while Run A's workers import. The two
runs are then testing different source, which the declined per-run isolated
directory would have separated. Documented, not fixed.
