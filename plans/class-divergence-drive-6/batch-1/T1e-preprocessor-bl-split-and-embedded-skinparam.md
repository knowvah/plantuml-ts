# T1e: preprocessor-bl-split-and-embedded-skinparam

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

## Task (TDD) — shared preprocessor, every engine (D7)
1. **`$bl()` split.** C4's `$defineSkinparams` emits several skinparam blocks on one
   output line joined by `$bl()` (`%breakline()`); upstream splits that line before
   collecting (`BlockUml.java:153` `Jaws.mutateExpands1`, `jaws/Jaws.java:65+`); the
   port's `StyleAndSkinparamCollector` (`src/core/preprocessor.ts:306-308`) reads it
   unsplit (instrumented: key `rectangle<<person>>` held `…}skinparam database<<person>> {…`).
2. **Embedded skinparam.** A `skinparam` inside a `{{ }}` embed must apply to the
   nested diagram only (dezobu: outer background turns `#CCCCFF`; rozugu: the nested
   block leaks into the outer element). Read how upstream isolates the embedded
   block (`EmbeddedDiagram.java`, `BodyEnhanced2.java:91-94`).

## Rows
- `unknown/dezobu-62-vuzu421` (embedded-skinparam-hoisted)
- `unknown/rozugu-82-pera583` (embedded-block-skinparam-leak)

## Write-set
- `src/core/preprocessor.ts`
- `src/core/preprocessor-collector.ts`
- their unit tests under `tests/`

## Read-set
cdd5 journal rows 82, 77; `.agent-notes/cdd5-T5d.md`; `BlockUml.java`, `jaws/Jaws.java`, `EmbeddedDiagram.java`.

## Interface contracts
none.

## Acceptance
- Given a C4 `$defineSkinparams` source, then each skinparam block is collected as its own key.
- Given dezobu and rozugu, then the outer document keeps its own background/skinparams.
- Given all engines' ratchets, then every movement is reported with its mechanism (C4 fixtures are expected to move).
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
