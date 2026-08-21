# SRE T0 — stdlib-build-race, root-cause artifact

## Mechanism
`buildStdlibPackages()`'s per-package helper `freshGeneratedDir`
(`scripts/build-stdlib-packages.ts:42-47`) unconditionally
`rmSync(generatedDir, { recursive: true, force: true })`s the fixed,
repo-absolute `packages/<pkg>/generated/` directory and then repopulates it
with several sequential `writeFileSync` calls before any reader can observe
a complete tree again. `generatedDir` is not per-run-isolated (no PID, no
temp dir) — it is the literal path
`tests/integration/stdlib-remote-e2e.test.ts:49,51` `import()`s. A **second,
independently-scheduled OS process** that also runs `globalSetup` (i.e. a
second concurrent `npm test`/`vitest` invocation) calls the same
`buildStdlibPackages()` on its own schedule, with no coordination between
processes. If that second process's `rmSync`+rewrite window overlaps the
instant a first process's worker is resolving/reading
`tupadr3.remote.js` (or any sibling generated file), the read observes the
directory either emptied or mid-rewrite and fails with
`ENOENT`/`Cannot find module`.

## Origin
`scripts/build-stdlib-packages.ts:42-47` (`freshGeneratedDir`) — the
unconditional `rmSync` of a shared, fixed-path, gitignored directory with no
cross-process lock and no up-to-date check before deleting.

## Causal chain
1. `globalSetup` (`tests/helpers/build-stdlib-globalsetup.ts:86-89`) calls
   `buildStdlibPackages()` once per **vitest process**, before that
   process's own workers spawn. This closes the *intra*-process race
   si11a/SI12 fixed (three test files each rebuilding in their own
   `beforeAll`).
2. It does **not**, and structurally cannot, close an *inter*-process race:
   nothing prevents a second, concurrently-running `npm test` invocation's
   `globalSetup` from calling the same `rmSync`+rewrite against the same
   path while the first invocation's workers are still importing out of it.
3. `import()` (or a plain `fs` read) of `tupadr3.remote.js` issued by
   process A, landing inside process B's `rmSync`-to-rewrite window, throws
   `Cannot find module '.../tupadr3.remote.js'` / `ENOENT` — exactly the
   signature recorded in `.agent-notes/g1h-T2.md`.
4. The `globalSetup` doc comment's claim — *"globalSetup completes before
   any worker spawns, so no test ever observes a half-rebuilt tree"* — is
   true only **within** one vitest process; it says nothing about a second
   process, and its confident wording is what led the prior task (SI33 /
   g1h-T2) to scope its search to intra-process writers and rule out the
   one caller of `buildStdlibPackages()` in the test tree, leaving the real,
   inter-process cause unavailable to that search.

## Ruled out (with evidence)
- **Same-turn single-process race** (`scripts_scratch/T0/unit-pin.test.ts`):
  starting `import(url)` then calling the real `buildStdlibPackages()`
  before awaiting, under both `jiti` (5/5 runs) and vite-node
  (`vitest run --config scripts_scratch/T0/unit-pin.config.ts`, 3/3 runs),
  **never** reproduced — every run resolved the import with full, correct
  content. Evidence this is a loader property, not a timing fluke: both
  loaders' `import()` of a plain local `.js` path performs the actual
  read/parse synchronously before returning control, so by the time
  `buildStdlibPackages()` runs, the read has already completed. Eliminates
  same-turn single-process ordering as a viable (or as *the*) mechanism.
- **Threadpool-async single-process race**
  (`scripts_scratch/T0/unit-pin-fsread.test.ts`, `fs.promises.readFile`
  instead of `import()`): 5/5 runs, all succeeded. A libuv-threadpool read
  of one small, page-cache-warm file completes faster than
  `buildStdlibPackages()`'s multi-file, ~29 MB synchronous rewrite loop can
  reach that specific file. Eliminates "any async op racing a rebuild
  reproduces it" — the reader needs sustained overlap, not a single
  fire-and-forget attempt.
- **T2's write-set, a second in-run writer, and `prepack`** — already ruled
  out by g1h-T2.md with evidence; not re-derived here (per pre-loaded
  observations).
- **The preceding `npm run build`** — already ruled out by g1h-T2.md
  (controlled experiment, negative); not re-derived here.

## Reproduction (positive evidence)

**Primary (D2, two real OS processes, the real `buildStdlibPackages`):**
process A loops calling the real `buildStdlibPackages()`
(`scripts_scratch/T0/writer.ts`, `jiti scripts_scratch/T0/writer.ts 300 2`);
process B loops `import()`-ing the real `tupadr3.remote.js` with a
cache-busting query per attempt (`scripts_scratch/T0/reader.ts`, `jiti
scripts_scratch/T0/reader.ts 100000`), both launched concurrently:

```
( npx jiti scripts_scratch/T0/writer.ts 300 2 > writer.log 2>&1 ) &
( npx jiti scripts_scratch/T0/reader.ts 100000 > reader.log 2>&1 ) &
wait
```

**5/5 runs failed** with the recorded signature (raw output, one line per
run):
```
Run 1: FAIL at attempt 1297: Cannot find module '/Users/scottseely/git/knowvah/plantuml-ts/packages/stdlib-tupadr3/generated/tupadr3.remote.js'
Run 2: FAIL at attempt 334:  Cannot find module '/Users/scottseely/git/knowvah/plantuml-ts/packages/stdlib-tupadr3/generated/tupadr3.remote.js'
Run 3: FAIL at attempt 541:  Cannot find module '/Users/scottseely/git/knowvah/plantuml-ts/packages/stdlib-tupadr3/generated/tupadr3.remote.js'
Run 4: FAIL at attempt 530:  Cannot find module '/Users/scottseely/git/knowvah/plantuml-ts/packages/stdlib-tupadr3/generated/tupadr3.remote.js'
Run 5: FAIL at attempt 801:  Cannot find module '/Users/scottseely/git/knowvah/plantuml-ts/packages/stdlib-tupadr3/generated/tupadr3.remote.js'
```
Mean attempts to fail: (1297+334+541+530+801)/5 = **700.6**.

**Secondary unit-level pin (single process, genuine OS-thread concurrency,
not a same-turn trick):** main thread loops calling the real
`buildStdlibPackages()`; a `worker_threads` Worker running plain JS
(`scripts_scratch/T0/worker-reader.mjs`, no transform layer, so it runs on
a real separate OS thread) loops `readFileSync`-ing the same path
concurrently
(`jiti scripts_scratch/T0/unit-pin-worker.ts <writerIters> <readerAttempts>`).
**5/5 runs failed**, first failure consistently within the first ~55-60
reader attempts:
```
Run 1: 81069 failing reads; first at attempt 54: [ENOENT] ...tupadr3.remote.js
Run 2: 81009 failing reads; first at attempt 58: [ENOENT] ...tupadr3.remote.js
Run 3: 81123 failing reads; first at attempt 54: [ENOENT] ...tupadr3.remote.js
Run 4: 81184 failing reads; first at attempt 60: [ENOENT] ...tupadr3.remote.js
Run 5: 81064 failing reads; first at attempt 57: [ENOENT] ...tupadr3.remote.js
```
(`freshGeneratedDir` itself is not exported — `buildStdlibPackages` is the
module's only export, per `scripts/build-stdlib-packages.ts:107`; both
pins call it directly, not a reimplementation.)

## Accounting for the three recorded facts (g1h-T2.md)
- **(a) the generated file's mtime being inside the failing run** — matches
  directly: in both reproductions, the writer is *continuously* rewriting
  `tupadr3.remote.js` for the run's whole duration (not a one-shot build at
  start), so any mtime sampled during a genuinely overlapping second run
  necessarily falls inside that run's window.
- **(b) the unresolvable import** — reproduced verbatim, 10/10 combined runs
  across both harnesses (`Cannot find module .../tupadr3.remote.js` /
  `ENOENT` on the same path).
- **(c) the failing run being the only one launched at load1 ~17, and also
  the slowest (59.96 s vs 53.92-55.82 s)** — consistent with, not merely
  compatible with, the mechanism: elevated load (~17) at launch is itself
  evidence of other concurrently-running processes on the machine
  competing for CPU/I/O — precisely the condition D2's harness reproduces
  directly (a second process performing the same disk-heavy rebuild at the
  same time). That contention is also the reason the run was slowest: the
  same competing I/O that stretches wall-clock duration is what widens the
  window during which one run's `rmSync` can overlap another's read. Load
  and duration are not two independent coincidences here — both are
  symptoms of the one underlying condition (genuine concurrent activity
  against the same shared path) the mechanism requires.

## Interface-contract result
```json
{
  "reproCommand": "( npx jiti scripts_scratch/T0/writer.ts 300 2 > writer.log 2>&1 ) & ( npx jiti scripts_scratch/T0/reader.ts 100000 > reader.log 2>&1 ) & wait",
  "failureSignature": "Cannot find module '<repo>/packages/stdlib-tupadr3/generated/tupadr3.remote.js'",
  "meanAttemptsToFail": 700.6,
  "reproducible": true
}
```

## Quality gates
- `npm test`: 624 test files passed, 16006 passed / 1 skipped / 1 todo.
  `Duration` 57.687 s (vitest-reported; `time` wrapped total also 57.687 s
  user+sys). Measured with `uptime` load1 **4.56** just before the run
  (`mds_stores` steady ~12%, `suggestd`/`corespotlightd` at 0%) — under the
  60.3 s ceiling.
- `npm run typecheck`: exit 0, no errors.
- `npm run lint`: exit 0, no errors (scoped to `src tests demo`;
  `scripts_scratch/` is out of lint's scope).
- `npm run build`: exit 0. Exactly 3 pre-existing TS2591/TS2503 notes in
  `src/core/include-resolver-node.ts` (Node global types under the
  browser-safe `tsconfig` used for the dts bundling pass) — the documented
  pre-existing notes, not a new failure.
- `git diff --name-only -- src/`: empty.

## Scope note
No `src/` changes and no fix in this task, per the write-set boundary.
`scripts_scratch/T0/` is left in place (not deleted) for the next task; the
real `packages/*/generated/` tree was restored to a complete, valid state
before finishing (`npx jiti scripts/build-stdlib-packages.ts`, confirmed by
`ls`).
