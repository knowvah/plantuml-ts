/**
 * The `USymbolFrame#asBig` shapes a `group`/`partition` frame contributes to
 * compression, beyond its own ignored rect (`shapes-of.ts#shapeForNode`):
 * the title-tab underline. Split out of `shapes-of.ts`
 * (mission add4, T2b) when that file reached its 500-line cap.
 *
 * @see net/sourceforge/plantuml/decoration/symbol/USymbolFrame.java:136-170
 */

import type { ActivityNodeGeo } from '../../activity-geometry.types.js';
import type { Theme } from '../../../../core/theme.js';
import type { CompressShape } from './shapes-of.js';
import { activityFontSize } from '../../activity-style-defaults.js';
import { compositeTitleWidth } from '../../activity-renderer-composite.js';

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
