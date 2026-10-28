# xikovo diagnosis (gdd-T1b): title/header + `hide footbox` canvas 8 px short

Rows: `xikovo-87-rosu902` (corpus), authored `title-hide-footbox`,
`header-hide-footbox`. Control: authored `caption-hide-footbox` (0 diffs).

## Mechanism

On the chromed `exportMargin` arm, our canvas is `trunc(dim + 1)` of the
stacked chrome dimension only. That models `SvgGraphics`'s constructor
`ensureVisible(minDim)` but not the `ensureVisible` every drawn primitive
calls. Under `hide footbox` the gantt body draws ink 8 px below its own
`calculateDimension` (`TimeHeaderSimple#drawSmallVlinesDay`: `dy(6)` +
`vline(totalHeightWithoutFooter + 2)`). The jar's canvas grows to cover that
ink wherever the body lands. Ours clips to the dimension.

## Origin

- Ours: `src/core/TextBlockExporter.ts:327`
  (`height: Math.trunc(dim.height + ENSURE_VISIBLE_BUMP)` in `exportExtents`;
  `:326` is the width twin). This canvas only floors at `minDim`. It never
  sees the extent of the body that `drawBodyAt` draws, at
  `scaleMarginedBody`, `:292`.
- Java it should mirror: `klimt/drawing/svg/SvgGraphics.java:129-135`
  (`ensureVisible`, `maxY = (int)(y + 1)`). It is called twice:
  - once from the constructor with `minDim`, at `:143`, which we model;
  - again for every primitive drawn through the export's single `UGraphic`
    during `core/TextBlockExporter.java:177` (`textBlock.drawU(ug)`). Here
    that is `svgLine`'s `ensureVisible(x2, y2)` at `SvgGraphics.java:620-621`,
    which we do not model on this arm.
- The root `height` is `format(maxY)` (`SvgGraphics.java:801-813`).

## Causal chain

1. `TimeHeaderSimple.java` `drawSmallVlinesDay` draws each day separator from
   `y = 6` to `y = totalHeightWithoutFooter + 8` (`UTranslate.dy(6)`,
   `ULine.vline(totalHeightWithoutFooter + 2)`). Ported line for line:
   `src/diagrams/gantt/draw/header/TimeHeaderSimple.ts:105-108`.
2. With the footbox shown, `GanttLayout.java:102-103` makes the total
   `rows + getTimeFooterHeight` (font 10 + 6 = 16 > 8), so the separators stay
   inside the dimension. Under `hide footbox` the footer is 0, so the
   dimension is `rows` and the separators overflow it by 8. Both sides
   compute the same dimension.
3. `DecorateEntityImage.addTop` (title) and the header ribbon stack the chrome
   on `original.calculateDimension` (`svek/DecorateEntityImage.java:105-124,
   161-166`). The body is drawn at `yImage` = the chrome height, so the
   overflow lands at `chrome + dim + 8`. That is BELOW the decorated
   dimension `chrome + dim`.
4. Jar: the canvas is `max((int)(dim_total + 1), (int)(chrome + dim + 8 + 1))`.
   The overflow wins, giving 90 and 51.
5. Ours: `composeChrome` (`src/core/annotations/chrome.ts`) stacks on
   `fragment.height` = dim, which is correct. Then
   `finalizeTitledDiagramFragment` → `exportTo` → `exportExtents` takes
   `trunc(dim_total + 1)` and nothing else, giving 82 and 43. `drawBodyAt`
   draws the separators at the right `y`, but its klimt canvas is discarded
   (`.body` only).
6. Caption does not lose height because the caption is stacked BELOW the body
   (`yText2 = yImage + dimOriginal.getHeight()`, `DecorateEntityImage.java:111`).
   The caption's height (17) is larger than the 8 px overflow, so
   `trunc(dim_total + 1)` already covers the ink, and the jar's `max` picks the
   dimension too. A top-only block (title, header) adds height above the body
   and nothing below it, so the overflow sticks out.

Instrumented values (temporary gated `console.error`, since reverted;
DeterministicMeasurer):

| hop | title + hide | header + hide | caption + hide |
|---|---|---|---|
| gantt `dim` (w × h) | 471.1875 × 46 | 337.625 × 31 | 337.625 × 31 |
| `calculateMargin` T/R/B/L | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 |
| body ink `getMinMax` maxY | 54 (= 46 + 8) | 39 (= 31 + 8) | 39 (= 31 + 8) |
| raw klimt canvas h (scale 1, translate 0) | 55 | 40 | 40 |
| chrome `initial.height` | 46 | 31 | 31 |
| chrome `block.height` | 81 (+35 title) | 42 (+11 header) | 48 (+17 caption) |
| body anchor translate (dx, dy) | (0, 35) | (0, 11) | (0, 0) |
| `exportTo` dim h → canvas h (ours) | 81 → **82** | 42 → **43** | 48 → **49** |
| anchored body ink canvas (dy + 55 / 40) | 90 | 51 | 40 |
| jar `svg/@height` | **90** | **51** | **49** |

Jar = `max(ours, anchored ink canvas)` in all three columns.

Counterfactual (gated, scratch, reverted): `drawBodyAt` stashed its klimt
canvas (drawn at the final factor and anchor translate), and `exportTo` took
`max(trunc(dim + 1)·factor, drawn canvas)`. Results:

- gantt (corpus + authored, 321 rows): exactly 3 rows move, all 2 → 0 diffs
  (`xikovo-87-rosu902`, `title-hide-footbox`, `header-hide-footbox`); 0 rises;
  0 errors.
- wbs + mindmap + salt (corpus + authored wbs/salt, 476 rows): 0 rows move;
  the trace logged no canvas raise.

## Ruled out

- **Gantt layout (`GanttLayout.ts` / `GanttDiagramMainBlock.ts`).** Our `dim`
  (46 / 31) equals the jar's. If the jar's dim were larger (for example, if
  it kept the footer under hide), the caption control would be 31 + 8 + 17 + 1
  = 57, not 49. Without chrome, ours is 55 = jar hide-only 55. The body
  elements are byte-identical (diff-one reports only `@height` and
  `@viewBox[3]`).
- **The footer height itself.** `TimeHeaderSimple.java` `getTimeFooterHeight`
  = font-size-day + 6 = 16, not 8. The 8 px is `6 + 2` from
  `drawSmallVlinesDay`, and it equals body ink maxY − dim
  (54 − 46, 39 − 31). With the footbox shown (title-only 98/98), the
  footer's 16 px absorbs the 8 px overflow, which is why that row matches.
- **Document margin (`document-margin.ts`, `calculateMargin`).** It is
  0/0/0/0 for every row, and gantt does not take the margin-baked arm
  (`exportMargin` is set; `applyExportedChrome`'s `documentMarginOf` path
  is not involved).
- **Chrome slot stacking (`chrome.ts` `applyChromeSlots`, `preChromeHeight`).**
  The stacking adds exactly the title, header and caption block heights
  (35 / 11 / 17), and those equal the jar's differences
  (90 − 55, 51 − 40, 49 − 31 − 1 = 17). `initial.height` = `dim`, which is
  what `DecorateEntityImage` stacks on (`calculateDimension`, never ink).
  The stacking is correct; the blind spot is after it.
- **`frameInkOf` / body-ink.** These only apply with `mainframe`, which none
  of these rows has. The `frameInk` spread is `{}`.
- **Line order (`hide footbox` before or after `title`).** Per the planning
  probes, it does not matter. The mechanism depends on the body's ink,
  not on the order of the parsed commands.
- **Scale.** Factor 1 on all rows (no `scale`, dpi 96).

## Proposed write-set

This is a core fix, NOT a gantt-only branch. The shared rule is the jar's
single `UGraphic`: the canvas is
`max((int)(minDim + 1), (int)(every drawn primitive's extent + 1))`, at the
final scale. On the `exportMargin` arm, the drawn body's extent comes from the
pass that `drawBodyAt` already makes at the final factor and anchor translate
(klimt's own `ensureVisible` canvas). `exportTo` takes the max of that and
`trunc(dim + 1)·factor`.

- `src/core/dispatcher-types.ts`: the return type of `drawBodyAt` gains the
  drawn canvas (for example `{ body, width, height }`), or a sibling
  callback.
- `src/core/TextBlockExporter.ts`: `scaleMarginedBody` / `exportTo` /
  `exportExtents` floor the canvas at the drawn body's canvas.
- The four producers' `drawBodyAt`, each a one-line change to return the
  `drawFragment` result's `width`/`height` alongside `.body`:
  `src/diagrams/{gantt,wbs,salt,mindmap}/index.ts`.
- Tests that stub `drawBodyAt`: `tests/unit/core/TextBlockExporter.test.ts:71`,
  `tests/unit/mindmap/render-scale.test.ts:179,193`,
  `tests/unit/gantt/index.test.ts:113`, `tests/unit/wbs/index.test.ts:130`.

Not modelled by the proposal, and named here: the `ensureVisible` calls that
the chrome's own primitives make (title text and so on). These lie inside the
stacked dimension by construction.

## Expected movers

The exporting engines on the `exportMargin` arm are exactly gantt, wbs, salt
and mindmap (`grep exportMargin src/diagrams`). I checked all four; only gantt
moves.

- **gantt:** 3 rows → conformant (above). The overflow source is the
  `TimeHeaderSimple` vline with the footer hidden. Other `TimeHeader*`
  variants draw their separators to `totalHeightWithoutFooter` exactly
  (`TimeHeaderDaily.java:114-129`, `TimeHeader.java:270-275`), so only
  simple-scale gantts overflow.
- **wbs, mindmap:** 0 movers in the full sweep (16 corpus rows carry chrome
  across wbs/mindmap/salt). Their `drawU` draws within the
  `Fork`/tree dimension it computes.
- **salt:** 0 movers. Note that salt's `background` pass draws
  `EMPTY_TEXT_BLOCK`, so the fix must read the `drawBodyAt` pass's canvas,
  not the background pass's.
- The margin-baked arm (activity, description, sequence, class) does not go
  through `exportExtents`' margin branch, so it is not affected by this
  write-set.

## Open questions

- Does the margin-baked arm have the same blind spot (canvas = stacked
  dimension, drawn-ink overflow ignored) for any engine whose body draws
  outside its `calculateDimension` under top chrome? This was not measured
  here and is out of this task's scope.
- Under `scale ≠ 1`, the jar's per-primitive `ensureVisible` runs on scaled
  coordinates. The counterfactual compared in scaled space, but no scaled row
  overflows, so that arm is untested.

Java read: `core/TextBlockExporter.java:159-209`, `UgDiagram.java:123-150`,
`core/DiagramChromeFactory.java:110-135, 363-420`,
`svek/DecorateEntityImage.java:68-185`,
`klimt/drawing/svg/SvgGraphics.java:117-143, 608-621, 801-813`,
`gantt/GanttLayout.java:80-130`, `gantt/GanttDiagramMainBlock.java:100-158`,
`gantt/draw/header/TimeHeaderSimple.java`, `TimeHeader.java:140-160`,
`TimeHeaderDaily.java:74-129`, `TimeHeaderFactory.java:78-91`.
