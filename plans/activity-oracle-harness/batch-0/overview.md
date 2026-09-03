# Batch 0 — capture and helper

Two independent tasks, **no shared writes**. Run in parallel.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | Capture the activity oracle corpus | sonnet | `test-results/dot-cache/activity/**`, `test-results/render-manifest-baseline.json`, `.agent-notes/aoh-T0.md` | — | [x] |
| T1 | The activity render helper | sonnet | `tests/oracle/svg-conformance/render-fixture-activity.ts` | — | [x] |

T0 runs the jar and commits what it produces; it writes **no `src/` and no
tests**. T1 writes one test-helper module and touches no cache.

**Parallel safety:** these two write disjoint trees. If executing in one
worktree, they may still run concurrently — neither reads the other's output.

| T0b | Pin the activity tree into the corpus-completeness gates ([D11]) | orchestrator | `oracle/goldens/svg-conformance/{routing,refusal}-baseline.json`, those two suites' derivation counts, `plans/.../scripts/pin-activity-baselines.ts`, `.agent-notes/aoh-T0b.md` | T0 | [x] |

**T0b was added during execution**, not at decomposition — see
[T0b-pin-corpus-gates.md](T0b-pin-corpus-gates.md) and [D11](../decisions.md).
It commits BEFORE T0 so no red commit lands.
