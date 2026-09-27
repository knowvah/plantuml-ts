# T30 — batch-3 close

**Agent:** orchestrator · **Depends on:** T21, T22, T24, T26, T27, T29, T23, T25, T28

Run [`../close-procedure.md`](../close-procedure.md) with `N=3`, `prev =
b2.json`. Worktree tasks: cherry-pick in task order, regenerate
`docs/catalog.md` on conflict, `git status` the main checkout before each
merge. Step 9 is mandatory when any task touched `src/core/`.

## Acceptance criteria

See close-procedure. Plus: every fixture owned by this batch has a
non-empty `final`.

## Observability · Rollback

N/A. Reversible.
