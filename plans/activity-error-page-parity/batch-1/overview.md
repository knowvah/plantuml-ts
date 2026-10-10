# Batch 1 — signals, refusals, style, move (parallel)

T1a–T1d are agents, each in its own worktree (`measurements/mkwt.sh <ID>`),
prompt = `common-rules.md` + the task file. T1e is orchestrator-only and runs
while the agents work (its write-set is goldens/corpus/cache only). Write-sets
are disjoint. Close: `close-procedure.md` (re-pin only if T1c/T1d moved bytes).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1a | Stock-jar verifier + record (D5) | tooling-engineer (sonnet) | `scripts/stock-jar-verify.sh`, `scripts/lib/stock-jar-*.ts`, `oracle/goldens/stock-error-pages.json`, `tests/oracle/svg-conformance/stock-error-pages.test.ts`, `.gitignore` (if `oracle/dist/stock/` not covered) | T0 | [ ] |
| T1b | `setErrorPageObserver` (D7) | typescript-pro (sonnet) | `src/core/error/error-renderer.ts`, `tests/unit/core/error/aepp-T1b-error-page-observer.test.ts` | T0 | [ ] |
| T1c | Swimlane-after-start refusal + kedozi crash (D2) | typescript-pro (sonnet) | `src/diagrams/activity/{node-dispatch,dispatch-support,parser,switch-dispatch}.ts`, `tests/unit/activity/aepp-T1c-refusals.test.ts` | T0 | [ ] |
| T1d | tidoda rectangle group style | typescript-pro (sonnet) | `src/diagrams/activity/{group-dispatch,activity-style-defaults,activity-renderer-composite-symbols,activity-renderer-composite}.ts`, `tests/unit/activity/aepp-T1d-rectangle-group-style.test.ts` | T0 | [ ] |
| T1e | Move jetigu/nuzise to sequence (D3) | orchestrator | `scripts/populate-corpus.py`, cache dirs, routing/refusal + activity goldens, `tests/visual/data/*.json` if needed | T0 | [x] |
| T1g | Mirror upstream's unguarded sametail contact (zuduxu/rubebe; user ruling, journal rows 3-4, 8) | typescript-pro (sonnet) | `src/diagrams/class/class-edge-group-inheritance.ts`, `renderer-group.ts` (+1 named class file), `tests/unit/class/aepp-T1g-sametail-lost-edge.test.ts` | T0 | [ ] |

Added mid-batch: T1d's write-set gains the src/core `<sname>RoundCorner` handler + `tests/unit/core/aepp-T1d-sname-roundcorner.test.ts` (user ruling, journal row 6); T1a gains the `oracle-widths` provenance (row 8); T1c added `src/diagrams/activity/swimlane-strategy.ts` (row 7).
