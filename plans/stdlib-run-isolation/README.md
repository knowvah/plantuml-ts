# Mission: stdlib-run-isolation

**Close — or formally, permanently accept — the residual hole
`stdlib-build-race` (SI34) left open by design.** That mission fixed the
common case and said so plainly. This one addresses what it could not, and
is allowed to conclude that the right answer is "accept and stop".

**Branch:** `fix/stdlib-run-isolation` (from `main` at or after `2202f55c`)
· **Merge:** merge commit · **Agents run no git** — the orchestrator commits
each task by pathspec.

## The residual, as SI34 recorded it

Two concurrent `npm test` runs over **identical** source are safe: the
content-derived skip (`isGeneratedDirUpToDate` / `isSpriteSplitUpToDate`)
means the second run recognises a complete tree and deletes nothing, and the
cross-process lock means it never observes a *partial* one.

Two runs that **straddle a genuine source change** are not. Run B must
rebuild, so it `rmSync`s `packages/<pkg>/generated/` while run A's workers
are still importing out of it. Symptom: the original
`Cannot find module .../generated/<file>.js`, or — worse because it is
silent — an import that resolves mid-rewrite and yields a mismatched module
body.

The lock cannot fix this. Per D3 it is released when the build finishes,
before that same process's workers run; holding it for the whole test run
was considered and rejected as too coarse.

## What this mission must NOT assume

**The fix is not pre-decided.** The obvious candidate — a per-run isolated
output directory — was **explicitly declined by the user on 2026-08-21**
(`plans/stdlib-build-race/decisions.md` D3) on packaging blast-radius
grounds. This mission exists to revisit that with the blast radius
**measured instead of asserted**, and the user, not an agent, decides.

Two corrections to the record that motivated re-opening it:

- SI34's close-out cited **two** import sites. The real count is at least
  **six** test files reading the canonical tree — see T0. The declined
  option was judged against an under-count.
- `generated/` is not merely a build output. It is `main`, `types`, and
  **every `exports` subpath** for all four `@knowvah/plantuml-stdlib*`
  packages. Relocating it is not a path change; it changes what the
  packages publish. That makes the original concern *more* serious than
  stated, not less.

Both facts must be verified independently in T0. Do not inherit them.

## Batches

| Batch | What | Tasks | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | Reproduce the residual · census the readers — **PIVOT GATE** | T0, T1 | [x] |
| [1](batch-1/overview.md) | Options ADR with measured cost — **STOPS FOR THE USER** | T2 | [x] |
| [2](batch-2/overview.md) | Implement the approved option | T3, T4 | [x] |
| [3](batch-3/overview.md) | Verify and close out | T5 | [x] |

Batch 0 is parallel (disjoint write-sets). Everything after is serial:
the ADR gates the implementation, and the user gates the ADR.

## Quality gates (after every batch)

```
- command: npm test
  pass: exit 0 (coverage >= 90/90/90)
  on_fail: fix_and_rerun
- command: npm run typecheck
  pass: exit 0 (both tsconfigs)
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0 (3 pre-existing [unplugin:dts] notes are NOT a failure)
  on_fail: fix_and_rerun
- command: git diff --name-only -- src/
  pass: EMPTY. Any output is stop 2.
  on_fail: stop
- command: npx jiti scripts/render-manifest.ts --out /tmp/sri-manifest.json && python3 plans/state-declared-size-fix/scripts/manifest-diff.py test-results/render-manifest-baseline.json /tmp/sri-manifest.json plans/stdlib-run-isolation/expected-moves.txt
  pass: "0 unexpected"
  on_fail: stop
```

**Wall-clock: measure and report it; there is no hard ceiling.** The suite is
past 16,000 tests and the user has confirmed it may take as long as it needs —
the 60.3 s figure inherited from earlier missions is **advisory context, not a
gate**. Do not trade correctness, coverage, or a faithful test for speed, and
do not skip work because it "costs too much" wall-clock.

Still report `npm test` duration with the machine load (`uptime` plus
`ps -Aceo pcpu,comm | grep -E 'suggestd|corespotlightd|mds_stores'` at ~0).
That discipline is about **measurement integrity**, not budget: SI34 burned two
readings on self-induced Spotlight reindexing, and an unexplained jump is still
a signal worth investigating. A large, *unexplained* regression is a finding to
report; a large, *explained* one is simply the cost of the work.

For reference, SI34 measured 55.75-57.80 s on settled machines; `main`
post-merge was 56.85 s.

## Stop conditions

1. **T0 cannot reproduce the changed-inputs residual.** Then it is a
   theoretical hole, not an observed defect. STOP and report; the correct
   outcome is to document it permanently, not to build isolation for a
   symptom nobody can produce. Do NOT weaken the repro until it fires.
2. **Any `src/` file is modified.** This is test/build infrastructure. Zero
   tolerance.
3. **After T2's ADR, STOP unconditionally and wait for the user.** The
   option this mission most obviously points at was declined by the user
   once already. No agent may re-adopt it on its own authority, however
   convincing the measurement. This stop is not a failure state — it is the
   mission's purpose.
4. Two consecutive gate failures on the same check.
5. A change to what any `@knowvah/plantuml-stdlib*` package **publishes**
   (`main`, `types`, `exports`, `files`) that is not explicitly authorised
   by the approved ADR. Silently altering the published surface of four
   packages is strictly worse than the race.
6. A task proposes trading test correctness, coverage, or fidelity for
   wall-clock speed. The suite may take as long as it needs.
7. A finding contradicts a locked decision (D1–D5).
8. Same location changed 3x consecutively without the check clearing.

## Push forward (journal the call)

Harness shape and filenames · probes under `scripts_scratch/T<N>/`, deleted
before commit · the seam's naming · which existing env-gating idiom to
mirror · a repro needing more than 5 attempts (record the rate and continue)
· minor/patch dep bumps.

## Index

- [decisions.md](decisions.md) — D1…D5 (locked) ·
  [decision-journal.md](decision-journal.md) ·
  [expected-moves.txt](expected-moves.txt)
- [diagrams/residual-window.md](diagrams/residual-window.md)
- **Source record:** `plans/stdlib-build-race/README.md#close-out-2026-08-21`
  · that mission's `decisions.md` D3 and its full `decision-journal.md` ·
  `.agent-notes/sre-T0.md` (the proven mechanism) and `sre-T2.md` (the
  skip's own residuals)

## Close-out (2026-08-21)

**Every number below was re-measured this session** on this branch's HEAD;
none restates a task-report or journal figure without independently
re-running it. Full detail, including the two double-run trial logs and
the corrected census re-derivation, is in `.agent-notes/sri-T5.md`.

**Which branch the mission took.** This mission ended on **(c)**: the user
approved a mechanism at the stop-3 gate. **The user chose option D** —
extend the existing cross-process build lock
(`scripts/build-stdlib-packages/build-lock.ts`) to cover the 8 in-worker
readers of `packages/<pkg>/generated/` — over ADR-003's own recommendation
of option A (a lock-scoped snapshot copy), because D is the only option
that also closes the 2 `npm pack --dry-run` tests, which A and B
structurally cannot reach (`planning/adr/ADR-003-stdlib-run-isolation.md`,
"Status").

**T0's exposure measurement.** The changed-inputs residual was reproduced,
not merely deduced: 2/5 synthetic-harness runs (40%), mean 21,325.5 attempts
to fail, ~30x narrower than the original bug SI34 fixed (mean 700.6, 5/5).
Silent corruption actively checked for and never observed across ~100k+
combined import attempts (`.agent-notes/sri-T0.md`).

**T1's reader census, corrected.** **21 total consumers** of
`packages/<pkg>/generated/` (4 `package.json` + 4 `tsconfig.json` + 1
producer script + 1 globalSetup caller + 8 test files + 3 build-race-harness
files); **8 concurrent readers** run inside a default, non-skipped vitest
worker. This session independently re-derived the 8-reader figure via
`grep -rl "withStdlibBuildLock" tests/` (11 matches, minus the helper
itself, its own unit test, and the textual fitness function, leaves exactly
8) rather than trusting the journal's count. T4 also found a 3rd `npm pack`
call site inside `tests/unit/stdlib-packages.test.ts` that T1's census
missed — an extra call site *within* an already-counted file, not a 9th
file; T1's 21/8 stands.

**End-to-end verification result.** Two real, concurrent full `npm test`
runs, straddling one genuine mutation of a real build input
(`assets/stdlib/tupadr3/_race-sentinel-T5.puml`, toggled while the first
run's workers were ~18-23s into a 60-110s suite), with the second run's
`globalSetup` genuinely rebuilding `stdlib-tupadr3`'s tree
(`rebuild --` logged, not `skip`) while the first run's workers were active.
**Trial 2** (isolated `--coverage.reportsDirectory` per run): both runs
fully green, 628/629 files, 16050/16053 tests, 0 failures each, zero
`packages/*/generated/`-tree errors in either log. **Trial 1** (both runs
sharing the default `coverage/` output) hit an *unrelated* real race first —
two concurrent `vitest run --coverage` processes contending on one
`coverage/.tmp/` scratch directory, crashing Run A's coverage-report step
with an `ENOENT` that has nothing to do with `packages/*/generated/`; Run
A's actual test execution logged zero failures and zero
`generated/`-tree errors before that crash. Flagged, not chased — out of
this mission's scope, no `src/` involved.

**Honest limit on what this proves.** A real full-suite run makes at most a
handful of reads to any one generated file across its whole run, so the
a-priori chance of a real suite naturally landing a read inside the
single, sub-second `rmSync`+rewrite window is low regardless of whether the
fix works — 2 non-crashing trials is consistent with the fix but is not,
alone, strong evidence. The load-bearing proof is mechanism-level: this
session's re-run of T0's harness (below) and T3's own lock-contention
measurement, both of which force the collision rather than hope for it.

**T0 harness re-run, before/after.** *Before* (bare, unlocked reader,
`scripts_scratch/T0/reader-verify.ts` vs `writer-mutate.ts 200 5`):
reproduced again — `FAIL at attempt 2897`, same `ENOENT` signature, 200/200
real rebuilds confirmed. The raw race is fully present for anything that
bypasses the lock, exactly as expected. *After*
(`scripts_scratch/T3/reader-verify-locked.ts`, same writer, reader now
holds `withStdlibBuildLock` with no override): 500/500 attempts, zero
`FAIL`, zero `SILENT`, 17 measured "waiting for the stdlib build lock"
lines against the writer's 200 rebuilds — real, measured contention, not
an assumption.

**Re-measured `npm test` wall-clock, this session.** `uptime` load
4.51 7.23 10.25, `corespotlightd` 0.0% (polled ~9 minutes after this
session's two double-run trials to let Spotlight's reindex from that
churn clear, per the brief's named trap). `npm test`: exit 0, 628/629
files, 16050/16053 tests, coverage 95.44/90.47/96.95/96.53, vitest
`Duration 61.00s`, wrapped `real 61.99s`. Fully explained by option D's
reader-side lock serialization (disclosed in ADR-003 before the user's
choice, measured at +7% during batch 2); not a new, unexplained
regression.

**Other gates, this session.** `npm run typecheck` exit 0. `npm run lint`
exit 0. `npm run build` exit 0, exactly the 3 pre-existing TS2591/TS2503
notes in `src/core/include-resolver-node.ts`.
`git diff --name-only main..HEAD -- src/`: **empty**.
`git diff --stat main..HEAD -- packages/`: **empty** — nothing any
`@knowvah/plantuml-stdlib*` package publishes changed. render-manifest vs
baseline: **"0 expected moves, 0 unexpected"** over 3158 fixtures.

**What this mission did NOT do.** No `src/` file was touched at any batch.
No product behavior changed and no rendering was affected — render-manifest
reported "0 unexpected" at every batch. Nothing any of the four
`@knowvah/plantuml-stdlib*` packages publish (`main`, `types`, `exports`,
`files`) changed at any point (`git diff --stat main..HEAD -- packages/`
empty, quoted above).

**Costs, recorded honestly as costs, not defects.**
- The suite is **~7% slower** (this session's 61.00s vitest `Duration`
  against the batch-0 baseline of 57.45s recorded earlier in this mission)
  — the disclosed, accepted price of serializing 8 readers behind the same
  lock the builder holds. No assertion was weakened to get this number.
- **~37 per-test timeouts were raised to 120s** (T4) because the lock's own
  `maxWaitMs` is 30s, six times vitest's 5s default; without the raise,
  genuine contention timed out real tests. No assertion was weakened — but
  a genuine hang now takes up to 2 minutes to surface instead of 5 seconds.
- **Two hazards found in a lock designed for a builder, not a reader**, both
  fixed before batch 2 closed: (1) `isStale` could reclaim a live reader's
  lock past `staleAgeMs` = 60s, and the old `release()` was an unconditional
  `rmSync` that would then delete the reclaimer's lock out from under it —
  fixed with an ownership-safe `releaseIfOwned` that only removes a lock
  file if it still names this holder's exact `(pid, acquiredAt)` pair,
  proven red-then-green against a fabricated-reclaimer test
  (`scripts/build-stdlib-packages/build-lock.ts`). (2) Lock acquisition
  blocks synchronously (`Atomics.wait`), which can freeze a vitest worker's
  event loop for up to 30s under contention — disclosed in ADR-003 before
  the user's choice, measured (not merely asserted) during T3/batch 2.

**Residual status.** **Closed**, not merely accepted. See the corrected
entry in `plans/stdlib-build-race/README.md`'s residual section and
`planning/next-missions.md`.
