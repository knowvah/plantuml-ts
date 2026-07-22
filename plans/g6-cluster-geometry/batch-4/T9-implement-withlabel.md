# T9 — Port the WithLabel sizing; widen the border-point gate

## Prior observations

Read `batch-4/withlabel-derivation.md` (T8's output) FIRST — locked:
sizing formulas, DOT rank-chain shape, gate change, predicted bboxes.

## Context

plantuml-ts state clusters; Decision D5 (jar port only, upstream names
preserved, `@see` citations on every ported symbol).

## Task

1. Implement the border-point port-block sizing per T8's doc:
   sizing terms in `state-composite-sizing.ts` (or the location T8's
   symbol map names), DOT rank-chain emission in
   `state-dot-graph.ts`, and the `titleTableEligible` change in
   `state-composite-cluster.ts` (exactly T8's specified change to the
   `hasBorderPointChildren` conjunct — nothing else in the
   conjunction; `insideAutonomPass` stays untouchable).
2. Unit tests: border-point sizing terms; the emitted DOT shape for a
   minimal entry/exit fixture; gate behavior (border-point cluster now
   eligible, non-border-point behavior unchanged).
3. Re-measure: pesita's `AA` bbox must match T8's prediction (not
   merely "bigger than 36×36"); the batch-1/2/3 fixture sets must stay
   byte-identical/exact; size-backlog tighten-only.

## Write-set

`src/diagrams/state/state-composite-cluster.ts`,
`src/diagrams/state/state-composite-sizing.ts`,
`src/diagrams/state/state-dot-graph.ts`,
`tests/unit/state/` (nearest existing files),
`oracle/goldens/state/size-backlog.json`.
(If T8's symbol map names a different/new file, stop and journal —
write-set change needs orchestrator approval per README cond. 1.)

## Read-set

`batch-4/withlabel-derivation.md`; `decisions.md#d5`;
`state-composite-cluster.ts:273-360`; the jar files T8 cites (for
faithful naming while porting).

## Acceptance criteria

- Given pesita, when `AA` is box-measured, then its bbox equals T8's
  predicted value.
- Given T8's ≥2 additional family fixtures, when measured, then each
  matches its prediction (any mismatch → stop, derivation incomplete).
- Given all prior batches' fixture sets, when re-measured, then zero
  regressions; backlog tighten-only; DOT gate exact; census floors
  hold.

## Quality bar

`npm test && npm run typecheck && npm run lint && npm run build` green.

## Boundaries

No approximation, no tuning (D5); `insideAutonomPass` untouchable; no
git mutations.

## Observability / Rollback

Reversible; G5 full-revert protocol if predictions fail.
