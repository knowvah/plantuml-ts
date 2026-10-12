# Shared preamble (prepend to every batch-1..5 agent prompt)

Return only the structured report:
- commit sha(s) and files changed
- per-row render-diff structural/numeric before → after (where rows can move)
- residuals with mechanisms (Java + port `file:line`)
- write-set extensions
- non-salt movers with mechanisms
- test counts, including the collected file count

No preamble, no trailing summary.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at `~/git/plantuml` is the
specification; the salt package is `src/main/java/net/sourceforge/plantuml/salt/`
(`salt/`, `salt/element/`, `salt/factory/`). Read `CLAUDE.md` first ("READ THE JAVA FIRST",
"Never fit a value", "Do not refactor while porting", "Preserve upstream names"). Brief:
`plans/salt-engine-port/` (README, decisions.md D1–D9). The oracle is the 1.2026.8beta1 jar
(`oracle/dist/plantuml-oracle.jar`); salt oracles are cached at
`test-results/dot-cache/salt/<slug>/{in.puml,in.svg}`. Render new oracles only with
`scripts/oracle-render.sh <out-dir> <puml>`; jar values in tests come from such probes or the
cache, never from guesses. Grep `src/main/java/net/`, never only `net/sourceforge/plantuml/`.

Port layout (D1): `src/diagrams/salt/<File>.ts`, `src/diagrams/salt/element/<File>.ts`,
`src/diagrams/salt/factory/<File>.ts` — one TS file per Java file, upstream names, `@see` on
every symbol, `file:line` on every constant. Draw through the existing klimt port
(`src/core/klimt/`: `UGraphic`, `TextBlock`, `UTranslate`, `ULine`, `URectangle`, `UPolygon`,
creole, fonts) and `ISkinSimple` (`src/core/style/ISkinSimple.ts`). A missing klimt/sprite
piece is stop 10: report it, do not re-implement it in salt.

## Quality bar
- **TDD:** failing test first, with specific values from the Java or a jar probe.
- Tests live in `tests/unit/salt/` (mirror the source sub-directories).
- Targeted run: `npx vitest run --maxWorkers=4 tests/unit/salt` plus any test touching a
  file you changed; report the collected file count (a filter can collect zero).
- `npm run typecheck`; `npx eslint <changed files>`; `npx prettier --write <changed files>`
  (git hooks do not run in worktrees). New src module ⇒ `npm run catalog`, commit
  `docs/catalog.md`.
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
  acceptance; change a public API.

## Commit
`feat(salt): <what, lowercase, ≤72 chars>` (or `test(salt)`/`fix(salt)`); body names the
Java ported and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (revert).
