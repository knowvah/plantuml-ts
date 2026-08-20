## Observation: sequence wiring into cross-type census + freshness sentinel
- **Context**: T5 of `sequence-oracle-harness`. Added `sequence` dispatch to
  `scripts/svg-conformance-census.ts` (routing through T1's
  `renderFixtureSequence`) and a `sequence` sentinel to
  `tests/oracle/svg-conformance/oracle-freshness.test.ts`.
- **Finding**:
  - `npx tsx scripts/svg-conformance-census.ts sequence` loads 1141 fixtures
    (matches T0's committed corpus size exactly) and reports 0/1141
    zero-diff, 1043 in the `11-30` bucket, 90 in `31+`, 7 in `4-10`, 1 error
    — consistent with T2's whole-corpus measurement of zero conformant
    fixtures. M=1141 (not 0), confirming the dispatch actually finds the
    fixtures rather than silently matching nothing.
  - Sentinel chosen: `bacupi-77-fuke586` — the `localeCompare`-first slug in
    `test-results/dot-cache/sequence/` (same selection rule the other 8
    sentinels already follow, confirmed by checking `component`/`usecase`/
    `class`'s own first-slugs). Its markup is a plain 6-line sequence
    diagram with no `!include`, no `newpage`, no `{{ }}` note — deliberately
    NOT `dasutu-58-saje713` (the documented `svek-*.dot`-emitting exception)
    and NOT one of the 3 `!include`-stdlib-failing slugs from T0's note.
    Byte-verified fresh via `scripts/oracle-render.sh <abs-out> <abs-puml>`
    against the pinned jar (`cmp` — byte-identical) before wiring it in.
  - `oracle-render.sh` resolves its `-o` out-dir RELATIVE TO THE INPUT
    FILE's directory, not the shell's cwd, when given relative paths — a
    relative out-dir + relative puml produced a spuriously nested
    `scripts_scratch/T5/scripts_scratch/T5/` and no `.svg` at the expected
    path. Not a bug in the wrapper; CLAUDE.md already says "always" pass
    absolute paths to it — this is why. Using absolute paths for both args
    fixed it immediately.
  - Demonstrated the guard actually guards: copied the freshness test file
    into a `scripts_scratch/T5/a/` scratch dir (3 levels deep, matching
    `tests/oracle/svg-conformance/`'s depth, since the file computes `REPO`
    via `join(dirname(...), '../../..')`), pointed its `sequence` sentinel
    at a synthetic `STALE-*` cache dir holding the sentinel's own `in.puml`
    paired with a DIFFERENT fixture's `in.svg`, and ran it via a scratch
    `vitest.stale.config.ts` (`include: ['scripts_scratch/T5/a/*.test.ts']`)
    since the real config's `include: ['tests/**/*.test.ts']` excludes
    scratch paths. Result: 8 passed, 1 failed — only the deliberately-stale
    sequence row — with the exact `staleMessage` text. All scratch
    artifacts (probe file, scratch config, synthetic cache dir) deleted
    before finishing; `git status --short` confirmed only the two intended
    files changed.
  - `npm test` collided twice with sibling agents' concurrent `npm test`
    runs on the shared `coverage/.tmp` directory — vitest's own error text
    on the second attempt: "Something removed the coverage directory ...
    Make sure you are not running multiple Vitests with the same
    coverage.reportsDirectory at the same time." Confirmed via `ps aux`
    that other test/JVM processes were active during both failed attempts.
    A third attempt, run when `ps aux` showed no concurrent vitest/npm
    processes, passed cleanly: 623/623 test files, coverage
    95.44/90.47/96.94/96.52 (stmt/branch/fn/line), 65.02s wall-clock
    (`/usr/bin/time -p`) / 63.99s per vitest's own `Duration` line — over
    the mission's 60.3s bar by ~4-5s, plausibly still partial contention
    from siblings even though `ps` showed nothing at start (background JVM
    renders from T3/T4 can start mid-run).
- **Impact**: Confirms sequence is now a first-class member of the
  cross-type census and freshness surfaces, with the guard's failure mode
  independently demonstrated (not just asserted). The `coverage/.tmp`
  collision is an environment hazard for any agent running `npm test`
  concurrently with siblings in this shared working tree — worth knowing
  before trusting a single failed `npm test` run as a real regression.
- **Confidence**: High (all findings directly observed via tool output).
