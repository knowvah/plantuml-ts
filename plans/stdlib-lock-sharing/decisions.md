# Architecture decisions — stdlib-lock-sharing

Locked at planning, 2026-08-22, and confirmed by the user. A task that finds a
conflicting constraint **stops and journals it** (stop 7) rather than silently
overriding.

## D1 — Readers register presence as per-reader files in a directory

**Context.** A shared lock needs to know whether any reader currently holds
it. Three shapes were considered: a directory of per-reader files, a single
counter file updated read-modify-write, and heartbeat entries with a TTL.

**Decision.** Each reader atomically creates
`<lockPath>.readers/<pid>-<seq>`. The writer drains by waiting for that
directory to empty.

**Why the alternatives lose.** A counter file needs a non-atomic
read-modify-write on the filesystem — precisely the race class this whole line
of work exists to remove — and a crashed reader leaks the count permanently.
Heartbeats make correctness depend on wall-clock skew and on a refresh
interval beating its TTL, and add a timer to every reader; this repo avoids
wall-clock dependence in seeded paths.

**Consequences.** Reuses the `wx` create-if-absent atomicity the writer lock
already relies on, and lets stale reader entries be reclaimed by the same
PID-liveness + age rules already implemented for the writer. Costs one inode
per concurrently-held reader section.

## D2 — Reader acquire re-checks for a writer after registering

**Context.** Between "no writer present" and "my reader entry exists" a writer
can take the exclusive lock, and would then see an empty readers directory and
proceed while this reader believes it holds a shared lock.

**Decision.** Reader acquisition is: verify no writer lock → create the reader
entry → **re-verify no writer appeared**. If one did, remove the entry, back
off, and retry.

**Consequences.** Closes the register/observe window without needing a
second lock. The retry must respect `maxWaitMs` like every other wait path
(stop 2).

## D3 — Writer priority: a waiting writer blocks new readers

**Context.** With 573 reader acquisitions per concurrent pair, a builder
waiting for the readers directory to drain could be starved indefinitely by a
steady arrival of new readers.

**Decision.** A waiting writer publishes an intent marker. Readers arriving
while that marker exists queue behind it; readers already holding drain
normally.

**Consequences.** Bounds writer wait, which matters because a starved builder
means a stale `generated/` tree — the failure this lock exists to prevent. It
also means a reader can now wait on a writer that has not yet acquired; that
wait is still bounded by `maxWaitMs`.

## D4 — Mode is an option on `acquireBuildLock`, defaulting to exclusive

**Context.** `acquireBuildLock(repoRoot, options)` has three production
callers: the builder (`scripts/build-stdlib-packages.ts:293`), the reader
helper (`tests/helpers/with-stdlib-build-lock.ts:40`), and the lock's own
tests.

**Decision.** Add `mode: 'shared' | 'exclusive'` to `BuildLockOptions`,
defaulting to `'exclusive'`.

**Why not a separate `acquireSharedLock`.** Two entry points read more clearly
at call sites but duplicate the wait/stale/timeout loop or require a shared
internal anyway, and the fitness function would have to accept both shapes.

**Consequences.** Every existing caller and test keeps its current semantics
untouched, so the diff stays reviewable and the blast radius stays at 6 files.
`acquireBuildLock` is **not reentrant** (noted at
`tests/unit/stdlib-dts-import-specifier.test.ts:69`); adding a mode does not
change that, and shared mode must not silently make it appear reentrant.

## Routing

Autonomous execution. **T1** (the lock itself) and **T4** (measurement) get
`typescript-pro`; **T0** gets `typescript-pro`; **T2**/**T3** get
`typescript-pro`; **T5** gets `typescript-pro`. All sonnet. No task is routed
to a review-only agent — `architect-reviewer` has no `Write` or `Bash`
(learned the hard way in SI35 T2).
