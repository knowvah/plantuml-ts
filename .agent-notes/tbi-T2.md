# T2 — `catalog.test.ts` timeout diagnosis (mission: test-budget-invariant)

Write-set honored: this note only. `scripts_scratch/T2/**` used for probes and
deleted before finishing (`rm -rf scripts_scratch`, confirmed via
`git status --short` showing no scratch entries below). No `src/` touched,
no `tests/architecture/catalog.test.ts` edit, no git write command run.

## Mechanism

`catalog.test.ts:20`'s `buildCatalog()` call is genuinely CPU-bound —
`scripts/generate-catalog.ts:54-61` (`walk`, a synchronous `readdirSync`/
`statSync` tree walk over ~1,000 `src/` files) and `:107-135`
(`readModule`, which cold-parses every file via `ts.createSourceFile` at
`:109`) — and, measured directly (below), draws on roughly **2x its own
wall-clock time in CPU-seconds** even in total isolation (V8's background
compiler/GC threads run concurrently with the main JS thread). It executes
exactly once, cold, inside a single forked vitest worker process. `npm test`
spawns up to `Math.min(12, os.availableParallelism() - 1)` such forked
workers per invocation (`node_modules/vitest/dist/chunks/cli-api.BK8pd4xc.js:2404`),
which is **11 workers on this 12-logical-core machine** — i.e. a *single*
`npm test` run already asks for effectively the whole machine. Two
concurrently-launched `npm test` processes (the condition `lsh-T4` used and
this task independently reproduced) put up to **22 such forks in flight for
12 cores**, each doing its own multi-core-hungry startup work (jsdom
construction, esbuild/TS transform, coverage instrumentation). The 5,000ms
default (vitest's own; confirmed no `testTimeout` anywhere in
`vitest.config.ts`, consistent with D4) trips only when
`catalog.test.ts`'s own ~400-600ms CPU-bound window happens to land inside a
moment of unusually tight overlap between the two processes' own startup
bursts — a **timing/scheduling-dependent spike, not a smooth function of
aggregate load average.**

## Origin

- `scripts/generate-catalog.ts:54` (`walk`) and `:107-109` (`readModule` /
  `ts.createSourceFile`) — the CPU-bound work the timeout races against.
- `tests/architecture/catalog.test.ts:20-22` — where vitest's unconfigured
  5,000ms default (not a local override) is applied.
- `node_modules/vitest/dist/chunks/cli-api.BK8pd4xc.js:2404` —
  `Math.min(12, numCpus - 1)` worker-pool sizing, the structural reason a
  single `npm test` already saturates a 12-core machine and two saturate it
  ~2x over.

## Causal chain (406ms → intermittently >5,000ms)

1. Baseline (quiet machine, this session): `uptime` 15:28, load
   3.50/3.48/3.48, all five daemon families 0.0%. Standalone
   `buildCatalog()`, cold call: **406.32ms** wall (matches D5's cited
   figure exactly). `npx vitest run tests/architecture/catalog.test.ts`
   alone: **391ms** reported test duration. Single-invocation baseline
   confirmed, independent of D5's number.
2. CPU accounting (same baseline window, load 3.31/3.44/3.47, daemons
   0.0%): `wallMs: 398.08, userMs: 767.38, sysMs: 49.02` — **user CPU time
   is ~1.9x wall time even with zero contention**, proving the call wants
   more than one core's worth of concurrent scheduling within its own
   ~400ms window (V8 background compile/GC threads), not a strictly
   single-core-bound task.
3. Synthetic pure-CPU-spin scaling (load 7.57-11.12/~20/~14, daemons
   0.0%-0.3% throughout): K busy-loop competitors sharing the 12 cores
   with one `buildCatalog()` probe — K=0: 464.62ms; K=6: 449.46ms; K=11:
   701.96ms; K=16: 845.08ms; K=22: 1,027.5ms (max ~2.5x baseline). **Pure
   uniform core-count oversubscription, even at the full 22-worker
   equivalent, does not get remotely close to 5,000ms.**
4. Synthetic real-process scaling (load 9.04/17.86/14.04, daemons
   ≤1.4%): 22 real Node processes, each running the *same* cold
   `buildCatalog()` probe, launched near-simultaneously (a synchronized
   startup burst, closer analog to 22 vitest workers forking at once than
   #3's steady spin loops): wall times ranged **747.32-2,306.60ms**
   (max ~5.7x baseline) — meaningfully worse than uniform spin
   competition, confirming real Node-process startup work (module
   loading, JIT, GC) contends more sharply than steady CPU load, but
   **still short of 5,000ms.**
5. Real concurrent-pair reproduction #1 (`COVERAGE_ISOLATE=1` on both,
   full suite, matching `lsh-T4`'s exact protocol): launched at load
   2.75/3.29/3.41, daemons 0.0%. Catalog test in both processes: **1,390ms
   / 1,433ms**, both pass — recorded at log lines 22504/12653, i.e. early
   in each run. Mid-run load samples during the same run: 4.23/3.59/3.52
   (daemons 0%) shortly after start, climbing to 62.34/21.30/10.22 and
   peaking 64.94/23.21/11.03 later in the ~119-120s run. **The catalog
   test itself completed before the run's load had ramped to its later
   peak.**
6. Real concurrent-pair reproduction #2, this time with a periodic
   uncapped `buildCatalog()` probe sampled every ~4s throughout the run
   (bypassing vitest's 5,000ms cap so the true peak, not a truncated one,
   is visible): launched at load 6.44/15.42/13.43, daemons 0.0%. Catalog
   test in both processes: **615ms / 611ms**, both pass, again at log
   lines 9-11 (i.e. essentially the first test file to finish). 15
   independent probe samples across the ~90s run, load1 climbing
   10.09→71.09 monotonically: wall times ranged **482.29-1,544.58ms**
   (max at load1=61.40, daemons 0% at every sample). **Even at load1=71.09
   — higher than SI36's own "57.07 → fail" reference point — the
   independently-sampled probe topped out at 1,511.42ms.**

Put together: `catalog.test.ts` is one of the first files vitest schedules
(both this session's reproductions logged it in the first ~10 result
lines), so it executes during the *early* part of a concurrent-pair run,
before the run's own load has ramped to the high sustained values recorded
later. Neither steady-state contention (item 6, sampled up to load1 71) nor
synchronized-but-externally-staggered contention (items 3-4) reproduces a
result anywhere near 5,000ms. The `lsh-T4` failures (trials 2 and 4, 3
occurrences) therefore depend on a narrower condition than "high load": the
two `npm test` processes' own startup-fork CPU bursts landing in
sufficiently tight real-time overlap that `catalog.test.ts`'s specific
~500ms window falls inside it — a probabilistic OS-scheduling alignment,
not a deterministic function of code or of aggregate load average. This
session reproduced the passing case twice (2/2); `lsh-T4` reproduced the
same protocol 5 times and got the failure signature in 2/5. Both are
consistent with the same intermittent, timing-dependent mechanism.

## Ruled out

1. **A shared lock/mutex serializing the two suites for this test** — ruled
   out by inspection, not by trial: `tests/architecture/catalog.test.ts`
   and `scripts/generate-catalog.ts` (read in full this session) import
   nothing from `build-lock.ts`; `generate-catalog.ts`'s only `node:fs`
   imports are `readFileSync`/`writeFileSync`/`readdirSync`/`statSync` —
   no lock primitive exists to contend on. Matches D5's own "0 references"
   claim, independently confirmed.
2. **Cross-process filesystem serialization on the `readdirSync`/
   `statSync` walk** — ruled out on two grounds: (a) OS semantics —
   concurrent read-only directory listing/stat calls from independent
   processes do not mutually exclude at the VFS layer, and `src/` is never
   written during test execution, so there is no shared mutable state to
   serialize on; (b) empirically, item 4 above added 22 real processes
   that *also* `readdirSync`+parse the same `src/` tree concurrently, and
   the worst result was 2,306.60ms — if directory-walk contention were a
   material factor beyond plain CPU scheduling, this experiment would have
   shown a sharper penalty than the pure-CPU-spin case (item 3); instead it
   showed the expected, modest step consistent with heavier per-process
   CPU/memory demand, not I/O-level serialization.
3. **Cross-process TS-parser or module-cache contention** — ruled out
   structurally: each forked worker is a separate OS process with its own
   V8 isolate and its own `require`d copy of the `typescript` package;
   there is no cross-process shared state for `ts.createSourceFile` to
   contend on.
4. **Memory pressure / swapping** — ruled out by capacity, not by a
   dedicated trial: `sysctl hw.memsize` = 96GB; `vm_stat` sampled after the
   heaviest reproduction (item 5) showed ~6.9GB still free
   (421,179 pages × 16KB) with no unusual `Pages purgeable`/wired growth.
   Two full test-suite processes on this machine do not approach memory
   exhaustion, so paging is not a plausible contributor.
5. **"High aggregate load average alone explains it"** — ruled out
   empirically by item 6: an uncapped probe sampled repeatedly across a
   real concurrent-pair run, at load1 readings up to 71.09 (higher than
   SI36's own recorded 57.07-load failure point), never exceeded 1,544ms.
   If aggregate load were the operative variable, that sampling should have
   reproduced values approaching 5,000ms and did not in 15 tries.

**Not ruled out / genuine open boundary.** The exact worst-case wall time
during a *synchronized* two-process startup-fork overlap (as opposed to
this task's externally-staggered synthetic version, item 4, or the
naturally-early-and-therefore-lower-load real reproductions, items 5-6) was
not directly measured — I could not force that specific alignment to occur,
and neither could `lsh-T4` reliably (2 of 5 trials). This is the reason no
`set-budget` recommendation follows: I have no measured number for the
actual failure window, only that it exceeds 5,000ms (vitest's own cap
truncates the failing trials before a true peak is observable) and that
every non-failing measurement this session and the CPU-accounting/spin/real-
process experiments produced tops out at ~2,306ms. Any number I could name
now would be interpolated past the last thing I actually measured, which
`~/.claude/rules/diagnosis.md` and this repo's own "never fit a value"
rule both rule out.

## Operating limit (recommendation: no-change)

- **Single `npm test` invocation** (the normal case — CI, ordinary local
  development): reliable. Measured 391-406ms against a 5,000ms budget,
  ~12x headroom, and a single invocation's own worker pool (≤11 forks for
  12 cores) does not itself reach the oversubscription level this
  diagnosis shows is necessary.
- **Concurrent-pair `npm test` invocations** (two full-suite runs launched
  at once on the same machine — this mission's own `lsh-T4` stress
  protocol, and a realistic condition on this org's shared, multi-session
  development machines): reliable in the large majority of cases — this
  session reproduced it twice with **zero** failures (611-1,433ms observed
  for the catalog test each time), consistent with 3 of `lsh-T4`'s 5
  trials. It fails intermittently (`lsh-T4`: 2 of 5 trials, 3 total
  occurrences) when the two processes' own startup CPU bursts happen to
  align tightly around the moment `catalog.test.ts` executes — a
  probabilistic OS-scheduling condition, not a fixed multiplier of load.

No code change is warranted on the evidence gathered. Setting a
`set-budget` number now would mean picking a value with no measured
worst-case behind it, which is exactly the "raise it until green" pattern
D5 exists to prevent. If a future occurrence needs a harder guarantee,
the next diagnostic step (not attempted here — it needs test-infrastructure
instrumentation, out of this task's write-set) is to hook vitest's own
worker-fork lifecycle directly (e.g. a `globalSetup`/reporter hook logging
each worker's fork-to-first-test timestamp) rather than an external probe,
so the actual synchronized-startup window can be measured directly instead
of approximated.

## Environment note

Two full-suite reproductions (items 5-6) ran against a tree another agent
was concurrently editing (`tests/helpers/*` and several `tests/unit/*`
files, per T1's parallel batch). Both runs completed 629/629 passed | 1
skipped with no failures, so this did not affect the diagnosis, but is
noted per the task's own caveat about a mid-edit tree.

## Quality gates (this session)

- `npm test` — exit 0, 629 files passed | 1 skipped, all tests green.
  Load at gate-run time: 2.71/3.32/3.43 (daemons 0.0%, from the pre-gate
  settle check).
- `npm run typecheck` — exit 0 (both tsconfigs).
- `npm run lint` — exit 0.
- `npm run build` — exit 0; only the 3 pre-existing `[unplugin:dts]`/
  TS2591/TS2503 notes in `src/core/include-resolver-node.ts`.

```json
{
  "mechanism": "catalog.test.ts's buildCatalog() call is a ~400-600ms CPU-bound synchronous tree-walk-and-parse (readdirSync + ts.createSourceFile) that draws on ~2x its own wall time in CPU-seconds even in isolation. It runs once, cold, inside one of up to 11 forked vitest workers per npm test invocation on this 12-core machine; two concurrent npm test invocations put up to 22 such forks in flight for 12 cores. The 5,000ms default trips only when catalog.test.ts's own execution window happens to land inside a moment of unusually tight overlap between the two processes' startup CPU bursts -- a scheduling-timing spike, not a smooth function of aggregate load.",
  "originFileLine": "scripts/generate-catalog.ts:54 (walk) and :107-109 (readModule/ts.createSourceFile); applied at tests/architecture/catalog.test.ts:20-22 against vitest's unconfigured 5,000ms default; worker-pool sizing at node_modules/vitest/dist/chunks/cli-api.BK8pd4xc.js:2404",
  "causalChain": "406ms cold baseline (confirmed) -> single npm test already uses ~11/12 cores -> two concurrent npm test processes want ~22/12 cores -> IF catalog.test.ts's ~500ms CPU-hungry window coincides with the two processes' own startup-burst peak (jsdom/esbuild/coverage setup across ~22 forks), wall time spikes past 5,000ms; measured non-colliding cases (this session's 2 reproductions, uncapped sampling up to load1=71) never exceeded 1,544ms, so the failure is specifically the collision case, not general contention",
  "ruledOut": [
    "Shared lock/mutex serializing the two suites -- ruled out by code inspection: catalog.test.ts/generate-catalog.ts import no lock primitive (0 references)",
    "Cross-process filesystem serialization on readdirSync/statSync -- ruled out by OS read-concurrency semantics and empirically: 22 concurrent real processes reading the same src/ tree peaked at 2,306.60ms, not a sharper I/O-serialization penalty",
    "Cross-process TS-parser/module-cache contention -- ruled out structurally: each forked worker has its own isolated V8/typescript module state",
    "Memory pressure/swapping -- ruled out by capacity: 96GB RAM, ~6.9GB free measured after the heaviest reproduction, no swap indicators",
    "Aggregate load average as the operative variable -- ruled out empirically: uncapped probe sampled 15 times across a real concurrent-pair run up to load1=71.09 never exceeded 1,544ms"
  ],
  "recommendation": "no-change"
}
```
