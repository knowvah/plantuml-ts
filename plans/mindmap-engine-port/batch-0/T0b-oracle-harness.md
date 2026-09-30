# T0b: mindmap oracle harness

Return only the structured report: commit sha(s), files changed, per-check or per-fixture
before → after, residuals with mechanisms (Java + port `file:line`), write-set extensions,
test counts (collected files). No preamble.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at `~/git/plantuml`
(`src/main/java/net/sourceforge/plantuml/`) is the specification. Read `CLAUDE.md` first
("READ THE JAVA FIRST", "Never fit a value", "Do not refactor while porting", "Preserve
upstream names"). The oracle is the 1.2026.8beta1 jar (`oracle/dist/plantuml-oracle.jar`);
mindmap goldens are cached at `test-results/dot-cache/mindmap/<slug>/in.svg`. Render new
oracles only via `scripts/oracle-render.sh <out-dir> <puml>`. Jar values for tests come
from the T0c probes (`plans/mindmap-engine-port/tools/probe/`), never from guesses.
Brief: `plans/mindmap-engine-port/` (README, decisions.md D1–D12).

## Task (TDD)
1. `tests/oracle/svg-conformance/render-fixture-mindmap.ts`: render a fixture's `in.puml`
   through the production `renderSync` with the measurer the survey uses
   (`scripts/svg-parity-survey.ts` render call) and the fixture include/asset store, like
   `render-fixture-sequence.ts`.
2. `mindmap.diff-baseline.ratchet.test.ts`: mirror `sequence.diff-baseline.ratchet.test.ts`
   (weightedScore never rises above the pin; `diffCount` informational; `errored` rows
   carry `status: "error"` + reason). Manifest `oracle/goldens/svg-mindmap/diff-baseline.json`
   seeded from a fresh measurement: today every non-jar-error row is `error` (unknown
   diagram type, `src/core/dispatcher.ts` error sentinel); jar-error rows marked as such.
3. `mindmap.golden.ratchet.test.ts`: mirror `class.golden.ratchet.test.ts`; ratchet
   `oracle/goldens/svg-mindmap/ratchet.json` with 0 pins; include a pin tool path note
   (pinning is orchestrator-only at closes).
4. A manifest-shape test: rows = the 142 cached slugs (collected-count style check).

## Write-set
- `tests/oracle/svg-conformance/render-fixture-mindmap.ts`
- `tests/oracle/svg-conformance/mindmap.diff-baseline.ratchet.test.ts`
- `tests/oracle/svg-conformance/mindmap.golden.ratchet.test.ts`
- `oracle/goldens/svg-mindmap/{diff-baseline.json,ratchet.json,README.md}`

## Read-set
`tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts`,
`render-fixture-sequence.ts:75-100`, `class.golden.ratchet.test.ts`,
`scripts/svg-parity-survey.ts` (render call), `compare.ts` (`compareSvg`, `weightedScore`).

## Interface contracts
`renderFixtureMindmap(markup: string, measurer: StringMeasurer, options?: { includeStore?, assetStore? }): string`
— consumed by T5a and every close.

## Acceptance
- Given the empty golden ratchet, then it passes with 0 pins.
- Given the diff-baseline with every row `error`, then it passes today.
- Given a fixture, then the helper renders through `renderSync` with the survey's measurer.

## Architecture decisions (locked)
D7, D8, D10.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over the three new test files
(report the collected file count). `npm run typecheck`; `npx eslint <changed files>`;
`npx prettier --check <changed files>`. No full `npm test`. New src module ⇒ `npm run
catalog` and commit `docs/catalog.md`. Complexity hook: ≤30 NLOC per function, CCN ≤10,
≤5 params, ≤500-line files (split along upstream boundaries). Worktree rules: README
"Execution rules" (absolute worktree paths; no Serena edit tools; no `git stash`).

## Boundaries
- Always: quote the Java before claiming parity; `@see` the Java origin on every ported
  symbol and a `file:line` on every constant; keep upstream names.
- Stop and report (do not edit): a needed file outside the write-set (beyond a pure
  type/file-cap move or a small unported helper on this path that no other task owns),
  or Java that contradicts the stated mechanism or a D-decision.
- Never: fit a value, touch the oracle jar/cache, dot-engine or the fork, push, edit the
  flat `StyleMap` or any existing engine's style resolution.

## Commit
`test(mindmap): add the oracle harness and empty baselines`: conventional, lowercase, ≤72 chars, one per task; body with the Java
cited and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (new files; revert the commit).
