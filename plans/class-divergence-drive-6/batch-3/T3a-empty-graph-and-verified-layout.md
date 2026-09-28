# T3a: empty-graph-and-verified-layout

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
1. jititi: an empty graph returns 0x0 (`src/core/graph-layout.ts:318-320`); upstream
   still runs graphviz and `svek/SvekResult.java:130-135` returns
   `minMax.getDimension().delta(15, 15)` (21x21 for `class A / class B / remove *`,
   oracle-checked in cdd5 T5d).
2. (Amended at T0e.) T0d verified that neither the json 1px rows nor zasuxe is a
   dot-engine or `graph-layout.ts` defect (real `dot` = dot-engine on both DOTs):
   json 1px is a class ink rule (re-slotted to T2b) and zasuxe is the class engine's
   cluster `nodeIds` order (re-slotted to T3d). This task owns jititi only.

## Rows
- `unknown/jititi-15-maxe512` (empty-graph-svek-dimension)

## Write-set
- `src/core/graph-layout.ts`
- their unit tests under `tests/`

## Read-set
`diagnosis/verify.md`; cdd5 journal row 82.

## Interface contracts
none.

## Acceptance
- Given jititi, then the canvas is 21x21.
- Given bizasu/meramo/momada/zasuxe, then each follows T0d's verdict (fixed, or filed with evidence).
## Architecture decisions (locked)
`decisions.md` D1–D12; this task leans on D1, D12. dot-engine is off limits.

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
