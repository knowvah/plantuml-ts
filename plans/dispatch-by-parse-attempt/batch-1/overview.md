# Batch 1 — contract modules, unwired

Two new modules, no existing behaviour touched. Both are pure ports with
upstream citations, and both are consumed by later batches. Parallel: disjoint
write-sets, no dependency between them.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | `ParseRefusal` + score + merge | typescript-pro | `src/core/parse-refusal.ts`, its test | — | [x] |
| T2 | `findStartTypes` candidate set | typescript-pro | `src/core/diagram-type-set.ts`, its test | — | [x] |

**Gate at close:** all four. Nothing in `src/` consumes either module yet, so
every existing gate must be **unchanged** — a moved baseline here means
something was wired that should not have been.

**Closed 2026-08-24.** All four gates green; the routing gate and T0's
refusal gate both **unchanged**, as this batch required. Two extra commits
beyond the two tasks: `fix(T2)` corrected two invented divergences from the
Java (`/\s/` for `Character.isWhitespace`, `toLowerCase()` for the ASCII-only
fold), and `chore(T1,T2)` regenerated the drift-gated module catalog for the
two new modules. Every citation in both modules was re-read against
`~/git/plantuml` rather than taken from the agents' reports.
