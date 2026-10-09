# Rules every agent prompt carries (paste first)

1. **NO Serena MCP tools AT ALL, read or write — not one call.** They resolve to
   the MAIN checkout, not your worktree.
2. Work only in your worktree; every path starts with it; `.agent-notes/` means
   `<worktree>/.agent-notes/`. Confirm `<worktree>/.husky/_` exists before your
   first commit (pre-commit runs prettier + eslint --fix).
3. No `git stash` in any form; WIP commits only.
4. No raw `&` background jobs; foreground vitest with modest file sets and
   `--maxWorkers=4`; never the full `npm test`. Surveys one engine per command,
   foreground.
5. Never edit `oracle/goldens/**`, baseline/census/owed JSONs, cached oracle
   bytes (`test-results/dot-cache/**`), `oracle/pin.json`, `oracle/dist`, or
   `DIVERGENCES.md` (orchestrator only — report the exact text). The fork is
   off-limits except where your task file explicitly authorizes it.
6. Java at `~/git/plantuml/src/main/java` is the spec (grep `src/main/java/net/`):
   quote `file:line` for every mechanism and constant; no tolerances, no fitted
   values. Read the method body AND the constructor that built its inputs;
   verify every brief claim — the brief states measurements to re-take, not
   conclusions. JSDoc `@see` on ported symbols; upstream names.
7. Mirror the jar's output exactly (repo CLAUDE.md). Render the jar first via
   `scripts/oracle-render.sh <out-dir> <puml>` — ONE fixture per JVM — and
   mirror THAT. Author jar fixtures under `tests/fixtures/isw-<ID>/` with a test
   comparing ours to the jar render.
8. Measure with `DeterministicMeasurer` only (never construct
   `WidthTableMeasurer` outside `src/core` — D4).
9. Stay in your write-set; anything else: stop and report (mechanism + owner).
10. Files <= 500 lines; functions <= 30 NLOC / CCN <= 10 / <= 5 params (hook).
11. Commits: Conventional Commits, lines <= 80, no attribution footer, one per
    mechanism, each green on targeted tests + `npm run typecheck` + eslint.
12. Any `src/core/**` edit: all-engine survey before AND after
    (`plans/instrument-space-width/measurements/survey-all.sh <dir>` or one
    engine per command), `engdiff.py <before> <after>`, `elements.mts` +
    `elements-diff.py`, `seq-scores.mts`. Any conformant loss or AWAY line = stop.
    Report every pinned row that moves and every owed row you clear.
13. Scratch files ONLY under `/private/tmp/claude-501/isw-<ID>/`.
14. Final report to `<worktree>/.agent-notes/isw-<ID>.md` (commit it) and return
    it: commits; Java -> ours (file:line); fixtures before -> after; engdiff;
    ratchet movers; owed rows cleared; exact DIVERGENCES.md text if any; not
    done + why. No preamble, no trailing summary.
