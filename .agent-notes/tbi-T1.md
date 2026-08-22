# test-budget-invariant T1 — done

## Observation: `:429`'s missing budget fixed; constant extracted

- **Context**: `tests/unit/stdlib-packages.test.ts:429` (`packages/stdlib-all
  ships a LICENSE...`) had no third `it()` argument, so it inherited
  vitest's 5,000ms default despite transitively holding the stdlib build
  lock via `npmPackDryRun` -> `withStdlibBuildLock`.
- **Finding**: Gave it `LOCK_PRESSURE_BUDGET_MS` (120,000) plus a comment
  citing the mechanism and `plans/test-budget-invariant/diagrams/
  budget-invariant.md`. Extracted all 41 genuine lock-pressure `120_000`
  literals (across `stdlib-packages`, `stdlib-eager-omission`,
  `stdlib-all-exports`, `stdlib-package-files`, `stdlib-dts-import-
  specifier`, `stdlib-remote-e2e`, `sprite-package-files`,
  `build-stdlib-packages`, `build-stdlib-lock`) to one constant,
  `LOCK_PRESSURE_BUDGET_MS`, in `tests/helpers/lock-pressure-budget.ts`.
  Doc comment carries the full derivation (30,000 `maxWaitMs` +
  20,029 measured `maxHoldMs` from `.agent-notes/lsh-T4.md` ≈ 50,000
  legitimate worst case, 120,000 as ~2.4x margin) and does not lower the
  value, per D3.
- **`tests/unit/class/class-geo-builders.test.ts:491` deliberately left
  alone**: its `120000` match is a false positive — the digits appear
  inside a pinned fixture coordinate, `y: 97.50001200000001` (arrow glyph
  point, "matches upstream" pinned value, not a timeout literal). Read the
  surrounding test (`'single-line "ok >"' ... (pinned)'`); the file has no
  `withStdlibBuildLock`/`acquireBuildLock`/lock import at all. Confirmed
  genuinely unrelated, not converted.
- **Impact**: Fixes the SI36-T4-observed intermittent failure mode
  (`Error: Test timed out in 5000ms` at `stdlib-packages.test.ts:428:3`,
  trials 3/4/5 of 5) and satisfies the repo's no-magic-literals rule for
  this budget going forward. `LOCK_PRESSURE_BUDGET_MS` is exported for
  T3's fitness test to import from `tests/architecture/`.
- **Confidence**: High — grep-verified zero remaining `120_000`/`120000`
  literals in `tests/**/*.ts` except the constant's own definition and the
  journaled class-geo-builders false positive; all four quality gates
  green.

## Quality gates (this session)

- `npm test` — exit 0, 629 files passed | 1 skipped (630), 16,076 tests
  passed | 2 skipped | 1 todo, vitest-reported Duration 60.59s. Coverage
  95.44%/90.47%/96.95%/96.53% (stmts/branch/func/line, all ≥90%). Load at
  start 44.05/29.49/14.89; `corespotlightd` was churning (179.8%) at the
  moment polled, immediately before the run — Spotlight-indexing noise per
  `.agent-notes/confounded-wall-clock-readings.md`, not a lock or code
  issue; suite still passed clean at exit 0.
- `npm run typecheck` — exit 0 (both tsconfigs).
- `npm run lint` — exit 0.
- `npm run build` — exit 0; exactly the 3 pre-existing TS2591/TS2503 notes
  in `src/core/include-resolver-node.ts`.

## Scope confirmation

- `git diff --name-only -- src/ vitest.config.ts` → empty.
- Write-set: `tests/helpers/lock-pressure-budget.ts` (new), 9 test files
  (`stdlib-packages`, `stdlib-eager-omission`, `stdlib-all-exports`,
  `stdlib-package-files`, `stdlib-dts-import-specifier`,
  `stdlib-remote-e2e`, `sprite-package-files`, `build-stdlib-packages`,
  `build-stdlib-lock`), this note. `tests/architecture/*` untouched.
- No git write command run.
