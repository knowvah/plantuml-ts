# T20 — batch-2 close

**Agent:** orchestrator · **Depends on:** T14, T17, T15, T16, T18, T19

Run [`../close-procedure.md`](../close-procedure.md) with `N=2`, `prev =
b1.json`. Worktree tasks: cherry-pick in task order, regenerate
`docs/catalog.md` on conflict, `git status` the main checkout before each
merge. Step 9 is mandatory when any task touched `src/core/`.

## Acceptance criteria

See close-procedure. Plus: every fixture owned by this batch has a
non-empty `final`.

## Observability · Rollback

N/A. Reversible.
