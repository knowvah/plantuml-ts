# T0 — Reusable contention harness and baseline

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/stdlib-lock-sharing`. **You write no `src/`** — stop 1. **You write no
fix.** This task produces an instrument and a measurement.

`stdlib-run-isolation` (SI35) put 8 reader test files under the cross-process
build lock. Readers acquire it in the same **exclusive** mode a builder does,
so they serialise against peers they never needed to exclude. The orchestrator
measured this once by hand-patching `build-lock.ts` and reverting the patch —
that is not repeatable, and T4 needs to prove the redesign beat the baseline.

## Task
1. Build `scripts/measure-lock-contention.ts`: a committed, reusable way to
   record, per lock acquisition, **how long the caller waited** and **how long
   it then held**. It must work for a single `npm test` and for two concurrent
   suites, attributing samples per process.
2. Do NOT leave permanent instrumentation inside `build-lock.ts`'s hot path.
   `BuildLockOptions` already carries injectable seams (`log`, `now`); prefer
   those, or an opt-in env gate that is inert when unset. If you conclude a
   small permanent hook is unavoidable, say so and justify it — a hook that
   costs nothing when disabled is acceptable, silent overhead is not.
3. Capture the baseline on **current `main`**: one single run, and one pair of
   concurrent runs (use `COVERAGE_ISOLATE=1` for the concurrent pair, or the
   two suites will also collide on coverage — that is a separate, already-fixed
   defect, see `.agent-notes/coverage-tmp-race.md`). Report per configuration:
   acquisitions, total wait, total hold, mean hold, max hold, max wait, and
   how many acquisitions exceeded `maxWaitMs`.
4. Write `.agent-notes/lsh-T0.md` with the harness's usage and the baseline
   table.

**Reproduce the numbers; do not inherit them.** The README quotes 288/573
acquisitions and 54.7 s/229.6 s of waiting. If your measurement disagrees,
that is valuable — say so and show your working.

Read-only git only; no commits.

## Write-set
- `scripts/measure-lock-contention.ts`
- `.agent-notes/lsh-T0.md`

## Read-set
- `.agent-notes/stdlib-lock-budget.md` — the hand measurement and its method
- `scripts/build-stdlib-packages/build-lock.ts` — `acquireBuildLock` at `:295`,
  `BuildLockOptions` at `:89`, the poll loop at `:290`
- `tests/helpers/with-stdlib-build-lock.ts` — the reader entry point
- `plans/stdlib-lock-sharing/decisions.md` — D4

## Architecture decisions (LOCKED — a conflicting finding is stop 7)
- **D4** — mode will become an option on `acquireBuildLock`, defaulting to
  exclusive. Your harness must keep working once that lands, so measure via
  the public entry point rather than assuming today's single mode.

## Interface contracts
Report, and write into your note, a table with one row per configuration:
`{ configuration: 'single' | 'concurrent-pair', acquisitions: number,
totalWaitMs: number, totalHoldMs: number, meanHoldMs: number,
maxHoldMs: number, maxWaitMs: number, timeouts: number }`.
T4 consumes exactly this shape for its before/after.

## Acceptance
- Given the harness, when run against a single `npm test`, then it emits the
  contract above.
- Given the harness, when run against two concurrent suites, then it
  attributes samples per process and still emits the contract.
- Given `npm test` with the harness disabled, then there is no measurable
  overhead and no output — quote the check you used.
- Given the baseline, then it is your own measurement, with the machine load.

## Observability requirements
The harness IS the observability for this mission. No production SLIs — this
is developer tooling, not a service.

## Rollback
**Reversible.** A new script plus a note; reverting the commit removes both.

## Quality bar
Four gates green. Complexity hook blocks on write: >500 lines/file, >30 NLOC
/function, CCN >10, >5 params — extract a NAMED helper, never widen an
exemption.

Report `npm test` duration with the load (`uptime` plus
`ps -Aceo pcpu,comm | grep -E 'suggestd|corespotlightd|mds_stores'`), and
**wait for `corespotlightd` to fall to ~0 first**. No wall-clock ceiling.

## Boundaries
- **Always:** measure through the public entry point; state a load reading with
  every timing number; leave the harness inert when disabled.
- **Never:** touch `src/`; change lock behaviour; leave instrumentation running
  in the default path; run any git write command.

## Report (<=350 tokens)
The contract table for both configurations, whether it matched the README's
figures, the overhead check, and the four gates. No preamble.
