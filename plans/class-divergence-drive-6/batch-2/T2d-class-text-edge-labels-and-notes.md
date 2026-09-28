# T2d: class-text-edge-labels-and-notes

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
1. Edge labels are creole (kexaba sprite label, rimeca): `svek/SvekEdge.java:298-299`
   vs `class-edge-label-measure.ts:112`, `renderer-edge-label.ts:145-156`.
2. Class note text alignment (fukegu, logavi): `svek/image/EntityImageNote.java:112`,
   `style/FromSkinparamToStyle.java:178` vs `renderer-note.ts`.
3. Class note tables (colede): the bespoke table path vs upstream creole tables
   (`renderer-note-lines.ts`, `note-layout-measure-rows.ts`).

## Rows
- `unknown/kexaba-26-kobu577` (edge-label-not-creole)
- `unknown/rimeca-17-gice904` (edge-label-not-creole)
- `unknown/fukegu-14-zona532` (class-note-text-alignment-unported)
- `unknown/logavi-03-mita108` (class-note-text-alignment-unported)
- `unknown/colede-79-give418` (class-note-table-bespoke)

## Write-set
- `src/diagrams/class/class-edge-label-measure.ts`
- `src/diagrams/class/renderer-edge-label.ts`
- `src/diagrams/class/class-edge-label-attach.ts`
- `src/diagrams/class/renderer-note.ts`
- `src/diagrams/class/renderer-note-lines.ts`
- `src/diagrams/class/note-layout-measure.ts`
- `src/diagrams/class/note-layout-measure-rows.ts`
- their unit tests under `tests/`

## Read-set
cdd5 S1/S2 diagnosis sections for each row (`plans/class-divergence-drive-5/diagnosis/`).

## Interface contracts
none.

## Acceptance
- Given each row, then it is conformant or its residual is stated with a mechanism.
- Given the class ratchet, then no pin is lost.
## Architecture decisions (locked)
`decisions.md` D1–D12; this task leans on —. dot-engine is off limits.

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
