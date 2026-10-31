# Squash — one commit per batch (jfp procedure)

Agent: orchestrator. Runs last, after the exit batch is committed and its
gates are green. Never rebase or cherry-pick to squash; build each batch
commit from the tree its close produced (`plans/json-family-parity/batch-squash/overview.md`
is the procedure this copies; in zsh split the map with explicit `read`, and
verify every sha is 40 hex characters).

## Steps
0. **Record, then freeze.** Write `<batch> <close sha> <tree sha>` per close
   (b0, b1, b2, exit) to `$M/squash-map.txt`, journal the tag `jff/pre-squash`
   and the map, tick the squash batch in `README.md`, commit `docs(jff): squash map`.
   That commit's tree is the target tree.
1. `git tag jff/pre-squash HEAD` (local, never pushed).
2. Re-read the map; the last entry's tree must equal `HEAD^{tree}`.
3. Build the chain with `git commit-tree <close-tree> -p <prev> -F <msg-file>`,
   first parent `git merge-base main jff/pre-squash` (must be `b9b309894`; if
   main was merged into the branch, stop and ask). Unsigned. One commit per
   batch plus `docs(jff): close out` kept separate.
4. Messages: Conventional Commits, e.g. `fix(json): jff batch 2 — scale the
   chromed block at export, title included`; body lists the tasks, the surveys
   and positional totals before → after, `Refs: jff/pre-squash <first>..<last>`.
   Subjects ≤ 72, lines ≤ 80; no attribution.
5. Verify: every new commit's tree equals its recorded close tree; the final
   tree equals `jff/pre-squash^{tree}`; `git rev-list --count b9b309894..<new tip>`
   = batches + 2 with 0 merges. Any mismatch: stop, branch unmoved.
6. `git update-ref refs/heads/feat/json-family-followons <new tip> jff/pre-squash`
   (compare-and-swap), then `git reset --hard HEAD`.
7. Hand-off: give the user `git rebase --force-rebase -S b9b309894`; expect `G`
   on every line of `git log --format='%G? %h %s' b9b309894..`; they push and open
   the PR. Say that every hash the brief or journal cites resolves only through
   `jff/pre-squash`.

## Write-set
`refs/heads/feat/json-family-followons`, tag `jff/pre-squash`; step 0 only:
`$M/squash-map.txt`, `decision-journal.md`, `README.md`.

## Acceptance
- Given the new branch, then `git rev-list --count b9b309894..HEAD` is batches + 2 and contains no merges.
- Given each new commit, then its tree equals its batch's close tree; the final tree equals `jff/pre-squash^{tree}`.

Observability: N/A. Rollback: Reversible — `git update-ref` the branch back to `jff/pre-squash`.
