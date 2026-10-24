# T2b — blotter else-band offset scales; same-colour band paths are strokeless

Agent: `typescript-pro` (sonnet), worktree `sdd3-T2b`. Commit:
`fix(sequence): scale the else-band offset and unstroke band paths`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (sdd2: `blotter-scaled-offset-and-path-stroke`; Java re-read)
`GroupingTile#drawCompBackground` computes `ypos = elseTile.getYGauge()
.getMin().getCurrentValue() - getFrameY()` and calls `blotter.addChange(ypos
+ 1, backElse)` (`teoz/GroupingTile.java:331-340`): the `+ 1` is in layout
space, so the export scale multiplies it (`SvgGraphics#format`). Ours:
`buildBands` (`renderer-frame-blotter.ts:80-97`) works on the ALREADY-scaled
geo (`sep.y - frame.y`, geo scaled by `scaleSequenceGeometry`), then adds a
literal `+ 1` (`:88`) — one unscaled px, wrong by `k - 1` for `scale k`.
Pass `k` into `buildBands` and add `k`. Second part: a band drawn as a
`UPath` (rounded first/last band) has fore == back (`ug.apply(current)
.apply(current.bg())`, `Blotter.java:80-82`), so `DriverPathSvg` draws it
with stroke width 0 (`DriverPathSvg.java:65-69`); `renderBand` passes
`strokeWidth: ctx.strokeWidth` for every shape (`:177,214`). Rects keep their
stroke (`DriverRectangleSvg`). Also check the path's `d`: `SEG_CLOSE` emits
nothing (`SvgGraphics.java:855-856`), so the jar's path has no `Z` —
ours appends `' Z'` to both arc paths (`renderer-frame-blotter.ts:112`
and the matching line in `bottomArcPathD`): drop it, and confirm against
cabedu's golden `d` (sdd2 recorded the band path as "unclosed").

## Targets
gebeki-18-muci858 (8), cabedu-56-lasa287 (7). kixani-97-giji283's blotter part
(shared with T2a's alpha split) is reported, not required, here.

## Write-set
`src/diagrams/sequence/renderer-frame-blotter.ts` and its test.

## Read-set
`renderer-frame-blotter.ts:70-135,160-227`; Java: `GroupingTile.java:316-347`,
`Blotter.java:74-140`, `DriverPathSvg.java:58-72`, `SvgGraphics.java:850-858`.

## Acceptance
- Given a frame at `scale 2` with a coloured `else`, when the bands are
  built, then the band boundary is `(sep.y - frame.y) + k` (unit test citing
  `GroupingTile.java:340`); at `scale 1` output is unchanged.
- Given a rounded multi-band frame, when drawn, then the two arc-path bands
  carry no stroke and no `Z`, and rect bands keep their stroke.
- Given gebeki and cabedu, then each diffs to 0.
- Given the 1042 pins, then every pin stays byte-equal.

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
