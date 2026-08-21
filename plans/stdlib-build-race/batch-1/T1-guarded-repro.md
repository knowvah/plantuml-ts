# T1 — Commit the repro behind an env guard

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/stdlib-build-race`. **No `src/`** — stop 2. **No fix** — T2 and T4 own
that. If you fix the race here, T1's own evidence becomes unobservable.

T0 reproduced the race in `scripts_scratch/T0/`. Read `.agent-notes/sre-T0.md`
first: it carries the repro command, the exact failure signature, and how many
attempts a run needs.

## Task
1. Write `tests/integration/stdlib-build-race.test.ts`, promoting T0's harness
   into a real test. It must **skip by default** and run only when its env var
   is set — mirror how the repo already gates expensive suites rather than
   inventing a new convention (grep for existing `SVG_PARITY_TIMEOUT_MS`-style
   env reads and `describe.skipIf` usage).
2. Run it **on this unfixed tree** with the guard set, and record the failure
   **verbatim** in your note. This is the last batch in which that failure
   exists; after Batch 3 it should be gone, and T5 compares against what you
   record here.
3. Confirm the default-skipped path costs nothing: `npm test` wall-clock must
   be unchanged within noise, measured on a settled machine.

Read-only git only; no commits.

## Write-set
- `tests/integration/stdlib-build-race.test.ts`
- `.agent-notes/sre-T1.md`

## Read-set
- `.agent-notes/sre-T0.md` — repro command, signature, attempt count
- `scripts_scratch/T0/**` — the working harness
- `plans/stdlib-build-race/decisions.md` — D1, D4
- an existing env-gated suite, for the local convention

## Interface contracts
Report `{ envVar: string, testPath: string, prefixFailureQuoted: string }`.
T5 consumes `envVar` and `prefixFailureQuoted` to prove the fix flipped it.

## Acceptance
- Given no env var, when `npm test` runs, then the test SKIPS and the suite
  wall-clock is unchanged within noise against the 60.3 s ceiling.
- Given the env var, when run on this UNFIXED tree, then it FAILS with T0's
  signature — quoted verbatim in the note.
- Given the four gates, then all are green: a skipped test is not a red gate.
- Given the test file, then it explains in a doc comment why it is guarded —
  cost and timing-dependence — so nobody "helpfully" un-guards it later.

## Observability
N/A — no new observable operations.

## Rollback
Reversible: one new test file, one commit.

## Quality bar
Four gates green, coverage >= 90/90/90. `npm test` under 60.3 s on a settled
machine. Complexity hook: >500 lines/file, >30 NLOC/function, CCN >10, >5
params — extract a NAMED helper, never widen an exemption.

## Boundaries
- **Always:** verify the guarded test actually fails pre-fix; quote it raw.
- **Never:** touch `src/`; fix the race; leave the test running by default;
  run git write commands.

## Report (<=300 tokens)
The interface contract, the verbatim pre-fix failure, the default-skipped
wall-clock, and the four gates.
