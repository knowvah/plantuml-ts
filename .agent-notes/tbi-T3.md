# test-budget-invariant T3 -- notes

## Observation: strict D1 reading surfaces 14 pre-existing violations beyond `:429`
- **Context**: Building `tests/architecture/stdlib-lock-test-budget.test.ts` per
  D1/D2. D1's text is unconditional: "every test that acquires the stdlib build
  lock declares a per-test budget greater than `DEFAULT_MAX_WAIT_MS`." The only
  authorized narrowing, per the task brief §0 and D1's own context paragraph, is
  the explicit-`maxWaitMs`-override class (a call that can only ever wait up to
  its own override needs only exceed THAT value, not the full 30,000ms).
- **Finding**: Applying that rule (no other narrowing -- specifically, NOT
  exempting calls that override `lockPath` to an isolated `mkdtempSync` scratch
  file, since `resolveOptions` in `build-lock.ts` still defaults `maxWaitMs` to
  30,000 regardless of `lockPath`) surfaces 14 genuine violations in 2 files,
  neither in T3's write-set:
  - `tests/unit/build-stdlib-lock.test.ts:298,474,499,826,854,867,878,908`
    (8 sites) -- direct `acquireBuildLock(...)` calls with no `maxWaitMs`
    override and no test-level timeout (or, at `:298`, an explicit
    `maxWaitMs: 5000` matched by an exactly-equal, not strictly-greater,
    vitest-default 5000ms budget).
  - `tests/unit/with-stdlib-build-lock.test.ts:139,160,182,196,213,246`
    (6 sites) -- direct `withStdlibBuildLock(fn, { lockPath })` calls, no
    `maxWaitMs` override, no test-level timeout. This file was merged by the
    stdlib-lock-sharing mission (commit `9bae19db`, part of `eeaa8ca8`) BEFORE
    test-budget-invariant was planned (`decisions.md` "Locked at planning,
    2026-08-22") -- it existed at planning time but is not mentioned anywhere
    in the brief, D1-D5, or task §0's build-stdlib-lock.test.ts-specific
    false-positive warning. It was not part of T1's 9-file conversion list.
- **Verified NOT a scanner bug**: an earlier draft flagged 25 sites, including
  several in `sprite-package-files.test.ts`, `stdlib-package-files.test.ts`,
  `stdlib-packages.test.ts`, `build-stdlib-packages.test.ts` that DO carry
  `LOCK_PRESSURE_BUDGET_MS` correctly. Root cause: `splitTopLevelArgs` treated
  a Prettier-style trailing comma (`fn(a, b,\n)`) as producing an extra empty
  final argument, shadowing the real last argument. Fixed by trimming and
  dropping empty parts in `splitTopLevelArgs`. After the fix, all 11 other
  candidate files pass cleanly (11/13 `it.each` cases green; the 2 red ones
  are exactly the 14 sites above). Full `npm test` run: only this new file's 2
  cases fail, all 16,087 other tests + 629 other files pass -- confirms zero
  false positives elsewhere.
- **Impact**: `npm test` cannot reach exit 0 without either fixing those 2
  files (outside T3's write-set: "You write no `src/`" plus an explicit
  enumerated write-set that does not include them) or weakening the check
  (explicitly forbidden: boundaries §10 "Never: ... weaken the check to make
  it pass"). Per `decisions.md`'s own directive ("A task that finds a
  conflicting constraint stops and journals it... rather than silently
  overriding") and `~/.claude/rules/diagnosis.md`, this is logged here rather
  than resolved unilaterally. The fitness test itself is correct and
  demonstrated red/green through the D2 indirection case
  (`stdlib-packages.test.ts:437-447`'s `npmPackDryRun` helper).
- **Recommendation**: a fast, mechanical follow-up task, same shape as T1:
  add `, LOCK_PRESSURE_BUDGET_MS` as the third `it(...)` argument at the 14
  sites above (import `LOCK_PRESSURE_BUDGET_MS` into
  `with-stdlib-build-lock.test.ts`, which does not currently import it). No
  design work needed -- the fix is mechanical once T3's fitness test names
  the exact sites.
- **Confidence**: High -- verified by reading `build-lock.ts`'s
  `resolveOptions`/`productionDefaults` (maxWaitMs defaults to 30,000
  regardless of `lockPath`), by running the fitness test standalone and via
  full `npm test`, and by the red/green demonstration proving the detector
  itself is sound (not a false positive generator).

## Adjudication (coordinator, 2026-08-22): the 14 sites are false positives
- **Ruling**: the detector was under-scoped, not the 2 files under-fixed.
  D1 binds tests that acquire *the* stdlib build lock -- the ONE shared lock
  at `defaultLockPath(REPO_ROOT)`. A call that overrides `lockPath` to a
  fresh `mkdtempSync` scratch file (`join(makeTempDir(prefix), '<name>.lock')`)
  is provably uncontended -- the `wx` create always wins on the first
  attempt, so `DEFAULT_MAX_WAIT_MS` is unreachable by construction -- and is
  exercising the LOCK MECHANISM under test, not the shared lock the mission
  is about. Verified independently by the coordinator and by me: exactly one
  acquisition across both files omits `lockPath`
  (`build-stdlib-lock.test.ts:286`, inside the `it(...)` starting at `:272`),
  and it already carries `LOCK_PRESSURE_BUDGET_MS` (`:296`). All 30 others
  (the 14 originally flagged, plus 16 more that happened to already carry
  adequate ad-hoc budgets) pass an explicit scratch `lockPath` and are out of
  scope.
- **Detector change**: `findLockCallSites` now excludes any call whose own
  options argument names `lockPath` (shorthand or explicit) --
  `hasLockPathOverride`. Nothing else changed: per-call `maxWaitMs`-override
  threshold, the live-parsed `DEFAULT_MAX_WAIT_MS` default, and D2's
  same-file fixed-point helper resolution are all exactly as built. The
  file's own header doc comment now states this SCOPE BOUNDARY explicitly
  (same treatment as the cross-file boundary already documented there).
- **Re-proof, all three, quoted**:
  1. D2 indirection (`stdlib-packages.test.ts:437-447`, `npmPackDryRun`) --
     budget removed: `"tests/unit/stdlib-packages.test.ts:437 -- lock-using
     test declares a 5000ms budget, must exceed 30000ms (this call's
     maxWaitMs, or DEFAULT_MAX_WAIT_MS if unset)"`. Restored: 2 passed, 11
     skipped; `git diff --stat` empty.
  2. Shared-lock direct call (`build-stdlib-lock.test.ts:272-296`) -- budget
     removed: `"tests/unit/build-stdlib-lock.test.ts:272 -- lock-using test
     declares a 5000ms budget, must exceed 30000ms (this call's maxWaitMs,
     or DEFAULT_MAX_WAIT_MS if unset)"`. Restored: 1 passed, 12 skipped;
     `git diff --stat` empty.
  3. `npm test`: 630 passed | 1 skipped (631 files), 16089 passed | 2
     skipped | 1 todo -- exit 0.
- **Original 14-site finding kept above, unmodified** -- it was a correct
  reading of D1's literal text given no scope boundary existed yet; the
  adjudication narrows the detector's SCOPE (which calls count as "the
  stdlib build lock"), it does not invalidate the reasoning that produced
  the finding, and the same detector-scoping question would recur for any
  future file that acquires the lock exclusively via scratch `lockPath`s.

## Design decisions carried into the fitness test's own doc comment
- Threshold per call site = explicit `maxWaitMs:` literal in that call's
  OWN final top-level argument if present, else the live-parsed
  `DEFAULT_MAX_WAIT_MS` (30,000, read out of `build-lock.ts` by regex --
  not exported, breaks loudly if the constant moves/renames).
- No `lockPath`-based exemption: deliberately not added, since nothing in
  D1-D5 or task §0 authorizes it, and doing so specifically to shrink the
  violation count would itself be "weakening the check to make it pass."
- D2 indirection resolved via same-file fixed-point (any depth of same-file
  helper calling another same-file helper), not just one level -- covers
  `npmPackDryRun` and generalizes further without extra cost.
- String/template contents are blanked (not just comments) specifically
  because `build-stdlib-lock.test.ts` and `with-stdlib-build-lock.test.ts`
  generate child-process worker scripts as template-literal strings
  containing literal, syntactically-valid mentions of both lock function
  names -- confirmed empirically these produce false "helper" classifications
  if only comments are blanked.
- File discovery: a plain substring pre-filter (`raw.includes('acquireBuildLock')`
  etc.) over every `.test.ts` file under `tests/`, not a hardcoded list and
  not an import-statement parse -- deliberately over-inclusive (a doc-comment
  mention is enough to include a file) since under-inclusion risks silently
  skipping a real violation, and `checkFile` trivially returns `[]` for a
  file with no real call.
