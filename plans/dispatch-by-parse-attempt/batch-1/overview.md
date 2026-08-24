# Batch 1 — contract modules, unwired

Two new modules, no existing behaviour touched. Both are pure ports with
upstream citations, and both are consumed by later batches. Parallel: disjoint
write-sets, no dependency between them.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | `ParseRefusal` + score + merge | typescript-pro | `src/core/parse-refusal.ts`, its test | — | [ ] |
| T2 | `findStartTypes` candidate set | typescript-pro | `src/core/diagram-type-set.ts`, its test | — | [ ] |

**Gate at close:** all four. Nothing in `src/` consumes either module yet, so
every existing gate must be **unchanged** — a moved baseline here means
something was wired that should not have been.
