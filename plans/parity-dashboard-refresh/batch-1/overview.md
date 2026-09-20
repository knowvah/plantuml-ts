# Batch 1 — producers

Four independent producer changes. No shared writes; run all four in
parallel, each in its own worktree (memory: [[batch-parallelism-needs-worktrees]]).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | `scripts/capture-oracle-cache.ts` — manifest → `dot-cache/<type>/` via `oracle-render.sh`, encoding the two activity-capture findings | typescript-pro (sonnet) | `scripts/capture-oracle-cache.ts`, `tests/unit/scripts/capture-oracle-cache.test.ts` | — | [x] |
| T2 | census: `--json <path>` output + missing `activity` dispatch | typescript-pro (sonnet) | `scripts/svg-conformance-census.ts`, `tests/unit/scripts/svg-conformance-census.test.ts` | — | [x] |
| T3 | survey defaults to every cached type, writes `parity-<type>.json`; dashboard derives `TYPES`; stale preamble replaced | typescript-pro (sonnet) | `scripts/svg-parity-survey.ts`, `scripts/svg-parity-dashboard.ts`, `tests/unit/scripts/svg-parity.test.ts`, `docs/svg-conformance.md` (§ "Survey and dashboard" only) | — | [x] |
| T4 | extract DOT row logic to `scripts/dot-parity-rows.ts` with `n/a (no DOT stage)` rows; shrink `dot-sync-report.ts` under 500 lines | typescript-pro (sonnet) | `scripts/dot-sync-report.ts`, `scripts/dot-parity-rows.ts`, `tests/unit/scripts/dot-parity-rows.test.ts` | — | [x] |

Gate after merge of all four: the four quality gates in README, plus
`jiti scripts/svg-parity-dashboard.ts` still regenerates a byte-identical
`PARITY-SVG.md` from the UNCHANGED `parity.json` except for the preamble
(T3 AC3) — proves T3 did not move any number.
