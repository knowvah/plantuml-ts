# T1p-f — switch BIG_DIAMOND per-lane case draw

Agent: typescript-pro, worktree `add2-T1p-f` (wave 2). Rules: [common.md](common.md).

## Context (verified by orchestrator, journal row 8)
`FtileSwitchWithDiamonds.drawU` (`vcompact/cond/FtileSwitchWithDiamonds.java:131-145`):
in `Mode.BIG_DIAMOND` it calls `tile.drawU(ug.apply(...))` directly on every
case tile instead of `ug.draw(tile)`, so the swimlane membership gate
(`vcompact/UGraphicInterceptorOneSwimlane.java` `draw`) never sees them, and
`Swimlanes` draws the whole tree once per lane (`Swimlanes.java:328-343`) — every
case tile is emitted once per lane. `mode` is chosen at
`FtileSwitchWithDiamonds.java:73-90` (BIG_DIAMOND when `w9 == 0`). The jar's
output in `tests/fixtures/activity/T1p-e/switch-cross-swimlane.svg` shows it.
Preserve it (CLAUDE.md: information-carrying output is kept even when it looks
like a bug). Read `.agent-notes/T1p-e-switch-cross-swimlane.md` first.

## Task
Port `Mode` + the BIG_DIAMOND draw: our node pipeline in
`swimlane-placement.ts#placeSwimlanes` is 1:1 (`nodes.map(shiftNode)`); mirror
the jar's per-lane re-emission for exactly the tiles the jar draws ungated,
in the jar's draw order. Mirror the Java's structure rather than special-casing
the output. Check which corpus switch fixtures are BIG_DIAMOND with
swimlanes (mojezi-43-gamu360, ruzazu-94-meso880 are cross-lane switches).

## Write-set
`src/diagrams/activity/layout/{swimlane-placement,walk-switch}.ts`,
`src/diagrams/activity/tiles/gtile-switch.ts`, new files, their tests,
`tests/fixtures/activity/T1p-f/**`.

## Acceptance
- The T1p-e fixture: the case boxes appear once per lane, as in the jar.
- Switches without swimlanes, or in SMALL_DIAMOND mode: byte-identical.
