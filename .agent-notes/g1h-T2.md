# G1H T2 — sequence diff-baseline ratchet

## Observation: the sequence diff floor is ~10, and it is uniform
- **Context**: pinning `oracle/goldens/svg-sequence/diff-baseline.json` over
  all 1141 committed fixtures.
- **Finding**: distribution over the 1138 measurable fixtures is min **10**,
  p25 **12**, median **12**, p75 **12**, max **139**, mean 14.5. **Zero**
  fixtures reach 0 diffs. The interquartile range collapsing to a single
  value (12) means the overwhelming majority of fixtures differ by the SAME
  small set of diffs — a fixed per-diagram floor, not per-fixture drift.
- **Impact**: T4's census should expect one or two very large buckets
  accounting for ~10-12 diffs on nearly every fixture (D2 already names one
  candidate: the unitless fractional `width` vs the jar's `166px`). A census
  that reports many evenly-sized buckets would contradict this and should be
  re-checked before being believed. It also means the ratchet's early signal
  will come from the *tail* (the 139-diff fixtures), not the mode.
- **Confidence**: High (measured over the full committed corpus).

## Observation: only 3 of 1141 fixtures error, all from the same seam
- **Context**: same measurement pass.
- **Finding**: 3 errors, all `!include` resolution, none a render defect:
  - `nereka-67-deco609` — `!include <tupadr3/common.puml>`, no stdlib bundle
  - `tuzaga-87-gene496` — `!include <logos/centos>`, no stdlib bundle
  - `nuvoja-46-dezu541` — `!includedef 'macro'` not in the IncludeStore
  All three are the documented architecture boundary, not sequence-engine
  faults: `src/` vendors no PlantUML stdlib and includes resolve
  synchronously from a pre-populated store (CLAUDE.md "Architecture").
- **Impact**: These are recorded `status: "error"` with `diffCount: null`.
  They are fixable at any time by supplying an `includeStore` through
  `renderFixtureSequence`'s `options` passthrough — but doing so would change
  what the baseline measures, so it is deliberately NOT done here. If a later
  task wires a store, all three become error-to-baseline transitions and the
  ratchet will FAIL loudly (AC3) rather than silently reading them as 0.
- **Confidence**: High (error strings quoted from the run).

## Observation: the `npm test` ceiling did NOT rise; T1's reading was Spotlight
- **Context**: Step 3, measuring the new wall-clock ceiling.
- **Finding**: On first inspection load1 was **11.66** with `suggestd` at 67.8%
  and `corespotlightd` at 54.9% — macOS reindexing T0's 1141 newly committed
  corpus files. Polled to load1 3.8 / spotlight ~0% before measuring. Four
  runs then gave vitest `Duration` 55.42–55.82 s, wrapped `real`
  56.44–56.80 s, all green. Adding 1150 tests moved the whole-run wall clock
  by less than the 0.40 s run-to-run spread.
- **Impact**: Two things. (1) The 60.3 s ceiling is kept, now measured rather
  than inherited. (2) **Any wall-clock measurement taken shortly after a large
  corpus lands in this repo is confounded by Spotlight**, which is the
  mechanism behind T1's unusable 61.5–62.6 s reading. Poll
  `ps -Aceo pcpu,comm | grep -E 'suggestd|corespotlightd|mds_stores'` to ~0
  before trusting a number. This will recur on any future corpus-capture
  mission.
- **Confidence**: High for the timings (4 runs, two clocks); High for the
  Spotlight mechanism (observed directly at 120% CPU, decaying to 0 while the
  tree was otherwise idle).

## Observation: a `skipIf`-on-missing-cache would be wrong for a COMMITTED cache
- **Context**: mirroring `description.diff-baseline.ratchet.test.ts`, whose
  every describe block is `describe.skipIf(!cacheAvailable)`.
- **Finding**: that sibling's own doc comment gives the reason — its oracle
  tree is gitignored and regenerable, so absence means "not generated yet".
  Sequence's cache is committed (D4; `.gitignore:25` re-includes
  `!test-results/dot-cache/`), so absence means a broken checkout. Copying the
  `skipIf` verbatim would silently disable all 1141 gate assertions in exactly
  the state where the gate matters most.
- **Impact**: The sequence ratchet has NO cache-level `skipIf`; an `AC0` block
  asserts the corpus is present and complete instead. Mirroring the sibling's
  *reason* required diverging from its *code*. Recorded here because the next
  person diffing the two files will notice the difference and should not
  "fix" it.
- **Confidence**: High (both files' doc comments; `.gitignore` verified).

## Field-name reconciliation (reported, not a stop-9)
T2's task file states the contract two ways: `{ slug, diffs: number }`, and
"mirror description's field names exactly rather than inventing new ones".
Description's field is `diffCount`, not `diffs`. Resolved in favour of the
mirror clause — `diffs` would be the invented name. Shipped fields:
`type`, `slug`, `status`, `diffCount`, `reason?`, `measuredAt`,
`measuredAgainstCommit`. `group` is dropped (it indexed
bodyenhanced-atom-seams' blast-radius groups; no analogue here). `type` is
kept though always `"sequence"` because it builds the cache path. This is a
discrepancy between two clauses of one task file, not a conflict with a
locked decision (D1/D2/D4/D6 are silent on field names), so it was resolved
rather than halted on. T4 consumes only the fixture list and status, so no
downstream contract depends on the count field's name.

## Observation: a 1-in-7 `stdlib-remote-e2e` failure — OPEN, mechanism NOT isolated
- **Context**: T2's final confirmation `npm test` after cleanup. NOT a
  sequence test and NOT in T2's write-set.
- **Symptom**: 2 tests in `tests/integration/stdlib-remote-e2e.test.ts` failed
  with `Cannot find module .../packages/stdlib-tupadr3/generated/
  tupadr3.remote.js`. That file's mtime was inside the failing run, i.e.
  `globalSetup` DID write it; the worker still could not resolve it.
- **Ruled out, with the evidence that ruled it out**:
  1. *T2's write-set.* `git status` shows zero changes under `src/`,
     `tests/integration/` or `packages/`. T2 adds a test file, a JSON
     manifest, a README section and this note; none is imported by the
     failing suite.
  2. *A second in-run writer racing `globalSetup`.* `buildStdlibPackages()`
     has exactly ONE caller in the entire test tree
     (`tests/helpers/build-stdlib-globalsetup.ts:87`); `split-sprite-bundle`,
     `sprite-package-files` and `stdlib-packages` each carry an explicit
     comment that they never rebuild it. So the unconditional `rmSync` in
     `scripts/build-stdlib-packages.ts:44` (`freshGeneratedDir`) cannot fire
     while a worker is importing.
  3. *`prepack` deleting the tree.* `packages/stdlib-tupadr3/package.json`'s
     `prepack` runs only `copy-assets.mjs`, whose target is `assets/`, not
     `generated/`.
  4. *The preceding `npm run build`* — the ONLY variable that differed from
     every passing run. Controlled experiment: `npm run build && npm test`
     → 621/621 green. Negative.
- **Reproduction**: 1 failure in 7 full-suite runs on this tree (runs 1-4,
  r5 plain, r6 after a build — all green). The failing run was the only one
  launched at load1 ~17, and was also the slowest (`Duration` 59.96 s vs
  53.92-55.82 s for the six green runs).
- **Impact**: This is the same error CLASS the `globalSetup` doc comment
  records as historically intermittent for this exact file family (si11a T8,
  SI12 T8) — but the specific race those fixes closed is provably not
  available here (see ruled-out #2). **I could not state the positive
  mechanism, so this is reported OPEN rather than closed.** Per
  `~/.claude/rules/diagnosis.md` "two attempts failed" is not a diagnosis and
  neither is "flake": the next person to see it should instrument
  `globalSetup` completion vs. worker spawn ordering under load, which is the
  hypothesis this pass could not test. It does not gate T2 (six green runs,
  and the failure is outside the write-set), but it should not be written off.
- **Confidence**: High that it is not caused by T2; High on the four
  eliminations; UNKNOWN on the actual mechanism.
