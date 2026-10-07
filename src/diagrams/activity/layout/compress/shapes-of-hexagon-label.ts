/**
 * `if-own-label`'s text slots (add4-T3a, HEX-LABEL-SLOT; split out of
 * `shapes-of.ts`, which sits near its 500-line cap).
 *
 * `FtileDiamondInside#drawU` draws the condition label as one TextBlock
 * centred in the hexagon (`lx = (dimTotal.width - dimLabel.width) / 2`,
 * `vertical/FtileDiamondInside.java:94-96`). The label is a Sheet
 * (`ConditionalBuilder.java:240-243`), so every stripe is its own `UText`
 * (`SheetBlock1.java:146-148`), and `SlotFinder#drawText` boxes each one
 * through a `TextLimitFinder` (`klimt/compress/SlotFinder.java:127-135`).
 * The slots are per line: boxing the whole `\n`-joined string as one line
 * measured its full length (82.64 vs the widest line's 58.16 on
 * `pekefu-66-mepa144`), poking 0.2375 px past the hexagon so the empty
 * else column compressed to 10.2375 instead of 10.
 *
 * Positions mirror `activity-renderer-if-shapes.ts#renderHexagonMultilineLabel`
 * (the block's left is `cx - maxWidth / 2`, each line offset by the
 * `SheetBlock1#initMap` alignment coefficient, `SheetBlock1.java:155-172`;
 * baselines `flooredFirstBaselineY` + the floored `AtomText` advance,
 * `AtomText.java:179-181`). A single line reduces to
 * `renderHexagonLabel`'s own `flooredFirstBaselineY(cy, size, 1)`.
 * Extents are the bounder's (`TextLimitFinder`, as every `'text'` shape).
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondInside.java:94-96
 * @see net/sourceforge/plantuml/klimt/compress/SlotFinder.java:127-135
 */

import type { ActivityNodeGeo } from '../../activity-geometry.types.js';
import type { StringBounder } from '../../tiles/tile.js';
import type { Theme } from '../../../../core/theme.js';
import type { CompressShape } from './shapes-of.js';
import { activityFontSize } from '../../activity-style-defaults.js';
import { activityHorizontalAlignment } from '../../activity-text-style.js';
import { flooredFirstBaselineY } from '../../activity-renderer-shapes.js';
import { diamondLineWidth } from '../../activity-renderer-if-shapes.js';
import { floorActionLineHeight } from '../../tiles/gtile-action.js';

/** `SheetBlock1#getCoef`'s per-line x offset (`SheetBlock1.java:155-172`). */
function alignOffset(align: 'left' | 'center' | 'right', diff: number): number {
  if (align === 'center') return diff / 2;
  return align === 'right' ? diff : 0;
}

/** One `'text'` slot per label line of an `if-own-label` node. */
export function ifOwnLabelShapes(node: ActivityNodeGeo, bounder: StringBounder, theme: Theme): CompressShape[] {
  const size = activityFontSize(theme, 'diamond');
  const lines = (node.label ?? '').split('\n');
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const drawWidths = lines.map((ln) => diamondLineWidth(theme, size, ln));
  const maxWidth = Math.max(...drawWidths);
  const blockX = cx - maxWidth / 2;
  const firstBaselineY = flooredFirstBaselineY(cy, size, lines.length);
  const advance = floorActionLineHeight(size);
  const align = activityHorizontalAlignment(theme);
  return lines.map((ln, i) => {
    const dim = bounder.getDimension(ln, size);
    const x = blockX + alignOffset(align, maxWidth - drawWidths[i]!);
    return { kind: 'text', x, y: firstBaselineY + advance * i, width: dim.width, height: dim.height };
  });
}
