# Two ways a per-agent git worktree silently reads or writes the wrong tree

`parity-dashboard-refresh` / batch 1, 2026-09-20. Four agents, four
`git worktree add` checkouts under `.claude/worktrees/`, gitignored asset
trees symlinked in per `.agent-notes/si24-census-worktree-needs-ignored-assets.md`.

## Observation: `test-results/` is half-committed, so a whole-dir symlink lands inside it
- **Context**: recipe was `ln -s $REPO/test-results $W/test-results`.
- **Finding**: `.gitignore` carves out `!test-results/dot-cache/`, so `git worktree
  add` materialises `test-results/` as a REAL directory holding the committed
  cache, and the symlink becomes `test-results/test-results`. Every gitignored
  sibling (`visual-qa-svg/canonical/`, `dot-sync-equal/`,
  `render-manifest-baseline.json`) is invisible in the worktree. `git status`
  stays clean, nothing errors, so no agent noticed.
- **Impact**: T4's before/after `--markdown` proof ran with every DOT row at zero
  on both sides (vacuous), and its `dotParityRows` tests passed only because
  `buildAgg` was unreachable; the same tests timed out in the main checkout.
  Corrected recipe: link the CHILDREN of `test-results/` individually, and after
  linking, `ls -la $W/test-results/` must show them.
- **Confidence**: High (reproduced both ways).

## Observation: Serena edit tools write to the MAIN checkout, not the worktree
- **Context**: agents are told "work only in your worktree"; their toolset
  includes Serena's `replace_symbol_body` / `insert_*_symbol`.
- **Finding**: Serena is registered at user scope with the main checkout as
  its project root, and its `relative_path` resolves against that root. A T4
  edit landed in the main checkout's `scripts/dot-parity-rows.ts` at 09:22
  (8+/8- of its first, later-abandoned attempt) while the worktree copy went
  its own way. Found only because the next cherry-pick refused to overwrite
  a modified file.
- **Impact**: for worktree agents, Serena READ tools with absolute worktree
  paths only; NEVER Serena edit tools; all edits via Edit/Write on absolute
  worktree paths. The orchestrator should `git status` the main checkout
  before every merge.
- **Confidence**: High (file mtime inside the agent's run window; content
  matches its reported first attempt).

## Observation: the symlinks show as untracked
- **Finding**: `.gitignore` rules with a trailing slash (`node_modules/`)
  do not match a symlink. Adding the bare names to `.git/info/exclude`
  (shared by all worktrees) keeps `git status` clean and protects against
  a stray `git add .`.
- **Confidence**: High.
