# Rules every agent prompt carries (paste first)

1. **NO Serena MCP tools, read or write.** They resolve to the MAIN checkout,
   not your worktree; five add2 agents corrupted main this way.
2. Work only in your worktree; every Read/Edit/Write path starts with it.
3. No `git stash` in any form. Before/after: WIP commit or a second worktree
   via `plans/activity-divergence-drive-3/measurements/mkwt.sh <name>` (bare
   `git worktree add` lacks the stdlib symlinks); remove it afterwards.
4. No raw `&` background jobs; foreground vitest with modest file sets; never
   the full `npm test` (the orchestrator runs it at the close).
5. Never edit `oracle/goldens/**` or baseline JSONs (re-pinning is orchestrator-only).
6. Java at `~/git/plantuml/src/main/java` is the spec: quote `file:line` for
   every mechanism and constant; no tolerances, no fitted values (stop 13).
   Ported symbols carry a JSDoc `@see` to their Java origin.
7. Stay in your write-set; anything else: stop and report (mechanism + owner).
8. Files <= 500 lines; functions <= 30 NLOC / CCN <= 10 / <= 5 params (hook).
9. Commits: Conventional Commits, lines <= 80, no attribution footer, one per
   mechanism, each green on targeted tests + `npm run typecheck` + eslint.
10. Measure probe Σ + element census before/after each commit; every riser
    needs an element-census-backed mechanism (D6 reveal classes) or it's a stop.
11. Write your final report to `.agent-notes/<ID>.md` in the worktree and
    return it: commits; Java -> ours (file:line); rows before -> after;
    probe Σ per commit; risers + mechanism; re-slots; not done + why. No preamble.
