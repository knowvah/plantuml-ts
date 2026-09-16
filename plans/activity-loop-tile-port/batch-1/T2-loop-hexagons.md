# T2 — loop hexagons as `GtileDiamondInside` with side labels

**Agent:** typescript-pro · **Depends on:** T1

## Context

Faithful TypeScript port of PlantUML; the Java is the spec. Read
[`../README.md`](../README.md), [`../decisions.md`](../decisions.md) D1 (the
mechanism, quoted) and D9, and the if precedent: `layout/conditional-
builder.ts:160-180` (how the if builds `GtileDiamondInside(condition,
labels, bounder, theme)`) and `layout/walk-if-down.ts:60-80` (how the
`if-label` nodes are emitted from `diamond1.labelAt(side)`).

**Ours today.** `tile-layout.ts:134-176` builds `new GtileDiamond(...)` for
both loops; `walk-while-branch.ts` and the `'gtile-repeat'` case of
`tile-coordinates.ts:234-297` emit the hexagon node with `kindHint`
`'while-header'` / `'repeat-cond'` and no labels; `renderer-shapes.ts:449-
453` draws them. `GtileWhile`'s `_exitLabel`/`_backLabel` constructor
parameters are unused.

## Fix

1. `tile-layout.ts`: `tileWhile` -> `new GtileDiamondInside(node.condition,
   { north: node.yesLabel, west: node.exitLabel }, …)`
   (`FtileWhile.java:125-127`); `tileRepeat` -> `new GtileDiamondInside(
   node.condition, { east: node.yesLabel, south: node.outLabel }, …)`
   (`FtileRepeat.java:150-151`). Remove the unused label parameters from
   `GtileWhile`'s constructor or wire them through — do not leave dead
   parameters.
2. `layout/diamond-labels.ts` (new): extract the `if-label` emission from
   `walk-if-down.ts:60-80` into `emitDiamondLabels(t, x, y, sides, lane,
   out)`; `walk-if-down.ts` may keep its own copy if the pure-move would
   widen its write-set — journal either way (stop 1 pre-authorises the
   split).
3. Both loop walkers emit the hexagon node then its labels via the helper.
4. `GtileWhile`/`GtileRepeat`: the header/condition parameter type becomes
   `GtileDiamondInside`; `condition.width / 2` reads stay (D3 of awrl:
   `left = width/2` holds for `GtileDiamondInside` too — assert it).

## Read-set

Files above; `tiles/gtile-diamond-inside.ts:56-165`; `renderer-shapes.ts:
440-458`; `tests/diagrams/activity/tiles/gtile-diamond-inside.test.ts`
(the label anchors).

## Write-set

`src/diagrams/activity/layout/tile-layout.ts`,
`src/diagrams/activity/layout/diamond-labels.ts` (new),
`src/diagrams/activity/layout/walk-while-branch.ts`,
`src/diagrams/activity/layout/tile-coordinates.ts` (repeat case only),
`src/diagrams/activity/tiles/gtile-while.ts`,
`src/diagrams/activity/tiles/gtile-repeat.ts`;
`tests/diagrams/activity/tiles/gtile-while.test.ts`, `gtile-repeat.test.ts`,
`tests/diagrams/activity/layout/tile-layout.test.ts`,
`tile-coordinates.test.ts`, `tests/unit/activity/layout.test.ts` — only
assertions the geometry changes, with a Java cite, never deleted;
`measurements/t2.json`; journal rows; `docs/catalog.md` on drift.

## Acceptance criteria

- Given `while (c) is (yes) … endwhile (no)`, when walked, then the nodes
  carry `yes` at `labelAt('north')` and `no` at `labelAt('west')` of the
  hexagon
- Given `cemagu-66-vazo965`, when `--align` runs, then the hexagon polygon
  width is 187.35 (jar) and the text count equals the jar's
- Given `bareka-88-fusu160`, then 9 texts (was 7)
- Given a fixture with no loop, then byte-identical (render-all + `cmp`)
- Given `t2.json` vs `base.json`, then every mover is a `fixtures.md` row
  or a named parent re-centring; every riser has a journal row

## Observability / Rollback

N/A / **Reversible.**

## Quality bar

Targeted tests green; typecheck, lint, build exit 0; the orchestrator runs
`npm test` (red only on the four activity oracle gates, on journaled
movers), the probe, the scan (must stay 0) and render-all + `cmp`, then
resumes you to commit. Stage explicit paths.

## Commit

`feat(altp-T2): build loop hexagons as FtileDiamondInside with side labels`
