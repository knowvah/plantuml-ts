# Shared preamble (prepend to every agent prompt, after the worktree header)

The worktree header names: the worktree path from `measurements/mkwt.sh Tn`, the branch `codd/Tn`,
and the base sha.

Return only the structured report, and ALSO write it to `<worktree>/Tn-report.md`, because a resumed
agent's second report can be lost ([[subagent-handback-single-shot]]):
- commit sha(s) and files changed
- per named fixture: render-diff structural/numeric before → after
  (`npx jiti plans/class-divergence-drive/tools/render-diff.mts <tree>/<slug>`), plus layoutParity
  where layout can move
- the diagnosis artifact for each mechanism: mechanism, origin `file:line` (Java + port), causal
  chain, ruled out
- residuals with mechanisms, and write-set extensions
- test counts, including the collected file count

No preamble, no trailing summary.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at `~/git/plantuml` is the
specification. Read `CLAUDE.md` first: "READ THE JAVA FIRST", "Never fit a value", "Mirror the jar's
output exactly", "Do not refactor while porting", "Preserve upstream names".

- Brief: `plans/component-divergence-drive/` (README, decisions.md D1–D8, fixtures.md).
- Background: `.agent-notes/dsw-findings.md`, `.agent-notes/dsw-T7.md`.
- The jar's DOT and SVG for every fixture are `test-results/dot-cache/<tree>/<slug>/{svek-1.dot,in.svg}`.
- Render a new oracle only with `scripts/oracle-render.sh <out-dir> <puml>`.
- Grep `src/main/java/net/`, never only `net/sourceforge/plantuml/`.
- Description engine: `src/diagrams/description/` (`layout.ts`, `layout-dot-tree.ts`,
  `renderer-cluster.ts`, `renderer-entity*.ts`, `description-cluster-header.ts`).
- Key Java:
  - `svek/Cluster.java` (`drawU` from `:298`; the kermor notes are `:302-307`)
  - `svek/ClusterDotString.java`
  - `svek/SvekResult.java` / `svek/GeneralImageBuilder.java` (canvas, margins)
  - `decoration/symbol/USymbol*.java`, especially `USymbolFolder.java:228`
  - `klimt/drawing/svg/SvgGraphics.java`

## D8 — before any layout-side edit
For a fix touching layout geometry, edges, labels or cluster boxes:
1. Read the fixture's family in `docs/graphviz-issues/TRACKER.md` and `measurements/tracker-ledger.md`.
2. Run native `dot -Tdot` on the cached `svek-1.dot` and compare it with our builder dump or with
   layoutParity.
3. If dot-engine is to blame: stop and report (stop 11). Do not work around it.
4. Never draw a package title at the engine's `cluster.label` position. It draws at
   `USymbolFolder.java:228` `UTranslate(4, 2)` (TRACKER #14).

## Quality bar
- **TDD:** write the failing test first. Its values come from the jar SVG/DOT or a jar probe, never
  from guesses.
- Tests mirror the source path under `tests/unit/`.
- Targeted run: `npx vitest run --maxWorkers=4 <your test files> tests/architecture`. Report the
  collected file count; a filter can collect zero.
- Before `git commit`:
  - `npm run typecheck`
  - `npx eslint <changed files>`
  - `npx prettier --write <changed files>`
  - if you added a src module, `npm run catalog`
- New files need ≥ 90% coverage of lines, branches and functions.
- Complexity hook limits: ≤30 NLOC per function, CCN ≤10, ≤5 params, ≤500-line files.
- Before reporting, run the D5 guards whenever you touched `src/core/**`.

## Worktree rules
- Work only in your worktree, using absolute paths.
- **No Serena edit tools.** They write the MAIN checkout ([[agents-write-main-via-serena]]).
  Serena read tools are fine.
- No `git stash`. Never `cd` below the repo root. Never `npm install`.
- The 4 npm-pack packaging tests fail in worktrees; ignore them.

## Boundaries
- **Always:** quote the Java (`file:line`) before claiming parity. Every constant carries its
  citation. State the mechanism before the edit.
- **Stop and report (do not edit):**
  - a needed file outside the write-set
  - Java that contradicts a D-decision
  - a core origin that the task's spec did not anticipate. Report it, and the orchestrator applies D5.
- **Never:**
  - fit a value
  - touch the oracle, dot-engine or the fork
  - push
  - sign an acceptance
  - edit `oracle/goldens/**`, `*.ratchet.test.ts`, `census-*.json`, `parity-*.json`,
    routing/refusal baselines or `docs/parity-report.md`, unless the task file names them

## Commit
`fix(description): …`, `feat(description): …` or `fix(core): …`, lowercase, ≤72 chars. The body
names the Java ported, the mechanism, and what the tests pin. No attribution lines.

**Observability:** N/A for code tasks; measurement is the close's job.
**Rollback:** Reversible (revert).
