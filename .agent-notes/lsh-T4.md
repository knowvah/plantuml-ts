# stdlib-lock-sharing T4 — verdict: measure, do not fix

Write-set: `.agent-notes/lsh-T4.md`, `scripts_scratch/T4/**` (probes;
orchestrator deletes). No `src/` touched. No git write command run.

## 1. Contract table — before (T0) vs after (T1-T3), both re-measured this
session, `single` and `concurrent-pair`, using T0's committed harness
unchanged

Load before `single`: `uptime` 12:26 load 6.50/14.12/13.33,
`mds_stores`/`corespotlightd`/`suggestd` all 0.0%. Load before
`concurrent-pair`: 12:27 load 13.25/14.91/13.72, all three 0.0% (polled
after Spotlight settled from the `single` run's own churn — `mds_stores`
briefly hit 230.3% between the two runs, per the mission's named trap;
waited it out before measuring).

| | Single run (before/T0) | Single run (after) | Concurrent-pair (before/T0) | Concurrent-pair (after) |
|---|---|---|---|---|
| Acquisitions | 288 | 300 | 576 | 600 |
| Total **waiting** | 33,806 ms | **1,018 ms** | 319,190 ms | **3,769 ms** |
| Total **holding** | 12,903 ms | 21,211 ms | 40,261 ms | 60,890 ms |
| Mean hold | 44.8 ms | 70.7 ms | 69.9 ms | 101.5 ms |
| Max hold | 7,524 ms | 10,908 ms | 13,152 ms | 20,029 ms |
| Max wait | 7,434 ms | 205 ms | 29,500 ms | 950 ms |
| `timeouts` (waitMs ≥ 30,000) | 0 | 0 | 0 | 0 |

Raw contract rows (this session):
```
{"configuration":"single","acquisitions":300,"totalWaitMs":1018,"totalHoldMs":21211,"meanHoldMs":70.70333333333333,"maxHoldMs":10908,"maxWaitMs":205,"timeouts":0}
{"configuration":"concurrent-pair","acquisitions":600,"totalWaitMs":3769,"totalHoldMs":60890,"meanHoldMs":101.48333333333333,"maxHoldMs":20029,"maxWaitMs":950,"timeouts":0}
```

**Waiting dropped by 97% (single) and 99% (concurrent-pair).** This is the
headline result and it is real: shared-mode readers no longer serialize
against each other. **Acquisitions rose +12/process (288→300, 576→600)** —
explained, not anomalous: `tests/unit/build-stdlib-lock.test.ts` gained new
direct `acquireBuildLock` calls in T1 (`3efa6cd6`, confirmed via
`git log ae167d8a..HEAD -- tests/unit/build-stdlib-lock.test.ts`; the file
now has 23 direct call sites, up from before T1) to unit-test the new
shared-mode acquisition path — the trace hook fires process-wide for every
`acquireBuildLock` call, exactly the same reason T0 flagged the file's
existing timeout-path tests as inflating the `timeouts` field if counted
naively. **Holding rose** (12,903→21,211 ms single; 40,261→60,890 ms
concurrent-pair) — expected, not a regression: shared acquisitions now run
concurrently rather than queued, so more holders are mid-hold at any given
instant and the *sum* of hold durations naturally rises even though no
single hold got slower (mean hold 44.8→70.7 ms single is consistent with
machine-load variance already documented in T0's own note, not a new
per-acquisition cost — `acquireShared`'s critical section is the same
`registerPresence`/re-check pair regardless of concurrency).

## 2. Concurrent trials — 5 pairs run, pass rate reported honestly

5 independent `concurrent-pair` invocations of T0's harness (10 `npm test`
processes total), run sequentially, Spotlight-settle-polled before starting
(load readings, per trial, all captured; `corespotlightd`/`mds_stores` both
0.0% before the batch started).

Contract rows for reference (not the headline number — that's above):
```
trial1 {"acquisitions":600,"totalWaitMs":49804,"maxWaitMs":12818,"timeouts":0}
trial2 {"acquisitions":600,"totalWaitMs":6622,"maxWaitMs":1450,"timeouts":0}
trial3 {"acquisitions":600,"totalWaitMs":22913,"maxWaitMs":8698,"timeouts":0}
trial4 {"acquisitions":600,"totalWaitMs":3737,"maxWaitMs":785,"timeouts":0}
trial5 {"acquisitions":600,"totalWaitMs":24664,"maxWaitMs":8665,"timeouts":0}
```

**Pass rate: 1 of 5 pairs (20%) fully clean; 5 of 10 processes (50%)
failed.** `timeouts: 0` in every trial and `grep -n "Timed out after.*
waiting for the stdlib build lock" trial-*.log` matched **zero** lines
across all 5 trials (`concurrentTrials: 5, failures` by the old
lock-timeout signature: **0**). The redesign's target defect — a lock
timeout throwing and failing real tests under concurrency — did not occur
once in 10 process-runs, against the pre-mission reference of "2 of 6
shared-coverage and 1 of 6 isolated runs failed" with that exact signature.

**But a different, real failure mode showed up in 4 of 5 trials**, in two
signatures, both `Error: Test timed out in 5000ms` — vitest's *default*
per-test timeout, unrelated to the stdlib lock:

```
FAIL  tests/architecture/catalog.test.ts > docs/catalog.md > is up to date
  with src/ (run `npm run catalog` if this fails)
Error: Test timed out in 5000ms.
 ❯ tests/architecture/catalog.test.ts:20:3
     21|     const committed = readFileSync(CATALOG_PATH, 'utf8');
     22|     expect(buildCatalog()).toBe(committed);
```
(trials 2, 4 — 3 occurrences across those two trials)

```
FAIL  tests/unit/stdlib-packages.test.ts > npm pack --dry-run: tarball
  ceilings + LICENSE presence > packages/stdlib-all ships a LICENSE and no
  vendored data of its own
Error: Test timed out in 5000ms.
 ❯ tests/unit/stdlib-packages.test.ts:428:3
    429|   it('packages/stdlib-all ships a LICENSE and no vendored data of
      its own', ...
    430|     const result = npmPackDryRun('stdlib-all');
```
(trials 3, 4, 5 — one occurrence in trial 3 also carried a jsdom
`HTMLCanvasElement.getContext` warning in the same file, unrelated console
noise from an adjacent test, not part of this failure)

**Mechanism, stated plainly, not fully instrumented.** Neither signature
names the lock. `buildCatalog()` walks `src/` synchronously and
`npmPackDryRun` shells out to `npm pack`; both are genuinely CPU-bound work
with a tight, unconfigured 5,000ms default (vitest's global default, not
a per-test override). Before this redesign, two concurrent suites spent
the bulk of their "waiting" time inside `Atomics.wait` — a synchronous
sleep, not CPU-bound — while queued behind the exclusive mutex (T0:
319,190ms of total wait, almost all reader-vs-reader). After the redesign,
that queueing is gone: both suites' real, CPU-bound work (transform,
`npm pack` subprocess spawn, `buildCatalog()`'s tree walk) now runs
genuinely concurrently instead of one queued behind the other's sleep. Two
processes contending for the same physical cores on this session's already
loaded, 2-user machine (`uptime` load averages 15-64 across this session)
plausibly pushes single-threaded, CPU-bound work past a 5-second budget
that was previously comfortable. **This is stated as a plausible causal
chain grounded in what each test does, not as a confirmed root cause** — I
did not instrument per-test CPU time to prove it directly, and did not
attempt to (out of this task's write-set: no fix, and confirming it would
require touching test infrastructure). What I can state with certainty:
this is **not** the lock-timeout signature the mission was built to fix,
`acquireBuildLock` and `acquireShared`/`acquireExclusive` never throw in
any of the 5 trials' logs, and both failing tests are pre-existing tests
this mission's write-set never touched.

## 3. Safety invariant — builder genuinely rebuilding while readers active

Method: mirrors `plans/stdlib-run-isolation`'s T5 exactly (same throwaway
sentinel technique, `assets/stdlib/tupadr3/_race-sentinel-T4.puml`, walked
by `readBundlePaths`, `scripts/build-stdlib-packages/emit-remote-manifest.ts
:54-66`, so its presence genuinely flips `stdlib-tupadr3`'s content hash).

Spotlight-settle-polled before starting (`corespotlightd`/`mds_stores` both
0.0% at 12:41:53). Started run A (`COVERAGE_ISOLATE=1 npm test`, background,
12:41:57). Waited 20s into its worker-execution phase (confirmed via tail
of run A's own log showing live test output, not `globalSetup`). Created
the sentinel file at 12:42:25. Started run B (`COVERAGE_ISOLATE=1 npm
test`, background) immediately after. Both ran to completion (~85s each).

**Run B's `globalSetup` genuinely rebuilt, quoted verbatim:**
```
[build-stdlib-packages] stdlib-tupadr3: rebuild -- generated/ was missing,
stale, or unreadable for the current build inputs
```
(not `skip` — every other package in the same run logged `skip`, confirming
only the mutated package triggered a real `rmSync`+rewrite.)

**Run A observed no torn or missing tree:** 629/629 test files, 16,076
tests passed, 0 failures, 0 skipped-beyond-baseline. `grep -niE
"ENOENT.*generated|Cannot find module.*generated|Failed to load
url.*generated|tupadr3\.remote"` against both run logs: **zero matches**.
Run B itself failed only on the same unrelated
`tests/architecture/catalog.test.ts` 5000ms-timeout signature from §2 — not
a lock or tree-integrity failure. Zero `"waiting for the stdlib build
lock"` lines logged in either run (the writer's drain against run A's
currently-registered readers completed inside one poll interval, too fast
to log the "waiting" line `acquireExclusive` only emits once).

Sentinel removed and `packages/*/generated/` regenerated to a clean,
current, byte-matching state via `npx jiti
scripts/build-stdlib-packages.ts` immediately after. `packages/*/generated/`
is gitignored (confirmed: `.gitignore` line `packages/*/generated/`), so
this restoration is a hygiene step, not a `git status` requirement — but
`git status --short` was re-checked clean regardless (below).

## 4. Limits of this evidence

- **The contract-table drop (33,806ms → 1,018ms; 319,190ms → 3,769ms) is
  the load-bearing number.** It is a direct, mechanism-level measurement of
  the exact quantity T0 diagnosed as the problem (reader-vs-reader
  serialization), not a proxy or a trial count.
- **5 concurrent-pair trials is a small sample on a shared, variable-load
  machine** (this session's `uptime` load averages ranged 6.5 to 64 across
  the run). The wait-time numbers per trial varied roughly 13x
  (3,737-49,804ms) even with `timeouts: 0` in all five — consistent with
  the fix working, not proof that no trial could ever exceed the 30s
  budget under worse load. The mission's own reference point (2/6 and 1/6
  lock-timeout failures pre-fix) came from a similarly small sample; this
  task does not claim a larger, more rigorous sample than that baseline.
- **The safety proof is one straddling-rebuild trial, not a rate** — same
  limit the predecessor mission (`plans/stdlib-run-isolation`) stated
  explicitly about its own T5: a real suite makes at most a handful of
  reads to any one generated file across a ~60-110s run, so one clean
  trial is consistent with the fix working, not statistically strong
  evidence on its own. The mechanism-level proof is that `acquireExclusive`
  provably calls `drainPresence` before any `rmSync` (read in
  `build-lock.ts:410-431`), not the trial count.
- **The new `Test timed out in 5000ms` failure mode is reported, not
  root-caused to instrumentation-grade certainty.** I traced it to two
  specific, named tests and a plausible mechanism (CPU contention
  previously masked by mutex-queue sleep time), but did not measure
  per-test CPU time directly to confirm that mechanism against a null
  hypothesis (e.g., a pre-existing flake unrelated to concurrency). This is
  a genuine open question this task surfaces, not one it closes.

## Quality gates (this session, after restoring the tree)

- `npm test` — exit 0, 629/629 files, 16,076 passed | 2 skipped | 1 todo,
  coverage 95.44% / 90.47% / 96.95% / 96.53% (stmts/branch/func/line, all
  ≥ 90%).
- `npm run typecheck` — exit 0 (both tsconfigs).
- `npm run lint` — exit 0.
- `npm run build` — exit 0; exactly the 3 pre-existing TS2591/TS2503 notes
  in `src/core/include-resolver-node.ts`.

## Scope confirmation

- `git diff --name-only -- src/` → empty (zero tolerance, confirmed).
- `git status --short` → `?? scripts_scratch/` only (this task's own
  write-set; `.agent-notes/` untracked entries not yet staged are expected
  and part of this task's write-set).
- `assets/stdlib/tupadr3/_race-sentinel-T4.puml` removed;
  `packages/*/generated/` regenerated clean (gitignored, not tracked).
- No git write command run.
