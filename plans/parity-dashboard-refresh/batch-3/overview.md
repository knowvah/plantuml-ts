# Batch 3 — the consumer

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T6 | `scripts/parity-dashboard.ts` unified matrix → `docs/parity-report.md`; drift test; `parity:dashboard` npm script; first regeneration from JSON on disk | typescript-pro (sonnet) | `scripts/parity-dashboard.ts`, `tests/unit/scripts/parity-dashboard.test.ts`, `package.json`, `docs/parity-report.md` | T2, T3, T4 | [x] |

May run concurrently with T5 (disjoint write-sets). T6's first
regeneration uses whatever JSON is on disk; T7 refreshes it.
