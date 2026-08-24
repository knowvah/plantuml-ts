# Batch 3 — the candidate-type filter

One task, landed alone so its effect is separable from T2's. This is the piece
most likely to move a fixture that is **currently correct**, because it changes
which plugins are consulted at all rather than the order they are consulted in.

| ID | Description | Agent | Writes | Depends On | Done |
|----|---|---|---|---|---|
| T3 | [Candidate-type filter](T3-candidate-type-filter.md) | typescript-pro | `src/core/dispatcher.ts`, `src/core/block-extractor.ts`, `tests/unit/core/dispatcher.test.ts` | T2 | [ ] |
