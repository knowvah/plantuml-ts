# Squash — one commit per batch (D11)

Agent: orchestrator. Runs last, after the exit batch is committed and its
gates are green. The working history (one commit per task, `--no-ff` task
merges, close commits) is what the decision journal cites while the drive
runs; the branch that becomes the PR has **one commit per batch**.

Lesson from sdd1: `git rebase -r` re-runs merges and silently drops content
a merge commit itself introduced ("evil merge" — sdd1 lost `ea9913a2f`'s
restored file and `ed7355c47`'s tightened pins). Never rebase or
cherry-pick to squash. Build each batch commit from the tree its close
produced.

## Steps
0. **Record first, then freeze.** The squashed shas change again when the
   user signs (`rebase -S` rewrites every commit), so nothing records them.
   Instead, while still on the working history: collect the batch-close
   commits in order (b0 close, b1 … b8 closes, the exit commit; batch 5 may hold spawned T5c… tasks), write
   `<batch> <close sha> <tree sha>` to `$M/squash-map.txt`, append a journal
   row naming the tag `sdd3/pre-squash` and the map, tick the squash batch
   in `README.md`, and commit that as part of the exit commit (amend it, or
   a last `docs(sdd3): squash map` commit that step 3 folds into the exit
   commit's tree). The tree of this final commit is the target tree.
1. **Tag the working history**: `git tag sdd3/pre-squash HEAD` (local, never
   pushed). Every journal citation stays resolvable through it.
2. **Re-read the map** (`$M/squash-map.txt`); the last entry's tree must
   equal `HEAD^{tree}`.
3. **Build the chain** with `git commit-tree`, parent =
   `git merge-base main sdd3/pre-squash` for the first, the previous new
   commit thereafter. If main was merged into the mission branch during the
   drive, the batch trees carry main's changes and the first-parent base is
   wrong: stop and ask the user (rebase the result onto main, or squash
   from that merge onward). Then:
   `git commit-tree <close-tree> -p <prev> -F <msg-file>`. Unsigned (the
   user signs). One commit per batch; the exit commit may be folded into
   batch 8's or kept as its own `docs(sdd3): close out` — keep it separate.
4. **Messages**: Conventional Commits, one per batch, e.g.
   `fix(svg): sdd3 batch 2 — core text and svg fixes` with a body listing
   the tasks (ID + one line), the cohort counts before → after and the pin
   count, and `Refs: sdd3/pre-squash <first>..<last>` for the per-task
   history. Lines ≤ 80; no attribution.
5. **Verify**: for every new commit, `git rev-parse <new>^{tree}` equals the
   recorded close tree; the final tree equals `sdd3/pre-squash^{tree}`
   (byte-identical branch content). Any mismatch: stop, keep the branch
   unmoved.
6. **Move the branch**: `git update-ref refs/heads/feat/sequence-divergence-
   drive-2 <new tip> sdd3/pre-squash` (compare-and-swap on the old tip).
7. **Hand-off**: give the user the exact signing command:
   `git rebase --force-rebase -S <merge-base>` on the branch. `--force-rebase`
   is required: the squashed chain already sits on the merge base, so a plain
   `rebase -S` reports "up to date" and signs nothing (PR #87, 2026-10-22).
   No merges are left, so `-r` is not needed. Expect one signing prompt per
   commit and `G` on every line of `git log --format='%G? %h %s'`. Then the
   user pushes and the PR is opened. Report the squashed shas in chat only
   (they change on signing), and tell the user that every hash the brief or
   journal cites resolves only through `sdd3/pre-squash`.

## Write-set
`refs/heads/feat/sequence-divergence-drive-3`, tag `sdd3/pre-squash`;
step 0 only: `$M/squash-map.txt`, `decision-journal.md`, `README.md`.

## Acceptance
- Given the new branch, then `git rev-list --count <base>..HEAD` equals the
  number of batches (+1 for the exit commit) and contains no merges.
- Given each new commit, then its tree equals its batch's close tree.
- Given the final commit, then its tree equals `sdd3/pre-squash^{tree}`.
- Given the tag, then every sha cited in the journal is reachable from it.

Observability: N/A. Rollback: Reversible — `git update-ref` the branch back
to `sdd3/pre-squash`.
