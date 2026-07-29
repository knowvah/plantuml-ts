# T6 — Perf check and mission close

Orchestrator task, not an agent's.

## Task

1. **Perf check** (Phase-4 commitment). Time a render of the largest
   corpus fixture before (main @ `7267187`) and after. `BodyEnhanced*
   .getArea` rebuilds text blocks, so the port could cost more per node.
   **Flag a >10% regression; do not gate on it.** Record both numbers.
2. **Close the mission.** Update `plans/bodyenhanced-atom-seams/README.md`
   checkboxes, append the outcome to `decision-journal.md`, record the
   result in `planning/mission-index.md`, and ledger any residual in
   `plans/s1l-leaf-sizing/ledger.md`.
3. **Retire S1L-i explicitly** in `mission-index.md` if ADR-4 closed it —
   with the fixture evidence, not by assumption.
4. **Decide the filed `archimate` sname gap**: folded in, or still filed?
   Say which and why.

## Acceptance criteria

- Given the perf measurement, then both numbers are recorded, with the
  fixture named
- Given S1L-i, then it is marked done WITH evidence or explicitly left open
- Given every residual, then it is ledgered, not dropped
- Given the mission index, then it states what was NOT achieved as plainly
  as what was

## Observability / Rollback

N/A — documentation. Reversible.
