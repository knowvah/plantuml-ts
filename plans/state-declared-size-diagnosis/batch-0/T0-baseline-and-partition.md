# T0 — Baseline, PARTITION, schema check

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `docs/state-declared-size-diagnosis`.
This mission diagnoses state-engine declared-size mismatches without touching
`src/` (`decisions.md` ADR-2). You build the ruler and the slices. Read
`README.md`, `decisions.md`, `findings/SCHEMA.md`, `findings/PARTITION-preview.md`,
and `scripts/measure-composite-declared-size.ts:1-60` (harness doc + usage).

## Task
1. `npx jiti scripts/measure-composite-declared-size.ts --mismatched-only > /tmp/a.jsonl`,
   run again to `/tmp/b.jsonl`; `cmp` must be silent. Copy to
   `test-results/state-declared-size-baseline.jsonl` (gitignored — report its
   sha256 and the summary line so the orchestrator journals both).
2. Write `findings/PARTITION.md` from the baseline: for each fixture with any
   mismatched row, its rows (scope/axis/idx/ours/jar/Δpx) and its first-match
   label using the classifier order below; then `precision` (all rows
   |Δ| < 0.05 px) and `unmatched` lists; then a bucket→fixtures table with
   counts and each bucket's max |Δ|; split `composite` into `composite-a`/`-b`
   alphabetically at the median; merge `creole-sprite`+`escape` into
   `creole-sprite-escape`. Classifier order (first match on `in.puml`):
   concurrent-region (`^\s*(--+|\|\|+)\s*$`), note (`^\s*note\b`),
   pseudo-state (`<<(entryPoint|exitPoint|inputPin|outputPin|expansionInput|expansionOutput|choice|fork|join|end|start|history|sdlreceive)>>|\[H\*?\]`),
   stereotype (`<<[^>]+>>`), composite (`^\s*state\b[^{\n]*\{`),
   attribute-line (`^\s*[\w"\[\]]+\s*:\s*\S`), escape (`\\[nt]`),
   creole-sprite (`<\$|<img|<b>|<i>|<u>|<color|<size|<font|\*\*|//`),
   skinparam-style (`skinparam|<style>|!theme`), else other. If the result
   differs from PARTITION-preview.md, PARTITION.md wins; list the moves.
   Also list repeated |Δpx| values (rounded 0.1) with counts.
3. Write `findings/check-schema.py` (stdlib only): parses every
   `findings/*.md` except SCHEMA/PARTITION*/METRIC-AUDIT/SYNTHESIS, counts
   `### <slug>` records, checks each has the SCHEMA fields in order, non-empty
   `originFileLine`/`javaRef`/`ruledOut` when `status: resolved`, `nextStep`
   when `unresolved`; cross-checks the slug set == PARTITION's 94 (63 real +
   27 precision + 4 unmatched); prints `N records, M violations` and exits 1
   on M > 0. Verify it runs (0 records now) without error.
4. Replace README "Starting state" numbers with the measured ones if they
   differ (say "verified at T0 <sha>").

## Write-set
`test-results/state-declared-size-baseline.jsonl`, `findings/PARTITION.md`,
`findings/check-schema.py`, `README.md` (numbers only). Nothing else.

## Acceptance
- Given the branch point, when the harness runs twice, then outputs are byte-identical.
- Given PARTITION.md, then every fixture appears in exactly one of: a bucket, precision, unmatched; totals sum to the harness's inexact-fixture count.
- Given check-schema.py, then it exits 0 with `0 records, 0 violations` on the empty findings dir and exits 1 when a record lacks `originFileLine`.

## Observability / Rollback
N/A — docs + gitignored baseline. Reversible.

## Report (≤1k tokens)
sha256 + summary line; bucket table; moves vs preview; anything odd about
the harness (e.g. non-determinism) — do NOT modify the harness (ADR-2).
