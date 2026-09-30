# Shared preamble (prepend to every batch-1 / batch-2 agent prompt)

Return only the structured report: commit sha(s), files changed, per-row
render-diff structural/numeric before → after, residuals with mechanisms (Java +
port `file:line`), write-set extensions, non-class movers with mechanisms, test
counts (collected file count included). No preamble, no trailing summary.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at `~/git/plantuml`
(branch `dot-output`) is the specification. Read `CLAUDE.md` first ("READ THE JAVA
FIRST", "Never fit a value", "Do not refactor while porting", "Preserve upstream
names"). The oracle is the 1.2026.8beta1 jar; caches at
`test-results/dot-cache/<tree>/<slug>/in.svg` and `svek-N.dot`. Row mechanisms:
`plans/class-divergence-drive-7/fixtures.md` (`cdd6 mechanism`, `cdd6 row`) and
the cited rows of `plans/class-divergence-drive-6/decision-journal.md`. Grep
`src/main/java/net/`, never only `net/sourceforge/plantuml/`.

Measure a row with `npx jiti plans/class-divergence-drive/tools/render-diff.mts
<tree>/<slug>` (structural/numeric counts). Render an oracle probe only with
`scripts/oracle-render.sh <out-dir> <puml>`.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over the
tests covering changed modules plus: `tests/unit/class/`,
`tests/oracle/svg-conformance/class.golden.ratchet.test.ts`,
`tests/oracle/class-dot-parity.test.ts`, `description.golden.ratchet.test.ts`,
`state.golden.ratchet.test.ts`, `object.golden.ratchet.test.ts`,
`sequence.diff-baseline.ratchet.test.ts`, `activity.diff-baseline.ratchet.test.ts`,
`activity.style-baseline.test.ts`, `activity.text-baseline.test.ts`,
`mindmap` ratchet (report the collected file count — a filter can collect zero).
Non-class movement: report it with the mechanism; re-pin only what your task spec
names (D7). `npm run typecheck`; `npx eslint <changed files>`. No full `npm test`.
New src module ⇒ `npm run catalog` and commit `docs/catalog.md`. Complexity hook:
≤30 NLOC per function, CCN ≤10, ≤5 params, ≤500-line files. Worktree rules:
absolute worktree paths; no Serena edit tools; no `git stash`.

## Boundaries
- Always: quote the Java before claiming parity; cite `file:line` on every ported
  symbol (`@see`) and constant.
- Stop and report (do not edit): a needed file outside the write-set (beyond a pure
  type/file-cap move), or Java that contradicts the stated mechanism (D1: report the
  corrected mechanism; do not re-diagnose past your 2-fix budget).
- Never: fit a value, touch the oracle or dot-engine or the plantuml fork, push,
  sign an acceptance, change a public API.

## Commit
`fix(<scope>): <what, lowercase, ≤72 chars>`, one per family; body with mechanism,
upstream citation, rows moved. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
