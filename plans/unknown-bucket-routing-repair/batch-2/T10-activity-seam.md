# T10 — fix the activity seam

## Context
plantuml-ts ports PlantUML; dispatch is parse-attempt over a frozen plugin
order (`src/core/dispatcher.ts:317-342`, D1). Batch 1 diagnosed every
`unknown`-bucket disagreement; the rows assigned to you are the
`fix-candidate` rows whose `seam` is `activity` — the orchestrator lists them in
this file's **Fixtures** section below, with each row's diagnosis
(`diagnosis/TN.md`) naming the upstream Command and the mechanism. Expected inputs: activity3 sources our activity parser refuses (T2). The legacy `(*) -->` family is NOT expected here (pin, D2) unless T2's diagnosis found a small subset.

## Fixtures
_(orchestrator fills in: slug · jar type · ours before · mechanism · diagnosis
note § · upstream cite · expected landing)_

## Task
For each mechanism (not each fixture): write the failing test first (a
unit test beside the parser/probe you change, using the fixture's exact
refusing line), port the upstream behaviour faithfully (keep upstream names;
do not refactor around it; no widening — D9), then re-measure EVERY fixture of
the mechanism through the gates' seams and confirm it LANDS on the jar's type
(D3). Then re-measure the existing tree: `npx vitest run
tests/oracle/svg-conformance/routing-conformance.test.ts
tests/oracle/svg-conformance/refusal-coverage.test.ts` must stay green with
zero `[CHANGED]` lines; `[FIXED]` lines are welcome and must be listed in
your return (they are pins this batch will retire). Flip each resolved row in
your ledger fragment(s) to `disposition: "fixed"`; a row you could not fix
within D2 becomes `known-misroute`/`known-gap` with the reason from its
diagnosis (journal-worthy; say so). Run `npm run parity:dashboard` only if
you touched a committed artifact it reads (you should not).

## Write-set
`src/diagrams/activity/**`, its unit tests, and ONLY the ledger fragment files listed in
`batch-2/overview.md` for T10.

## Read-set
`plans/unknown-bucket-routing-repair/{decisions.md,diagnosis/*.md}` (the
sections for your rows); the upstream `Command` classes cited there (read the
`executeArg`/regex bodies); `src/core/dispatcher.ts:250-350`; the parser you
change; `plans/routing-heuristic-repair/decisions.md#d2` and `#d3`.

## Architecture decisions
D1, D2, D3, D4 (you own your fragment rows), D9.

## Interface contracts
Ledger rows flipped to `fixed` (or to a pin with reason) — consumed by T14.

## Acceptance criteria
1. Given each mechanism's exemplar refusing line, when the new unit test
   runs before the fix, then it fails; after, it passes.
2. Given every fixture assigned to this task, when re-measured through the
   gates' seams, then `ourType` equals the jar's type and `weErrored` is
   false (or the row is a pin with a reason).
3. Given the existing tree, when both gates run, then zero `[CHANGED]`
   lines and no existing `agree`/`ok` row fails (stop 4 otherwise).
4. Given the fragment(s), when parsed, then no row of this task is still
   `fix-candidate`.
5. Given `npm run typecheck`, `npm run lint` and the changed test files
   under vitest, then all exit 0 with at least one file collected.

## Observability
N/A — the two gates are the instrument.

## Rollback
Reversible (revert the task commit).

## Quality bar
Hook limits; every ported function carries a JSDoc `@see` to its Java origin;
TDD as above; full `npm test` is the orchestrator's batch gate, not yours.

## Boundaries
- Always: judge by landing (D3); re-run both gates over the existing tree.
- Never: reorder plugins (D1); widen a claim (D9); edit another seam (stop
  8 — report it instead); touch the baselines or `test-results/`.

## Commit
`fix(ubrr-T10): <mechanism summary> in the activity seam` — body lists the fixtures
that now land and any `[FIXED]` retirements.
