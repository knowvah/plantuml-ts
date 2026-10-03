# T2h — jupoxe-15-sugo110 axis drift (exact `Direction.fromVector`)

Agent: typescript-pro, worktree `add2-T2h`. Added after T2e (journal row 31).

## Context
After T2e fixed the `endnote` closer, jupoxe-15-sugo110 builds its real
content (3 `if`s, 2 `repeat` loops) and `snake-merge-worm.ts#directionOf`
throws "not a horizontal or vertical line": two points differ by 2.84e-13 in
x (`1421.58125` vs `1421.5812500000002`). `directionOf` mirrors
`utils/Direction.java:110-130` (exact equality) and must stay exact: T1b
(journal row 23) found the same class — our code summed
`(x + childOffsetX) + hook.x` where Java resolves the local round-trip first
(`FtileAssemblySimple.java:132-140`, `FtileGeometry.java:77-82,149-156`).
Read `.agent-notes/T1b-snake-merge.md` (the AXIS_EPSILON section).

## Task
Instrument: find the two points, the two code paths (file:line) that compute
them, and the Java's arithmetic for that coordinate; regroup ours to the
Java's order. No tolerance. Then sweep for the same grouping pattern in every
walker (it will recur) and fix each instance the same way, citing the Java.

## Write-set
`src/diagrams/activity/layout/{tile-coordinates,walk-*,swimlane-*,snake-merge*}.ts`
EXCEPT `walk-if-down.ts` (T2c). If the origin is in a T2c or T2g file, stop and report.

## Acceptance
- jupoxe renders (no throw); `compress/invariant.test.ts` green; directionOf exact.
- 0 unexplained risers; pinned goldens byte-equal.
