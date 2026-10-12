# Shared preamble (prepend to every batch-0..5 agent prompt, after the worktree header)

Return only the structured report:
- commit sha(s) and files changed
- per-row render-diff structural/numeric before → after (where rows can move)
- residuals with mechanisms (Java + port `file:line`)
- write-set extensions
- non-wbs movers with mechanisms
- test counts, including the collected file count

No preamble, no trailing summary.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at `~/git/plantuml` is the
specification; the wbs package is `src/main/java/net/sourceforge/plantuml/wbs/` (15 files).
Read `CLAUDE.md` first ("READ THE JAVA FIRST", "Never fit a value", "Do not refactor while
porting", "Preserve upstream names"). Brief: `plans/wbs-engine-port/` (README,
decisions.md D1–D12). The oracle is the 1.2026.8beta1 jar (`oracle/dist/plantuml-oracle.jar`);
wbs oracles are cached at `test-results/dot-cache/wbs/<slug>/{in.puml,in.svg}` (204 rows).
Render new oracles only with `scripts/oracle-render.sh <out-dir> <puml>`; jar values in tests
come from such probes or the cache, never from guesses. Grep `src/main/java/net/`, never only
`net/sourceforge/plantuml/`.

Port layout (D1): `src/diagrams/wbs/<File>.ts` — one TS file per Java file, upstream names,
`@see` on every symbol, `file:line` on every constant. Draw through the existing klimt port
(`src/core/klimt/`: `UGraphic`, `TextBlock`, `TextBlockMemoized`, `UTranslate`, `ULine`,
creole `Display`), the activity ftile box (`FtileBoxOld.createWbs`, D3), the style engine
(`src/core/style/`, `StyleBuilder.getMergedStyleSpecial`) and the mindmap port's precedents
(`src/diagrams/mindmap/{Idea,IdeaShape,index}.ts`). A missing klimt/ftile/style piece is
stop 10: report it, do not re-implement it in wbs.

## Quality bar
- **TDD:** failing test first, with specific values from the Java or a jar probe.
- Tests live in `tests/unit/wbs/` (one test file per source file).
- Targeted run: `npx vitest run --maxWorkers=4 tests/unit/wbs` plus any test touching a
  file you changed; report the collected file count (a filter can collect zero).
- `npm run typecheck`; `npx eslint <changed files>`; `npx prettier --write <changed files>`
  (hooks run in the worktree too, `.husky/_` is linked). New src module ⇒ `npm run catalog`,
  commit `docs/catalog.md`.
- Coverage of your new files ≥ 90% lines/branches/functions.
- Complexity hook: ≤30 NLOC per function, CCN ≤10, ≤5 params, ≤500-line files.
- **Worktree rules:** work only in your worktree with absolute paths; **no Serena edit
  tools** (they write the main checkout); no `git stash`; never `cd` below the repo root;
  never `npm install` (node_modules is a symlink). The 3 npm-pack packaging tests fail in
  worktrees — ignore them.

## Boundaries
- **Always:** quote the Java before claiming parity.
- **Stop and report (do not edit):** a needed file outside the write-set (beyond a pure
  type or file-cap move); Java that contradicts the stated contract or a D-decision.
- **Never:** fit a value; touch the oracle, dot-engine or the fork; push; sign an
  acceptance; change a public API; edit `oracle/goldens/**` or `*.ratchet.test.ts`
  (orchestrator-only) unless the task file names them.

## Commit
`feat(wbs): <what, lowercase, ≤72 chars>` (or `test(wbs)`/`fix(wbs)`/`feat(core)` for a
pre-declared core piece); body names the Java ported and what the tests pin. No attribution.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (revert).
