# Batch 0 — capture and helper

Two independent tasks, **no shared writes**. Run in parallel.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | Capture the activity oracle corpus | sonnet | `test-results/dot-cache/activity/**`, `test-results/render-manifest-baseline.json`, `.agent-notes/aoh-T0.md` | — | [ ] |
| T1 | The activity render helper | sonnet | `tests/oracle/svg-conformance/render-fixture-activity.ts` | — | [ ] |

T0 runs the jar and commits what it produces; it writes **no `src/` and no
tests**. T1 writes one test-helper module and touches no cache.

**Parallel safety:** these two write disjoint trees. If executing in one
worktree, they may still run concurrently — neither reads the other's output.
