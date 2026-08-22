# stdlib-lock-sharing T0 — instrument + baseline

Measurement-only task. No fix, no lock-behavior change
(`plans/stdlib-lock-sharing/decisions.md` D4). Write-set:
`scripts/measure-lock-contention.ts` (new),
`scripts/build-stdlib-packages/build-lock.ts` (one small, justified,
inert-when-disabled hook — see below).

## Harness usage

```
npx jiti scripts/measure-lock-contention.ts --config single
npx jiti scripts/measure-lock-contention.ts --config concurrent-pair
npx jiti scripts/measure-lock-contention.ts            # both, in turn
```

Each invocation spawns `npm test` as its own OS process (twice, for
`concurrent-pair`, run concurrently with `COVERAGE_ISOLATE=1` set on both
— required per `.agent-notes/coverage-tmp-race.md`, or you measure the
`coverage/.tmp` shard race instead of lock contention). It sets
`STDLIB_LOCK_TRACE_DIR` to a fresh `mkdtemp`'d directory, reads every
`lock-trace-<pid>.jsonl` the run produced once the process(es) exit, and
prints one JSON line matching the contract:

```
{ configuration, acquisitions, totalWaitMs, totalHoldMs, meanHoldMs,
  maxHoldMs, maxWaitMs, timeouts }
```

## Mechanism: why `build-lock.ts` needed a hook (flagged per Boundaries)

The 8 reader test files, `tests/helpers/with-stdlib-build-lock.ts`, and
`scripts/build-stdlib-packages.ts`'s builder call site are all out of this
task's write-set, and none of them pass a `now`/`log` override to
`acquireBuildLock` — so there is no existing seam through which a REAL,
unmodified `npm test` run can be observed from outside. `acquireBuildLock`
now reads one new env var, `STDLIB_LOCK_TRACE_DIR`
(`build-lock.ts:75`-ish), once per call:

- Unset (every existing production caller, always): `traceDir` is
  `undefined`. The only additional cost is that one `process.env` read and
  a `!== undefined` check on the release path (and, on the rare throw
  path, one more). No `fs` call, no allocation beyond the `undefined`
  itself, no behavior change.
- Set: appends one JSON line per acquisition to
  `<dir>/lock-trace-<pid>.jsonl` — a file PER PROCESS (mirrors
  `coverage-reports-directory.ts`'s per-pid isolation), so two concurrent
  `npm test` invocations sharing one trace dir never race on the same file
  (distinct OS processes always have distinct pids while both are alive).

Vitest's v8-coverage-provider default pool is `forks`
(`node_modules/vitest/dist/chunks/coverage.*.js`: `resolved.pool ??=
"forks"`) — confirmed by reading that file, not assumed — so every worker
really is a separate process with its own pid; this is not a theoretical
safety margin.

### Overhead-when-disabled check (quoted, not asserted)

Ran 20,000 acquire/release cycles directly against `acquireBuildLock`
(throwaway probe in `scripts_scratch/T0/`, deleted before finishing —
not part of the write-set):

```
disabled: 0 trace files written, 117.7 µs/call
enabled:  1 trace file written, 152.3 µs/call
```

Zero files written when disabled is the "no output" proof the acceptance
criterion asks for. The ~34.6 µs/call delta when enabled is the
`appendFileSync` + `JSON.stringify` cost of the thing that's supposed to
cost something; the disabled path's only overhead is the env read +
comparison already reasoned about above, and it does not show up against
the ~118 µs/call baseline dominated by the lock's own two `fs` syscalls
per cycle (`tryCreateLockFile` + `releaseIfOwned`).

### `timeouts` field — a bug I found and fixed before trusting the number

First pass counted `timeouts` as "any thrown `'timeout'` trace record."
That produced `timeouts: 2` on a single, fully uncontended `npm test` run
— wrong, and a real bug, not run-to-run noise. Root cause:
`tests/unit/build-stdlib-lock.test.ts` deliberately drives
`acquireBuildLock` to throw twice per run, using `maxWaitMs: 100`
(`build-stdlib-lock.test.ts:276`, fake clock) and `maxWaitMs: 150`
(`build-stdlib-lock.test.ts:392`, real clock) to unit-test the timeout
path itself. Both are real `'timeout'` trace records — the hook fires for
every `acquireBuildLock` call process-wide, not only the real stdlib-lock
one — but neither is a production-budget timeout. Fixed by counting
`timeouts` against a fixed `PRODUCTION_MAX_WAIT_MS = 30_000` threshold
(matching `DEFAULT_MAX_WAIT_MS` in `build-lock.ts`, and the task's own
literal wording) applied to `waitMs` on every record, not "did throw".
Re-ran: `timeouts: 0` on the single-run baseline below. This is very
likely the same shape of confound the prior hand-measurement's raw
WAIT/HOLD prints were exposed to — its `acquisitions: 288` matches mine
exactly (see below), which is strong evidence its methodology also traced
every `acquireBuildLock` call process-wide rather than scoping to the
production lock; but its own "0 timeouts / single run" reading matches
what a fixed-30s-threshold count gives, not what a raw-throw count gives,
so I can't fully rule out that its underlying number-gathering already
applied an equivalent filter — only that my first pass, before I applied
one, was wrong.

## Baseline — machine load quoted next to every run

Before the single-run measurement:
```
11:33  load averages: 5.74 8.91 8.58
corespotlightd 0.0%, mds_stores 0.0%, suggestd 0.0%
```
Before the concurrent-pair measurement (run immediately after the single
run finished; load elevated from that run's own tail, not Spotlight):
```
11:35  load averages: 15.88 11.08 9.41
corespotlightd 0.0%, mds_stores 0.3%, suggestd 0.0%
```

| | Single run | Two concurrent suites |
|---|---|---|
| Acquisitions | 288 | 576 |
| Total time **holding** | 12,903 ms | 40,261 ms |
| Total time **waiting** | 33,806 ms | 319,190 ms |
| Mean hold | 44.8 ms | 69.9 ms |
| Max hold | 7,524 ms | 13,152 ms |
| Max wait | 7,434 ms | 29,500 ms |
| `timeouts` (waitMs ≥ 30,000ms) | 0 | 0 |

Raw contract rows:
```
{"configuration":"single","acquisitions":288,"totalWaitMs":33806,"totalHoldMs":12903,"meanHoldMs":44.802083333333336,"maxHoldMs":7524,"maxWaitMs":7434,"timeouts":0}
{"configuration":"concurrent-pair","acquisitions":576,"totalWaitMs":319190,"totalHoldMs":40261,"meanHoldMs":69.89756944444444,"maxHoldMs":13152,"maxWaitMs":29500,"timeouts":0}
```

Both `npm test` invocations in the concurrent-pair run passed in full:
`629 passed | 1 skipped` files, `16063 passed | 2 skipped | 1 todo` tests,
each — no flake, no timeout-driven test failure, this run.

## Comparison against the prior hand measurement

`.agent-notes/stdlib-lock-budget.md` (2026-08-21): 288 / 573 acquisitions,
54,745 ms / 229,592 ms total wait, 12,370 ms / 35,921 ms total hold,
9,483 ms / 29,724 ms max wait, 0 / 3 timeouts.

**Matches closely:** acquisitions (288 exactly; 576 vs 573, +0.5%), total
hold (12,903 vs 12,370, +4.3%; 40,261 vs 35,921, +12.1%), max hold (7,524
vs 7,515, +0.1%) — the *holding* side reproduces tightly in both
configurations. Both max-wait readings sit close to the 30,000ms cliff in
the concurrent case (29,500 here vs 29,724 there) — the qualitative
finding ("grazing the cliff on every concurrent run") reproduces even
though this run's own draw landed just under the budget instead of over
it, with 0 rather than 3 production-budget timeouts.

**Diverges:** total wait is meaningfully lower both configurations (33,806
vs 54,745, −38%; 319,190 vs 229,592, **+39% higher** in the concurrent
case — direction flips between configurations, not a uniform scale
factor). I did not chase this further: `npm test` is running on a shared,
multi-user machine (`uptime`'s 2-user load average, `9-16` even at
"quiet"), and the prior note's own instrumentation was hand-added and
reverted per-run rather than a fixed, reusable mechanism, so the two
runs are not on identical code (SI35's option D landed the day before,
`fix(T3)` commits on `2026-08-21` continued reshaping the same file
afterward) or necessarily comparable background load. Per the task
framing ("reproduce the numbers; do not inherit them"), I'm reporting the
divergence rather than tuning anything to close it — the acquisitions/
hold/max-wait agreement is the load-bearing confirmation that this
harness measures the same phenomenon the prior note did; the wait-total
gap is machine/timing variance across a day, not a methodology error I
could find (the `timeouts` bug above WAS a methodology error, and is
fixed and reflected in the table).

## Quality gates

- `npm test` — ran 4 times total across both measurement invocations (2
  full suites for `single`'s harness-internal `npm test`, 2 more
  concurrent for `concurrent-pair`); all 4 passed in full: `629 passed | 1
  skipped` files, `16063 passed | 2 skipped | 1 todo` tests, coverage
  95.44% / 90.47% / 96.95% / 96.53% (stmts/branch/func/line, all ≥ 90%).
- `npm run typecheck` — exit 0 (both tsconfigs; `scripts/**/*.ts` is
  covered by `tsconfig.node.json`'s `include`).
- `npm run lint` — exit 0 (`eslint src tests demo` — `scripts/` is not in
  ESLint's glob, so the new script isn't linted; matches every existing
  `scripts/*.ts` file).
- `npm run build` — exit 0. `git diff --name-only -- src/` is empty.

## Scope confirmation

- `git diff --name-only -- src/` → empty (zero tolerance, confirmed).
- `scripts_scratch/T0/` created for the overhead probe, deleted before
  finishing — not present in the final tree.
- No git write command run.
