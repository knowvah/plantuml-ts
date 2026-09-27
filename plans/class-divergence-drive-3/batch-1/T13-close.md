# T13 — batch-1 close

**Agent:** orchestrator · **Depends on:** T7, T8, T9, T10, T11, T12

Run [`../close-procedure.md`](../close-procedure.md) with `N=1`, `prev =
b0.json`. Wave-1 tasks ran in worktrees: cherry-pick in task order,
regenerate `docs/catalog.md` on conflict, and `git status` the main
checkout before each merge. Step 9 is mandatory (T8, T10, T11, T12 touch
`src/core/`). Any E row T6 has folded into a batch-1 mechanism is measured
here too.

## Acceptance criteria

See close-procedure. Plus: every workstream-A row has a non-empty `final`.

## Observability · Rollback

N/A. Reversible.
