# Batch 1 — Options ADR (SERIAL · **STOPS FOR THE USER**)

One task, and it deliberately ends the autonomous run.

The option this mission most obviously points at — a per-run isolated output
directory — was **declined by the user** during SI34. T2 re-opens that
question with T0's exposure measurement and T1's reader census in hand, and
then **stops** (stop 3). Only the user resumes the mission.

This is the mission's purpose, not a failure. An agent that reads T2's own
recommendation and starts implementing it has violated D4.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | Options ADR with measured cost; STOP for approval | architect-reviewer (sonnet) | `planning/adr/`, `.agent-notes/sri-T2.md` | T0, T1 | [x] |
