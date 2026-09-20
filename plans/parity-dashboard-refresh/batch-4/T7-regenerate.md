# T7 — regenerate every comparison (orchestrator)

## Steps (sequential; log wall-clock and counts for each in the journal)
1. `npx jiti scripts/dot-sync-report.ts component usecase class object
   state` then `--markdown` is NOT run directly (T6 embeds T4's rows).
2. `npm run svg:survey` (no args → every cached type, incl. the five new
   families). Check every `parity-*.json` for `"verdict":"timeout"`;
   any → re-run that type with `SVG_PARITY_CONCURRENCY=2`; still any →
   stop 5.
3. Census per dispatchable type:
   `for t in component usecase class object state sequence activity json
   yaml hcl dot; do npx jiti scripts/svg-conformance-census.ts $t --json
   tests/oracle/svg-conformance/census-$t.json; done`. The five new
   families have no helper; they get survey verdicts only (D-scope).
   Compare the activity census 0-diff count and error count against
   `oracle/goldens/svg-activity/diff-baseline.json` (stop 8 if they
   disagree beyond the 82-error cohort).
4. `npm run svg:dashboard` (component+usecase, `parity.json`), and once
   per `parity-<type>.json` with `--in/--out` into
   `tests/oracle/svg-conformance/PARITY-SVG-<type>.md`? NO — keep one
   `PARITY-SVG.md`; the unified report is the per-type view. Regenerate
   only `PARITY-SVG.md`.
5. `npm run parity:dashboard`. Read the output end to end; every `n/a`
   must carry a reason; paste the matrix into the journal.
6. Four gates, including the drift test. Commit ONE commit:
   `chore(pdr-T7): regenerate parity surveys, census and dashboards` with
   the headline numbers in the body.

## Acceptance criteria
1. Given all cached types, when surveyed, then zero `timeout` rows are
   committed.
2. Given the 11 census-dispatchable types, when run, then eleven
   `census-<type>.json` files exist.
3. Given fresh JSON, when `parity:dashboard` runs, then the drift test
   and all four gates are green.

## Observability / Rollback
N/A / Reversible (all generated files).
