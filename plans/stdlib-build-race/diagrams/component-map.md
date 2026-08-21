# Component map — what this mission touches

Everything in scope is test and build infrastructure. No `src/` component
appears here, and that is the point: the defect is in how tests prepare their
inputs, not in what the library does.

```plantuml
@startuml
title stdlib-build-race — affected components

package "test infrastructure" {
  [build-stdlib-globalsetup.ts] as GS
  [stdlib-remote-e2e.test.ts] as E2E
  [stdlib-build-race.test.ts] as RACE
}

package "build scripts" {
  [build-stdlib-packages.ts] as BUILD
}

folder "gitignored, shared by every run" {
  [packages/*/generated/] as GEN
}

GS --> BUILD : calls buildStdlibPackages\n(one caller, :87)
BUILD --> GEN : freshGeneratedDir\nrmSync + write
E2E --> GEN : imports tupadr3.remote.js
RACE --> BUILD : drives the race deliberately
RACE --> GEN : imports while build runs

note bottom of GEN
  Fixed repo-absolute path from __dirname.
  Not per-run, so concurrent runs collide.
end note
@enduml
```

| Component | Task | Change |
|---|---|---|
| `build-stdlib-packages.ts` | T2, T4 | up-to-date skip, then the lock |
| `build-stdlib-globalsetup.ts` | T3 | doc comment only |
| `stdlib-build-race.test.ts` | T1 | new, env-guarded |
| `stdlib-remote-e2e.test.ts` | — | read-only; the symptom site |
| `src/**` | — | untouched (stop 2) |
