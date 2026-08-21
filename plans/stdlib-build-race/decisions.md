# Architecture decisions — stdlib-build-race

Locked at planning, 2026-08-21, approved by the user the same day. A task that
finds a conflicting constraint **stops and journals it** (stop 7) rather than
silently overriding.

## D1 — A deterministic reproduction is required before any fix

**Context.** The bug fails 1 in 7 full-suite runs. At that rate, "it stopped
failing after the fix" is indistinguishable from luck.

**Decision.** T0 must produce a repro that fails **reliably**, and the
`rules/diagnosis.md` artifact — mechanism, origin `file:line`, causal chain,
what was ruled out — before any fix is written. If T0 cannot reproduce, the
hypothesis is wrong: **stop** (stop 1) and pivot to instrumenting `globalSetup`
completion vs. worker spawn ordering, the hypothesis SI33 flagged but could not
test.

**Consequences.** The fix is falsifiable. The mission can also legitimately end
at T0 with "the hypothesis was wrong, here is what we now know", which is a
better outcome than a plausible fix for an unproven cause.

## D2 — Reproduce with a two-process harness against the real build

**Context.** The race is between a writer (`buildStdlibPackages`) and a reader
(a worker importing `tupadr3.remote.js`).

**Decision.** Primary repro: process A runs the **real** `buildStdlibPackages`
while process B `import()`s `tupadr3.remote.js` in a loop. Secondary: a
unit-level pin calling `freshGeneratedDir` directly under a held import.

**Rejected.** Two concurrent full `npm test` runs — ~1 minute each and still
probabilistic, far too slow to iterate on.

**Consequences.** The repro exercises the actual code path rather than a mock,
so what it proves is about this repo and not about a model of it.

## D3 — The fix is a cross-process lock AND an idempotent up-to-date skip

**Context.** Each half alone leaves a window open.

- A lock alone is insufficient: Run A's *workers* import after A's
  `globalSetup` has already released the lock, so Run B acquires it legally
  and still `rmSync`s under them. Holding the lock for the whole run instead
  of the build is too coarse.
- An up-to-date skip alone is insufficient: Run B can observe Run A's
  **partial** tree, judge it stale, and `rmSync` it.

**Decision.** Both. The lock serializes builds; **inside** the lock the
up-to-date predicate is re-checked, so the second holder skips instead of
deleting. Together they close the window for the common case — two runs
building byte-identical output.

**Rejected: a per-run isolated output directory.** It would isolate fully, but
`tests/integration/stdlib-remote-e2e.test.ts:49,51` import fixed absolute paths
and each package's `package.json`/`prepack` references `generated/`. The
packaging blast radius is not worth it here. **The user declined this option
explicitly on 2026-08-21.**

**Residual hole, accepted and to be documented, not hidden.** If Run B
genuinely must rebuild (the source really changed mid-run), it still `rmSync`s
while Run A's workers import. That means the two runs are testing different
source — arguably it *should* be isolated, which is what the rejected option
would have bought. T5 documents this as a known limit.

## D4 — The up-to-date decision must be content-derived, never a count or mtime

**Context.** A permissive skip re-creates this repo's most expensive recurring
failure class: the stale cache that silently reported false conformance
(`object`: 0/80 reported vs 23/80 real). There is direct local precedent —
`build-stdlib-globalsetup.ts`'s own comment records that
`copy-assets.mjs#isUpToDate` is **file-COUNT based** and that this was part of
the SI12 breakage. Those `isUpToDate(expectedCount)` implementations still
exist in `packages/*/scripts/copy-assets.mjs`.

**Decision.** The predicate hashes the build inputs and the emitted manifest.
Never a file count. Never an mtime. **If the hash cannot be computed, REBUILD**
— never skip.

**Consequences.** A redundant rebuild costs seconds; a wrongly-skipped one
silently corrupts a test oracle. The asymmetry decides it. Violating this is
stop 5.

## D5 — Correct the `globalSetup` doc comment in every branch

**Context.** That comment asserts *"globalSetup completes before any worker
spawns, so no test ever observes a half-rebuilt tree."* True within one vitest
process; false across two. It is precisely what led SI33 to scope its search to
within-run writers and eliminate the real cause as unavailable.

**Decision.** Narrow the claim to its true scope, and name the concurrent-run
mechanism — **even if T0 disproves the hypothesis**, in which case it records
what was ruled out instead.

**Consequences.** The comment stops misdirecting the next reader, which is the
cheapest durable outcome this mission can produce.

## Routing

Autonomous execution. **T0** (the diagnosis) gets `debugger`; the rest get
`typescript-pro`. All sonnet — no task here requires multi-path architectural
reasoning, and the hard thinking is already recorded in D1–D5.
