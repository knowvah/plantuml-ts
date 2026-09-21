# Batch F (scripts/CI/lint/test config) — session notes

## Observation: worktree-relative dynamic import() cannot cross the
project root, even through a required symlink
- **Context**: Verifying `npm test` coverage for item 8 (vitest.config.ts
  coverage excludes). `npm test` showed 5 test files / 18 tests failing
  with `Cannot find module '.../packages/<pkg>/generated/*.js'`, all from
  `tests/unit/stdlib-package-files.test.ts` and
  `tests/unit/stdlib-all-exports.test.ts`.
- **Finding**: Diagnosed to a mechanism unrelated to any item in this
  batch. `packages/*/generated` is one of the worktree-hazard symlinks
  (CLAUDE.md/brief: "never write through them") and its `realpathSync()`
  resolves OUTSIDE this worktree's root, into the main checkout
  (`/Users/scottseely/git/knowvah/plantuml-ts/packages/...`). Vitest's
  SSR module runner (vite-node) refuses to `import()` any absolute path
  that resolves outside the configured project root — confirmed with a
  bare reproduction: `existsSync()` and a plain Node.js `import()`
  (outside Vite) both succeed on the exact same path, but the identical
  `import()` inside a vitest test throws "Cannot find module", and an
  unrelated file physically outside the worktree (in `/private/tmp`,
  no symlink involved at all) reproduces the identical error — so the
  determining factor is "resolves outside project root", not the
  symlink or the stdlib content itself.
- **Impact**: Any test in ANY worktree of this fleet that dynamically
  `import()`s from `packages/*/generated/` (or any other symlinked
  hazard directory whose target lies outside that worktree's root) will
  fail this way, independent of code correctness. Reproduced identically
  with every one of this batch's own changes reverted, so it predates
  this session. Not something in this batch's write-set to fix
  (`scripts/build-stdlib-packages/build-lock.ts`, the worktree symlink
  layout) — a worktree-symlink-strategy change is exactly the "shared
  cache key scheme" class of change the mission boundaries say to ask
  first about, not fix unilaterally.
- **Confidence**: High — reproduced deterministically across 3 separate
  `npx vitest run` invocations, isolated from `withStdlibBuildLock`
  (bare `import()` fails identically) and from any timing/race
  explanation (file mtimes static, not concurrently rewritten).

## Observation: Vitest's default coverage.reportOnFailure suppresses the
coverage table on ANY test failure
- **Context**: Same investigation — needed the coverage % for item 8's
  quality bar but `npm test`'s full output had no coverage table at all
  (only "Coverage enabled with v8" at start, no `% Stmts` summary).
- **Finding**: Vitest 5's coverage report generation is skipped by
  default when any test fails (`coverage.reportOnFailure` defaults to
  `false`). Forcing it with
  `npx vitest run --coverage --coverage.reportOnFailure=true` produced
  the real numbers despite the 18 pre-existing failures above: 96.27%
  statements, 91.7% branches, 97.35% functions, 97.24% lines.
- **Impact**: A batch/agent relying on `npm test`'s absence-of-a-
  coverage-table as "coverage must have failed" would be wrong whenever
  ANY unrelated test fails elsewhere in the suite — the coverage gate
  silently doesn't run rather than failing loudly. Worth knowing for
  any future coverage-threshold verification in a similarly imperfect
  worktree state.
- **Confidence**: High — directly observed both with and without the
  override flag, same worktree state.

## Observation: `npx playwright test`'s default outputDir clears a
worktree-hazard symlink
- **Context**: Item 7 (E2E in CI) — ran `npx playwright test` locally
  per the brief's instruction.
- **Finding**: Playwright's default `outputDir` is `test-results/`,
  which it clears before each run. In this worktree, `test-results/`
  itself is a real directory but `test-results/dot-cache` is a symlink
  to the main checkout (same hazard class as `packages/*/generated`).
  The clear removed the `dot-cache` SYMLINK from this worktree (the
  main checkout's actual tracked data was untouched — verified
  `ls -la` on the main checkout copy before and after). Restored with
  `ln -s /Users/scottseely/git/knowvah/plantuml-ts/test-results/dot-cache
  test-results/dot-cache`, matching the exact pattern already used for
  `node_modules`/`oracle/dist` in this worktree.
- **Impact**: Any agent running `npx playwright test` (or `test:e2e`) in
  a worktree with this symlink layout will silently break the
  `dot-cache` symlink locally (not lose data, just need to recreate the
  symlink — or `npm test`'s own `dot-cache`-dependent tests will start
  failing with ENOENT until it's restored). Did not change
  `playwright.config.ts`'s `outputDir` to work around this — that file
  is small and in this batch's write-set, but redirecting Playwright's
  output elsewhere is a bigger, uncoordinated change to a path other
  worktrees/CI may assume, so it's left as a documented hazard rather
  than silently patched.
- **Confidence**: High — directly observed the symlink disappearing
  after the Playwright run and the main checkout's copy being intact
  throughout.
