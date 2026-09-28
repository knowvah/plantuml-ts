# T3e: link-middle-decor-and-nested-renders

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
1. link middle decor (sejube): cdd5 S2 `link-middle-decor-partial`.
2. Nested-render gaps behind desc-embed rows (per T0d): josebu's nested sequence
   `queue "<$sprite>"` is drawn as text (`src/diagrams/sequence/renderer-participant-symbol.ts`,
   `USymbolQueue#asSmall(getTextBlock())`); tefeco's nested description `note right:`
   is not opale (`src/diagrams/description/parse-state.ts:370-380` vs
   `GraphvizImageBuilder.java:245-249` `setOpaleLine`). These are non-class engine
   files: report every movement in those engines (D7).

## Rows
- `unknown/sejube-03-bote542` (link-middle-decor-partial)

## Write-set
- `src/diagrams/class/class-layout-edge-labels.ts`
- `src/diagrams/class/class-edge-note-box.ts`
- `src/diagrams/class/renderer-arrowhead-middle.ts`
- `src/diagrams/sequence/renderer-participant-symbol.ts`
- `src/diagrams/description/parse-state.ts`
- their unit tests under `tests/`

## Read-set
cdd5 journal row 72; `diagnosis/verify.md`.

## Interface contracts
none.

## Acceptance
- Given sejube, then it is conformant or its residual is stated.
- Given josebu and tefeco, then their nested images match the jar's size (or the residual is stated).
- Given the sequence and description ratchets, then movements are reported with mechanisms.
## Architecture decisions (locked)
`decisions.md` D1–D12; this task leans on D7. dot-engine is off limits.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over the tests
covering changed modules plus: `tests/unit/class/`, `tests/oracle/svg-conformance/class.golden.ratchet.test.ts`, `tests/oracle/class-dot-parity.test.ts`, `description.golden.ratchet.test.ts`, `state.golden.ratchet.test.ts`, `object.golden.ratchet.test.ts`, `sequence.diff-baseline.ratchet.test.ts`, `activity.diff-baseline.ratchet.test.ts`, `activity.style-baseline.test.ts`, `activity.text-baseline.test.ts` (non-class movement: report it with the mechanism, never re-pin) (report the collected file count). `npm run
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
