# Rules every agent prompt carries (paste first)

1. **NO Serena MCP tools AT ALL, read or write — not one call.** They resolve to
   the MAIN checkout, not your worktree.
2. Work only in your worktree; every path starts with it; `.agent-notes/` means
   `<worktree>/.agent-notes/`.
3. No `git stash` in any form; WIP commits only.
4. No raw `&` background jobs; foreground vitest with modest file sets and
   `--maxWorkers=4`; never the full `npm test`. Surveys one engine per command,
   foreground.
5. Never edit `oracle/goldens/**`, baseline JSONs, census JSONs, cached oracle
   bytes or `DIVERGENCES.md` (orchestrator only — report the exact text).
6. Java at `~/git/plantuml/src/main/java` is the spec (grep `src/main/java/net/`):
   quote `file:line` for every mechanism and constant; no tolerances, no fitted
   values. Read the method body AND the constructor that built its inputs;
   verify every brief claim — the brief states measurements to re-take, not
   conclusions. Graphviz C is at `~/git/graphviz/`. JSDoc `@see` on ported
   symbols; upstream names.
7. Mirror the jar's output exactly (CLAUDE.md). Render the jar first via
   `scripts/oracle-render.sh <out-dir> <puml>` and mirror THAT. Author jar
   fixtures under `tests/fixtures/lgm-<ID>/` with a test comparing ours to the
   jar render.
8. Stay in your write-set; anything else: stop and report (mechanism + owner).
9. Files <= 500 lines; functions <= 30 NLOC / CCN <= 10 / <= 5 params (hook).
10. Commits: Conventional Commits, lines <= 80, no attribution footer, one per
    mechanism, each green on targeted tests + `npm run typecheck` + eslint.
11. Any `src/core/**` edit: all-engine survey before AND after (`npm run -s
    svg:survey -- <e> --out <dir>/parity-<e>.json`, one engine per command,
    engines = `tests/oracle/svg-conformance/parity-*.json`), then
    `python3 plans/large-group-mirror/measurements/engdiff.py <before> <after>`;
    any conformant loss = stop. Report every pinned ratchet row that moves
    (falls for re-pin; rises with mechanism) and any element-count move.
12. Scratch files ONLY under `/private/tmp/claude-501/lgm-<ID>/`.
13. Final report to `<worktree>/.agent-notes/lgm-<ID>.md` (commit it) and return
    it: commits; Java -> ours (file:line); fixtures before -> after; engdiff;
    ratchet movers; exact DIVERGENCES.md text; not done + why. No preamble.
