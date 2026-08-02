# Batch 4 — Close the mission

One task, not two: closing SI10 and registering the follow-up BOTH write
`planning/mission-index.md`, so they cannot be parallel.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T4 | Flip SI10 to done, re-scope its "retired" clause, register the SI9-extension follow-up, write the summary | technical-writer | `planning/mission-index.md`, `plans/si10-usecase-actor-routing/README.md` | T1, T2, T3 | [x] |

## Batch exit criteria

- SI10 reads `done` and its "analytic substitute retired" clause is
  **re-scoped, not restated** (ADR-1)
- The SI9-extension follow-up is registered as its own row
- Every number traces to the decision journal
- Predecessor rows unchanged — dated numbers were true when taken
- All four gates green
