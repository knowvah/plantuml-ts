# cdd-close-b4 — batch 4 close (class-divergence-drive)

Written 2026-09-22. Survey 460/56/207 → 468/68/187; census 462 → 470;
DOT 711/712.

## Observation: run `tsc` on the MERGED tree before trusting a worktree gate
- **Finding**: T12's worktree reported all four gates green, yet `tsc` on
  the merged tree failed in T12's own new test file. The agent's gate run
  predated its last test edit. Two other closes merged cleanly by luck.
- **Impact**: after every merge into the mission branch, `npx tsc --noEmit`
  before dispatching the next task; the close's full gate would catch it,
  but a dependent task would start from a red tree.
- **Confidence**: High.

## Observation: E9 was already closed by a batch-1 fix
- **Finding**: A2b E9 ("could not localise") was the phantom `Classifier`
  T3 removed for package link endpoints. T14 became attribution only
  (`.agent-notes/cdd-T14.md`). Check the current tree's render-diff before
  dispatching a diagnosis task whose fixtures overlap an earlier fix.
- **Confidence**: High.
