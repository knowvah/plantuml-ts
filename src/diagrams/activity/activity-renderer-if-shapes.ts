/**
 * `if-merge` and `if-label` node renderers (mission `activity-if-tile-port`,
 * D2/D3). Split into their own module (not added inline to
 * `activity-renderer-shapes.ts`) because that file was already at the
 * 500-line complexity-hook cap before this task -- the same "Push forward"
 * split `activity-renderer-bars.ts`/`activity-renderer-signal-shapes.ts`
 * already use for the identical reason.
 *
 * `actColors` is imported back FROM `activity-renderer-shapes.ts`, which in
 * turn imports {@link renderIfMerge}/{@link renderIfLabel} from here for its
 * `renderNode` dispatcher -- a circular import between the two modules,
 * safe the same way `activity-renderer-bars.ts` already documents: both
 * sides are function DEFINITIONS, and neither calls into the other until a
 * render actually runs, well after both modules finish loading.
 */

import type { ActivityNodeGeo } from './layout/tile-layout.js';
import type { Theme } from '../../core/theme.js';
import { text, polygon } from '../../core/svg.js';
import { activityFontSize, activityLineThickness } from './activity-style-defaults.js';
import { activityFontColor } from './activity-text-style.js';
import { actColors, ASCENT_FRACTION, textLines } from './activity-renderer-shapes.js';

/**
 * The merge rhombus (`diamond2`, D2) -- `FtileDiamond#drawU`'s
 * `Hexagon.asPolygon(shadowing)` (`vertical/FtileDiamond.java:89`), a
 * 4-point rhombus (`Hexagon.java:49-56`: `(12,0) (24,12) (12,24) (0,12)`)
 * translated to the node's own `(x, y)` -- the walker places the node so
 * this 24x24 box is exactly the drawn extent (D2's interface contract).
 * Same fill/stroke pair `renderDiamond` draws with, plus the explicit
 * `diamond` bucket's line thickness (`FtileDiamond.java:89`'s
 * `.apply(getStyle().getStroke())` -- the diamond style's own stroke,
 * `renderHexagon`'s `activityLineThickness(theme, 'diamond')` call resolves
 * the same style bucket) so a `diamond { LineThickness }` override is not
 * silently dropped on the rhombus.
 */
export function renderIfMerge(node: ActivityNodeGeo, theme: Theme): string {
  const c = actColors(theme);
  return polygon(
    [
      { x: node.x + 12, y: node.y },
      { x: node.x + 24, y: node.y + 12 },
      { x: node.x + 12, y: node.y + 24 },
      { x: node.x, y: node.y + 12 },
    ],
    { fill: c.diamondFill, stroke: c.diamondBorder, strokeWidth: activityLineThickness(theme, 'diamond') },
  );
}

/**
 * A branch/condition label (D3) -- `getLabelPositive`'s `TextBlock` resolves
 * the ARROW style (`ConditionalBuilder.java:117,280-283`), drawn
 * unconditionally LEFT-aligned (`HorizontalAlignment.LEFT`,
 * `ConditionalBuilder.java:280`) starting at the node's own `x` -- NOT
 * routed through `activity-text-placement.ts#activityTextLineX`'s
 * width/theme-alignment dispatch (that module's `'activity'`/`'diamond'`
 * union has no LEFT-fixed case, and applying its `'activity'`-bucket
 * padding here would put the label at the wrong `x` on a diagram with a
 * non-default `HorizontalAlignment` skinparam). `node.x`/`node.y` are the
 * walker's own placed top-left (D3), already at the jar's `UTranslate`; the
 * baseline offset is Q5's convention (`.agent-notes/aitp-T1.md#q5`):
 * `y0 + ARROW_FONT_SIZE * ASCENT_FRACTION`.
 */
export function renderIfLabel(node: ActivityNodeGeo, theme: Theme): string {
  const fontSize = activityFontSize(theme, 'arrow');
  const label = node.label ?? '';
  const lines = label.split('\n');
  const baselineY = node.y + fontSize * ASCENT_FRACTION;
  const fill = activityFontColor(theme, 'arrow');
  if (lines.length > 1) {
    return textLines(lines, node.x, baselineY, fontSize, { fontFamily: theme.fontFamily, fontSize, fill });
  }
  return text(node.x, baselineY, label, { fontFamily: theme.fontFamily, fontSize, fill });
}
