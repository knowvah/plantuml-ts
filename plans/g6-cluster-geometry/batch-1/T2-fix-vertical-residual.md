# T2 — Fix the vertical residual at its origin

## Prior observations

Read T1's journal entry FIRST — it supplies `mechanism`,
`fixLocation`, `formula`, and per-fixture `coverage`. Treat it as
locked. If you discover a conflicting constraint, stop and journal;
do not override.

## Context

Same repo context as T1 (see `batch-1/T1-diagnose-vertical-residual.md`
Context section). Decision D1 (`plans/g6-cluster-geometry/decisions.md`)
pre-authorizes both fix paths.

## Task

Implement T1's stated formula at the stated origin:

**Path A — fixLocation 'seam':** apply the vertical computation in
`src/core/graph-layout-build.ts` (alongside the existing
`innerMarginLevels` side-margin application), adding any seam fields
to `DotInputCluster` in `src/core/graph-layout.types.ts` with doc
comments citing the jar/C origin (`@see` convention). Set values in
`src/diagrams/state/state-composite-cluster.ts` if a per-cluster
input is needed.

**Path B — fixLocation 'graphviz-ts':** file the finding under
`docs/graphviz-issues/` (self-contained: finding, census impact,
minimal DOT repro, evidence pointer) + one TRACKER.md checklist line;
implement the fix in `../graphviz-ts` (separate repo — mirror its
own conventions); build + pin the new `.tgz`; bump the
`package.json` pin here; check the tracker box only after fixtures
re-measure clean.

Then, on either path:
1. Unit tests for the new computation
   (`tests/unit/state/layout.test.ts`).
2. Corpus re-measure: the 84-fixture width set must stay exact
   (zero regressions); heights on T1's measured set must close per
   T1's `coverage` predictions.
3. `oracle/goldens/state/size-backlog.json`: tighten every improved
   entry to its new measured delta. Widen NONE — if any entry needs
   widening, revert in full (G5 protocol) and STOP.

## Write-set

Path A: `src/core/graph-layout-build.ts`,
`src/core/graph-layout.types.ts`,
`src/diagrams/state/state-composite-cluster.ts` (only if a per-cluster
input is required), `tests/unit/state/layout.test.ts`,
`oracle/goldens/state/size-backlog.json`.
Path B: `docs/graphviz-issues/*` (new file + TRACKER.md),
`package.json` + lockfile (pin bump), `tests/unit/state/layout.test.ts`,
`oracle/goldens/state/size-backlog.json`; plus `../graphviz-ts`
(external repo — its own commit, per its own conventions).

## Read-set

T1's journal entry; `decisions.md#d1`; the files T1 cites as origin;
`docs/graphviz-issues/TRACKER.md` (format precedent, Path B only).

## Acceptance criteria

- Given the fix, when the 84-fixture width set re-measures, then
  width is exact with zero regressions.
- Given T1's measured fixture set, when heights re-measure, then each
  closes to T1's predicted value (deviations → stop, the mechanism
  was incomplete).
- Given the corpus sweep, when size-backlog re-measures, then improved
  entries are tightened and none widened.
- Given `npm test`, then DOT gate stays frozen exact and no census
  floor shrinks.
- Path B only: given the tracker, then the issue file exists and its
  box is checked only after clean re-measurement on the new .tgz.

## Quality bar

`npm test && npm run typecheck && npm run lint && npm run build` all
green before finishing.

## Boundaries

- Do not modify side-margin logic (innerMarginLevels mechanism is
  final) except to sit new code beside it.
- Never widen a backlog entry; never touch `insideAutonomPass`.
- No git mutations (orchestrator commits; Path B's graphviz-ts commit
  is also orchestrator-run).

## Observability

The tightened size-backlog entries + unchanged census/DOT gates ARE
the instrumentation. No new observable operations.

## Rollback

Reversible. Path A: git revert. Path B: revert pin bump + lockfile
(library commit stays upstream, harmless).
