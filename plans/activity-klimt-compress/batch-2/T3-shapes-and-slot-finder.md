# T3 — Shape adapter, `SlotFinder`, reservations

**Agent:** `typescript-pro` · **Depends on:** T1, T2

## Context

Read [`../decisions.md#d2`](../decisions.md), `#d5` (locked) and
`.agent-notes/akc-T0.md`. `SlotFinder#draw` (`klimt/compress/
SlotFinder.java:70-140`): a `UShapeIgnorableForCompression` whose
`isIgnoreForCompressionOn(mode)` is true calls `drawWhenCompressed` and
returns — for `URectangle` that reserves `UEmpty(2, h)` at each end on X
and `UEmpty(w, 2)` at each end on Y (`klimt/shape/URectangle.java:193-206`);
`URectangle`/`UEllipse`/`UEmpty` occupy `[x, x + w]` (or the y range);
`UPath`/`UPolygon` occupy `[x + minX, x + maxX]`; a `UPolygon` whose
`getCompressionMode() == mode` is skipped; `UText` occupies its
`TextLimitFinder` extents; `ULine` and `CenteredText` are not in the chain
and never occupy. Which shapes our geometry corresponds to: action, note,
bar, if-merge-less rect kinds → `rect`; start/stop/end/spot → `ellipse`;
diamonds and hexagons → `polygon` with the drawn extents; edge labels →
`text` measured with the bounder (the renderer's `label.length × 0.6 ×
size` at `renderer.ts:80` is a filed approximation — do not change it);
arrowheads → `polygon` from T1's `arrowHeadExtents` at each edge's last
point (and its mid-arrow); `break`, `if-merge` → nothing (`FtileBreak`,
`FtileEmpty#drawU` draw nothing); fork/join bars → `rect` with `ignoreX`;
the title band and lane backgrounds → `rect` with `ignoreX` and `ignoreY`
(`ftile/Swimlanes.java:339,364-365`); dividers → `empty` of width `x1 + x2`
(`ftile/LaneDivider.java:91`); `EdgeMeta.shape === 'parallel-in' |
'parallel-out'` cross-lane edges → their arrowhead polygon carries
`polygonSkipMode: 'x'` (`ftile/Worm.java:159-168`). Reservations upstream
draws as `UEmpty(5, Hexagon.hexagonHalfSize = 12)`: `FtileIfDown.java:349`
(`x2, y2 − 12`), `:402`, `:440` (`xmax, y2 − 12`), `FtileWhile.java:272`
(`x1, y1bis`) — read each site and place ours at the same offsets from the
hexagon our if/while walkers emit.

## Read-set

- `src/diagrams/activity/layout/tile-coordinates.ts` (`Out` `:55-70`; the
  if/while/repeat cases), `walk-fork-branches.ts`, `swimlane-placement.ts:
  55-70` (`EdgeMeta`), `:380-407`
- `src/diagrams/activity/activity-renderer-shapes.ts` (`renderDiamond`,
  `renderHexagon`: the polygon extents ours draws), `renderer.ts:72-100`
- `src/diagrams/activity/layout/compress/slot.ts` (T2),
  `src/diagrams/activity/arrows-regular.ts` (T1)
- Java: `SlotFinder.java`, `URectangle.java:107-113, 193-217`,
  `TextLimitFinder.java`, `Worm.java:150-170`, `FtileIfDown.java:340-445`,
  `FtileWhile.java:260-275`, `LaneDivider.java:85-97`, `Swimlanes.java:
  330-370`, `Hexagon.java:46`

## Write-set

See the batch table. `docs/catalog.md` only on drift.

## Task

Tests first.

1. `Out.reservations: Reservation[]` (`{x, y, width, height}`), emitted by
   the if/while/repeat cases at the cited offsets, and by `placeSwimlanes`
   for each divider (`x1 + x2` wide, 1 high) and the band/backgrounds'
   ignore rects. Internal to `layout/`; `ActivityGeometry` unchanged.
2. `shapes-of.ts`: `shapesOf(input): CompressShape[]` per the mapping above.
3. `slot-finder.ts`: `collectSlots(shapes, mode): SlotSet` — the Java
   dispatch line for line, including `drawWhenCompressed`'s reservations.
4. An invariant helper `overlaps(shapes): [i, j][]` for T5's test.

## Interface contract (consumed by T4)

```ts
interface CompressShape { kind: 'rect' | 'ellipse' | 'polygon' | 'text' | 'empty'; x: number; y: number; width: number; height: number; ignoreX?: boolean; ignoreY?: boolean; polygonSkipMode?: CompressionMode }
interface Reservation { x: number; y: number; width: number; height: number }
function shapesOf(input: { nodes; edges; edgeMeta; swimlanes; reservations; bounder; theme }): CompressShape[];
function collectSlots(shapes: readonly CompressShape[], mode: CompressionMode): SlotSet;
```

## Acceptance criteria

- Given a fork-bar node, when collected on x, then two 2-wide slots at its
  ends and none across it; on y, one slot over its height
- Given a `parallel-in` cross-lane edge, then its arrowhead contributes no
  x slot but a y slot
- Given a break node, then no shape; given an edge, then no shape for its
  segments, one polygon for its arrowhead
- Given an `if` hexagon, then a 5 × 12 reservation at the cited offset
- Given the probe, then EXACTLY 42511

## Observability / Rollback

N/A / **Reversible.**

## Quality bar

All four gates green; full `npm test`.

## Commit

`feat(akc-T3): collect compression slots from the activity geometry`
