# T2c: degenerate-ensurevisible-and-container-ink

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

## Task (TDD, D4)
1. The jar's degenerate canvas follows `SvgGraphics.java:129-133,757-758`
   `ensureVisible` on each text baseline ((int)(43.889+1) = 44 for rupigu/vabobu);
   `degenerateClassifierDims` (`class-geo-builders.ts`) consumes the LimitFinder-style
   `symbolInk` (`LimitFinder.java:217-225`) and gets 46. Add an ensureVisible extent
   beside `symbolInk`, used only by the degenerate path.
2. Empty `usymbol { }` containers (beboke, febuli, fezaro): apply T0d's verified
   mechanism (which builder draws them and where the ink diverges).

## Rows
- `unknown/rupigu-89-xabo757` (circle-interface-ink-y)
- `unknown/vabobu-24-temi990` (circle-interface-ink-y)
- `unknown/beboke-62-zofu377` (empty-usymbol-container-ink)
- `unknown/febuli-89-dusi249` (empty-usymbol-container-ink)
- `unknown/fezaro-08-nopo877` (empty-usymbol-container-ink)

## Write-set
- `src/diagrams/class/class-geo-builders.ts`
- `src/diagrams/class/class-layout-leaf-shapes.ts`
- `src/diagrams/class/class-container.ts`
- their unit tests under `tests/`

## Read-set
`.agent-notes/cdd5-T4a-circle-interface-ink-gap.md`; cdd5 journal row 84; `diagnosis/verify.md`.

## Interface contracts
none.

## Acceptance
- Given rupigu and vabobu, then svg height equals 44.
- Given beboke, febuli and fezaro, then the canvas equals the jar's (or T0d's residual is stated).
## Architecture decisions (locked)
`decisions.md` D1–D12; this task leans on D4. dot-engine is off limits.

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
