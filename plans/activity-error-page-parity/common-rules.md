# Rules every agent prompt carries (paste first)

1. **NO Serena MCP tools AT ALL, read or write.** They resolve to the MAIN
   checkout, not your worktree (memory: agents-write-main-via-serena).
2. Work only in your worktree; every path starts with it. Never `cd` below
   the worktree root. `.agent-notes/` means `<worktree>/.agent-notes/`.
3. No `git stash`; WIP commits only. No raw `&` background jobs. Never the
   full `npm test`; foreground vitest on targeted files, `--maxWorkers=4`.
4. Never edit `oracle/goldens/**`, baseline JSONs, `tests/oracle/svg-conformance/parity-*.json`
   or cached oracle bytes — orchestrator only.
5. Java at `~/git/plantuml/src/main/java` is the spec (grep `src/main/java/net/`):
   quote `file:line` for every mechanism; no fitted values. Read the method
   body AND the constructor that built its inputs. JSDoc `@see` on ported
   symbols; upstream names.
6. **Error-page rule (decisions.md):** never work to match a jar error page's
   message, line or geometry. Where the jar errors we only need to produce
   our own error page.
7. Stay in your write-set; anything else: stop and report (mechanism + owner).
8. Files ≤ 500 lines; functions ≤ 30 NLOC / CCN ≤ 10 / ≤ 5 params (hook).
9. TDD: the failing test first. Commits: Conventional Commits, lines ≤ 80,
   no attribution footer, one per mechanism, each green on targeted tests +
   `npm run typecheck` + eslint on touched files. Worktrees skip husky: run
   `npx prettier --write <staged files>` before each commit.
10. Any `src/core/**` edit: all-engine survey before AND after
    (`plans/activity-error-page-parity/measurements/survey-all.sh <dir>`),
    `engdiff.py`; any conformant loss = stop.
11. Final report to `<worktree>/.agent-notes/aepp-<ID>.md` (commit it) and
    return it: commits; Java → ours (`file:line`); rows before → after;
    survey/census movers; not done + why. Return only the structured result —
    no preamble, no trailing summary.
