# T3b: mainframe-svek-normalization

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
With `mainframe M`, the jar draws class `a` at body-local (1, 8) where the port uses
(7, 7): `SvekResult.calculateDimension` is the only caller of
`clusterManager.moveDelta(6 - minX, 6 - minY)` (`svek/SvekResult.java:130-135`), and
the mainframe path (`core/DiagramChromeFactory.java:278-337`,
`klimt/shape/BigFrame.java:80-90`) bypasses it. Port the normalization per T0d's
verified mechanism (cdd5 S4 `mainframe-svek-unnormalized`, controlled jar experiment).

## Rows
- `unknown/miveni-64-rexo238` (mainframe-svek-unnormalized)
- `unknown/rivino-95-midu088` (mainframe-svek-unnormalized)
- `unknown/soseka-43-riru110` (mainframe-svek-unnormalized)

## Write-set
- `src/core/klimt/shape/big-frame.ts`
- `src/core/annotations/chrome.ts`
- `src/diagrams/class/layout-ink-extent.ts`
- `src/index.ts`
- their unit tests under `tests/`

## Read-set
cdd5 S4 diagnosis family note (`plans/class-divergence-drive-5/diagnosis/S4-style.md`); `diagnosis/verify.md`.

## Interface contracts
none (no public API change: stop 12).

## Acceptance
- Given miveni, rivino, soseka, then each is conformant or its residual is stated.
- Given every engine's ratchet, then mainframe fixtures in other engines are reported (chrome is shared).
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
