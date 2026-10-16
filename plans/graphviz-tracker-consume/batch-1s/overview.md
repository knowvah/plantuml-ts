# Batch 1s — state lane: pavuzo (item 16); item 14

Runs in the worktree `gtc/S` (`bash measurements/mkwt.sh S`), in parallel with batches 1a–1c. It is
sequential within the lane, one commit per task. It writes `src/diagrams/state/**` only: a needed
`src/core/**` edit is stop 1. [Close-procedure B](../close-procedure.md) runs after T8; ticks 16 and 14
happen then.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T7a | pavuzo: 4 missing `textLength` | typescript-pro | state transition-label renderer files, tests | T0 | [ ] |
| T7b | pavuzo: uniform 1 px x shift (width 218 vs 219) | typescript-pro | state ink-extent / composite sizing files, tests | T7a | [ ] |
| T8 | Item 14: state composite title Y from `clusters[].label` (D3) | typescript-pro | `state-composite-cluster.ts` + label plumbing in `src/diagrams/state/**`, tests | T7b | [ ] |
