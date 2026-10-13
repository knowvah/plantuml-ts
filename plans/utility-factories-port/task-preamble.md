# Shared preamble (prepend to every agent prompt, after the worktree header)

Return only the structured report:
- commit sha(s) and files changed
- per-row render-diff structural/numeric before → after (where rows can move)
- residuals with mechanisms (Java + port `file:line`)
- write-set extensions
- non-utility movers with mechanisms
- test counts, including the collected file count

No preamble, no trailing summary.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at `~/git/plantuml` is the
specification. Read `CLAUDE.md` first ("READ THE JAVA FIRST", "Never fit a value", "Do not
refactor while porting", "Preserve upstream names"). Brief: `plans/utility-factories-port/`
(README, decisions.md D1–D12). The oracle is the 1.2026.8beta1 jar; the 17 in-scope corpus
oracles are cached at `test-results/dot-cache/unknown/<slug>/{in.puml,in.svg}`
(`plans/utility-factories-port/fixtures.md`). Render new oracles only with
`scripts/oracle-render.sh <out-dir> <puml>`; jar values in tests come from such probes or the
cache, never from guesses. Grep `src/main/java/net/`, never only `net/sourceforge/plantuml/`.

Port layout (D1): one TS file per Java file in the upstream package's home, upstream names,
`@see` on every symbol, `file:line` on every constant. Draw through the existing klimt port
(`src/core/klimt/`: `UGraphic`, `TextBlock`, `UTranslate`, `ULine`, `UImage`, creole `Display`),
the ported base classes (`UgDiagram`, `UgSimpleDiagram`, `PlainStringsDiagram`, T0c) and
`singleLinePlugin` (T0c). A missing klimt/core piece beyond those pre-declared is stop 10:
report it, do not re-implement it locally.

## Quality bar
- **TDD:** failing test first, with specific values from the Java or a jar probe.
- Tests mirror the source path under `tests/unit/` (one test file per source file).
- Targeted run: `npx vitest run --maxWorkers=4 <your test dirs> tests/architecture`; report the
  collected file count (a filter can collect zero).
- `npm run typecheck` MUST pass before `git commit`; `npx eslint <changed files>`; `npx prettier
  --write <changed files>`. New src module ⇒ `npm run catalog`, commit `docs/catalog.md`.
- Coverage of your new files ≥ 90% lines/branches/functions.
- Complexity hook: ≤30 NLOC per function, CCN ≤10, ≤5 params, ≤500-line files (split along the
  Java's own seams; journal it).
- **Determinism:** no `Math.random`/`Date.now` in rendering; render each corpus row three times
  and assert identical output in a test.
- **Worktree rules:** work only in your worktree with absolute paths; **no Serena edit tools**;
  no `git stash`; never `cd` below the repo root; never `npm install`. The 4 npm-pack packaging
  tests fail in worktrees — ignore them.

## Boundaries
- **Always:** quote the Java before claiming parity.
- **Stop and report (do not edit):** a needed file outside the write-set (beyond a pure type or
  file-cap move); Java that contradicts the stated contract or a D-decision.
- **Never:** fit a value; touch the oracle, dot-engine or the fork; push; sign an acceptance;
  change a public API; edit `oracle/goldens/**`, `*.ratchet.test.ts`, routing/refusal baselines
  or `src/index.ts` registration (orchestrator / T2a) unless the task file names them.

## Commit
`feat(<pkg>): <what, lowercase, ≤72 chars>` (or `test(...)`/`fix(...)`/`feat(core)` for a
pre-declared core piece); body names the Java ported and what the tests pin. No attribution.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (revert).
