# Shared preamble (prepend to every batch-1/2/3 agent prompt)

Return only the structured report:
- commit sha(s) and files changed
- per-row render-diff structural/numeric, before → after
- residuals with mechanisms (Java + port `file:line`)
- write-set extensions
- non-class movers with mechanisms
- test counts, including the collected file count

No preamble, no trailing summary.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at `~/git/plantuml`
is the specification. Read `CLAUDE.md` first, in particular "READ THE JAVA FIRST",
"Never fit a value", "Do not refactor while porting" and "Preserve upstream names". The
oracle is the 1.2026.8beta1 jar, with caches at
`test-results/dot-cache/<tree>/<slug>/{in.puml,in.svg,svek-N.dot}`. Row mechanisms are
in `plans/class-divergence-drive-8/fixtures.md`, and locked decisions in
`plans/class-divergence-drive-8/decisions.md`. Grep `src/main/java/net/`, never only
`net/sourceforge/plantuml/`.

Measure a row with `npx jiti plans/class-divergence-drive/tools/render-diff.mts
<tree>/<slug>`. Render an oracle probe only with
`scripts/oracle-render.sh <out-dir> <puml>`.

## Quality bar
- **TDD:** failing test first, with specific values.
- **Targeted tests:** run `npx vitest run` over the tests covering changed modules,
  plus:
  - `tests/unit/class/`
  - `tests/oracle/svg-conformance/class.golden.ratchet.test.ts`
  - `tests/oracle/class-dot-parity.test.ts`
  - the description, state and object golden ratchets
  - `sequence.diff-baseline.ratchet.test.ts`
  - the activity ratchets
  - the mindmap ratchets

  Report the collected file count: a filter can collect zero.
- **Non-class movement:** report it with its mechanism. Re-pin only what your task
  names.
- **Checks:** `npm run typecheck` and `npx eslint <changed files>`. No full `npm test`.
- **Catalog:** a new src module means running `npm run catalog` and committing
  `docs/catalog.md`.
- **Complexity hook:** ≤30 NLOC per function, CCN ≤10, ≤5 params, ≤500-line files.
- **Worktree rules:** use absolute worktree paths; **no Serena edit tools** (memory:
  they write the main checkout); no `git stash`; never `cd` below the repo root.

## Boundaries
- **Always:** quote the Java before claiming parity; cite `file:line` on every ported
  symbol (`@see`) and constant.
- **Stop and report (do not edit):**
  - when a needed file is outside the write-set, beyond a pure type or file-cap move
  - when the Java contradicts the stated mechanism; report the corrected mechanism
    rather than re-diagnosing past your 2-fix budget
- **Never:**
  - fit a value
  - touch the oracle, dot-engine or the plantuml fork
  - push
  - sign an acceptance
  - change a public API beyond D2's additions

## Commit
`fix(<scope>): <what, lowercase, ≤72 chars>`, or `feat(...)` for new capability.
The body gives the mechanism, the upstream citation and the rows moved. No
attribution lines.

**Observability:** N/A, no new observable operations. **Rollback:** Reversible.
