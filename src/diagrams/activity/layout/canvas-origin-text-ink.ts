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
import { measureLineWidth } from '../activity-text-placement.js';
import { centeredFirstBaselineY } from '../activity-renderer-shapes.js';
import { TITLE_ASCENT_FRACTION } from './swimlane-placement.js';
import { getTextBlockPosition } from './snake-text-position.js';
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
 * Family Q: `klimt/drawing/LimitFinder.java:217-224`'s `drawText` -- the
 * far (bottom) corner is ALWAYS `baseline + 1.5`, independent of the
 * font's own descent, and the near (top) corner is `baseline -
 * (lineHeight - 1.5)`; never the measured box's own `y`/`y + height` the
 * generic box treatment uses for every other kind. An `if-label` draws
 * one `UText` per `\n`-split line (`renderIfLabel`'s own baseline,
 * `activity-renderer-if-shapes.ts:139`), each `fontSize` apart; the far
 * bound is the LAST line's baseline + 1.5, the near bound the FIRST
 * line's baseline minus one line's own height. `measureLabel`'s own
 * per-line SUM (`gtile-diamond-inside.ts:79-83`) means `node.height /
 * lineCount` recovers that one-line height exactly (every line shares the
 * same `fontSize`).
 */
export function extendForIfLabelText(acc: MutableInkBounds, node: ActivityNodeGeo, theme: Theme): void {
  const lineCount = (node.label ?? '').split('\n').length;
  const fontSize = activityFontSize(theme, 'arrow');
  const lineHeight = node.height / lineCount;
  const firstBaselineY = node.y + fontSize * TITLE_ASCENT_FRACTION;
  const lastBaselineY = firstBaselineY + (lineCount - 1) * fontSize;
  acc.minY = Math.min(acc.minY, firstBaselineY - (lineHeight - 1.5));
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
  // `edge.labelAlign === undefined` means this edge's push site has not
  // been updated to carry its real `Snake#withLabel` alignment (T1a's
  // census) -- `renderer.ts#renderEdgeLabel`'s own doc comment cites the
  // measured blast-radius regression (`sojono-24-tufe806`) this guard
  // closes; the two guards must stay in lockstep (both gate on the SAME
  // field) or the ink scan and the actual draw would size the canvas for
  // a label position the renderer never produces.
  if (edge.label === undefined || edge.labelAlign === undefined) return;
  const fontSize = activityFontSize(theme, 'arrow');
  const width = measureLineWidth(theme, fontSize, edge.label);
  const position = getTextBlockPosition(edge.points, { width, height: fontSize }, edge.labelAlign);
  const baselineY = centeredFirstBaselineY(position.y + fontSize / 2, fontSize, 1);
  acc.minX = Math.min(acc.minX, position.x);
  acc.maxX = Math.max(acc.maxX, position.x + width);
  acc.minY = Math.min(acc.minY, baselineY - (fontSize - 1.5));
  acc.maxY = Math.max(acc.maxY, baselineY + 1.5);
}
