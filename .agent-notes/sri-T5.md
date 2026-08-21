# SRI T5 — verify and close out stdlib-run-isolation

## Scope
Batch 3, the mission's only remaining task. No `src/` file touched (write-set
was docs + `.agent-notes/` + `scripts_scratch/T5/**` only). Ran the
end-to-end verification nobody had done yet, re-ran T0's harness for a
before/after, re-measured every published number this session, corrected
SI34's residual-section import-site count, and closed out the mission
README, `plans/stdlib-build-race/README.md`'s residual section, and
`planning/next-missions.md`.

## End-to-end verification: two real, concurrent full `npm test` runs
straddling one genuine source change

**Method.** Toggled a throwaway `.puml` file under `assets/stdlib/tupadr3/`
(same real input T0 used — `readBundlePaths`,
`scripts/build-stdlib-packages/emit-remote-manifest.ts:54-66`, walks that
directory) partway through Run A's execution, then started Run B. Run B's
own `globalSetup` genuinely detected the content mismatch and rebuilt
`stdlib-tupadr3`'s `generated/` tree for real (`rebuild --` log line, not
`skip`), while Run A's workers were roughly 18-23s into their run (each full
suite runs 60-110s under this load, so this sits well inside Run A's active
test-execution window, not merely its `globalSetup` phase).

**Trial 1** (both runs sharing the default `coverage/` output directory —
i.e. plain `npm test` on both sides): Run B finished clean, 628/629 files,
16050/16053 tests, 0 failures, `Duration 82.99s`. Run A's own test
execution produced **zero** stdlib-`generated/`-tree errors and **zero**
`FAIL`/error-summary blocks for any test file, but its process then crashed
during **coverage-report generation** with
`Error: ENOENT: ... open '.../coverage/.tmp/coverage-103.json'` — a second,
unrelated real race: two concurrent `vitest run --coverage` invocations
share one `coverage/.tmp/` scratch directory, and one process's cleanup
removed the other's raw V8 dump before it could be read. This is **not**
the mission's target mechanism and is out of this mission's scope (no
`packages/*/generated/` path is involved) — flagged here so it isn't
mistaken for a residual hit, and not investigated further (no `src/`
change, no write-set for it).

**Trial 2** (isolated `--coverage.reportsDirectory` per run, eliminating the
trial-1 confound): both runs fully green — 628/629 files, 16050/16053 tests,
0 failures each, `Duration 77.23s` / `81.87s`, Run B's `stdlib-tupadr3`
rebuild again confirmed genuine (`rebuild --` line). **Zero**
stdlib-`generated/`-tree errors in either log.

**What this establishes, and its limits.** Two real concurrent full-suite
runs, straddling one genuine rebuild of the exact package the original bug
and T0's residual both hit, produced no crash and no failure attributable
to the `generated/`-tree race, with option D's lock converting all 8
concurrent readers. This is real signal, not a proxy — but it is **one
observed non-collision per trial**, not a rate. The synthetic harness
needed ~2,900-24,500 tight-loop attempts to hit the window even once;
a real suite makes at most a handful of reads to any one file across its
whole ~60-110s run, so the a-priori chance of a real suite naturally
landing a read inside the single, sub-second `rmSync`+rewrite window is
low regardless of whether the fix works. Absence of a crash in 2 trials is
consistent with the fix working; it is not, by itself, strong evidence,
because an unfixed suite would also very likely not have crashed by chance
in only 2 trials at this read frequency. The mechanism-level proof is T3's
lock-contention measurement (below) and this session's re-run of it, not
trial count.

## T0 harness re-run — before / after

**Before** (bare, unlocked reader — `scripts_scratch/T0/reader-verify.ts`,
unmodified, racing `scripts_scratch/T0/writer-mutate.ts 200 5`): reproduced
again, `FAIL at attempt 2897: ENOENT: no such file or directory, open
'.../packages/stdlib-tupadr3/generated/tupadr3.remote.js'`, 200/200 real
rebuilds confirmed (`grep -c "rebuild --"`). Confirms the raw race is still
fully present for any reader that doesn't hold the lock — expected, since
this harness deliberately bypasses it.

**After** (`scripts_scratch/T3/reader-verify-locked.ts`, wraps the same
import in `withStdlibBuildLock` with no `lockPath` override, so it contends
on the same deterministic lock the writer acquires): 500/500 attempts, zero
`FAIL`, zero `SILENT`, 17 "waiting for the stdlib build lock" lines logged
against the writer's 200 real rebuilds (real, measured contention — this
session's number differs from T3's own 20-wait reading, as expected for a
stochastic race, not a discrepancy).

## Re-measured numbers this session (all with load readings)

- `npm test`: exit 0, 628/629 files, 16050/16053 tests, coverage
  95.44/90.47/96.95/96.53, vitest `Duration 61.00s`, wrapped `real 61.99s`.
  Load at start: `uptime` 4.51 7.23 10.25, `corespotlightd` 0.0%
  (polled every 10-15s until it cleared from the double-run trials' churn
  before starting this gate — took ~9 minutes).
- `npm run typecheck`: exit 0, no output.
- `npm run lint`: exit 0, no output.
- `npm run build`: exit 0, exactly the 3 pre-existing TS2591/TS2503 notes in
  `src/core/include-resolver-node.ts`.
- `git diff --name-only main..HEAD -- src/`: empty.
- `git diff --stat main..HEAD -- packages/`: empty.
- render-manifest vs baseline: `OK: 0 expected moves, 0 unexpected` (3158
  fixtures).

## Independent re-verification of T1's census (not merely re-cited)

`grep -rl "withStdlibBuildLock" tests/` this session returns 11 files;
subtracting the helper itself (`tests/helpers/with-stdlib-build-lock.ts`),
its own unit test (`tests/unit/with-stdlib-build-lock.test.ts`, scratch
`lockPath` overrides only), and the fitness function
(`tests/architecture/stdlib-read-lock.test.ts`, a textual guard, not a
canonical-tree reader itself) leaves exactly **8**: `sprite-package-files`,
`stdlib-dts-import-specifier`, `stdlib-all-exports`, `build-stdlib-packages`,
`stdlib-package-files`, `stdlib-eager-omission`, `stdlib-packages`,
`stdlib-remote-e2e`. Matches T1's census and T4's "all 8 converted" claim,
confirmed by this session's own grep rather than trusted from the journal.
The 21-consumer total (4 `package.json` + 4 `tsconfig.json` + 1 producer
script + 1 globalSetup caller + 8 test files + 3 build-race-harness files)
is arithmetic on T1's own breakdown, already independently spot-checked by
the orchestrator earlier in the mission (decision journal) — not
re-derived component-by-component here, since it is a structural count with
no load-dependent number to re-measure.

## Restore verification

`assets/stdlib/tupadr3/_race-sentinel-T5.puml` and `_race-sentinel-T0.puml`
both removed after every trial; `buildStdlibPackages()` re-run to a clean,
current, byte-matching state after every trial. Final:
```
$ git status --short
?? scripts_scratch/
```
No modified tracked file anywhere. `scripts_scratch/T5/` (this task's
`toggle-sentinel.ts`) is this task's own write-set, left on disk per
instruction (the orchestrator deletes it before merge). No stray
`vitest`/`jiti`/`writer-mutate`/`reader-verify` process left running
(`ps aux` scan, clean after every trial).

## Quality gates

All four green this session — see "Re-measured numbers" above for exact
figures. `git status --short` clean of tracked-file modification.
