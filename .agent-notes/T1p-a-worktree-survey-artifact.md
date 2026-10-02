## Observation: a plain `git worktree add` is missing gitignored asset symlinks the mission worktrees carry

- **Context**: T1p-a (batch 1p, add2) ran an all-engine `npm run svg:survey`
  before/after to satisfy the task's "report verdict changes (expect none)"
  requirement. `git stash` is banned, so a throwaway comparison checkout was
  made via `git worktree add --detach /tmp/<dir> HEAD`.
- **Finding**: `assets/stdlib` and every `packages/stdlib*/generated` are
  gitignored (`.git/info/exclude`) and, in every mission worktree under
  `.claude/worktrees/`, are SYMLINKS back to the main checkout (set up by
  whatever created the worktree — not plain `git worktree add`, which leaves
  them simply absent). A plain `git worktree add` therefore has no stdlib
  asset/include data at all. Four class fixtures using `sprite ... jar:...`
  or `!include <tupadr3/...>` rendered as spurious `diverged` there and
  `conformant` in the real worktree — a measurement artifact of the
  comparison checkout, not a real effect of any code change. Symlinking
  `assets/stdlib` + the four `packages/stdlib*/generated` dirs from the main
  checkout into the throwaway worktree made its survey output match the real
  worktree exactly (709/12 class verdicts both sides).
- **Impact**: any future before/after survey done via a hand-rolled
  `git worktree add` (rather than the repo's own worktree-creation tooling)
  must recreate these symlinks first, or it will report false positives on
  every sprite/stdlib-include fixture — specifically in `class`, which has
  the heaviest stdlib/sprite usage of the surveyed engines. Confirmed by a
  controlled experiment (re-ran the before-worktree with the symlinks added;
  the spurious diffs disappeared) before trusting the real before/after.
- **Confidence**: High (reproduced twice, isolated by adding the symlinks
  one directory at a time).
