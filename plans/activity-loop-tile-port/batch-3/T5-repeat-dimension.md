# T5 — `walk-repeat.ts`, the entry tile, and `GtileRepeat` dimension

**Agent:** typescript-pro · **Depends on:** T4

## Context

Faithful port; the Java is the spec. Read [`../README.md`](../README.md),
[`../decisions.md`](../decisions.md) D2, D4, D10 (quoted), the T1 contract
(`ActivityRepeat.entry`), T3's `gtile-while.ts` as the shape, and awrl's T2
(`plans/activity-while-repeat-left-alignment/batch-2/T2-repeat-left.md`;
`gtile-repeat.ts` at `3651a1ec` already has `left`, `bodyOffsetX`,
`conditionOffsetX`).

**The jar** (`vcompact/FtileRepeat.java`), `backward == null`:

```
getLeft  = max(repeat.left, d1.w/2, d2.w/2)                      // :767-774
getRight = max(repeat.w - repeat.left, d1.w/2, d2.w/2)           // :777-786
width    = max(getLeft + getRight, tbTest.w + 24) + 24           // :708-715
height   = d1.h + repeat.h + d2.h + 96                           // :713-714
left     = getLeft; inY = 0; outY = height                       // :696-699
diamond1 at (left - d1.w/2, 0)                                   // :744-748
repeat   at (left - repeat.left, d1.h + space/2),
           space = height - d1.h - d2.h - repeat.h               // :730-741
diamond2 at (left - d2.w/2, height - d2.h)                       // :759-765
```

`tbTest` is the condition text measured with the diamond font under
`INSIDE_HEXAGON` (`:66-70`) — and NOTE `:151`: under `INSIDE_HEXAGON` the
`FtileRepeat` is built with `TextBlockUtils.empty(0, 0)` as `tbTest`, so
the floor is `0 + 24` there; read `:141-155` and journal which applies.
`d1` is the entry: `FtileDiamond` 24×24 with `left = 12`
(`vertical/FtileDiamond.java:108-112`) or the inline action's tile.

## Fix

1. **Commit 1 (pure move):** `layout/walk-repeat.ts` exporting
   `walkRepeat(t, x, y, myLane, out)` with the `'gtile-repeat'` case's body
   verbatim; `tile-coordinates.ts`'s case becomes a one-line delegate
   (the `walk-while-branch.ts` header comment is the template, circular-
   import note included). Render-all + `cmp`: 0 movers.
2. `tiles/gtile-repeat-entry.ts`: `GtileRepeatEntry`, 24×24, hooks
   `(12, 0)`/`(12, 24)`, `kind: 'gtile-repeat-entry'`; the walker emits it
   with node kind `'repeat-start'` (`activity-renderer-shapes.ts:440`
   renders a diamond — verify its polygon matches `FtileDiamond#drawU`).
3. `tile-layout.ts#tileRepeat`: `entry = node.entry ? tileNode(node.entry)
   : new GtileRepeatEntry()`; `new GtileRepeat(entry, body, condition, …)`.
4. `GtileRepeat`: the arithmetic above; `children = [entry, body,
   condition]`; `entryOffsetX/Y`, `bodyOffsetX/Y`, `conditionOffsetX/Y`;
   hooks `(left, 0)`/`(left, height)`. Keep `backEdgeLeftX` for T6.
5. `walkRepeat`: place the three children at the offsets; edges unchanged
   otherwise (they now start/end at the new positions).

## Write-set

`src/diagrams/activity/layout/walk-repeat.ts` (new),
`src/diagrams/activity/layout/tile-coordinates.ts` (repeat case delegate
only), `src/diagrams/activity/tiles/gtile-repeat-entry.ts` (new),
`src/diagrams/activity/tiles/gtile-repeat.ts`,
`src/diagrams/activity/layout/tile-layout.ts` (`tileRepeat`);
`tests/diagrams/activity/tiles/gtile-repeat.test.ts`,
`gtile-repeat-entry.test.ts` (new), `tests/diagrams/activity/layout/tile-
layout.test.ts`, `tile-coordinates.test.ts`, `compress/invariant.test.ts`,
`tests/unit/activity/layout.test.ts`; `measurements/t5.json`; journal
rows; `docs/catalog.md` on drift.

## Interface contract (consumed by T6)

```ts
class GtileRepeat {
  readonly left: number; readonly width: number; readonly height: number;
  readonly entryOffsetX: number;     readonly entryOffsetY: 0;
  readonly bodyOffsetX: number;      readonly bodyOffsetY: number;
  readonly conditionOffsetX: number; readonly conditionOffsetY: number;
  readonly children: readonly [Tile /* entry */, Tile /* body */, GtileDiamondInside];
}
```

## Acceptance criteria

- Given body 40×60 (left 10), condition 50×40, entry 24×24, then `left =
  25`, `right = 30`, `width = 79`, `height = 220`, `bodyOffsetY = 72`,
  `conditionOffsetY = 180`, `entryOffsetX = 13`
- Given `repeat :R1;`, then `children[0]` is the action's tile and no
  entry diamond node is emitted
- Given the pure-move commit, then render-all + `cmp` shows 0 movers
- Given `t5.json` vs `t4.json`, then every mover is a `repeat` row or a
  named parent re-centring; while-only rows byte-identical; scan 0

## Observability / Rollback

N/A / **Reversible.**

## Quality bar

As T2. Two commits: the pure move, then the port.

## Commits

`refactor(altp-T5): move the repeat walker into walk-repeat.ts` then
`feat(altp-T5): size and place a repeat with its entry tile as FtileRepeat does`
