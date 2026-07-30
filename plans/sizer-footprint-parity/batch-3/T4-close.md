# T4 — Close the mission

Orchestrator task, not an agent's.

## Task

1. **Correct the superseded remedy.** `plans/s1l-leaf-sizing/ledger.md`'s
   "Residual filed by mission bodyenhanced-atom-seams" section prescribes
   adding side channels to `Sea`/`SheetBlock1`. **That is wrong** (ADR-3):
   upstream has no such channels. Rewrite it with what was actually true —
   `AtomImg.java:106-107`'s hardcoded constant and `Footprint`'s
   draw-to-measure — and record that the entry misled for one mission.
2. Record the outcome in `planning/mission-index.md`, stating what was NOT
   achieved as plainly as what was.
3. Note in SI1's row that the `Sea`/`SheetBlock1` gap it inherited **no
   longer exists** — SI1's scope shrinks accordingly.
4. Update README checkboxes; append the outcome to `decision-journal.md`.

## Acceptance criteria

- Given the ledger, then its filed remedy is corrected, not merely appended to
- Given SI1's row, then the retired inheritance is explicit
- Given the mission index, then failures are as legible as successes
- Given the perf numbers from T3, then both are recorded with the fixture named

## Observability / Rollback

N/A — documentation. Reversible.
