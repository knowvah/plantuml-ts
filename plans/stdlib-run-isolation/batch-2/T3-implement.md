# T3 — Implement the approved mechanism (option D)

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/stdlib-run-isolation`. **You write no `src/`** — stop 2.

**Gate cleared.** The user approved **option D** on 2026-08-21 at the
stop-3 decision gate: *extend the existing cross-process build lock to cover
readers*, so that the 8 in-worker consumers of `packages/<pkg>/generated/`
hold the lock across their canonical-path section and therefore cannot be
reading while another process rebuilds.

Option D was **not** the ADR's recommendation (that was A). The user chose it
because D closes the 2 `npm pack` tests, which A and B structurally cannot
reach. The accepted trade, disclosed before the choice, is up to 30 s of
reader-side tail latency under contention and a new coupling from test files
to `build-lock.ts`.

T3 builds the mechanism and hardens the lock. **T4 converts the 8 call
sites** — do not convert them here; that write-set belongs to T4.

## Two hazards you MUST design against (verified by the orchestrator, not guesses)

The lock was built for a **builder**: it holds the lock for about a second,
once per process, outside any worker. Option D repurposes it for **readers
inside vitest workers**. Two consequences follow, and both are yours to
handle:

1. **The lock steals itself after 60 s, and `release()` does not check
   ownership.** `isStale` (`build-lock.ts:196-210`) reclaims a *parsed* lock
   when `!isProcessAlive(pid) || now - acquiredAt > staleAgeMs`, where
   `DEFAULT_STALE_AGE_MS = 60_000`. That is deliberate and correct for a
   builder — the doc comment says a live-but-wedged holder is as dangerous as
   a dead one. But `acquireBuildLock`'s returned `release()` is an
   unconditional `rmSync(opts.lockPath)` (`:270`). So if any holder outlives
   60 s: mutual exclusion is silently lost, **and** that holder's `release()`
   then deletes a lock belonging to whoever reclaimed it. Make `release()`
   ownership-safe — release only if the file still names this acquisition —
   and keep every reader critical section far below 60 s. If you conclude the
   ownership check is unnecessary, you must say why in as many words.
2. **Acquisition blocks synchronously.** `sleepSync` (`:128`, wired at
   `:147`) is "a genuine synchronous sleep, not a spin loop and not a timer",
   and `acquireBuildLock` calls it in its poll loop (`:290`). Inside a vitest
   worker that freezes the event loop for up to `maxWaitMs` = 30 s. With 8
   readers contending this may dominate suite wall-clock or trip per-test
   timeouts. **Measure the suite impact; do not assume it.**

Cleared already, so do not re-investigate: `prepack` cannot re-enter the
lock. `packages/stdlib-{aws,tupadr3}` `prepack` runs `copy-assets.mjs` only;
`stdlib` and `stdlib-all` have no `prepack`. No pack test can deadlock
against a lock its own parent holds.

## Task
1. **TDD — tests first.** Build one named helper that runs a callback with the
   stdlib build lock held, for use by reader tests. It must support both sync
   and async callbacks (several call sites `await import(...)` inside the
   critical section) and must always release in a `finally`.
2. Harden `build-lock.ts` per hazard 1: an ownership-safe `release()`.
   Preserve every existing behaviour — dead-PID reclaim, corrupt-content
   grace, bounded wait, the `wx` atomic create. `tests/unit/build-stdlib-lock.test.ts`
   must stay green; extend it rather than weakening it.
3. Keep the critical section as narrow as the call site allows. The helper
   should make the narrow thing the easy thing.
4. Log any new decision point so a future run is readable from its output.
5. **Verify against T0's harness** — it is still on disk at
   `scripts_scratch/T0/`. Re-run the reproduction and quote before and after.
   Note honestly that T0's harness races a *builder* against a *bare* reader:
   until T4 converts the call sites, the harness's own reader is not lock-aware,
   so a genuine "after" may require pointing the harness at the new helper.
   Say exactly what you did.

Read-only git only; no commits.

## Write-set (pinned by the orchestrator — do not write outside it)
- `tests/helpers/with-stdlib-build-lock.ts` (new; name is yours to choose,
  but keep it in `tests/helpers/`)
- `tests/unit/with-stdlib-build-lock.test.ts` (new; match the helper's name)
- `scripts/build-stdlib-packages/build-lock.ts`
- `tests/unit/build-stdlib-lock.test.ts`

**Do not touch the 8 consumer files — they are T4's.** If the work requires a
file no task owns, stop and report.

## Read-set
- `planning/adr/ADR-003-stdlib-run-isolation.md` — the approved option D
- `.agent-notes/sri-T0.md`, `sri-T1.md`, `sri-T2.md`
- `scripts/build-stdlib-packages.ts` (see `:293-302` for the existing
  critical section) and `scripts/build-stdlib-packages/build-lock.ts`
- `plans/stdlib-run-isolation/decisions.md` — D2, D3
- `plans/stdlib-run-isolation/decision-journal.md` — the 2026-08-21 entries
- `scripts_scratch/T0/` — the reproduction harness

## Architecture decisions (LOCKED — a conflicting finding is stop 7: journal it, never override)
- **D2** — do not change what any package publishes (`main`, `types`, every
  `exports` subpath, `files`). Option D does not authorise any such change.
  Violating this is stop 5.
- **D3** — preserve the pack tests' ability to exercise the **real** published
  layout. A change that makes a pack assertion pass by no longer testing the
  real thing is a regression disguised as a fix.

## Acceptance
- Given T0's harness re-run, then the result is quoted before and after, with
  an honest statement of what the harness could and could not prove at this
  stage.
- Given `tests/unit/build-stdlib-lock.test.ts`, then every pre-existing
  behaviour still passes and the ownership-safe release is covered by a new
  test that fails against the old unconditional `rmSync`.
- Given the helper, then it is covered for: sync callback, async callback,
  release on throw, and release-after-reclaim (hazard 1).
- Given the suite, then `npm test` duration is measured and reported with the
  machine load. There is no ceiling — but an unexplained jump is a finding,
  and a faster suite is never a reason to weaken a test.

## Quality bar
Four gates green, coverage >= 90/90/90, TDD. Complexity hook: >500 lines/file,
>30 NLOC/function, CCN >10, >5 params — extract a NAMED helper, never widen an
exemption.

Report `npm test` duration with the load: run `uptime` and
`ps -Aceo pcpu,comm | grep -E 'suggestd|corespotlightd|mds_stores'` immediately
before, and **wait for `corespotlightd` to reach ~0** — heavy file churn
re-triggers Spotlight indexing and has burned readings on this mission twice.

## Boundaries
- **Always:** TDD; re-run T0's harness as the proof; measure the suite; keep
  critical sections narrow.
- **Never:** touch `src/`; touch the 8 consumer files (T4 owns them); change
  the published surface; weaken a pack test to make it pass; run any git write
  command.

## Report (<=350 tokens)
The mechanism as built; the ownership-safe release and its new test; the
before/after on T0's harness with its honest caveat; the suite cost with load;
the four gates.
