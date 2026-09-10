/**
 * Per-line text-X placement for the activity renderer (mission
 * `activity-min-box-width`, T5, D2). Split out of `activity-renderer-shapes
 * .ts` rather than added there: that file was already at the 500-line
 * complexity-hook cap before this task (`.agent-notes/amb-T0.md`), so this
 * task's own arithmetic has to live somewhere else.
 *
 * THE CONTRACT THIS REPLACES. `FtileBox#drawU`
 * (`ftile/vertical/FtileBox.java:224-233`) draws its creole sheet at an
 * explicit `x` translate -- LEFT at `padding.getLeft()`, CENTER/RIGHT
 * computed from the measured text-block width -- and never at a `text-
 * anchor`. The port's pre-T5 renderer inverted this: every activity `<text>`
 * carried `text-anchor="middle"` or `"start"` at a geometric centre/edge,
 * because the box's OWN width floor (deleted in T2) made left/centre
 * indistinguishable for the common case. This module gives every remaining
 * `text-anchor` site in `activity-renderer-shapes.ts`/`renderer.ts` the
 * real per-line `x` it needs to stop relying on the attribute.
 *
 * PER-LINE, NOT PER-BLOCK (D2's open question, settled here).
 * `SheetBlock1#initMap` (`klimt/creole/SheetBlock1.java:154-171`) resolves
 * multi-line alignment PER STRIPE (one stripe == one line): the sheet's own
 * width is the WIDEST stripe, and every narrower stripe is shifted by
 * `(maxWidth - stripeWidth) / coef`, where `coef` is 0 for LEFT, 2 for
 * CENTER, 1 for RIGHT (`getCoef`, `:174-193`) -- i.e. each line is
 * positioned from ITS OWN measured width, not the block's. Composed with
 * `FtileBox#drawU`'s own outer, block-level translate (which itself reads
 * only the WIDEST line's width, `dimTb.getWidth()`), the two offsets
 * algebraically cancel the block term for CENTER and RIGHT:
 *
 *   CENTER: (boxWidth - maxLineW)/2 + (maxLineW - lineW)/2
 *         = (boxWidth - lineW) / 2
 *   RIGHT:  (boxWidth - maxLineW - padding) + (maxLineW - lineW)
 *         = boxWidth - padding - lineW
 *   LEFT:   padding.getLeft() + 0                     (coef 0: never shifts)
 *
 * `boxLineX` below reproduces these three closed forms directly, using only
 * the ONE line's own measured width and the box's total content width --
 * confirmed against the jar's `cizixu-00-koro700` single-line fixture
 * (`x = rect.x + 10`, LEFT) and algebraically exact for CENTER/RIGHT.
 *
 * `FtileDiamondInside.java:94-96` and `GtileHexagonInside.java:117` never
 * branch on alignment: `lx = (dimTotal.getWidth() - dimLabel.getWidth()) /
 * 2` centres the WHOLE label block geometrically every time, and (by the
 * same per-line `SheetBlock1` mechanism, CENTER's `coef = 2` case) each line
 * within a multi-line diamond/hexagon label centres on ITS OWN width too --
 * `centeredLineX` below.
 *
 * MEASUREMENT SEAM. `renderNode`'s contract (`(node, theme) => string`) is
 * consumed by `activity-renderer-swimlanes.ts` (outside this mission's
 * write-set), so it cannot grow a `measurer` parameter -- and
 * `ActivityGeometry`/`ActivityNodeGeo` (`activity-layout-types.ts`, also
 * outside the write-set) carry no per-line width either. This module
 * instantiates its OWN `WidthTableMeasurer` (`core/measurer.ts`) instead --
 * the SAME class the conformance harness re-exports as `DeterministicMeasurer`
 * (`core/measurer-deterministic.ts`) and injects at the layout stage
 * (`tests/oracle/svg-conformance/render-fixture-activity.ts`), so the width
 * this module computes at RENDER time matches, number for number, what
 * `tiles/gtile-action.ts` sized the box at under the oracle harness. A fresh
 * module-level instance (stateless, table-lookup only, no DOM) is the
 * established pattern for a measurer-blind renderer, not a new one --
 * `sequence/renderer-participant-symbol.ts:196` does the same for the same
 * structural reason.
 */
import type { Theme } from '../../core/theme.js';
import { WidthTableMeasurer } from '../../core/measurer.js';
import { activityPadding } from './activity-style-defaults.js';
import { activityHorizontalAlignment } from './activity-text-style.js';

const MEASURER = new WidthTableMeasurer();

/** Proportional-font line width, in the same metric system the deterministic
 *  conformance harness sizes every activity box in. */
export function measureLineWidth(theme: Theme, fontSize: number, line: string): number {
  return MEASURER.measure(line, { family: theme.fontFamily, size: fontSize }).width;
}

/** `<code>` blocks measure monospace, matching `tiles/gtile-action.ts`'s own
 *  `monoCharWidth = fontSize * 0.6` sizing -- the box's width floor was
 *  computed with this SAME formula, so the render-time `x` must agree with
 *  it, not the proportional table {@link measureLineWidth} reads. */
export function measureMonoLineWidth(fontSize: number, line: string): number {
  return line.length * fontSize * 0.6;
}

/** `FtileDiamondInside.java:94-96` / `GtileHexagonInside.java:117` --
 *  geometric centring, no alignment branch. */
export function centeredLineX(cx: number, lineWidth: number): number {
  return cx - lineWidth / 2;
}

/** `FtileBox#drawU`'s three branches (`FtileBox.java:224-233`), collapsed to
 *  the per-line closed form this module's doc comment derives. `boxX` is the
 *  box's own left edge (`node.x`); `boxWidth` its total content width
 *  (`node.width`). */
function boxLineX(boxX: number, boxWidth: number, lineWidth: number, padding: number, theme: Theme): number {
  const align = activityHorizontalAlignment(theme);
  if (align === 'left') return boxX + padding;
  if (align === 'right') return boxX + boxWidth - padding - lineWidth;
  return boxX + (boxWidth - lineWidth) / 2;
}

/**
 * The activity-family text `sname`s this module positions: `'activity'`
 * resolves the `FtileBox` L/C/R branch above (action, parallelogram, SDL
 * chevrons -- every `BoxStyle` is an `FtileBox`, `FtileBox.java:97-99,146`);
 * `'diamond'` resolves the geometric-centre branch (diamond, hexagon
 * condition).
 */
export interface ActivityTextOpts {
  sname: 'activity' | 'diamond';
  fontSize?: number;
  /**
   * The box's own content width (`node.width`) -- required whenever
   * `sname` is `'activity'`, since `boxLineX` cannot resolve LEFT/CENTER/
   * RIGHT without it. Optional only because `renderLabel`'s `<latex>`
   * branch (`activity-renderer-shapes.ts`) never reaches this function at
   * all, so a caller composing ONLY that branch has nothing real to pass.
   */
  width?: number;
}

/**
 * One line's `x`, dispatched on `opts.sname`. Throws for a broken caller
 * contract (`'activity'` without `width`) rather than silently drawing at
 * the wrong `x` -- a missing `width` here is a programmer error, not an
 * expected failure (`error-handling.md`: throw vs. return).
 */
export function activityTextLineX(theme: Theme, cx: number, lineWidth: number, opts: ActivityTextOpts): number {
  if (opts.sname === 'diamond') return centeredLineX(cx, lineWidth);
  if (opts.width === undefined) {
    throw new Error('activityTextLineX: opts.width is required when sname is "activity"');
  }
  const padding = activityPadding('activity');
  return boxLineX(cx - opts.width / 2, opts.width, lineWidth, padding, theme);
}
