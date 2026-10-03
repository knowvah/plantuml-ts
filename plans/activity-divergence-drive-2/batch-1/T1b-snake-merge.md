# T1b — snake merge port (D1, D2)

Agent: typescript-pro, worktree `add2-T1b`. Commits per mechanism:
`feat(activity): …` / `fix(activity): …`.

## Context
`decisions.md#D1-D2` and T1a's `measurements/connection-census.md` (your
interface input — every strategy assignment cites the Java line it records).

## Task
0. Re-check T1a's §1 MISSING list against the code after batch 1p; any site
   still MISSING is stop 12. Re-verify the two flagged sites (FtileIfWithLinks
   ConnectionVerticalOut, FtileWhile ConnectionOutSpecial) and test the
   FtileGroup scope boundary in isolation (T1a merge case F was confounded).
1. `ActivityEdgeGeo.mergeable: 'FULL' | 'LIMITED' | 'NONE'` (default FULL) and
   whatever text/decoration flags `Snake.merge` reads.
2. NEW `src/diagrams/activity/layout/snake-merge.ts`: pure port of
   `UGraphicForSnake.addPendingSnake` (merge into the first pending snake that
   accepts), `PendingSnake.merge`, `Snake.merge` (`Snake.java:303-327`),
   `Worm.merge(other, strategy)`, `removeEndDecorationIfTouches` +
   `cannotBeTouched`, in edge draw order, one scope per `Swimlanes` and a nested
   scope per group/partition (`FtileGroup`). Unit tests per Java branch.
3. Set strategies at T1a's push sites; run the merge before `compressGeometry`
   (`assign-coordinates-full.ts`); renderer, `compress/shapes-of.ts` and
   `canvas-origin.ts` consume merged edges.
4. Reproduce every T1a merge case byte-for-byte against the jar (unit/oracle).

## Write-set
`src/diagrams/activity/activity-geometry.types.ts`,
`src/diagrams/activity/layout/snake-merge.ts` (NEW),
`src/diagrams/activity/layout/{tile-coordinates,walk-if-down,walk-if-with-links,
walk-if-long-horizontal,walk-while-branch,walk-while-backward,walk-repeat,
walk-repeat-backward,walk-fork-branches,assign-coordinates-full,canvas-origin}.ts`,
`src/diagrams/activity/layout/compress/shapes-of.ts`,
`src/diagrams/activity/renderer.ts`, their tests, new tests.

## Acceptance
- Given journal row 14's six break-in-repeat rows (cixave, dacuga, mudobi,
  bizono, dixiku, doziki), then their extra weld-join arrowheads/lines are gone.
- Given becaje-01-vaji284, bocaga-53-nale241, jecoxu-17-zama003, then the
  duplicate line + arrowhead is gone (element counts equal the jar's).
- Given a LIMITED or NONE site, then its snakes never fuse past the Java rule.
- Given the 67 pinned goldens, then byte-equal (stop 6 otherwise).
- Given the full corpus, then "extra line+arrow" rows fall from 99 (report the
  new census) and every riser has a mechanism from the diff.

Quality bar: targeted vitest (`tests/diagrams/activity`, `tests/unit/activity`,
activity golden/diff-baseline/harness-parity tests,
`tests/diagrams/activity/layout/compress/invariant.test.ts`) + typecheck +
eslint. Files ≤ 500 lines; functions ≤ 30 NLOC / CCN ≤ 10. No Serena, no stash.
Observability: N/A. Rollback: Reversible.
