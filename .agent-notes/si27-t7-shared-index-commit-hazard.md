## Observation: `git add <paths>` + bare `git commit` is unsafe on a shared index

- **Context**: T7, committing `src/core/command/Command.ts` and 5 other
  write-set files on `refactor/shared-seam-extraction` while 6 other SI27
  agents were mid-edit on the same working tree.
- **Finding**: `git commit` with no pathspec commits the ENTIRE index, not
  just what the current agent just `git add`ed. Ran `git add <my 6 files>`
  then `git commit -m ...`; between those two commands another agent (or
  several) had already `git add`ed their own in-progress renames/deletes
  (T2's `render-atoms.ts`→`core/creole-atoms-image-resolver.ts` and
  `renderer-symbol.ts`→`core/decoration/symbol/usymbol-resolve.ts`; T4's
  `class-color-override.ts`→`core/color-override.ts`; T5's delete of
  `description/frontier-calculator.ts`; T8's delete of the four
  `renderer-shell.ts` files) into the shared index without committing yet.
  My commit (`ccf1e3dd`) swept all of it in under the T7 commit message.
  Worse: for T5 and T8, only the DELETE side of their move was staged at
  that moment, not the new-path ADD — so `ccf1e3dd` in isolation is a
  broken commit (e.g. `description/frontier-calculator.ts` deleted with no
  `core/svek/FrontierCalculator.ts` replacement present in that commit).
  The working tree itself was never broken (the new files existed on disk,
  just not yet `git add`ed by their owning agent), so `npm run
  typecheck`/`build`/`test` against the working tree stayed green
  throughout — only `git show ccf1e3dd` / a checkout of that exact SHA in
  isolation is inconsistent.
- **Impact**: On a mission branch using merge commits (not squash), this
  intermediate broken commit persists in final history — bisectability is
  degraded and per-task commit attribution (README's "one commit per task")
  is violated for T2/T4/T5/T8, whose moves now show up under T7's message
  instead of their own. No data was lost; every file's final content is
  correct once each owning agent adds+commits its remaining diff on top.
  **Mitigation for remaining agents**: `git commit` with EXPLICIT pathspecs
  (`git commit <path1> <path2> ... -m "..."`) instead of a bare `git commit`
  after `git add` — this only commits the given paths regardless of what
  else is staged, and is safe even if the index is dirty with other agents'
  staged-but-uncommitted work. `git commit -m` alone is not equivalent to
  `git add <paths> && git commit -m` under index contention.
- **Confidence**: High (directly observed: `git show --stat ccf1e3dd`).
