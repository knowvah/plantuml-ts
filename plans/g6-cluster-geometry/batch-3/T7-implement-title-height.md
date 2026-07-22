# T7 — Implement the title-height formula; relax the lineCount gate

## Prior observations

Read `batch-3/title-height-derivation.md` (T6's output) FIRST. It is
locked: formula, relaxable eligibility conditions, per-fixture
predictions.

## Context

plantuml-ts state clusters; Decision D2. The implementation site is
`src/diagrams/state/state-composite-cluster.ts`:
`measureClusterTitle` (line ~37), the `CLUSTER_TITLE_TABLE_HEIGHT`
constant (line 96), and the `titleTableEligible` conjunction
(lines 289-293).

## Task

1. Replace the constant with T6's formula (computed per cluster from
   `measureClusterTitle`'s output + action/stereotype line counts).
   Preserve upstream names where the formula mirrors jar symbols; cite
   jar origins in doc comments (`@see` convention).
2. Relax `titleTableEligible` exactly as T6's doc authorizes (at
   minimum `lineCount === 1`; nothing beyond what it names). The
   `hasBorderPointChildren` and `insideAutonomPass` conjuncts are
   UNTOUCHABLE in this task (batch 4 / out-of-scope respectively).
3. Unit tests: single-line reduces to old value; multi-line,
   action-text, stereotype cases match T6 predictions.
4. Re-measure: (a) the 132/134 single-line verified set must be
   byte-identical; (b) newly-eligible multi-line/stereotype fixtures
   box-measured vs oracle — heights must match; (c) size-backlog:
   tighten improved entries, widen none; pin any fixture reaching
   byte-exact zero-diff.

## Write-set

`src/diagrams/state/state-composite-cluster.ts`,
`tests/unit/state/layout.test.ts`,
`oracle/goldens/state/size-backlog.json`,
`oracle/goldens/state/*` (pins if any).

## Read-set

`batch-3/title-height-derivation.md`; `decisions.md#d2`;
`state-composite-cluster.ts:34-100, 273-360`.

## Acceptance criteria

- Given the 132/134 verified single-line set, when re-rendered, then
  byte-identical output.
- Given each newly-eligible fixture, when box-measured, then header
  height matches T6's prediction (mismatch → stop; the derivation was
  incomplete — journal, do not tune).
- Given the corpus sweep, then backlog only tightens; census floors
  hold; DOT gate exact.

## Quality bar

`npm test && npm run typecheck && npm run lint && npm run build` green.

## Boundaries

No tuning constants to make fixtures pass (D2); do not touch
`hasBorderPointChildren`/`insideAutonomPass` conjuncts; no git
mutations.

## Observability / Rollback

Backlog tightenings + pins are the metric. Reversible (git revert; the
G5 full-revert protocol applies if the formula fails re-measurement).
