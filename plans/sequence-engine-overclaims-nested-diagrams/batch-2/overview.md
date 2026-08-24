# Batch 2 — the structural fix

One task. This is the change with the largest reach in the mission: it is one
line per plugin and it re-decides routing for the whole corpus.

Deliberately **not** parallel with batch 3, though the write-sets are
disjoint. Both change routing corpus-wide; landing them together makes a moved
fixture unattributable, which is the whole reason T1 was built first.

| ID | Description | Agent | Writes | Depends On | Done |
|----|---|---|---|---|---|
| T2 | [Registration order](T2-registration-order.md) | typescript-pro | `src/index.ts`, `tests/unit/core/registration-order.test.ts` | T1 | [ ] |
