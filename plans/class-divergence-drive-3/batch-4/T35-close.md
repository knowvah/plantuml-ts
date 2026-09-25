# T35 — batch-4 close

**Agent:** orchestrator · **Depends on:** T31, T33, T34, T32

Run [`../close-procedure.md`](../close-procedure.md) with `N=4`, `prev =
b3.json`. Worktree tasks: cherry-pick in task order, regenerate
`docs/catalog.md` on conflict, `git status` the main checkout before each
merge. Step 9 is mandatory when any task touched `src/core/`.

## Acceptance criteria

See close-procedure. Plus: every fixture owned by this batch has a
non-empty `final`.

## Observability · Rollback

N/A. Reversible.
