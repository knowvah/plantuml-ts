# Batch 0 — Reproduce and census (PARALLEL · **PIVOT GATE**)

Two tasks, disjoint write-sets, and the mission turns on the first.

T0 must produce the residual as an **observed** failure. It has never been
seen — SI34 deduced it from the lock's release semantics rather than
witnessing it. If it cannot be reproduced, the mission STOPS (stop 1) and
the right outcome is a permanent documented acceptance.

T1 counts the readers. SI34's close-out said two; the orchestrator found at
least six while drafting this brief. T1 establishes the real number
independently, because the declined design decision was justified against
the under-count.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | Reproduce the changed-inputs residual; diagnosis artifact | debugger (sonnet) | `scripts_scratch/T0/**`, `.agent-notes/sri-T0.md` | — | [x] |
| T1 | Census every reader of the canonical tree | typescript-pro (sonnet) | `.agent-notes/sri-T1.md` | — | [x] |
