# SRE T1 — guarded repro promoted to a real test

## Correction (post-review)
First pass pointed the test at `scripts_scratch/T0/writer.ts`/`reader.ts`,
which the mission brief has the orchestrator delete once this task lands
(batch-0's quality bar: "The orchestrator removes it after T1 lands").
That breaks the committed test on the next checkout. Fixed by promoting the
harness itself into committed files:

- `tests/helpers/stdlib-build-race-writer.ts`
- `tests/helpers/stdlib-build-race-reader.ts`

`tests/helpers/` is this repo's existing convention for shared test
utilities; both files are `.ts`, not `.test.ts`, so vitest's
`include: ['tests/**/*.test.ts']` does not collect them as tests. Semantics
are copied verbatim from `scripts_scratch/T0/` — same real
`buildStdlibPackages` import in the writer, same cache-busting query-string
`import()` per attempt in the reader, same `WRITER_ITERATIONS` (300),
`WRITER_DELAY_MS` (2), `READER_ATTEMPTS` (100,000) constants. Only the
doc-comment path references and the "committed, not scratch" framing
changed. `tests/integration/stdlib-build-race.test.ts`'s `WRITER_SCRIPT`/
`READER_SCRIPT` now resolve into `tests/helpers/`, not `scripts_scratch/`.

## What was written
`tests/integration/stdlib-build-race.test.ts` follows the repo's existing
`describe.skipIf(...)` convention (`tests/unit/description-doc-dims.test.ts`,
`tests/oracle/declaration-order-parity.test.ts`, `tests/oracle/
wrapper-parity.test.ts`) — no `.test.ts` file in this repo gates on a raw
env var directly, so the gate is
`describe.skipIf(!process.env.STDLIB_BUILD_RACE_REPRO)`, matching that
idiom's shape. `SVG_PARITY_TIMEOUT_MS`/`SVG_PARITY_CONCURRENCY`
(`scripts/svg-parity-survey.ts:77-78`) confirmed the `SCREAMING_SNAKE`
env-var naming convention used for the var name itself.

The assertion polarity is deliberate: it asserts the ABSENCE of the race
(reader exits 0, no `FAIL at attempt` in its stdout). That makes the test
RED on this unfixed tree (the failure IS the evidence) and is expected to
flip GREEN once T4's build lock lands — this matches T4's own acceptance
criterion ("Given T1's guarded repro on this tree, then it now PASSES").

## Interface-contract result
```json
{
  "envVar": "STDLIB_BUILD_RACE_REPRO",
  "testPath": "tests/integration/stdlib-build-race.test.ts",
  "writerPath": "tests/helpers/stdlib-build-race-writer.ts",
  "readerPath": "tests/helpers/stdlib-build-race-reader.ts",
  "prefixFailureQuoted": "FAIL at attempt 1036: Cannot find module '/Users/scottseely/git/knowvah/plantuml-ts/packages/stdlib-tupadr3/generated/tupadr3.remote.js'"
}
```

## Verbatim pre-fix failure (this unfixed tree, guard set, NEW committed harness)
Command: `STDLIB_BUILD_RACE_REPRO=1 npx vitest run
tests/integration/stdlib-build-race.test.ts --config vitest.config.ts`

```
 ❯ tests/integration/stdlib-build-race.test.ts (1 test | 1 failed) 107291ms
     × a concurrent buildStdlibPackages() rebuild does not race a tupadr3.remote.js import 107290ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/integration/stdlib-build-race.test.ts > stdlib build race -- inter-process rebuild vs. import (SRE T0/T1) > a concurrent buildStdlibPackages() rebuild does not race a tupadr3.remote.js import
AssertionError: expected 'FAIL at attempt 1036: Cannot find mod…' not to match /FAIL at attempt \d+: (Cannot find mod…/

- Expected:
/FAIL at attempt \d+: (Cannot find module|ENOENT)/

+ Received:
"FAIL at attempt 1036: Cannot find module '/Users/scottseely/git/knowvah/plantuml-ts/packages/stdlib-tupadr3/generated/tupadr3.remote.js'
Require stack:
- /Users/scottseely/git/knowvah/plantuml-ts/tests/helpers/stdlib-build-race-reader.ts
"

 ❯ tests/integration/stdlib-build-race.test.ts:93:41

 Test Files  1 failed (1)
      Tests  1 failed (1)
   Duration  108.19s
```
Matches T0's signature exactly (`Cannot find module '.../tupadr3.remote.js'`),
attempt 1036 this run (T0's mean was 700.6 across 5 runs — same order of
magnitude, same failure mode). The require-stack line now names
`tests/helpers/stdlib-build-race-reader.ts`, confirming the repointing
actually took effect rather than silently still resolving scratch.
`packages/stdlib-tupadr3/generated/` was confirmed complete and non-empty
(`tupadr3.remote.js`, 6857 lines) after the run.

## Default-skipped cost (unchanged tree, no env var)
Two `npm test` measurements were taken across this task; both are reported
because the second run's machine load did not settle as cleanly.

**Run A (first pass, same skip code path — the describe block never
touches `WRITER_SCRIPT`/`READER_SCRIPT`, so this measurement is unaffected
by today's harness relocation):** load settled first (`mds` 1.1%,
`mds_stores` 0.9%, `suggestd` 0.3%, `corespotlightd` 0%, load1 dropped from
a transient 7.2 spike). `npm test`: 624 files passed | 1 skipped, 16006
tests passed | 2 skipped | 1 todo, `Duration 57.05s` / `time` wrapper
57.204s vs. T0's own 57.687s baseline — within noise, under the 60.3s
ceiling.

**Run B (re-verification after this correction):** the two race-repro runs
above rewrote `packages/stdlib-tupadr3/generated/` several hundred times
each in quick succession; macOS `corespotlightd`/`mds_stores` visibly
reacted (`corespotlightd` sustained 90-280%, `mds_stores` briefly 70%)
during and after, and did not settle to baseline within ~2 minutes of
polling (`until` loop, 20 x 10s checks) — this is a self-induced Spotlight
re-index of the churned directory, not a pre-existing confound. Ran `npm
test` anyway rather than block further: `uptime` load1 5.44 (5m/15m still
elevated at 9.00/10.73 from the churn), `corespotlightd` 95.5% at launch.
Result: 624 passed | 1 skipped files, 16006 passed | 2 skipped | 1 todo
tests, `Duration 58.45s`, `time` wrapper **59.448s** — still under the
60.3s ceiling but only ~0.85s of headroom, visibly inflated versus Run A's
57.2s under the same skip path. Coverage both runs: statements 95.44%,
branches 90.47%, functions 96.95%, lines 96.53% (>= 90/90/90).

Mechanism for the delta: the default-skip code path itself is provably
identical between runs (the failing test's body never executes under
`describe.skipIf`, and the guard predicate doesn't depend on where
`WRITER_SCRIPT`/`READER_SCRIPT` point); the ~2.2s slowdown is CPU
contention from `corespotlightd`/`mds_stores`, not a regression the new
committed files introduced. Run A is the trustworthy measurement of "what
does the default-skipped test cost"; Run B corroborates it stays under
ceiling even under self-induced indexing load.

## Quality gates
- `npm test`: exit 0 both runs (Run A 57.05s/57.204s, settled load1 ~7.2
  post-spike-settle, watch-list daemons ~0; Run B 58.45s/59.448s, load1
  5.44 but `corespotlightd` 95.5%, unsettled from this task's own file
  churn — see above).
- `npm run typecheck`: `tsc --noEmit && tsc --project tsconfig.node.json
  --noEmit` — exit 0, no errors (re-run after the harness relocation).
- `npm run lint`: `eslint --no-error-on-unmatched-pattern src tests demo`
  scoped to the three changed files plus a full `src tests demo` pass —
  exit 0, no warnings/errors.
- `npm run build`: exit 0. Exactly the same 3 pre-existing TS2591/TS2503
  notes in `src/core/include-resolver-node.ts` T0 documented — not a new
  failure.
- `git diff --name-only -- src/`: empty (re-checked after the correction).
- `git status --short`: `tests/helpers/stdlib-build-race-writer.ts`,
  `tests/helpers/stdlib-build-race-reader.ts`,
  `tests/integration/stdlib-build-race.test.ts`, `.agent-notes/sre-T1.md`
  (this task's write-set) plus pre-existing untouched
  `scripts_scratch/` and an orchestrator-owned
  `plans/stdlib-build-race/decision-journal.md` modification not made by
  this task.

## Scope note
No `src/` changes, no fix. `scripts_scratch/T0/` untouched and NOT
deleted — per instruction, the orchestrator removes it, not this task.
Read-only git only — no commits, no staging, no branch ops.
