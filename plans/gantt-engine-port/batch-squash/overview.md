# Squash — one commit per batch (D7)

Agent: orchestrator. Runs last, after the exit batch is committed and its
gates are green. The working history (one commit per task, `--no-ff` task
merges, close commits) is what the decision journal cites while the drive
runs; the branch that becomes the PR has **one commit per batch**.

Never rebase or cherry-pick to squash (sdd1 lost an evil-merge's content that
way). Build each batch commit from the tree its close produced. This is
sdd3's procedure (`plans/sequence-divergence-drive-3/batch-squash/overview.md`)
with the names changed; sdd3's own run surfaced one trap: in zsh a loop
variable is NOT word-split, so write the map with `${b%%:*}`-style splitting
or explicit `read`, and verify the shas are 40 hex characters before
committing the map.

## Steps
0. **Record first, then freeze.** Collect the batch-close commits in order
   (b0–b8 closes, the exit commit), write `<batch> <close sha> <tree
   sha>` to `$M/squash-map.txt` (the exit entry is the tag itself, by
   reference), append a journal row naming the tag `gep/pre-squash` and the
   map, tick the squash batch in `README.md`, commit `docs(gep): squash map`.
   The tree of this final commit is the target tree.
1. **Tag the working history**: `git tag gep/pre-squash HEAD` (local, never
   pushed). Re-tag with `-f` only if the map had to be rewritten before
   anything was built on it.
2. **Re-read the map**; the last entry's tree must equal `HEAD^{tree}`.
3. **Build the chain** with `git commit-tree`, parent = `git merge-base main
   gep/pre-squash` (must be `1be33f054`; if main was merged into the branch,
   stop and ask) for the first, the previous new commit thereafter:
   `git commit-tree <close-tree> -p <prev> -F <msg-file>`. Unsigned. One
   commit per batch plus `docs(gep): close out` kept separate.
4. **Messages**: Conventional Commits, e.g. `fix(core): gep batch 1 — shell
   arms; class, state, json honour skinparam lengthAdjust`, body listing the
   tasks (ID + one line), the gantt counts before → after, and
   `Refs: gep/pre-squash <first>..<last>`. Lines ≤ 80; no attribution.
5. **Verify**: every new commit's tree equals the recorded close tree; the
   final tree equals `gep/pre-squash^{tree}`; `git rev-list --count` = 10
   (b0–b8, exit) with 0 merges. Any mismatch: stop, branch unmoved.
6. **Move the branch**: `git update-ref refs/heads/feat/gantt-engine-port <new tip> gep/pre-squash` (compare-and-swap on the old tip), then
   `git reset --hard HEAD`.
7. **Hand-off**: give the user `git rebase --force-rebase -S 1be33f054` on the
   branch (`--force-rebase` is required: the chain already sits on the base,
   so a plain `rebase -S` signs nothing), expect `G` on every line of
   `git log --format='%G? %h %s'`, then push and open the PR. Report the
   squashed shas in chat only (they change on signing) and say that every
   hash the brief or journal cites resolves only through `gep/pre-squash`.

## Write-set
`refs/heads/feat/gantt-engine-port`, tag `gep/pre-squash`; step 0
only: `$M/squash-map.txt`, `decision-journal.md`, `README.md`.

## Acceptance
- Given the new branch, then `git rev-list --count 1be33f054..HEAD` is 10 and
  contains no merges.
- Given each new commit, then its tree equals its batch's close tree.
- Given the final commit, then its tree equals `gep/pre-squash^{tree}`.

Observability: N/A. Rollback: Reversible — `git update-ref` the branch back
to `gep/pre-squash`.
