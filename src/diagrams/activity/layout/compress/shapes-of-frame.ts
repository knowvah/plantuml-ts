/**
 * The `USymbolFrame#asBig` shapes a `group`/`partition` frame contributes to
 * compression, beyond its own ignored rect (`shapes-of.ts#shapeForNode`):
 * the title-tab underline and the title itself. Split out of `shapes-of.ts`
 * (mission add4, T2b) when that file reached its 500-line cap.
 *
 * @see net/sourceforge/plantuml/decoration/symbol/USymbolFrame.java:136-170
 */

import type { ActivityNodeGeo } from '../../activity-geometry.types.js';
import type { StringBounder } from '../../tiles/tile.js';
import type { Theme } from '../../../../core/theme.js';
import type { CompressShape } from './shapes-of.js';
import { activityFontSize } from '../../activity-style-defaults.js';
import { ASCENT_FRACTION } from '../../activity-renderer-shapes.js';
import { compositeTitleWidth } from '../../activity-renderer-composite.js';

/** `USymbolFrame#asBig`'s "Temporary hack" threshold: `if (widthFull -
 *  widthTitle < 25)` (`USymbolFrame.java:153`). */
const SPECIAL_TEXT_MIN_SPARE = 25;
/** `ug.apply(new UTranslate(3, 1))` -- the title's inset inside the frame,
 *  both branches (`USymbolFrame.java:154,156`). */
const TITLE_INSET_X = 3;
const TITLE_INSET_Y = 1;
/** `new UEmpty(1, 1)` (`atmp/SpecialText.java:61`). */
const SPECIAL_TEXT_SLOT = 1;

/**
 * `USymbolFrame#drawFrame`'s title-tab underline (`:76-84`, a `UPath`,
 * `setIgnoreForCompressionOnX()` only -- never Y). `UPath#drawWhenCompressed`
 * is a NO-OP (`klimt/UPath.java:233-234`, unlike `URectangle`'s 2px-edges
 * reservation), so on X it must contribute NOTHING, not a shrunk box --
 * modelled as `'polygon'` with `polygonSkipMode: 'x'` (`slot-finder.ts`'s
 * own `shape.polygonSkipMode !== mode` skip, the one existing CompressShape
 * kind with that "contributes nothing on this axis" semantic). On Y
 * (never skipped) it occupies its full `[y, y+textHeight]` box, exactly
 * `SlotFinder#drawPath`'s own un-ignored branch. `textWidth`/`textHeight`
 * mirror `activity-renderer-composite.ts#renderComposite`'s own formula
 * (same `dimTitle.getWidth() == 0` branch, `USymbolFrame.java:76-84,99-104`).
 */
export function frameTabShape(node: ActivityNodeGeo, theme: Theme): CompressShape {
  const fontSize = activityFontSize(theme, 'composite');
  const titleWidth = compositeTitleWidth(theme, node.label ?? '');
  const textWidth = titleWidth === 0 ? node.width / 3 : titleWidth + 10;
  const textHeight = titleWidth === 0 ? 12 : fontSize + 3;
  return { kind: 'polygon', x: node.x, y: node.y, width: textWidth, height: textHeight, polygonSkipMode: 'x' };
}

/**
 * The frame title's own compression footprint (`USymbolFrame.java:150-156`):
 *
 * - `widthFull - widthTitle < 25`: `title.drawU(ug.apply(new UTranslate(3,
 *   1)))` -- a plain text draw, which `SlotFinder#drawText` registers at its
 *   ink extent (`klimt/compress/SlotFinder.java:127-135`).
 * - otherwise: `draw(new SpecialText(title))`. `SpecialText` is ignorable on
 *   both axes (`atmp/SpecialText.java:55-57`), so `SlotFinder#draw` calls its
 *   `drawWhenCompressed` (`SlotFinder.java:87-92`), which draws a 1x1
 *   `UEmpty` at the title's END, `dx(dimTitle.width)` (`SpecialText.java
 *   :59-62`) -- a single pixel that keeps compression from cutting the
 *   title span while leaving the text itself free to overlap.
 *
 * `null` only for an empty title on the plain-text branch.
 */
export function frameTitleShape(node: ActivityNodeGeo, bounder: StringBounder, theme: Theme): CompressShape | null {
  const title = node.label ?? '';
  const titleWidth = compositeTitleWidth(theme, title);
  const x = node.x + TITLE_INSET_X;
  const y = node.y + TITLE_INSET_Y;
  if (node.width - titleWidth < SPECIAL_TEXT_MIN_SPARE) {
    // An empty `Display` draws no `UText`, so nothing reaches `drawText`.
    if (title === '') return null;
    const fontSize = activityFontSize(theme, 'composite');
    const dim = bounder.getDimension(title, fontSize);
    return { kind: 'text', x, y: y + fontSize * ASCENT_FRACTION, width: titleWidth, height: dim.height };
  }
  return { kind: 'empty', x: x + titleWidth, y, width: SPECIAL_TEXT_SLOT, height: SPECIAL_TEXT_SLOT };
}
