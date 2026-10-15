# T2 — cluster-box fix

Prepend [../task-preamble.md](../task-preamble.md). Worktree `codd/T2`.

## Input
`measurements/T1b-diagnosis.md` (the artifact, mechanisms, row map and fixer write-set). Implement
the mechanisms it states, at their origin. Do not re-derive them. If the Java contradicts the
artifact, stop and report (stop 3); never adapt the fix to the numbers.

## D8 checklist (record in your report)
- the TRACKER entries consulted (T0b ledger), and the native `dot -Tdot` result per named fixture
- package/folder titles stay at `USymbolFolder.java:228` `UTranslate(4, 2)` (TRACKER #14)

## Write-set
- `src/diagrams/description/renderer-cluster.ts`, `layout.ts`, `frontier-cluster-bbox.ts`,
  `layout-geo-post.ts`
- the other files T1b named. A core file falls under D5: journal it and run the guards.
- `tests/unit/description/**` (and `tests/unit/core/**` if core is touched)
- `docs/catalog.md` (`npm run catalog`)

## Acceptance
- Given bamami, when rendered, then the package rect height equals the jar's (81, from cluster6's bb
  16.07..97.07), and render-diff falls from 0/88. Report the residual.
- Given every row T1b mapped to the mechanism, then render-diff before → after per row; each rise
  carries a mechanism.
- Given the layout-parity ratchet (469) and the description golden ratchet (89), then both stay
  green.
- Given the component/usecase/unknown/c4/class/object/state surveys in the worktree, then there are
  zero conformant losses, and every mover is listed with its mechanism.

**Observability:** N/A. **Rollback:** Reversible.
