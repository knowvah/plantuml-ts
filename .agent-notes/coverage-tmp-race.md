# coverage/.tmp — concurrent-run race, root cause and fix

Diagnosed and fixed 2026-08-21, immediately after `stdlib-run-isolation`
(SI35) merged. SI35's T5 found the symptom while verifying that mission and
recorded it as "not root-caused". It is root-caused now.

## Observation: the race is a documented vitest usage constraint, not a bug

- **Context**: Two concurrent full `npm test` runs (`vitest run --coverage`,
  vitest 4.1.10, v8 provider) against one checkout.
- **Finding**: Vitest does not expose the raw-coverage scratch directory as
  its own option. It *derives* it from `reportsDirectory`
  (`node_modules/vitest/dist/chunks/coverage.DM_a_rWm.js:654-655`):

  ```js
  const tempDirectory = `.tmp${shard ? `-${shard.index}-${shard.count}` : ""}`;
  this.coverageFilesDirectory = resolve(this.options.reportsDirectory, tempDirectory);
  ```

  `clean()` (`:719-724`) unconditionally `rm -rf`s that directory and
  recreates it **at run start**, and shards are written into it as
  `coverage-${uniqueId++}.json` (`:740`) from a counter that starts at the
  same value in every process.

  Vitest already knows about this scenario and ships a dedicated error for it
  (`:729`): *"Something removed the coverage directory … Vitest created
  earlier. Make sure you are not running multiple Vitests with the same
  `coverage.reportsDirectory` at the same time."* It also uses the same
  directory-suffixing trick itself for `--shard`.
- **Impact**: This is **ours to configure, not an upstream defect** — there is
  nothing to report to vitest. Two runs sharing `reportsDirectory` share
  `.tmp`, and that has *two* distinct failure modes, not one.
- **Confidence**: High — read the source, then reproduced both modes.

## Observation: there are TWO failure modes, and the reported one is the rarer

- **Context**: 3 controlled trials, each two concurrent full suites sharing
  the default `coverage/`.
- **Finding**:
  1. **Deletion** — run B's start-of-run `clean()` deletes run A's shards
     mid-flight. Surfaces as `ENOENT ... coverage/.tmp/coverage-<n>.json`.
     This is what SI35's T5 observed and hypothesised.
  2. **Filename collision / corruption** — because `uniqueId` restarts at the
     same value per process, both runs write `coverage-0.json`,
     `coverage-1.json`, … into the *same* directory, interleaving their
     content. Surfaces as
     `SyntaxError: Unexpected non-whitespace character after JSON at position 1364804`
     thrown from `V8CoverageProvider.readCoverageFiles`
     (`coverage.DM_a_rWm.js:762`).

  Mode 2 is what actually reproduced here (2 of 6 shared runs). It is the
  worse of the two: deletion fails loudly with a clear ENOENT, while
  collision produces a *corrupt but present* file.
- **Impact**: A fix that only prevented deletion would miss the corruption
  mode. Separating `reportsDirectory` per process closes both, because both
  stem from sharing one directory.
- **Confidence**: High — both signatures quoted from real trial logs.

## The fix

`vitest.config.ts` resolves `coverage.reportsDirectory` through
`tests/helpers/coverage-reports-directory.ts`. **Off by default**: an ordinary
`npm test`, and CI, resolve the literal `'coverage'` and behave exactly as
before, thresholds included. `COVERAGE_ISOLATE=1` opts a run into
`<os-tmpdir>/plantuml-ts-coverage-<pid>`.

Isolated runs deliberately write **outside the repository**: they are
throwaway, and putting them under `coverage/` would leave a per-pid directory
behind in the working tree after every concurrent run. The OS reaps its temp
dir; the repo stays clean. Note that the isolated report directory is *not*
deleted at the end of a run — vitest removes only its own `.tmp` subdirectory
(`:774`). This is intentional: deleting the report dir from `globalSetup`'s
teardown would risk racing the report writer.

## Measured result

| Configuration | Trials | Coverage-race failures | Build-lock timeouts |
|---|---|---|---|
| Shared `coverage/` (before) | 3 pairs = 6 runs | **2 runs** | 5 timeouts across 2 runs |
| `COVERAGE_ISOLATE=1` (after) | 3 pairs = 6 runs | **0 runs** | 1 timeout in 1 run |

## Observation: concurrent runs are STILL not fully safe — a separate defect

- **Context**: The same trials above.
- **Finding**: The dominant failure mode for two concurrent suites is now
  **not** coverage at all. It is
  `Error: Timed out after 30000ms waiting for the stdlib build lock at
  /var/folders/.../plantuml-ts-stdlib-build-<hash>.lock`, thrown from
  `acquireBuildLock` (`scripts/build-stdlib-packages/build-lock.ts:315`).
  It failed real tests in 2 of 6 shared runs and 1 of 6 isolated runs.
- **Impact**: This is a direct consequence of SI35's **option D**, which put
  8 reader files under that lock with `maxWaitMs = 30_000`. Under genuine
  two-suite concurrency the contention exceeds 30 s and the acquire throws.
  Option D was chosen knowing it carried "up to 30 s tail latency"; what the
  trials show is that two full suites can *exceed* that budget, turning
  latency into failure. Closing the coverage race does not make concurrent
  runs safe — it removes one of two blockers.
- **Not fixed here**: raising `maxWaitMs`, or scoping the lock differently, is
  a design decision with real trade-offs (a larger budget masks genuine
  deadlock). Left for an explicit decision rather than changed unilaterally.
- **Confidence**: High — quoted from trial logs, with the throw site read.
