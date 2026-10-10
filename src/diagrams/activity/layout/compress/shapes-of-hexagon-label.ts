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
 * add4-T3h: positions and extents are the drawn Sheet's
 * (`activity-text-sheet-diamond.ts#diamondTestBlock`, the block
 * `renderHexagonOwnLabel` draws): the block's left is `x + lx`, `lx =
 * (width - dimLabel.width) / 2`, its top `y + ly`; inside `SheetBlock1`'s
 * padding (`SheetBlock1.java:209-210`) each stripe sits at its alignment
 * offset (`SheetBlock1#getCoef`, `SheetBlock1.java:155-172`) below the
 * previous stripe, and its resolved creole width is the slot's width (a
 * stripe's `UText`s are contiguous). A stripe's width and height are its
 * own one-line Sheet's, less the padding on both sides.
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
import { ASCENT_FRACTION } from '../../activity-renderer-shapes.js';
import { diamondTestBlock } from '../../activity-text-sheet-diamond.js';
import { klimtStringBounder } from '../../activity-creole-sheet.js';
import { measurerAdapterOf } from '../../tiles/gtile-action.js';
import type { StringBounder as KlimtStringBounder } from '../../../../core/klimt/font/StringBounder.js';

/** `SheetBlock1#getCoef`'s per-line x offset (`SheetBlock1.java:155-172`). */
function alignOffset(align: 'left' | 'center' | 'right', diff: number): number {
  if (align === 'center') return diff / 2;
  return align === 'right' ? diff : 0;
}

/** The drawn condition Sheet's dimension for `label`. */
function sheetDim(
  label: string,
  theme: Theme,
  sb: KlimtStringBounder,
  wrapped: boolean,
): { width: number; height: number } {
  const dim = diamondTestBlock(label, theme, wrapped).calculateDimension(sb);
  return { width: dim.getWidth(), height: dim.getHeight() };
}

/** One `'text'` slot per label line of an `if-own-label` node. */
export function ifOwnLabelShapes(node: ActivityNodeGeo, bounder: StringBounder, theme: Theme): CompressShape[] {
  const size = activityFontSize(theme, 'diamond');
  const pad = theme.padding ?? 0;
  const label = node.label ?? '';
  const sb = klimtStringBounder(measurerAdapterOf(bounder), { family: theme.fontFamily, size });
  const block = sheetDim(label, theme, sb, node.wrapped === true);
  const stripes = label.split('\n').map((ln) => {
    const d = sheetDim(ln, theme, sb, node.wrapped === true);
    return { width: d.width - 2 * pad, height: d.height - 2 * pad, inkHeight: bounder.getDimension(ln, size).height };
  });
  const maxWidth = block.width - 2 * pad;
  const left = node.x + (node.width - block.width) / 2 + pad;
  const align = activityHorizontalAlignment(theme);
  let top = node.y + (node.height - block.height) / 2 + pad;
  return stripes.map((stripe) => {
    const shape: CompressShape = {
      kind: 'text',
      x: left + alignOffset(align, maxWidth - stripe.width),
      y: top + size * ASCENT_FRACTION,
      width: stripe.width,
      height: stripe.inkHeight,
    };
    top += stripe.height;
    return shape;
  });
}
