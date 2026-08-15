# Batch 1 — measure, derive, share

No behaviour change lands in this batch. It exists so that Batch 2 has a
gate to be judged by, a validated predicate to wire in, and a helper it can
import.

All three tasks have disjoint write-sets and no dependencies on each other.
**Run them in parallel.**

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1](T1-measurement-harness.md) | Commit the shape-match / document-size harness with its baseline pinned | typescript-pro | `scripts/shape-match-report.ts` | — | [x] |
| [T2](T2-wrapper-level.md) | Derive the cluster wrapper level from upstream's predicate; validate against all 126 cached DOTs | typescript-pro | `src/diagrams/class/class-cluster-levels.ts`, `tests/unit/class/class-cluster-levels.test.ts` | — | [x] |
| [T3](T3-share-title-helper.md) | Move `computeTitleTableHeight` to a shared core module | typescript-pro | `src/core/cluster-title-table.ts`, `src/diagrams/state/state-composite-header.ts`, state importers | — | [x] |

## Batch exit criteria

- All four quality gates green.
- T1's harness reports the pinned baseline (691 / 20685) on an unmodified
  tree — if it does not, the harness is wrong, not the tree.
- T2 agrees with all 126 cached DOTs. Any disagreement is a STOP.
- T3 leaves every state test byte-identical.
- `git diff --name-only` against the batch start matches the union of the
  three write-sets and nothing else.

## Note for the orchestrator

Agents share this worktree. No agent runs git. Commit the three tasks
separately after the batch completes, one commit per task, referencing the
task ID (`feat(T1): ...`).
