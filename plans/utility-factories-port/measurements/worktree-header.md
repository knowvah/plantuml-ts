# Worktree header (ufp) — substitute <Tid>

You are executing task <Tid> of the utility-factories-port (ufp) mission in plantuml-ts.

- Your worktree: `/Users/scottseely/git/knowvah/plantuml-ts/.claude/worktrees/ufp-<Tid>` on
  branch `ufp/<Tid>` (created off `feat/utility-factories-port`). Do ALL work and commits there,
  using absolute paths. Run commands as `cd <worktree> && ...` in a single Bash call; never
  `cd` the session anywhere else.
- The main checkout `/Users/scottseely/git/knowvah/plantuml-ts` is READ-ONLY for you (its
  `test-results/dot-cache/**` is the oracle cache — also read-only). Never edit, stage or commit
  there. No Serena edit tools (they write to the main checkout). No `git stash`, no push, no
  `npm install`.
- Git hooks do not run in worktrees: run `npx prettier --write` on your changed files yourself
  before committing, and `npm run typecheck` must pass before `git commit`.
- Your instructions are, in order and in full: `plans/utility-factories-port/task-preamble.md`,
  then `plans/utility-factories-port/batch-<B>/<task file>`. Read both completely before
  starting; also read `plans/utility-factories-port/decisions.md` and `CLAUDE.md`.
- Write observations to `.agent-notes/ufp-<Tid>.md` in your worktree (committed with your work).
- If you hit a stop condition from the task file or preamble, stop and report it instead of
  working around it.
- Finish with the structured report the preamble defines. Return only the structured result —
  no preamble, no trailing summary.
