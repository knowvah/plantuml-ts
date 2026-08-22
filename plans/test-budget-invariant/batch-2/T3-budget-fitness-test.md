# T3 — Fitness test: a lock-using test's budget must exceed the lock's wait

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/test-budget-invariant`. **You write no `src/`** — stop 1. This is the
mission's substance.

`acquireBuildLock` waits up to `DEFAULT_MAX_WAIT_MS` (30,000) before throwing a
message that names the lock. A test that acquires the lock and declares a
budget **below** that dies first, so the lock's diagnosis never surfaces and
the real failure arrives disguised. That has now happened twice — once already
documented in `tests/unit/stdlib-packages.test.ts`'s own comment (*"a TIMEOUT
wearing the costume of a packaging failure"*), and once at `:429`, which T1 has
now fixed.

Two occurrences, two missions, same shape. It should be a gate, not a comment.

## Task
Add an architecture fitness test asserting: **every test that acquires the
stdlib build lock declares a per-test budget greater than
`DEFAULT_MAX_WAIT_MS`.**

**The hard part, and the whole point (D2):** `:429` never mentions
`withStdlibBuildLock`. It calls `npmPackDryRun`, a **same-file helper** that
holds the lock. A fitness test that greps `it(...)` bodies for the helper name
would **miss the exact defect it exists to catch**. Detection must resolve lock
usage through same-file helper functions.

Transitive usage *across* files is **not** required — `:429`'s shape is
same-file, and that bounds the work. Say so in the test's own doc comment, so a
future reader knows the boundary is deliberate rather than an oversight.

**Prove it works by demonstration, not assertion.** Temporarily remove the
budget from a lock-using test that reaches the lock *through a helper*, run the
fitness test, **quote the failure**; restore it, run again, **quote the pass**.
A red/green proof against a *direct* call site only is insufficient — the
direct case is the easy one.

Read-only git only; no commits.

## Write-set
- `tests/architecture/stdlib-lock-test-budget.test.ts` (new; name is yours)
- `.agent-notes/tbi-T3.md`

Do **not** touch `tests/architecture/catalog.test.ts` — that is T4's, running
right now in parallel. Do not touch T1's constant or its call sites.

## Read-set
- `tests/architecture/stdlib-read-lock.test.ts` — the existing fitness test in
  this family; match its shape and its failure-message style
- `tests/unit/stdlib-packages.test.ts:400-440` — `npmPackDryRun` and the two
  siblings; this is the shape you must detect
- `scripts/build-stdlib-packages/build-lock.ts` — `DEFAULT_MAX_WAIT_MS`
- `tests/helpers/with-stdlib-build-lock.ts` — the entry point
- T1's new constant module
- `plans/test-budget-invariant/decisions.md` — D1, D2
- `plans/test-budget-invariant/diagrams/budget-invariant.md`

## Architecture decisions (LOCKED — conflict is stop 7)
- **D1** — a fitness test, not a convention.
- **D2** — must follow **at least one level of indirection**. A version that
  only finds direct calls is **not done** (stop 5), not a partial pass.

## Interface contracts
No exported API. The test's failure message must name the offending
`file:line`, the declared budget, and the threshold it failed — mirroring
`stdlib-read-lock.test.ts`'s style, so a failure is actionable without opening
the test.

## Acceptance
- Given every current lock-using test, when the fitness test runs, then it
  passes (T1 has already fixed the one violation).
- Given a lock-using test that reaches the lock **through a same-file helper**,
  when its budget is removed, then the fitness test **fails** — quoted, then
  restored and quoted passing.
- Given a test that acquires the lock directly with too small a budget, then it
  also fails.
- Given a test that does not touch the lock, then it is not flagged — no false
  positives on the ~16,000 other tests.
- Given the test's doc comment, then it states why the threshold is
  `DEFAULT_MAX_WAIT_MS` and that cross-file indirection is deliberately out of
  scope.

## Observability requirements
N/A — the fitness test IS the observability for this invariant.

## Rollback
**Reversible.** One new test file.

## Quality bar
Four gates green. Complexity hook blocks on write: >500 lines/file,
>30 NLOC/function, CCN >10, >5 params — extract a NAMED helper. Report
`npm test` duration with `uptime` **and** the daemon readings
(`suggestd|corespotlightd|mds_stores|biomesyncd|BiomeAgent`), settled first.
No ceiling.

## Boundaries
- **Always:** demonstrate red/green through the **indirect** shape; keep false
  positives at zero.
- **Never:** touch `src/`; weaken the check to make it pass; touch T4's file or
  T1's; run any git write command.

## Report (<=300 tokens)
The detection strategy and how it resolves indirection; the quoted red/green
proof **through a helper**; the false-positive check; the four gates. No
preamble.
