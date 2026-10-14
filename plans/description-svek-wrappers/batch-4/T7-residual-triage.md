# T7 — residual triage (read-only)

**Agent:** `Explore` (read-only; it cannot write). The orchestrator writes its report to
`.agent-notes/dsw-T7.md`.

## Prompt
Using `plans/description-svek-wrappers/measurements/b3-eng/parity-{component,usecase,c4,unknown}.json`
(unknown: only rows whose `oracle/goldens/svg-conformance/routing-baseline.json` `ourType` is
`DESCRIPTION`), produce:

1. Counts of `layoutEqual` true / false / n/a, per tree.
2. Over the `layoutEqual === false` rows: a histogram of `layoutFirstDiff.component`, and for the
   two largest components the 10 most frequent `detail` shapes with 3 example slugs each.
3. Over `layoutEqual === true` rows that are still survey-diverged: the 10 slugs with the smallest
   render-diff structural count. These are post-layout drawing residuals, follow-on-4 kin.

Return only the structured result: three tables, no prose. Do not propose fixes.

## Acceptance
- Given the report, then every count reconciles with the survey files (totals equal row counts).

**Observability:** N/A. **Rollback:** N/A (no writes).
