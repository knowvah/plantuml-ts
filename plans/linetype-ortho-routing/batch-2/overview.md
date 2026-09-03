# Batch 2 — engine forwarding (all geometry movement happens here)

**Sequenced, not parallel.** The three tasks write disjoint files and touch
disjoint fixture sets, so they are parallel-safe on write-set grounds. They
are sequenced anyway: the `npm test` gate is global, and this repo's own
note records that a brief's "parallel" is about write-sets, not execution
safety (`.agent-notes/` — batch parallelism needs worktrees). For three small
tasks, worktrees cost more than they save.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T4 | state forwards `linetype` (3 assembly sites, 2 files) | sonnet | `src/diagrams/state/state-dot-graph.ts`, `src/diagrams/state/state-composite-pass.ts` + tests | T2, T3 | [x] |
| T5 | class forwards `linetype` | sonnet | `src/diagrams/class/class-dot-graph.ts` + tests | T4 | [x] |
| T6 | description forwards `linetype` | sonnet | `src/diagrams/description/layout.ts` + tests | T5 | [x] |

**Disjoint fixture sets make each task separately attributable:** T4 moves
only the 2 state fixtures, T5 only the 5 class fixtures, T6 only the 1
component fixture. Any task that moves a fixture belonging to another
engine's set is stop condition 1.

Each task reads `linetype` from **the same expression its own engine's
label half already reads** ([D3](../decisions.md)) — the two halves must
agree, or a diagram gets xlabels without ortho routing.
