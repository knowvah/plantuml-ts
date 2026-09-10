# T4 — `compressGeometry`

**Agent:** `typescript-pro` · **Depends on:** T3

## Context

Read [`../decisions.md#d1`](../decisions.md), `#d4`, `#d6`, `#d7` (locked).
`CompressionXorYBuilder` (`klimt/compress/CompressionXorYBuilder.java:52-62`):
`slotSet = slotFinder.getSlotSet().reverse().smaller(5.0)`; `affine = new
CompressionTransform(slotSet)`; then the block redraws through
`UGraphicCompressOnXorY` (`UGraphicCompressOnXorY.java`): a `URectangle`
(ignore flags notwithstanding) becomes `withWidth(ct(x + w) − ct(x))` drawn
at `ct(x)` (or height on Y); a `ULine` has BOTH endpoints transformed; a
`CenteredText` is re-centred in `ct(x + totalWidth) − ct(x)`; every other
shape is translated to `(ct(x), y)` (or `(x, ct(y))`) — ellipses, polygons,
texts keep their size. `calculateDimension` is `transform(width)` (`:63-69`).
`ActivityDiagram3.java:209-210` applies ON_X, then ON_Y on the result.

## Read-set

- `src/diagrams/activity/layout/compress/{slot,compression-transform,
  shapes-of,slot-finder}.ts` (T2, T3)
- `src/diagrams/activity/activity-layout-types.ts:1-45` (the Geo shapes —
  read only, stop 9)
- `src/diagrams/activity/layout/tile-coordinates.ts:426-478`
  (`computeBounds`, `assignCoordinates` — read only here)
- Java: `CompressionXorYBuilder.java`, `UGraphicCompressOnXorY.java` (whole)

## Write-set

See the batch table. `docs/catalog.md` only on drift.

## Task

Tests first. `compressGeometry(input)` runs one axis: `shapesOf` →
`collectSlots` → `reverse().smaller(5)` → `CompressionTransform`, then
applies it: rect kinds (bars included) `x' = ct(x)`, `w' = ct(x + w) −
ct(x)`; ellipse/polygon/text kinds `x' = ct(x)` with width kept; every edge
point through `ct`; `spikeTip` through `ct`; lanes `x`, `x + width`,
`contentX`, `contentX + contentWidth`, `contentMinX` through `ct`;
reservations through `ct` like rects; bounds `ct(maxX)`. Then the same on
Y (`y`, `height`, `swimlaneBand`, `swimlaneDividerY`). Return the new
geometry plus `removed: { x, y }` (the total slot length deleted per axis)
for the probe. The 5 and the order carry their citations.

## Interface contract (consumed by T5)

```ts
interface CompressInput { nodes: ActivityNodeGeo[]; edges: ActivityEdgeGeo[]; edgeMeta: readonly EdgeMeta[]; swimlanes: SwimlaneGeo[]; reservations: readonly Reservation[]; bounds: { maxX: number; maxY: number }; bounder: StringBounder; theme: Theme }
interface CompressResult { nodes; edges; swimlanes; reservations; bounds: { maxX; maxY }; removed: { x: number; y: number } }
function compressGeometry(input: CompressInput): CompressResult;   // ON_X then ON_Y
```

## Acceptance criteria

- Given a rect spanning a 28-wide empty gap, then it narrows by 18
- Given a start ellipse right of a removed slot, then it shifts left by the
  slot and keeps its width
- Given two 30-wide branches 28 apart under a bar, when x is compressed,
  then they are 10 apart and the bar is 22 narrower (18 + 2 + 2)
- Given bounds, then `bounds.maxX' = ct(maxX)`
- Given a fixture with no empty gap wider than 10, then the geometry is
  returned unchanged
- Given the probe, then EXACTLY 42511

## Observability / Rollback

`removed` is the per-fixture SLI T5 reports / **Reversible.**

## Quality bar

All four gates green; full `npm test`.

## Commit

`feat(akc-T4): apply the compression transform to the activity geometry`
