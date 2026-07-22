# T5 — Implementation (attempt 4, hard-barred)

## Locked inputs

T4's paper-gate artifact (predicted bboxes + intermediates + edit
list). G6 journal rows describe attempts 1-3 (all reverted); the pure
`FrontierCalculator` port + tests are ALREADY COMMITTED
(`src/diagrams/state/state-composite-frontier.ts`, commit 60fe88a) —
wire, don't duplicate.

## Task

1. Re-apply the attempt-3 implementation with T4's spec deltas:
   `addClusters` `${id}ee`/`${id}i`/rank-subgraph branch (rank
   subgraphs on the cluster's OWN handle, names never matching
   `/^cluster/i`), seam fields, FrontierCalculator/
   `manageEntryExitPoint` wiring in `state-composite-geo.ts`, gate
   change + `innerMarginLevels` force-disable (protection0/1=false)
   + D4's `<<O-O>>` stereoLines exclusion in
   `state-composite-cluster.ts`. `${id}i`/`${id}ee` KEEP their
   cluster-prefixed names (they ARE clusters). Upstream names +
   `@see` citations throughout.
2. Unit tests: rank-branch structure; i-wrapper condition
   (`isGroupTouched`, NOT `needsZaentPoint`); `<<O-O>>` exclusion;
   regression lock asserting rank-subgraph names never match
   `/^cluster/i` (issue-08 lock).
3. Measure the 3 targets via box extraction vs oracle: each must hit
   T4's prediction. ANY miss → full revert (G5 protocol) → report →
   PERMANENT stop (README cond. 7). Do not tune.
4. Full gates: `npm test && npm run typecheck && npm run lint &&
   npm run build`; 57 pins byte-identical; DOT parity 268/268;
   size-backlog tighten-only.

## Write-set

`src/core/graph-layout-build.ts`, `src/core/graph-layout.types.ts`,
`src/diagrams/state/state-composite-geo.ts`,
`src/diagrams/state/state-composite-cluster.ts`,
`src/diagrams/state/state-composite-frontier.ts` (wiring exports),
`src/diagrams/state/state-composite-pass-types.ts` (types only),
`tests/unit/state/*`. (Backlog/pins belong to T6.)

## Acceptance criteria

- Given the 3 targets, when box-measured, then each hits T4's
  prediction exactly.
- Given the suite, when run, then all gates green with zero
  ratchet/backlog movement.

## Boundaries

No tuning constants; never touch `insideAutonomPass` or side-margin
logic beyond the specified force-disable; no git mutations; probes
deleted.
