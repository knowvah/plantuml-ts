# G1H T3 — sequence golden ratchet (ships empty)

## Observation: no `parity-sequence.json` exists, so AC3 is correctly absent
- **Context**: mirroring `state.golden.ratchet.test.ts`, which has an AC3
  block enforcing DOT-equal eligibility via `parity-state.json`.
- **Finding**: only `parity-class.json`, `parity-object.json` and
  `parity-state.json` exist under `tests/oracle/svg-conformance/`. D1
  (`plans/sequence-oracle-harness/decisions.md`) already establishes sequence
  emits no DOT — the same situation `json.golden.ratchet.test.ts` documents
  via ADR-3 for json/yaml/hcl ("the jar emits no DOT for this family, so the
  DOT-equal eligibility gate the siblings use cannot be computed").
- **Impact**: `sequence.golden.ratchet.test.ts` mirrors state's AC1
  (conformance) and AC2 (tamper detection) blocks verbatim in shape, but
  drops AC3 rather than fabricating a `parity-sequence.json` that would be a
  second, uncalled-for comparator (D1, stop 4). This is a deliberate
  structural divergence from the literal instruction to mirror state
  "including its describe.skipIf guard" — that guard is present and
  identical; only the DOT-specific block is omitted, and the README explains
  why so nobody "fixes" the omission later.
- **Confidence**: High (grepped the directory for `parity-*.json`; read D1
  directly).

## Observation: coverage is scoped to `src/**/*.ts` only
- **Context**: worried an always-empty ratchet's dead `describe.skipIf`
  branches (AC1/AC2 loop bodies, never executed while `fixtures: []`) would
  fail the 90/90/90 coverage floor.
- **Finding**: `vitest.config.ts`'s `coverage.include` is `['src/**/*.ts']`.
  Test files are never coverage-instrumented themselves. Combined with D6
  (zero `src/` changes), this task cannot affect the coverage numbers at
  all — confirmed by the full-suite coverage summary being unchanged in
  kind from prior runs.
- **Impact**: No special handling (e.g. an `/* v8 ignore */`) was needed in
  the new test file for coverage purposes.
- **Confidence**: High (read the config directly, ran the full suite).

## Observation: concurrent sibling load confounds `npm test` wall-clock
- **Context**: measuring the wall-clock ceiling per the quality bar.
- **Finding**: first isolated run (before siblings' load ramped) was clean:
  `Duration 56.6s` total, matching T2's ~55s baseline. A later run showed
  `load average 89.11` and an `Unhandled Error: ENOTEMPTY .../coverage/.tmp`
  (a `rmdir` race on the shared coverage output dir), then a subsequent run
  completed in ~99-100s with exit 0. `git status` at that point showed
  modifications to `scripts/svg-conformance-census.ts` and
  `tests/oracle/svg-conformance/oracle-freshness.test.ts` plus untracked
  `oracle/goldens/svg-sequence/diff-census.json` and
  `tests/oracle/svg-conformance/sequence-diff-census*.ts` — all T4's
  write-set, none of mine, confirming a sibling `npm test` was running
  concurrently in the same working tree and contending for CPU + the shared
  `coverage/.tmp` directory.
- **Impact**: The 56.6s clean run is the number to trust; the 96-100s runs
  are a measured concurrency artifact, not a regression this task caused.
  Recorded here since T2 already flagged Spotlight as one wall-clock
  confound for this mission — concurrent sibling `npm test` invocations
  racing on `coverage/.tmp` is a second, independent one, worth knowing
  about for any future mission that runs agents in parallel against the
  same working tree.
- **Confidence**: High (git status directly implicates T4's write-set; the
  ENOTEMPTY path and load average were captured directly).
