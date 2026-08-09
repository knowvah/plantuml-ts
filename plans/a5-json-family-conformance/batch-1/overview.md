# Batch 1 — harness and corpus

**No production code changes in this batch.** It builds the measuring
instrument and widens the oracle cache, so Batch 2 can take a baseline that
means something. Both tasks are pure additions to test/oracle infrastructure.

The two tasks share no files and have no ordering dependency — run them in
parallel.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T1 | svg-json/yaml/hcl conformance harness | orchestrator (inline) | `tests/oracle/svg-conformance/render-fixture-json.ts`, `tests/oracle/svg-conformance/{json,yaml,hcl}.golden.ratchet.test.ts`, `oracle/goldens/svg-{json,yaml,hcl}/{README.md,ratchet.json}`, `scripts/svg-conformance-census.ts` | — | [x] |
| T2 | widen the oracle cache to all 92 fixtures | orchestrator (inline) | `test-results/dot-cache/{json,yaml,hcl}/**` | — | [x] |

## Why the cache needs widening

`test-results/dot-cache/json/` holds 5 fixtures, captured 2026-07-04. The
corpus is 50 `@startjson` + 39 `@startyaml` + 3 `@starthcl` = 92. A baseline
taken on 5 of 92 would misdirect the whole mission.

Note the cache entries here have `in.puml` + `in.svg` and **no `.dot`** — that
is correct and expected for this family (ADR-3), not a broken capture.

## Exit

- `npx tsx scripts/svg-conformance-census.ts json yaml hcl` runs and reports.
- All three ratchet suites exist and pass (empty manifests skip gracefully —
  the graceful-skip branch IS exercised at this point, as it was at G4/S0).
- Four gates green.
