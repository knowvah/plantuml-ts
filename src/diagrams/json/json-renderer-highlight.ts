/**
 * The highlighted row's backing rect for the JSON
 * renderer — split out of renderer.ts (cdd-T30, 500-line file-size cap).
 *
 * The highlight's fill and every highlighted cell's font come from the
 * `node+highlight` styles (`TextBlockJson.java:138-146,296-299`), resolved in
 * `renderer-style.ts`; nothing here decides a colour.
 */

import { SVG_CORNER_DIVISOR } from './renderer-style.js';
import type { NodeStyleJson } from './renderer-style.js';
import type { Paint } from '../../core/paint.js';
import type { JsonPen } from './renderer-pen.js';
import type { JsonNodeGeo, JsonRowGeo } from './layout.js';

/** The three literal lengths of `TextBlockJson.java:295,301`
 *  (`URectangle.build(trueWidth - 2, heightOfRow).rounded(4)` drawn at
 *  `UTranslate(1.5, 0)`). They are unscaled: the diagram's `scale` is applied
 *  at emit, to every numeric alike. */
const HIGHLIGHT_INSET_X = 1.5;
const HIGHLIGHT_WIDTH_REDUCTION = 2;
const HIGHLIGHT_ROUND = 4;

/** `URectangle.build(trueWidth - 2, heightOfRow).rounded(4)` drawn at
 *  `UTranslate(1.5, 0)` from the row's own origin, with fill AND stroke set to
 *  the highlight color (`.apply(cellBackColor).apply(cellBackColor.bg())`). */
export function highlightRect(
  node: JsonNodeGeo,
  row: JsonRowGeo,
  style: NodeStyleJson,
  background: Paint,
  pen: JsonPen,
): string {
  return pen.rect(node.x + HIGHLIGHT_INSET_X, node.y + row.y, node.width - HIGHLIGHT_WIDTH_REDUCTION, row.height, {
    fill: background,
    stroke: background,
    // The highlight rect is drawn through `ugline`, which descends from
    // `ugSeparator = styleSeparator.applyStrokeAndLineColor(ug, …)`
    // (`TextBlockJson.java:287`, used at :296-300). So it inherits the
    // SEPARATOR's whole stroke -- thickness and dash alike -- not the node's
    // and not a plain one. Only the colors are overridden, by the
    // `.apply(cellBackColor).apply(cellBackColor.bg())` on the draw itself.
    strokeWidth: style.box.sepThickness,
    ...(style.box.sepDash === undefined ? {} : { strokeDasharray: style.box.sepDash }),
    rx: HIGHLIGHT_ROUND / SVG_CORNER_DIVISOR,
    ry: HIGHLIGHT_ROUND / SVG_CORNER_DIVISOR,
  });
}
