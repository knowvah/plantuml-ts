# Rules every agent prompt carries (paste first)

1. **NO Serena MCP tools AT ALL, read or write — not one call.** They resolve to the
   MAIN checkout, not your worktree; add2/add3 agents corrupted main this way.
2. Work only in your worktree; every path starts with it; `.agent-notes/` means
   `<worktree>/.agent-notes/`.
3. No `git stash` in any form; WIP commits only.
4. No raw `&` background jobs; foreground vitest with modest file sets; never the full
   `npm test`. Keep each command short; surveys one engine per command, foreground.
5. Never edit `oracle/goldens/**`, baseline JSONs or cached oracle bytes (orchestrator only).
6. Java at `~/git/plantuml/src/main/java` is the spec (grep `src/main/java/net/`): quote
   `file:line` for every mechanism and constant; no tolerances, no fitted values. Read the
   method body AND the constructor that built its inputs; verify every brief claim.
   JSDoc `@see` on ported symbols; upstream names.
7. Stay in your write-set; anything else: stop and report (mechanism + owner).
8. Files <= 500 lines; functions <= 30 NLOC / CCN <= 10 / <= 5 params (hook).
9. Commits: Conventional Commits, lines <= 80, no attribution footer, one per mechanism,
   each green on targeted tests + `npm run typecheck` + eslint.
10. Measure probe Σ + element census before/after each commit; every riser needs an
    element-census-backed mechanism; never trade information-carrying output (a dropped
    note, label, connector) for score. After each commit run the golden ratchet,
    harness-parity and the style/text/swimlane census tests; report every census mover
    and whether it equals the pin's `jar` column.
11. Any `src/core/**` edit: all-engine survey before AND after (`npm run -s svg:survey --
    <e> --out <dir>/parity-<e>.json`, one engine per command), `engdiff.py`; any
    conformant loss = stop.
12. Oracle renders only via `scripts/oracle-render.sh <out-dir> <puml>`.
13. Final report to `<worktree>/.agent-notes/add4-<ID>.md` (commit it) and return it:
    commits; Java -> ours (file:line); rows before -> after; probe Σ per commit; risers +
    mechanism; census movers; not done + why. No preamble.
