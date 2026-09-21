# Batch 3 — pin, land the tree, regenerate, record

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T14 | run the generator, re-derive both gates' counts, add the sentinel, move the tree, survey alone, regenerate `dot-parity.json` and the dashboard — ONE commit | orchestrator | `oracle/goldens/svg-conformance/{routing,refusal}-baseline.json`, `tests/oracle/svg-conformance/{routing-conformance,refusal-coverage,oracle-freshness}.test.ts`, `test-results/dot-cache/unknown/**`, `tests/oracle/svg-conformance/{parity-unknown.json,dot-parity.json,parity*.json}`, `docs/parity-report.md` | batch 2 | [x] |
| T15 | bookkeeping: `planning/next-missions.md`, `planning/mission-index.md` Snapshot, `.agent-notes/unknown-bucket-mapping.md` outcome section | documentation-engineer (sonnet; has Edit) | those three files | T14 | [ ] |
