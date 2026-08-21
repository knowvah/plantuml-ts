# SRE T1 — guarded repro promoted to a real test

## Round 3 — the reader-timeout defect and its fix (this round)

### Symptom
After T2 landed the content-derived skip, the test (still using a fixed
`READER_ATTEMPTS = 100_000` reader) could never pass or fail cleanly: the
reader's cache-busted `import()` loop never got signalled to stop, ran out
the clock, and vitest reported `Error: Test timed out in 120000ms`.

### First attempted fix (superseded, kept here for the record)
Round 2 replaced the fixed attempt count with a cooperative stop: the test
awaits the writer's exit, then sends the reader `SIGTERM`; the reader
installs `process.on('SIGTERM', () => { stopRequested = true })` and checks
the flag between loop iterations. This looked correct and typechecked, but
every real run still timed out (30s, 200s, 240s attempts, `WRITER_ITERATIONS`
300 then 275) or ran far longer than the writer alone.

### Mechanism (diagnosis, per rules/diagnosis.md)
**Instrumented, not guessed.** Killed every stray process, confirmed a
clean process table, then ran a minimal throwaway harness
(scratchpad `calibrate.mjs`) that spawns writer(N)+reader with the same
`SIGTERM`-then-await logic, printing elapsed times. With `N = 20` (writer
alone finishes in ~9s), the reader did not close until **109.9 s** later —
a **100+ second delay between `SIGTERM` and the process actually exiting**,
confirmed independently by sending `kill -TERM` from a separate shell at a
live reader PID and observing zero effect for 2+ minutes (`ps` showed
`STAT=SN`/`R`, pegged at ~99% CPU the whole time, not stopped/zombie).

**Origin:** `tests/helpers/stdlib-build-race-reader.ts`'s cache-busting
technique itself — `import(url)` with a unique `?t=...` query on every
attempt. Node's ESM loader registers each resolved specifier permanently;
nothing ever evicts an old entry. As the loop runs, this registry (and the
retained compiled-module graph behind it) grows without bound, and each
subsequent `import()` call gets measurably more expensive than the last.

**Causal chain:** by a few hundred attempts in, a single in-flight
`import()` call can take many seconds to over a minute to settle. A JS-level
signal handler (`process.on('SIGTERM', ...)`) can only run when the event
loop is free to service it — it cannot interrupt a call already in flight.
So `SIGTERM`, and the cooperative flag it set, sat unactioned for the
entire duration of whatever `import()` call happened to be running when it
arrived. This is exactly why smaller `N` (`WRITER_ITERATIONS`) didn't reliably
help either: the reader's OWN attempt count (not the writer's) governs how
deep into the "expensive" zone it has gotten by the time it's asked to stop,
and that depends on wall-clock overlap with the writer, not on `N` alone.

**Ruled out, with evidence:**
- *Orphaned processes from earlier debugging inflating later measurements*
  — real and independently confirmed (multiple `ps`-visible leftover
  `stdlib-build-race-reader.ts` processes from earlier `npx jiti`-spawned
  runs, still running minutes later, pegging CPU cores) — but killing all
  of them and re-measuring on a verified-clean process table STILL showed
  the 100+ second `SIGTERM`-to-close gap, so orphan contamination was a
  real, compounding problem but not *the* root cause of the timeout itself.
- *`npx jiti` wrapper eating the signal* — real and independently confirmed
  separately (see below) but ruled OUT as the cause of THIS symptom, because
  the same 100+ second gap reproduced identically when spawning the LOCAL
  `node_modules/.bin/jiti` binary directly (no wrapper chain: confirmed via
  `node_modules/jiti/lib/jiti-cli.mjs` source, which `await jiti.import(...)`
  in-process, no fork/exec of a grandchild).
- *Writer-side slowdown from disk/CPU contention* — considered, but the
  writer's own measured duration (standalone vs. concurrent-with-reader,
  clean process table both times) did not change materially; the growth was
  entirely on the reader's `SIGTERM`-to-close gap, not the writer's own
  completion time.

### Fix
Removed the cooperative `SIGTERM`/stop-flag mechanism from
`tests/helpers/stdlib-build-race-reader.ts` entirely — it has no signal
handler anymore, just a large `maxAttempts` safety net. The test
(`tests/integration/stdlib-build-race.test.ts`) now kills the reader with
**`SIGKILL`** immediately after `writer.done` resolves. `SIGKILL` cannot be
caught, ignored, or deferred by the target process at any point, so it
terminates the reader at the OS level regardless of what it is doing
internally. Whatever the reader had already written to stdout before that
instant (a `FAIL at attempt N:` line, if the race fired) was already
captured by the parent's `data` listeners, since `console.log` in the
`catch` block runs synchronously before the process could receive the kill.
Measured (`calibrate2.mjs`, clean process table): kill-to-close latency is
**2-3 milliseconds**, vs. 100+ seconds for the cooperative approach.

A SEPARATE, independently real defect found and fixed in the same pass:
an `afterEach` hook (`tests/integration/stdlib-build-race.test.ts`) now
force-kills both children unconditionally, because vitest's per-test
timeout does not cancel the test's in-flight promise chain — a timed-out
run previously left both writer and/or reader running as true OS orphans
(directly observed: reader processes still consuming ~99% CPU 10+ minutes
after their originating `vitest run` command had already reported failure
and exited).

### WRITER_ITERATIONS: 300 -> 275, and why not lower
Per the coordinator's evidence (every historical pre-fix failure -- T0's
334-1297 reader attempts, mean 700.6; this mission's 888, 1036 -- exposed
the race with the writer well short of its full 300-iteration budget, floor
observed around iteration ~250), `WRITER_ITERATIONS` is reduced to 275 (25
iterations / ~10% margin above that floor). This is NOT independently
re-verified against the pre-fix builder in this task -- doing so would
require reverting T2's skip, which needs git writes outside this task's
scope (per the boundary the coordinator restated). If 275 proves
insufficient, the orchestrator's own re-verification against the old
builder will surface it directly.

### Clean-run measurement (current tree, T2's skip in place)
Isolated calibration (`calibrate2.mjs`, clean process table verified before
and after, SIGKILL-based reader stop):
```json
{
  "n": 275,
  "writerDoneAtMs": 122930,
  "totalMs": 122933,
  "killToCloseMs": 3,
  "readerCode": null,
  "readerSignal": "SIGKILL",
  "failLine": null
}
```
i.e. **~123 s** for 275 real `buildStdlibPackages()` calls plus a
negligible (3ms) reader-teardown cost. `RACE_TEST_TIMEOUT_MS` set to
**180,000 ms** — roughly 46% margin over the measured 123s, not a round
guess.

### Actual vitest run on the current (T2-fixed) tree
Command: `STDLIB_BUILD_RACE_REPRO=1 npx vitest run
tests/integration/stdlib-build-race.test.ts --config vitest.config.ts`
```
[build-stdlib-packages] stdlib: skip -- generated/ content hash already matches the current build inputs
[build-stdlib-packages] stdlib-aws: skip -- generated/ content hash already matches the current build inputs
[build-stdlib-packages] stdlib-tupadr3: skip -- generated/ content hash already matches the current build inputs
[build-stdlib-packages] stdlib-all: skip -- generated/ content hash already matches the current build inputs
[build-stdlib-packages] stdlib/assets/bootstrap1.13.1: skip -- sprites already match the current source content

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  11:14:49
   Duration  127.44s (transform 4ms, setup 0ms, import 9ms, tests 126.46s, environment 157ms)
```
**PASSES**, as expected: this harness exercises exactly the unchanged-inputs
case T2's skip closes. This is a correct result, not a failure of this
task's work -- it is NOT evidence the changed-inputs case (T4's build lock)
is fixed, since this harness never simulates changed inputs. Verified no
orphaned processes remained after the run, and
`packages/stdlib-tupadr3/generated/` stayed complete and valid throughout
(T2's skip never triggers the destructive `rmSync` on unchanged inputs).

### Interface-contract result
```json
{
  "envVar": "STDLIB_BUILD_RACE_REPRO",
  "testPath": "tests/integration/stdlib-build-race.test.ts",
  "writerPath": "tests/helpers/stdlib-build-race-writer.ts",
  "readerPath": "tests/helpers/stdlib-build-race-reader.ts",
  "writerIterations": 275,
  "raceTestTimeoutMs": 180000,
  "cleanRunMeasuredMs": 122933,
  "observedResultOnCurrentTree": "PASS"
}
```

### Default-skipped cost (unchanged tree, no env var)
Settled load before measuring (`uptime` load1 3.84-4.26, all watch-list
daemons -- `mds`, `mds_stores`, `suggestd`, `corespotlightd` -- at/near 0).
`npm test`: `625 passed | 1 skipped (626)` files, `16026 passed | 2 skipped
| 1 todo (16029)` tests, `Duration 56.87s` (vitest-reported), `time`
wrapper **57.896s** total -- under the 60.3s ceiling, consistent with
T0's own 57.687s baseline. (File/test counts are slightly higher than
earlier rounds because other in-flight mission tasks, T2/T3, have landed
their own committed test files in the interim -- not this task's doing.)
Coverage: statements 95.44%, branches 90.47%, functions 96.95%, lines
96.53% (>= 90/90/90).

### Quality gates
- `npm test`: exit 0, 57.896s at settled load (above) -- under 60.3s ceiling.
- `npm run typecheck`: `tsc --noEmit && tsc --project tsconfig.node.json
  --noEmit` -- exit 0, no errors.
- `npm run lint`: `eslint --no-error-on-unmatched-pattern src tests demo`
  -- exit 0, no warnings/errors.
- `npm run build`: exit 0. Same 3 pre-existing TS2591/TS2503 notes in
  `src/core/include-resolver-node.ts` -- not new.
- `git diff --name-only -- src/`: empty.
- This task's write-set (`tests/integration/stdlib-build-race.test.ts`,
  `tests/helpers/stdlib-build-race-writer.ts`,
  `tests/helpers/stdlib-build-race-reader.ts`, this note) are the only
  files this round touched; `git status --short` also shows other
  in-flight tasks' own committed/uncommitted changes (T2's
  `scripts/build-stdlib-packages.ts`, `tests/helpers/
  build-stdlib-globalsetup.ts`, `tests/unit/build-stdlib-packages.test.ts`,
  their own `.agent-notes/sre-T2.md`/`sre-T3.md`), none of which this task
  created or modified.

### Scope note
No `src/` changes. Did not touch `scripts/build-stdlib-packages.ts` or
`tests/unit/build-stdlib-packages.test.ts` (owned by another task). Did not
verify pre-fix exposure directly (would require reverting T2's skip via a
git write outside this task's scope) -- the orchestrator re-verifies the
red state against the old builder separately. Read-only git only -- no
commits, no staging, no branch ops. Scratchpad calibration scripts
(`calibrate.mjs`, `calibrate2.mjs`) lived only under
`/private/tmp/claude-501/.../scratchpad/`, never in the repo.
