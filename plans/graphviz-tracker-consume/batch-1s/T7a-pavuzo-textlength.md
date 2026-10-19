# T7a — pavuzo: missing `textLength` on four texts (item 16)

Prepend [../task-preamble.md](../task-preamble.md). Worktree `gtc-S`.

## Context
`state/pavuzo-79-zodu430` (4/85) has `skinparam linetype ortho` and a composite `NotShooting` with
`EvConfig` transitions. Our layout equals native on the jar DOT (TRACKER 16, 2026-10-14). The 4 structural
diffs: the jar's `<text>` carries `textLength` (52.813 ×2 inside the composite; 112.044 and 80.194 outside)
where ours has none. These are the ortho transition labels (xlabels: `SvekEdge.java:433-437`). Find which
draw path in ours omits `textLength`, and the jar's rule for emitting it (the klimt SVG text driver).

## Task
Write the diagnosis artifact, then fix at the origin, with a test.

## Write-set
State transition-label renderer files under `src/diagrams/state/` (name them in the artifact),
`tests/unit/state/**`.

## Acceptance
- Given pavuzo, when rendered, then the 4 `textLength` diffs clear, with values equal to the jar's.
- Given the state survey before and after, then there are no losses, and the state golden ratchet stays
  green.

**Observability:** N/A. **Rollback:** reversible.
