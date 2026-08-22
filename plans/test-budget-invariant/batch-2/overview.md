# Batch 2 — The fitness test, and the catalog outcome (PARALLEL)

Two tasks, disjoint write-sets, both depending on Batch 1.

T3 is the mission's substance and the harder of the two: a fitness test that
only finds direct `withStdlibBuildLock` calls would miss `:429`, the very
defect that motivated the mission (D2, stop 5).

T4 applies whatever T2 concluded — including "nothing", if that is what the
diagnosis supports.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3 | Fitness test: every lock-using test's budget > `DEFAULT_MAX_WAIT_MS`, resolving one level of helper indirection | typescript-pro (sonnet) | `tests/architecture/stdlib-lock-test-budget.test.ts` (new), `.agent-notes/tbi-T3.md` | T1 | [ ] |
| T4 | Apply T2's diagnosed outcome for `catalog.test.ts` | typescript-pro (sonnet) | `tests/architecture/catalog.test.ts`, `.agent-notes/tbi-T4.md` | T2 | [ ] |
