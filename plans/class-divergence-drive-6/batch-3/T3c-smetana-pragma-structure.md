# T3c: smetana-pragma-structure

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

## Task (TDD, D8 — structure only)
`!pragma layout smetana` changes how edges are drawn (`net/atmp/CucaDiagram.java:480-481`,
`net/sourceforge/plantuml/sdot/SmetanaEdge.java:215-217`); the port ignores the pragma
(`class-command-directives.ts:159-164`). Port the structural effect (draw path,
element order, emitted elements). Never tune a number toward Smetana's arithmetic;
a remaining numeric-only diff is done (structural-match).

## Rows
- `unknown/fakone-16-boro774` (smetana-pragma-ignored)
- `unknown/japode-92-famo984` (smetana-pragma-ignored)
- `unknown/tikiti-02-bagu049` (smetana-pragma-ignored)
- `unknown/xagomi-49-caki729` (smetana-pragma-ignored)

## Write-set
- `src/diagrams/class/class-command-directives.ts`
- `src/diagrams/class/ast.ts`
- `src/diagrams/class/renderer-edge.ts`
- `src/diagrams/class/renderer-group.ts`
- their unit tests under `tests/`

## Read-set
cdd5 S2 diagnosis `smetana-pragma-ignored`; CLAUDE.md "One layout engine".

## Interface contracts
none.

## Acceptance
- Given fakone, japode, tikiti, xagomi, then structural diffs are 0 (numeric residue journaled as the accepted delta).
## Architecture decisions (locked)
`decisions.md` D1–D12; this task leans on D8. dot-engine is off limits.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over the tests
covering changed modules plus: `tests/unit/class/`, `tests/oracle/svg-conformance/class.golden.ratchet.test.ts`, `tests/oracle/class-dot-parity.test.ts` (report the collected file count). `npm run
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
