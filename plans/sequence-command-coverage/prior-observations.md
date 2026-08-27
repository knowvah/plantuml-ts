# Prior observations — read before any measurement

Measured findings from earlier missions that bear on this write-set. All High
confidence, whole-population measurements rather than samples. Sources are in
`.agent-notes/` and the project memory.

## 1. `weightedScore` is not comparable across a change that grows our document

`.agent-notes/T13-sequence-ratchet-rise-diagnosis.md`

`compareNodes`' three short-circuits charge `units(actual) + units(expected)`
(`compare.ts:198,229,404`). That makes `weightedScore` monotone in alignment
**for a fixed pair of documents**, and NOT comparable across time when our side
changes size — the same "still mismatched" verdict costs strictly more once
`units(actual)` grows.

Worked example, `sequence/bexoce-95-vibe195`: baseline 622, live 950, and the
entire delta is one diff — `svg/g[1][childCount]` went from `actual=14
expected=59` to `actual=60 expected=59`. We went from emitting 14 of the
golden's 59 children to emitting 60 — off by one instead of by 45 — and the
score rose by 328.

Across all 242 risers in that mission: 162 moved CLOSER (98.6% of total rise),
35 moved FURTHER (0.5%), 22 unchanged, 23 had no top-level childCount
short-circuit. **This is what D5 exists to adjudicate.**

## 2. Any `renderSync` measurement needs the store AND the measurer

`.agent-notes/T1-routing-measurement-hazards.md`

- `renderSync` refuses `!include` when `options.includeStore` is absent
  (`src/index.ts:213`) and returns `errorSvg` — a document with **no**
  `data-diagram-type`. A measurement reading that attribute records a
  *resolution* failure as a *routing* answer of `NONE`. Measured: 90
  disagreements with no store, 79 with
  `tests/helpers/fixture-include-store.ts`.
- `resolveMeasurer` defaults to `CanvasMeasurer`, unimplemented under jsdom;
  layout failures then become `errorSvg`, another false `NONE`. Pass
  `DeterministicMeasurer` explicitly.
- Routing itself is measurer-independent — the whole corpus scores identically
  under either. This is a harness hazard, not a signal.

## 3. vitest hides `console.log` from passing tests

Same note. `npx vitest run <file>` with stdout redirected prints none of the
ratchet's `[IMPROVED]` / `[PROMOTION READY]` or the gates' `[FIXED]` /
`[REFUSAL SLI]` lines. Use `--reporter=default` or `--reporter=verbose`.
**Never conclude a branch did not fire from a redirected run.**

## 4. `compareSvg`'s diff count is not monotonic

Project memory `comparesvg-count-not-monotonic`. Three short-circuits each cost
1. Read `sequence-oracle-harness` decisions.md D5 before trusting any diff
count as a fidelity signal. `diffCount` is informational in
`diff-baseline.json` and is never gated; `weightedScore` is the gated quantity.

## 5. Exo arrows previously rendered by accident

`.agent-notes/T13-sequence-ratchet-rise-diagnosis.md`, "The exo-arrow trade".
Before the endpoint token was tightened to upstream's `PART1CODE` =
`([%pLN_.@]+)`, `\S+` let an endpoint swallow the bracket and invent a
participant named `[`. Fifteen exo fixtures drew a **wrong** diagram instead of
refusing; ten now reach an error page. Jar-verified both ways: `C-->B` declares
exactly B and C, and `A->oB` really does declare `oB` (the `o`/`x` decoration
is `[%s][ox]` — it needs the space).

**Consequence for T7/T12/T13**: any loosening of `PART1CODE` back toward `\S+`
silently reintroduces this. It is on-call risk 3 in the brief.

## 6. Subagent claims have been wrong before

Project memory `verify-agent-claims-si31`. Confident mechanism claims in
subagent reports were disproved by measurement in SI31. Verify a scope or
mechanism claim against the code before repeating it — yours or an agent's.

## 7. A measured limit from the dev box is a claim about the dev box

Project memory `catalog-ci-budget-correction`, `confounded-wall-clock-readings`.
Poll uptime and Spotlight daemons before trusting any timing number. `npm test`
runtime is advisory, not a gate (`npm-test-ceiling-advisory`).
