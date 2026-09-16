# T3 — `GtileWhile` dimension and placement

**Agent:** typescript-pro · **Depends on:** T2

## Context

Faithful port; the Java is the spec. Read [`../README.md`](../README.md),
[`../decisions.md`](../decisions.md) D3 (`specialOut` is null: drop
`xDeltaBecauseSpecial`), D4 (quoted arithmetic), D8, and awrl's T1 as the
shape (`plans/activity-while-repeat-left-alignment/batch-1/T1-while-left.md`,
`gtile-while.ts` as merged at `3651a1ec`: `contentLeft`, `headerOffsetX`,
`bodyOffsetX`).

**The jar** (`vcompact/FtileWhile.java:576-593`, `:621-641`), with
`backward == null` and `specialOut == null`:

```
geo    = geoDiamond1.appendBottom(geoWhile)          // merger, already ported
height = geo.h + 4*12 + suppHeightForLabel            // :585; label = back1 height
width  = geo.w + 24 + 12                              // :591 (dx = 2*12, + hexagonHalfSize)
left   = geo.left + 24                                // :593
inY    = geoDiamond1.inY; outY = height               // :593
diamond1 at (left - d1.left, 0)                       // :635-641
whileBlock at (left - body.left,
               d1.h + (height - d1.h - body.h - suppHeightForLabel)/2)   // :621-632
```

`suppHeightForLabel` (`:595-599`) is the `back1` label's height (`endwhile`
's `incoming1` display, `:146`) — measure it with the arrow font
(`activityFontSize(theme, 'arrow')`) or 0 when absent.

**Ours.** `gtile-while.ts` (merged awrl T1): `width = contentWidth +
BACK_EDGE_MARGIN`, `bodyOffsetY = header.height + NODE_MARGIN_Y`,
`height = bodyOffsetY + body.height + NODE_MARGIN_Y`, hooks at
`contentLeft`.

## Fix

1. `GtileWhile`: `left = contentLeft + 24`, `width = contentWidth + 36`,
   `height = header.h + body.h + 48 + labelH`, `headerOffsetX = left -
   header.left`, `headerOffsetY = 0`, `bodyOffsetX = left - body.left`,
   `bodyOffsetY = header.h + (height - header.h - body.h - labelH)/2`;
   `NORTH_HOOK = (left, 0)`, `SOUTH_HOOK = (left, height)`. Keep
   `backEdgeRightX = width` for T4 to retire. Every constant cites its
   line.
2. `walkWhile`: unchanged apart from reading the new offsets (T2's label
   emission stays).

## Read-set

`tiles/gtile-while.ts`, `layout/walk-while-branch.ts`, `tiles/gtile-top-
down.ts` (merger), `activity-style-defaults.ts` (`activityFontSize`);
the Java ranges above.

## Write-set

`src/diagrams/activity/tiles/gtile-while.ts`,
`src/diagrams/activity/layout/walk-while-branch.ts`;
`tests/diagrams/activity/tiles/gtile-while.test.ts`,
`tests/diagrams/activity/layout/tile-coordinates.test.ts`,
`tile-layout.test.ts`, `compress/invariant.test.ts`,
`tests/unit/activity/layout.test.ts` — re-asserted with cites, never
deleted; `measurements/t3.json`; journal rows.

## Interface contract (consumed by T4)

```ts
class GtileWhile {
  readonly left: number;           // geo.left + 24 (FtileWhile.java:593)
  readonly width: number;          // geo.w + 36   (:591)
  readonly height: number;         // geo.h + 48 + labelH (:585)
  readonly labelHeight: number;    // suppHeightForLabel (:595-599)
  readonly headerOffsetX: number; readonly headerOffsetY: 0;
  readonly bodyOffsetX: number;   readonly bodyOffsetY: number;
  readonly children: readonly [GtileDiamondInside, Tile];
}
```

## Acceptance criteria

- Given header 60×40 (left 30) and body 80×80 (left 40) and no label, then
  `left = 64`, `width = 116`, `height = 168`, `bodyOffsetY = 64`,
  `headerOffsetX = 34`, `bodyOffsetX = 24`
- Given a body wider than the header with `left < width/2`, then `width`
  follows the merger plus 36
- Given `t3.json` vs `t2.json`, then every mover is a `while` row of
  `fixtures.md` or a named parent re-centring; every repeat-only row is
  byte-identical (render-all + `cmp`)
- Given the scan, then 0

## Observability / Rollback

N/A / **Reversible.**

## Quality bar

As T2.

## Commit

`fix(altp-T3): size and place a while as FtileWhile does`
