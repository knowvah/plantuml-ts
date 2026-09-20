# T3 — survey every cached type; dashboard derives its families

## Context
`scripts/svg-parity-survey.ts` renders each cached fixture with production
`renderSync` + `WidthTableMeasurer`, compares to the jar SVG with
`compareSvg`, and writes `tests/oracle/svg-conformance/parity.json`
(`DEFAULT_TYPES = ['component','usecase']`, line 63; `--out` and
positional types exist, line 389-401). `scripts/svg-parity-dashboard.ts`
renders `PARITY-SVG.md` from `parity.json` with a hardcoded
`TYPES = ['component','usecase']` (line 27) and a preamble
(`DASHBOARD_PREAMBLE`, line 182-199) that blames the diverged verdicts on
"AWT font metrics". That claim is false: `DeterministicMeasurer` is a
re-export of `WidthTableMeasurer` (`src/core/measurer-deterministic.ts`
header, lines 20-30), so the survey and the ratchets measure text in the
same system; they differ by RENDER PATH (`renderSync` vs the low-level
`renderFixture*` helpers). Four golden ratchets read `parity.json` for
DOT eligibility, so that file's population must not change.

## Task
Survey:
- No positional args → survey EVERY directory under
  `test-results/dot-cache/` (sorted), writing
  `tests/oracle/svg-conformance/parity-<type>.json` per type, AND
  `parity.json` containing only component+usecase rows (unchanged
  population and shape).
- Positional args keep today's meaning. `--out` keeps today's meaning.
- Extract the per-type output-path rule as a pure exported function.

Dashboard:
- `familyTable` iterates the distinct `type` values present in the
  report (sorted), not a constant. Delete `TYPES`.
- Accept `--in <path>` (default `parity.json`) and `--out <path>` so the
  same script can render any `parity-<type>.json`.
- Replace the preamble: state that both sides measure with the width
  table, that the survey goes through production `renderSync` while the
  ratchet/census go through the low-level helpers, and that `dotEqual`
  remains the ratchet-eligibility signal. Remove every mention of AWT.
- Update `docs/svg-conformance.md` § "Survey and dashboard" (lines
  168-192) to match; touch no other section.

## Write-set
`scripts/svg-parity-survey.ts`, `scripts/svg-parity-dashboard.ts`,
`tests/unit/scripts/svg-parity.test.ts`, `docs/svg-conformance.md` (that
section only)

## Read-set
- `scripts/svg-parity-survey.ts:55-70, 385-452`
- `scripts/svg-parity-dashboard.ts:1-30, 57-90, 175-236`
- `tests/unit/scripts/svg-parity.test.ts:137-260`
- `src/core/measurer-deterministic.ts:1-35`
- `tests/oracle/svg-conformance/description.golden.ratchet.test.ts` —
  grep how it reads `parity.json` (confirm it is by slug; do not change it)

## Architecture decisions
`decisions.md#d3`, `#d4`.

## Interface contracts
`parity-<type>.json` = existing `ParityReport` (`generatedAt`,
`fixtures: FixtureRow[]`). Consumed by T6 and T7.

## Acceptance criteria
1. Given no positional args, when `parseSurveyArgs` runs, then the plan
   lists every cache type and one output path per type plus `parity.json`
   for component+usecase (unit test on the pure planner).
2. Given a report with types `{a, b, c}`, when `familyTable` renders,
   then it has exactly three rows in sorted order.
3. Given the committed `parity.json` unchanged, when the dashboard is
   regenerated, then `PARITY-SVG.md` differs from the committed file ONLY
   in the preamble block (verify with `diff`; paste the diff summary in
   the journal).
4. Given the new preamble, when grepped, then `AWT` does not occur in
   `svg-parity-dashboard.ts` or `PARITY-SVG.md`.

## Observability
N/A.

## Rollback
Reversible.

## Quality bar
Four gates green; hook limits; `tests/unit/scripts/svg-parity.test.ts`
updated for the removed `TYPES`, not skipped.

## Boundaries
Never change `parity.json`'s population. Never run a full survey in a
unit test. Do not touch `oracle/goldens/**`.

## Commit
`feat(pdr-T3): survey every cached type; dashboard derives families`
