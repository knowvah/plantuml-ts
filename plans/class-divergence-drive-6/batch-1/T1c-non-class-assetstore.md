# T1c: non-class-assetstore

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

## Task (TDD, D6)
1. For each of state, sequence, activity, json, yaml, hcl: `plugin.parse` reads
   `options.assetStore` (ParseOptions) and passes it to `createSpriteRegistry`
   exactly as `src/diagrams/class/parser.ts:317-318` and
   `src/diagrams/description/index.ts:59-67` do (`internalSpriteStoreFrom` /
   `internalEmojiStoreFrom`). cdd5 T3 located every drop point (`.agent-notes/cdd5-T3-assetstore-gap.md`).
2. Then forward the store in `tests/oracle/svg-conformance/render-fixture-{state,sequence,activity,json}.ts`
   and at the census call sites (`scripts/svg-conformance-census.ts` ~lines 289–299).
3. kokofa: `state-json-commands.ts` refuses a duplicate json id like class does
   ("JSON already exists", `CommandCreateJson.java:141-142`), so the dispatcher no
   longer renders a STATE box; the jar's crash page stays an accept-candidate.

## Rows
- `unknown/kokofa-47-deni140` (json-duplicate-state-fallthrough)

## Write-set
- `src/diagrams/state/index.ts`
- `src/diagrams/state/parser.ts`
- `src/diagrams/state/state-json-commands.ts`
- `src/diagrams/sequence/index.ts`
- `src/diagrams/sequence/parser.ts`
- `src/diagrams/sequence/sequence-parse-helpers.ts`
- `src/diagrams/activity/index.ts`
- `src/diagrams/activity/parser.ts`
- `src/diagrams/json/index.ts`
- `src/diagrams/json/parser.ts`
- `src/diagrams/yaml/parser.ts`
- `src/diagrams/hcl/parser.ts`
- `tests/oracle/svg-conformance/render-fixture-state.ts`
- `tests/oracle/svg-conformance/render-fixture-sequence.ts`
- `tests/oracle/svg-conformance/render-fixture-activity.ts`
- `tests/oracle/svg-conformance/render-fixture-json.ts`
- `scripts/svg-conformance-census.ts`
- their unit tests under `tests/`

## Read-set
`.agent-notes/cdd5-T3-assetstore-gap.md`; `src/diagrams/class/parser.ts:300-330`; `src/diagrams/description/index.ts:55-70`.

## Interface contracts
none.

## Acceptance
- Given a `jar:archimate/...` sprite in each engine, when rendered with the store, then the sprite element is present; without it, absent.
- Given kokofa, then `renderSync` returns the class error page (not a STATE box) and routing/refusal messages are reported.
- Given the non-class ratchets, then every movement is reported with its mechanism (expected: gains only).
## Architecture decisions (locked)
`decisions.md` D1–D12; this task leans on D6, D7. dot-engine is off limits.

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
