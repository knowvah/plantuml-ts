# T1p-e — switch cross-swimlane connections

Agent: typescript-pro, worktree `add2-T1p-e`. Rules: [common.md](common.md).

## Task
Port `FtileSwitchWithManyLinks.java`
`ConnectionHorizontalThenVerticalCrossSwimlane` (297-351) and
`ConnectionVerticalThenHorizontalCrossSwimlane` (352-end), and whatever in
`FtileSwitchWithManyLinks`/`FtileSwitchWithOneLink` selects them (swimlane
state). Our switch walking lives in `layout/tile-coordinates.ts`'s
`'gtile-switch'` case — extract it into a new `layout/walk-switch.ts` first
(no behaviour change, its own commit), then port. Find corpus fixtures with
`switch` across swimlanes; author fixtures where none exist.

## Write-set
`src/diagrams/activity/layout/tile-coordinates.ts`,
`src/diagrams/activity/tiles/gtile-switch.ts`,
`src/diagrams/activity/switch-dispatch.ts`, new `layout/walk-switch.ts` and
other new files, their tests, `tests/fixtures/activity/T1p-e/**`.

## Acceptance
- Cross-lane switch fixtures: connector geometry matches the jar's.
- Single-lane switch output byte-identical (probe Σ unchanged for rows
  without cross-lane switches).
