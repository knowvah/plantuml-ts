# T0a: branch, ledger, b0 (orchestrator)

Return only: branch sha, ledger row count, b0 counts (survey, routing, refusal), journal rows.

## Context
Orchestrator task. Brief `plans/mindmap-engine-port/`; decisions D7, D9, D10, D11.

## Task
1. `git checkout -b feat/mindmap-engine-port` off main (`git diff HEAD` empty first).
2. Copy `plans/class-divergence-drive-6/measurements/mkwt.sh` to
   `plans/mindmap-engine-port/measurements/mkwt.sh`, renaming branch/prefix to
   `feat/mindmap-engine-port` / `mmp-`; keep the `.husky/_` link.
3. Seed `fixtures.md`: one row per `test-results/dot-cache/mindmap/<slug>` (142) with
   columns `row | verdict (b0) | features | family | task | final`. `features` from a grep
   of `in.puml` (style, :depth, *, boxless, [#color], left side, top to bottom, +/-,
   orgmode, stereotype, skinparam, chrome, scale, theme). Mark the 3 jar-error rows.
4. b0: `npm run svg:survey -- mindmap --out measurements/b0/parity-mindmap.json`; survey
   every other engine into `measurements/b0-eng/` (load < 8 per engine, the cdd6
   `b3-eng/chain.sh` pattern). Record routing/refusal mindmap rows (139 misroute + 3
   jar-error; 139 ok + 3 jar-error).
5. Journal the start row and the b0 row.

## Write-set
`plans/mindmap-engine-port/{fixtures.md,decision-journal.md,measurements/**}`.

## Acceptance
- Given b0, then mindmap is 0/0/142 and the ledger has 142 rows, each with features.
- Given `mkwt.sh T0b`, then the worktree has linked `node_modules`, `oracle/dist`,
  `tests/corpus`, `test-results` children and `.husky/_`.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (new files; revert the commit).
