# T7 — text x/y fix

Prepend [../task-preamble.md](../task-preamble.md). Worktree `codd/T7`.

## Input
`measurements/T6-diagnosis.md`: mechanisms, row map and fixer write-set. Implement each mechanism
at its origin, in the order of rows explained, largest first. If the Java contradicts the artifact:
stop 3.

## Write-set
- the files T6 named, typically `src/diagrams/description/renderer-cluster.ts`,
  `description-cluster-header.ts`, `title-label-sizing.ts`, `renderer-edge.ts`
- core creole/measure files fall under D5. They are shared by every engine: run every engine's survey.
- `tests/unit/description/**`, `tests/unit/core/**` for touched modules
- `docs/catalog.md`

## Acceptance
- Given each mechanism's rows, then render-diff before → after per row, and each residual has a
  mechanism.
- Given golamo, rebena, vuvave and xipane, then the tightened `dotEqual` (`titleTable`) flips
  false→true in `parity-unknown.json` at the close, or the residual is named.
- Given every engine's survey in the worktree, then there are zero conformant losses.
- Given the census, then no attribute moves away from the jar (stop 13).

**Observability:** N/A. **Rollback:** Reversible.
