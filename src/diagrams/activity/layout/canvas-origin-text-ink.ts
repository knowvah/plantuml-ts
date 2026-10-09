/**
 * b3/T3a (`activity-divergence-drive-2` batch 3): three `canvas-origin.ts`
 * ink-scan corrections (families A/P/Q) split into their own sibling
 * module purely to keep `canvas-origin.ts` under the 500-line hook
 * (mission convention, "a sibling module when a file would cross the
 * hook", the same reasoning that split `canvas-origin.ts` itself out of
 * `assign-coordinates-full.ts`). `canvas-origin.ts`'s `extendForNode`/
 * `computeCanvasOrigin` are the only callers.
 */

import type { ActivityEdgeGeo, ActivityNodeGeo, SwimlaneGeo } from '../activity-geometry.types.js';
import type { Theme } from '../../../core/theme.js';
import { activityFontSize } from '../activity-style-defaults.js';
import { edgeLabelBlockSize } from './compress/edge-label-anchor.js';
import { floorActionLineHeight } from '../tiles/gtile-action.js';
import { ifLabelBlock } from '../activity-text-sheet-diamond.js';
import { klimtStringBounder } from '../activity-creole-sheet.js';
import { activityMeasurer } from '../activity-string-bounder.js';

import { TITLE_ASCENT_FRACTION } from './swimlane-placement.js';
import { DEFAULT_LABEL_ALIGN, getTextBlockPosition } from './snake-text-position.js';
import type { MutableInkBounds } from './canvas-origin.js';

/**
 * Family P: `split-bar`/`split-join-bar` are `FtileThinSplit`'s
 * `ULine.hline(last - first)` (`FtileThinSplit.java:88,95`) -- a
 * ZERO-`dy` line drawn with no further Y extent of its own. The node's own
 * bookkeeping `height = 1.5` field (`FtileThinSplit.java:61,84`, unread by
 * the renderer -- `compress-geometry.ts#RECT_HEIGHT_KINDS`'s own doc) is a
 * layout-only `FtileGeometry` value, never a real drawn height;
 * `LimitFinder#drawULine` (exact) records BOTH corners at the same `y`
 * when `dy = 0`, so this kind's own ink contributes a single Y value, not
 * `[y, y + height]` the generic box treatment would give it.
 */
export const SPLIT_LINE_KINDS = new Set(['split-bar', 'split-join-bar']);

/**
 * Family Q: `klimt/drawing/LimitFinder.java:216-224`'s `drawText` -- the
 * far (bottom) corner is ALWAYS `baseline + 1.5`, independent of the
 * font's own descent, and the near (top) corner is `baseline -
 * (fontSize - 1.5)` (the `StringBounder` height of one `UText`); never the
 * measured box's own `y`/`y + height` the generic box treatment uses for
 * every other kind. An `if-label` is a creole Sheet
 * (`activity-text-sheet-diamond.ts#ifLabelBlock`): `SheetBlock1` draws it
 * inside its padding (`SheetBlock1.java:209-210`), one `UText` per stripe,
 * each stripe `max(fontSize, 10)` high (`AtomText.java:179-181`). The near
 * bound is the FIRST line's, the far bound the LAST line's; X spans the
 * LEFT-aligned stripes, `[x + p, x + width - p]` (add4-T3h: the drawn
 * block, not `node.width`, which an EMPTY_DIAMOND tile measures raw).
 */
export function extendForIfLabelText(acc: MutableInkBounds, node: ActivityNodeGeo, theme: Theme): void {
  const lineCount = (node.label ?? '').split('\n').length;
  const { tb, fc } = ifLabelBlock(node, theme);
  const fontSize = fc.size;
  const pad = theme.padding ?? 0;
  const width = tb
    .calculateDimension(klimtStringBounder(activityMeasurer(theme), { family: fc.family, size: fontSize }))
    .getWidth();
  acc.minX = Math.min(acc.minX, node.x + pad);
  acc.maxX = Math.max(acc.maxX, node.x + width - pad);
  const firstBaselineY = node.y + pad + fontSize * TITLE_ASCENT_FRACTION;
  const lastBaselineY = firstBaselineY + (lineCount - 1) * floorActionLineHeight(fontSize);
  acc.minY = Math.min(acc.minY, firstBaselineY - (fontSize - 1.5));
  acc.maxY = Math.max(acc.maxY, lastBaselineY + 1.5);
}

/**
 * Family A: `LaneDivider#drawU`'s own `ULine.vline(height)`
 * (`LaneDivider.java:97`) is ink `LimitFinder#drawULine` (exact) sees --
 * never modelled as such. `placeSwimlanes`/`assignCoordinatesFull`'s own
 * divider `Reservation` is a `UEmpty(x1 + x2, 1)` (`LaneDivider.java:91`,
 * `canvas-origin.ts#extendForReservation`'s own doc), a near-zero-height
 * placeholder for the COMPRESSOR, not the drawn line's real Y span -- the
 * divider's visible ink spans the full block, from `baseY` to the
 * content's own bottom (`height = dimensionFull.getHeight() +
 * titleHeightTranslate.getDy()`, `Swimlanes.java:422-423`) -- the SAME
 * two (pre-shift) values `computeSwimlaneChrome` later derives
 * `swimlaneDividerY` from.
 */
export function extendForLaneDivider(
  acc: MutableInkBounds,
  swimlanes: readonly SwimlaneGeo[],
  baseY: number,
  contentMaxY: number,
): void {
  if (swimlanes.length <= 1) return;
  acc.minY = Math.min(acc.minY, baseY);
  acc.maxY = Math.max(acc.maxY, contentMaxY);
}

/**
 * T1b (`activity-divergence-drive-3`): an edge label's own ink.
 * `Snake#drawInternalLabel` (`ftile/Snake.java:226-232`) draws the label
 * through the SAME `UGraphic` the line segments draw through, so
 * `LimitFinder#drawText` (`klimt/drawing/LimitFinder.java:216-224`) --
 * NOT the generic box treatment every `ActivityNodeGeo` kind above gets
 * -- is what actually sizes it: `y -= dim.height - 1.5` then the four
 * corners of `[x, x+dim.width] x [y, y+dim.height]`, where `(x, y)` is
 * the draw call's own baseline position (upstream's `UText` draws at
 * its local origin, which `TextBlock.drawU(ug.apply(UTranslate.point
 * (position)))` places at exactly `position`, this port's own
 * `getTextBlockPosition` result -- `renderer.ts#renderEdgeLabel`'s own
 * `baselineY` is the SAME formula, so this function mirrors it rather
 * than re-deriving a second one). `Snake#getMaxX` (`Snake.java:234-242`)
 * confirms a label is part of the Ftile's own geometry (not drawn
 * floating outside it) -- this is the WIDER mechanism that makes that
 * true in both axes, not just X.
 */
export function extendForEdgeLabelText(acc: MutableInkBounds, edge: ActivityEdgeGeo, theme: Theme): void {
  // No `labelAlign` = the jar's default `arrowHorizontalAlignment()`, LEFT
  // (`AbstractFtile.java:108-110`, `AlignmentParam.java:42`); the renderer
  // resolves the SAME default, so ink and draw agree.
  if (edge.label === undefined) return;
  const fontSize = activityFontSize(theme, 'arrow');
  // add4-T1f (SWITCH-NL): one `UText` per Sheet line, stacked `fontSize`
  // apart (`SheetBlock1.java:146-148`); the envelope runs first ink-top to
  // last ink-bottom, matching `renderer.ts#renderEdgeLabelAligned`.
  const lines = edge.label.split('\n');
  // add4-T3h: the drawn block's own dimension (`edgeLabelBlockSize`,
  // `Snake.java:247`); each `UText` sits inside `SheetBlock1`'s padding
  // (`SheetBlock1.java:209-210`), so the LEFT block's ink spans
  // `[x + p, x + width - p]`.
  const pad = theme.padding ?? 0;
  const dim = edgeLabelBlockSize(edge.label, theme);
  const position = getTextBlockPosition(edge.points, dim, edge.labelAlign ?? DEFAULT_LABEL_ALIGN);
  const baselineY = position.y + pad + fontSize * TITLE_ASCENT_FRACTION;
  acc.minX = Math.min(acc.minX, position.x + pad);
  acc.maxX = Math.max(acc.maxX, position.x + dim.width - pad);
  acc.minY = Math.min(acc.minY, baselineY - (fontSize - 1.5));
  acc.maxY = Math.max(acc.maxY, baselineY + fontSize * (lines.length - 1) + 1.5);
}
