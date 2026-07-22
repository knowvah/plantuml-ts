# T5 — Pin sweep: byte-compare and pin the batch-2 targets

## Prior observations

G5 C7's "why 0 new pins" analysis: every eligible cluster fixture
carried at least one of (a) the vertical residual (fixed by T2),
(b) the class-attr gap (fixed by T3), (c) decede's style cascade
(fixed by T4). With all three landed, the 4 targets should reach
byte-exact zero-diff.

## Context

plantuml-ts oracle ratchet system. Pinned goldens live under
`oracle/goldens/state/`; the size backlog is
`oracle/goldens/state/size-backlog.json`; the parity harness is
`tests/oracle/state-dot-parity.test.ts`.

## Task

1. Byte-compare rendered output vs jar oracle for
   `gojuja-90-pune699`, `decede-10-buvu414`, `cakaxu-97-nexe753`,
   `fevida-60-kope208`.
2. For each zero-diff fixture: pin the golden (follow the existing
   pinning procedure evident in `tests/oracle/state-dot-parity.test.ts`
   + goldens layout) and REMOVE its size-backlog entry.
3. For each non-zero fixture: name the residual mechanism in the
   decision journal (measured attribute-level diff, not "still
   differs"), and tighten its backlog entry to the new measured delta.
4. Opportunistic sweep (push-forward): byte-compare the wider
   84-fixture cluster set; pin any additional fixture that reaches
   zero-diff; tighten every improved backlog entry. Report the count.
5. Update batch/README checkboxes and record new censuses.

## Write-set

`oracle/goldens/state/*` (new pins),
`oracle/goldens/state/size-backlog.json` (removals + tightenings),
`plans/g6-cluster-geometry/` (checkboxes, journal).

## Read-set

`tests/oracle/state-dot-parity.test.ts` (pinning procedure);
G5 ledger §C7 "why 0 new pins" section.

## Acceptance criteria

- Given the 4 targets, when byte-compared, then each is either pinned
  (and its backlog entry removed) or has a journaled, named residual
  mechanism with a tightened entry.
- Given the sweep, when size-backlog is written, then no entry is
  wider than before (widen-none bar).
- Given `npm test`, then all ratchets, census floors, and the DOT gate
  are green with the new pins active.

## Quality bar

`npm test && npm run typecheck && npm run lint && npm run build` green.

## Boundaries

Pins must be byte-exact — never pin a near-miss; never widen; no git
mutations.

## Observability / Rollback

The pin count + backlog shrink are the metrics. Reversible.
