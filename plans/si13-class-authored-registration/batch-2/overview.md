# Batch 2 — pipeline run, parity regeneration, eligibility (orchestrator-inline)

Run by the orchestrator, not an agent: long local jar/survey operations
plus the ADR-2 drift judgment call.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|------------|------|
| T2 | `dot-sync-report class` (authored slugs enter cache/aggregate — verify NOT silently skipped), survey regen `--out` at concurrency 2, ADR-2 drift breakdown, measure eligibility of all 5 authored fixtures, conditional `ratchet.json` add, stale doc-comment fix | orchestrator | `tests/oracle/svg-conformance/parity-class.json`, `oracle/goldens/svg-class/ratchet.json` (conditional), `tests/oracle/svg-conformance/class.golden.ratchet.test.ts` | T1 | [x] |

Procedure detail in [T2-pipeline-and-parity.md](T2-pipeline-and-parity.md).
Stop conditions 4/5/6 live here.
