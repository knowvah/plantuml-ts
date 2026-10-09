# T0c — every harness measures with `DeterministicMeasurer`

**Agent:** typescript-pro (sonnet, high). Prompt = `common-rules.md` + this file.
**Worktree:** `measurements/mkwt.sh T0c` (after T0b merges — both touch `scripts/`).

## Why
D4: T1a turns `DeterministicMeasurer` (today `export { WidthTableMeasurer as
DeterministicMeasurer }`, `src/core/measurer-deterministic.ts:54`) into a
subclass that overrides U+0020. Any harness still constructing
`WidthTableMeasurer` would then measure with zero-width spaces while the oracle
does not. Counted 2026-10-09: `WidthTableMeasurer` in 16 scripts, 198 test
files, 23 plan tools/measurements. While the alias holds, this rename changes
no output.

## Write-set
Every file outside `src/` that constructs or imports `WidthTableMeasurer`
(`scripts/**`, `tests/**`, `plans/*/tools/**`, `plans/*/measurements/**`), and
new `tests/architecture/isw-measurer.test.ts`. NOT `src/**` (production files
only mention it in comments; T1a owns those comments).

## Do
1. `grep -rl WidthTableMeasurer scripts tests plans` — switch construction and
   imports to `DeterministicMeasurer` from `src/core/measurer-deterministic.js`.
   Tests that test `WidthTableMeasurer` itself (the verbatim table port, e.g.
   `tests/unit/core/measurer*.test.ts`) keep it — list each kept file with why.
2. Architecture test: no file outside `src/core/` and the listed table-port
   tests constructs `WidthTableMeasurer`.
3. Survey all engines (rule 12): expect 0 movers vs b0, sequence scores and
   elements identical.

## Acceptance
- Given the tree, when the architecture test runs, then it passes, and fails if
  a scratch file under `scripts/` adds `new WidthTableMeasurer()`.
- Given b0, when the survey re-runs, then engdiff reports movers=0 and
  `seq-scores` equals `b0-seq.json`.

**Observability:** N/A. **Rollback:** reversible (pure rename).
