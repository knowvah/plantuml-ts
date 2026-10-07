# T1c — cross-lane connectors (D2)

Agent: typescript-pro, worktree `add3-T1c`. Rules: [../common-rules.md](../common-rules.md).

## Task
For each MISSING `drawTranslate` in T1a's census, add a `LoopTranslate` kind +
route (`layout/swimlane-loop-translate*.ts`, dispatched from
`swimlane-placement.ts#routeEdge`), tag the push site, and port the geometry
1:1: `FtileIfWithLinks.java:149-174,238-286` ConnectionHorizontalThenVertical /
VerticalThenHorizontal incl. their direction-flip detour snakes;
`FtileRepeat.java:432-459,480-535` ConnectionBackBackward1/2 (side decided from
TRANSLATED coordinates — `.agent-notes/T3f.md`); `FtileIfLongHorizontal`
out connector; `FtileWhile` cross-lane variants. Each kind cites its Java.

## Write-set
`layout/swimlane-placement.ts`, `layout/swimlane-loop-translate*.ts`,
`layout/walk-{if-with-links,if-long-horizontal,repeat-backward,while-backward,while-branch}.ts`,
`activity-geometry.types.ts`, their tests.

## Acceptance
- Each census XLANE row: cross-lane connector points = jar (or residual named).
- Single-lane diagrams byte-identical; 224 pins byte-equal; 0 unexplained risers.
- Any class neither ported nor absorbable = stop 12.
Observability: N/A. Rollback: Reversible.
