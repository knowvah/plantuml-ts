# Batch 1 — Fix the omission, name the constant, diagnose the catalog test (PARALLEL)

Two tasks, disjoint write-sets.

T1 is mechanical but must be atomic: one constant and all 42 of its call sites
are a single logical unit, so they are one task and one commit
(`~/.claude/rules/parallelism.md`). T2 writes no fix at all — it produces a
mechanism, and is permitted to conclude that no code change is warranted (D5).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Fix the `:429` omission; extract 42 `120_000` literals to one named constant | typescript-pro (sonnet) | `tests/helpers/*` (new constant), the 10 test files carrying `120_000`, `.agent-notes/tbi-T1.md` | — | [x] |
| T2 | Diagnose `catalog.test.ts`'s load sensitivity to a stated mechanism | typescript-pro (sonnet) | `.agent-notes/tbi-T2.md` only | — | [x] |
