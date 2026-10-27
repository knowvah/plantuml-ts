# T8<x> — <family> (template)

Agent: `typescript-pro` (sonnet), worktree `gep-T8<x>`. Commit:
`fix(gantt): <family mechanism, ≤ 50 chars> (T8<x>)`.
Read [../task-contract.md](../task-contract.md), decisions D4/D9/D10, and
`../diagnosis/F<n>-<family>.md` (the mechanism, origin and write-set — the
artifact is the spec).

## Task
Fix the mechanism at its origin (`file:line` in the artifact), mirroring the
Java; never fit a value. Add a unit test for the mechanism and an authored
fixture if no fixture isolates it (oracle via `scripts/oracle-render.sh`).

## Write-set
Exactly the artifact's write-set (src/diagrams/gantt, src/core/time,
src/core/clock.ts only — stop 16 otherwise) + its tests.

## Acceptance
- Given the family's rows, then each moves toward the jar (score falls) and
  the listed ones become conformant; report every row whose score rose
  (must be none).
- Given every other gantt fixture, then no score rises.
- Given the 28-engine survey on the branch, then no other engine moves.

Observability: N/A. Rollback: Reversible.
