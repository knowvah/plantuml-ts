# T1d: class-arrow-triangle-head

Return only the structured report: commit sha(s), files changed, per-row
render-diff structural/numeric before → after, residuals with mechanisms (Java +
port `file:line`), write-set extensions, test counts. No preamble.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at `~/git/plantuml`
(branch `dot-output`, upstream `97a5992`) is the specification. Read `CLAUDE.md`
first ("READ THE JAVA FIRST", "Never fit a value", "Do not refactor while porting",
"Preserve upstream names"). The oracle is the 1.2026.8beta1 jar; caches at
`test-results/dot-cache/<tree>/<slug>/in.svg`. Row mechanisms: `fixtures.md`
(cdd5 + T0d columns) and `diagnosis/verify.md`.

## Task (TDD)
`A -->> B` must parse as a class link with `LinkDecor.ARROW_TRIANGLE`
(`decoration/LinkDecor.java:87`: `ARROW_TRIANGLE(decors1("<<"), decors2(">>"), 10,
true, 0.8)`); the port's `class-relationship-parser.ts:116` `HEAD2_CHARS` lacks `>>`,
so class refuses and xuloxo routes DESCRIPTION (c4/gikaju likewise). Port the head
through the arrow grammar, the decor map and the arrowhead renderer mapping; read
`CommandLinkClass.java`'s regex for both directions (`<<--`).

## Rows
- `unknown/xuloxo-85-vibu502` (class-head-arrow-triangle)

## Write-set
- `src/diagrams/class/class-relationship-parser.ts`
- `src/diagrams/class/class-arrow-grammar.ts`
- `src/diagrams/class/class-arrow-decor-map.ts`
- `src/diagrams/class/class-relationship-decor-ast.ts`
- `src/diagrams/class/renderer-arrowhead.ts`
- their unit tests under `tests/`

## Read-set
`CommandLinkClass.java`, `LinkDecor.java:60-110`, `ExtremityFactory*` for ARROW_TRIANGLE.

## Interface contracts
none.

## Acceptance
- Given `A -->> B` and `A <<-- B`, then class parses them with ARROW_TRIANGLE and draws the jar's head.
- Given xuloxo, then it routes CLASS (report the rest of its diff: the `$bl()` half is T1e's).
## Architecture decisions (locked)
`decisions.md` D1–D12; this task leans on D7. dot-engine is off limits.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over the tests
covering changed modules plus: `tests/unit/class/`, `tests/oracle/svg-conformance/class.golden.ratchet.test.ts`, `tests/oracle/class-dot-parity.test.ts`, `description.golden.ratchet.test.ts`, `state.golden.ratchet.test.ts`, `object.golden.ratchet.test.ts`, `sequence.diff-baseline.ratchet.test.ts`, `activity.diff-baseline.ratchet.test.ts`, `activity.style-baseline.test.ts`, `activity.text-baseline.test.ts` (non-class movement: report it with the mechanism, never re-pin), `tests/oracle/svg-conformance/routing-conformance.test.ts`, `refusal-coverage.test.ts` (`--testTimeout=600000`) (report the collected file count). `npm run
typecheck`; `npx eslint <changed files>`. No full `npm test`. New src module ⇒
`npm run catalog` and commit `docs/catalog.md`. Complexity hook: ≤30 NLOC per
function, CCN ≤10, ≤5 params, ≤500-line files. Worktree rules: README "Execution
rules" (absolute worktree paths; no Serena edit tools; no `git stash`).

## Boundaries
- Always: quote the Java before claiming parity; cite `file:line` on every ported
  symbol (`@see`) and constant.
- Stop and report (do not edit): a needed file outside the write-set (beyond a pure
  type/file-cap move), or Java that contradicts the stated mechanism.
- Never: fit a value, touch the oracle or dot-engine, push.

## Commit
`fix(<scope>): <what, lowercase, ≤72 chars>`, one per family; body with mechanism,
upstream citation, rows moved. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
