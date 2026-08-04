# Batch 3 — verification + close-out (single task)

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|------------|------|
| T5 | Full-family re-measure, size-backlog pin deletions, docs close-out | orchestrator (inline) or typescript-pro | `oracle/goldens/description/size-backlog.json`, `planning/mission-index.md`, `plans/si15-uimage-raster-dims/README.md` (+ journal) | T1, T2, T3, T4 | [ ] |

Cold-tree verification (`rm -rf packages/*/assets && npm test`, twice) and
`npx jiti scripts/vendor-stdlib.ts --verify` are REQUIRED in this batch
before close-out, per `verify-gates-on-a-cold-tree`.
