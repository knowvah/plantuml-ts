# Batch 1 — systemic mechanisms, part 1

After batch 0. T1a (layout) and T1b (emission) write disjoint sets and run in
parallel in worktrees. T1b asserts text y RELATIVE to its rect so T1a's shift
does not couple them. Close per [close-procedure.md](../close-procedure.md)
(`b1`); expect the `canvas` family (311) and the `textLength` family (every
text) to vanish, and the first pins (the nine `canvas, pos`-only rows of
`fixtures.md` are the candidates).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-canvas-origin.md) | canvas origin/margin — D2 | typescript-pro | `src/diagrams/activity/layout/{assign-coordinates-full,tile-layout,tile-coordinates,swimlane-placement}.ts`, `src/diagrams/activity/activity-layout-constants.ts`, `tests/diagrams/activity/layout/**`, `oracle/goldens/svg-activity/{diff,swimlane}-baseline.json` | T0a, T0b | [ ] |
| [T1b](T1b-text-klimt-driver.md) | text via `DriverTextSvg`; `strictuml` → `ArrowsTriangle` — D1, D4 | typescript-pro | `src/diagrams/activity/{renderer,activity-renderer-shapes,activity-renderer-text (NEW),activity-text-placement,arrows-regular}.ts`, `tests/unit/activity/{renderer,renderer-shapes,activity-text-placement,arrows-regular}.test.ts`, `oracle/goldens/svg-activity/text-baseline.json` | T0a, T0b | [ ] |
