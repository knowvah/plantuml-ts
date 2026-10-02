# T1p-b — FtileIfLongVertical (`!pragma useVerticalIf`)

Agent: typescript-pro, worktree `add2-T1p-b` (wave 2, after T1p-a lands).
Rules: [common.md](common.md).

## Task
Port `vcompact/FtileIfLongVertical.java` (all 7 connection classes,
206-424) and its selection in `FtileFactoryDelegatorIf.java:85-89` (the
`useVerticalIf` pragma + elseif chain). Find how the pragma reaches the
factory in Java and how pragmas reach the activity layout in our code
(grep `pragma` under `src/`); thread it without changing public API
(stop 11). New tile `tiles/gtile-if-long-vertical.ts`, walker
`layout/walk-if-long-vertical.ts`, dispatched where the other if tiles are.
No corpus fixture enables the pragma (dulate-94-bupu593's pragma line is
commented out — it is a parser row, not yours): author fixtures (2-way,
3-way, elseif with labels, nested, inside swimlanes) with jar oracles.

## Write-set
`src/diagrams/activity/if-dispatch.ts`,
`src/diagrams/activity/layout/{conditional-builder,tile-layout,tile-coordinates}.ts`,
`src/diagrams/activity/tiles/tile.ts`, new tile + walker files, the renderer
file(s) only if a new shape is needed (report), their tests,
`tests/fixtures/activity/T1p-b/**`.

## Acceptance
- Each authored fixture: connector geometry matches the jar's.
- Without the pragma, output is byte-identical to before (probe Σ unchanged).
