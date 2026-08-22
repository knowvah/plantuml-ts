# The budget invariant: why a short timeout hides the real error

A test that acquires the stdlib build lock has two costs inside its own
per-test budget: how long it **waits** for the lock, and how long it **holds**
it. `acquireBuildLock` is willing to wait `DEFAULT_MAX_WAIT_MS` (30,000) before
throwing a message that names the lock. If the test's budget is shorter than
that, the test dies first — and the operator sees a generic timeout instead of
the lock's diagnosis.

Verified to parse through this repo's own `render()` before the mission was
briefed — see the mission's decision journal for the check.

## Today at `stdlib-packages.test.ts:429` — the test dies first

```plantuml
@startuml
title Budget 5000ms < lock maxWaitMs 30000ms: the lock never gets to speak

participant "test :429" as T
participant "vitest budget\n5,000 ms" as V
participant "build lock\nmaxWaitMs 30,000" as L
participant "npm pack\nsubprocess" as N

T -> L: acquire (shared)
note right of L: may legitimately wait\nup to 30,000 ms
L --> T: granted
T -> N: spawn npm pack --dry-run
note right of N: prepack copies 6,849 files\nmeasured 12.1 s standalone
V -> T: Test timed out in 5000ms
note over V: fires FIRST -- generic message,\nnames neither the lock nor npm pack
destroy T
@enduml
```

## The sibling at `:408` — budget 120,000 ms, so the real error survives

```plantuml
@startuml
title Budget 120,000ms > 30,000ms: whatever fails, reports itself

participant "test :408" as T
participant "vitest budget\n120,000 ms" as V
participant "build lock\nmaxWaitMs 30,000" as L
participant "npm pack\nsubprocess" as N

T -> L: acquire (shared)
L --> T: granted (or throws, naming the lock)
T -> N: spawn npm pack --dry-run
N --> T: result (or throws, naming npm pack)
note over V: budget outlives both,\nso the failure that occurs\nis the failure reported
@enduml
```

## The invariant

For every test that acquires the build lock:

```
declared budget > DEFAULT_MAX_WAIT_MS (30,000)
```

Below that line, the lock's designed error is unreachable and every lock
failure is misattributed. D1 makes this a fitness test; D2 requires that test
to see through `npmPackDryRun`-shaped helpers, because `:429` — the defect that
motivated the mission — never names the lock itself.
