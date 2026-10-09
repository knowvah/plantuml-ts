# isw-T0c report

Commits: see `git log isw/T0c` (one feat/refactor commit + this note).

Files changed: ~210 (207 rewritten to `DeterministicMeasurer` + new
`tests/architecture/isw-measurer.test.ts` + this note).

Kept (still name `WidthTableMeasurer`):
- `tests/unit/core/measurer-width-table.test.ts` - tests the verbatim table port.
- `tests/architecture/isw-measurer.test.ts` - the guard (synthetic offenders).
- Prose-only mentions in comments/strings (e.g. parity-dashboard text,
  verify-deterministic-measurer.ts docs) and all .md/.json/.patch under plans/
  (not code; scanner covers ts/mts/js/mjs/tsx only).

Not done: no survey (per orchestrator). `plans/**/*.mts` were not executed,
only rewritten mechanically (same pattern as elements.mts).

Verified: typecheck, lint, 188 touched test files (5 chunks, maxWorkers=4)
and the new architecture test green.
