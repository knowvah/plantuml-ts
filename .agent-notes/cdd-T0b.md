# cdd-T0b — render-diff / render-all / pin-diff tooling

## Observation: `tsx` is not installed; `jiti` is

- **Context**: T0b-tooling.md's every invocation example says `npx tsx ...`.
- **Finding**: `node_modules/.bin/tsx` does not exist in this repo;
  `node_modules/.bin/jiti` (v2.7.0) does, and every existing `scripts/*.ts`
  CLI entry point (e.g. `svg-parity-survey.ts`) is designed to run under it.
- **Impact**: All three tools and `tools/README.md` document invocation as
  `npx jiti plans/class-divergence-drive/tools/<tool>.mts ...`, not `npx tsx`.
- **Confidence**: High (verified: `ls node_modules/.bin`).

## Observation: `svg-parity-survey.ts`'s CLI dispatch is import-safe

- **Context**: The task brief flagged a risk that importing `diffVerdict`
  from `scripts/svg-parity-survey.ts` might trigger the file's `main()`/CLI
  behavior as a side effect of import.
- **Finding**: The file's only top-level side effect beyond constant
  definitions is a single guarded block at the tail:
  `if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) { ... }`.
  When another module imports it (rather than it being the process entry
  point), `process.argv[1]` is the importer's path, so the guard is false and
  nothing executes. `diffVerdict` itself (lines 166-186) is pure — it only
  calls `compareSvg` and returns a plain object.
- **Impact**: `render-all.mts` imports `diffVerdict` and `type Verdict`
  directly from `../../../scripts/svg-parity-survey.js` rather than
  re-implementing it. Its actual return-value union is narrower than its
  declared `Verdict` type (`diffVerdict` never returns `'oracle-error'`,
  `'errored'`, or `'timeout'` — those are assigned by
  `oracleErrorRow`/`rowFor` in the surrounding survey pipeline, which
  `render-all.mts` doesn't reuse), so `render-all.mts` narrows defensively
  with `toRowVerdict` rather than widening `RenderAllRow`'s type to match an
  unreachable case.
- **Confidence**: High (read the full file; the same guard pattern is
  applied to all three of this task's own `.mts` files for the same reason
  — so their own test files can import pure helpers without triggering the
  CLI).

## Observation: mission `tools/` has no test runner by default; a plain vitest include scopes from cwd, not from the config file

- **Context**: `plans/` is outside every gate (`tsconfig.json`, root
  `vitest.config.ts`, `eslint` invocation). Attempting `npx vitest run
  --config /dev/null plans/class-divergence-drive/tools` fails outright on
  vitest 5.0.1 (rolldown can't bundle `/dev/null` as a config entry).
- **Finding**: A minimal `vitest.config.ts` with `include: ['**/*.test.ts']`
  but no `root` override collects from the invocation's CWD (repo root),
  which matched the ENTIRE `tests/**` suite (750+ files) the first time this
  was tried — a silent over-collection, not the "0 files collected" failure
  mode the mission's own memory warns about, but the same underlying trap
  (a vitest filter/include doing something other than what you assumed).
  Setting `root: dirname(fileURLToPath(import.meta.url))` inside the config
  file scopes collection to exactly the tools directory regardless of
  invocation cwd.
- **Impact**: `tools/vitest.config.ts` is committed alongside the three
  tools so `npx vitest run --config
  plans/class-divergence-drive/tools/vitest.config.ts` deterministically
  collects exactly 3 files / N tests, from any cwd. A later task adding a
  fourth `tools/*.test.ts` file will be picked up automatically (glob, no
  per-file listing).
- **Confidence**: High (reproduced both the `/dev/null` failure and the
  whole-suite over-collection before landing on the `root`-pinned config).

## Observation: `render-all.mts` in-process corpus render is fast, not a bottleneck

- **Context**: The production survey spawns persistent `jiti` worker
  subprocesses specifically because a per-fixture spawn model measured ~8.9s
  import cost per fixture (`svg-parity-workers.ts`'s own header comment).
  This task's `render-all.mts` renders in-process instead (no worker pool,
  no timeout), which the brief flagged as a possible multi-minute run.
- **Finding**: Rendering all 723 cached class fixtures in a single `jiti`
  process (one import, one asset-store build, 723 in-process `renderSync`
  calls) took ~8.6s wall clock on the dev machine — the per-fixture jiti
  IMPORT cost the survey's worker pool exists to amortize doesn't recur when
  there's only ever one process. Zero fixtures errored or hung.
- **Impact**: `render-all.mts` is safe to run ad hoc before every batch
  close without a background/monitoring workflow; no fixture in the class
  corpus currently exercises the "would hang without a timeout" case.
- **Confidence**: High (measured directly, not estimated).

## Observation: `lint-staged`'s glob silently excludes `.mts`/`.cts`, but not `.test.ts`

- **Context**: `T0b-tooling.md`'s write-set names the three test files with a
  literal `.test.ts` extension. Committing them tripped `.husky/pre-commit`
  (`npx lint-staged`): `package.json#lint-staged`'s `"*.{ts,tsx,mjs,js}"`
  glob matched all three `.test.ts` files (and the mission's own
  `vitest.config.ts`) and ran a typed `eslint --fix` on them, which threw
  (not just failed a rule) with `@typescript-eslint/await-thenable ...
  parserOptions set to generate type information` — the exact failure mode
  `eslint.config.ts` already documents a fix for on `docs-site/**/*.ts`
  (`disableTypeChecked`), because no tsconfig's `include` reaches `plans/`.
- **Finding**: The three `.mts` tool files (`render-diff.mts`,
  `render-all.mts`, `pin-diff.mts`) were NOT matched by the same lint-staged
  run (`lint-staged`'s own output: "`*.{ts,tsx,mjs,js}` — 4 files" out of 7
  staged TS-like files, i.e. exactly the 3 `.test.ts` files + `vitest.config
  .ts`, not the 3 `.mts` files) — the glob's extension list is literally
  `ts,tsx,mjs,js`, which does not include `mts`/`cts`. Every prior mission's
  `plans/**/tools/*.mts` CLI file (e.g. `plans/activity-loop-tile-port/
  tools/*.mts`) committed clean for this same reason: none of them carried a
  `.test.ts` sibling to trip it.
- **Impact**: Fixing this properly would mean editing `package.json`'s
  `lint-staged` glob or `eslint.config.ts`'s file-scoping — both outside
  T0b's write-set, and hooks must not be skipped (`--no-verify` banned).
  Renamed the three test files and the mission's own `vitest.config.ts` to
  `.test.mts`/`.mts` (functionally identical under jiti/vitest, which
  resolve extensions directly) rather than the spec's literal `.test.ts` —
  a deviation from the literal write-set filenames, logged here and in the
  decision journal. A later task adding `plans/**/tools/*.test.ts` (not
  `.mts`) anywhere in this mission will hit the identical hook failure;
  route new mission test files through `.test.mts` until `lint-staged`'s
  glob or `eslint.config.ts` is fixed at the repo level (out of scope here).
- **Confidence**: High (reproduced the failure, then reproduced its absence
  after the rename, both against the real `.husky/pre-commit` hook).
