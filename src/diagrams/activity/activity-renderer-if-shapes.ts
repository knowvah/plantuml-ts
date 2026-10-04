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
import type { Paint } from '../../core/paint.js';
import { polygon } from '../../core/svg.js';
import { activityFontSize, activityLineThickness } from './activity-style-defaults.js';
import { HEXAGON_HALF_SIZE } from './layout/hexagon-reservations.js'; // Hexagon.java:46
import { activityFontColor } from './activity-text-style.js';
import {
  actColors,
  ASCENT_FRACTION,
  centeredFirstBaselineY,
  renderHexagonLabel,
  textLines,
} from './activity-renderer-shapes.js';
import { drawActivityText } from './activity-renderer-text.js';
import { centeredLineX, measureLineWidth, type ActivityTextOpts } from './activity-text-placement.js';

/**
 * The merge rhombus (`diamond2`, D2) -- `FtileDiamond#drawU`'s
 * `Hexagon.asPolygon(shadowing)` (`vertical/FtileDiamond.java:89`), a
 * 4-point rhombus translated to the node's own `(x, y)` -- the walker
 * places the node so this 24x24 box is exactly the drawn extent (D2's
 * interface contract). `Hexagon.asPolygon(double)` (`Hexagon.java:48-55`)
 * calls `addPoint` FIVE times, re-adding `(12,0)` as the closing point
 * after `(0,12)` (`Hexagon.java:51,55`: `diams.addPoint(hexagonHalfSize,
 * 0)` opens and closes the list) -- `UPolygon` does not close itself on
 * draw (T2f mechanism 1, `daxare-39-buci637`: jar `points="...,68.725,119,
 * 80.725,107"` repeats the first pair). `svg-shapes.ts#polygon` only joins
 * the points it is given (no implicit closing), so the activity side
 * repeats the first point explicitly, same as the hexagon
 * ({@link renderHexagon}).
 * Same fill/stroke pair `renderDiamond` draws with, plus the explicit
 * `diamond` bucket's line thickness (`FtileDiamond.java:89`'s
 * `.apply(getStyle().getStroke())` -- the diamond style's own stroke,
 * `renderHexagon`'s `activityLineThickness(theme, 'diamond')` call resolves
 * the same style bucket) so a `diamond { LineThickness }` override is not
 * silently dropped on the rhombus.
 */
export function renderIfMerge(node: ActivityNodeGeo, theme: Theme): string {
  const c = actColors(theme);
  const first = { x: node.x + 12, y: node.y };
  return polygon(
    [
      first,
      { x: node.x + 24, y: node.y + 12 },
      { x: node.x + 12, y: node.y + 24 },
      { x: node.x, y: node.y + 12 },
      first,
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
/**
 * The repeat-entry rhombus (`repeat-start`) and the label-less `if-split`/
 * `while-header` diamond both resolve to `FtileDiamond#drawU`
 * (`vertical/FtileDiamond.java:89`): `ug.apply(borderColor)
 * .apply(getStyle().getStroke()).apply(backColor.bg())
 * .draw(Hexagon.asPolygon(shadowing))` -- the SAME method as
 * {@link renderIfMerge} above, just the entry diamond rather than the merge
 * diamond. `Hexagon.asPolygon(double)` (`Hexagon.java:48-55`) calls
 * `addPoint` FIVE times, re-adding `(12,0)` as the closing point after
 * `(0,12)` -- `UPolygon` does not close itself on draw, and
 * `SvgGraphics.java:658` unconditionally adds
 * `stroke-linejoin:miter;stroke-miterlimit:10` to every polygon it draws.
 * This was the one remaining caller of the generic `core/svg.ts#diamond`
 * helper (open 4-point rhombus, no stroke-width/linejoin) -- the SAME
 * open-polygon gap {@link renderIfMerge} already fixed for `diamond2` (T2f
 * mechanism 1; this gap: `vaxuta-95-cico162` and the other repeat-entry
 * rows, b2 journal row 34). Switched to the same `polygon()` emitter +
 * closed 5-point list {@link renderIfMerge} uses, so a `diamond
 * { LineThickness }` override reaches this rhombus too (`getStyle()
 * .getStroke()` resolves the SAME `diamond` style bucket
 * `activityLineThickness(theme, 'diamond')` already reads there).
 * `core/svg.ts#diamond` keeps its other callers (state/chronology diagrams
 * draw different Java shapes there) -- not touched.
 */
export function renderDiamond(node: ActivityNodeGeo, theme: Theme): string {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const size = node.width / 2;
  const c = actColors(theme);
  const first = { x: cx, y: cy - size };
  const shape = polygon([first, { x: cx + size, y: cy }, { x: cx, y: cy + size }, { x: cx - size, y: cy }, first], {
    fill: c.diamondFill,
    stroke: c.diamondBorder,
    strokeWidth: activityLineThickness(theme, 'diamond'),
  });
  if (node.label === undefined || node.label === '') return shape;
  // `activityDiagram { diamond { FontSize 11 } }` (plantuml.skin:370), the
  // same value `tiles/gtile-diamond.ts` measured it at. `x` is
  // `FtileDiamondInside.java:94-96`'s `lx = (dimTotal.width -
  // dimLabel.width) / 2` in this node's own frame.
  const fontSize = activityFontSize(theme, 'diamond');
  const lineWidth = measureLineWidth(theme, fontSize, node.label);
  // D1: no `dominant-baseline` (the driver emits none, and no cached jar
  // SVG carries one) -- the real baseline is the same N=1 reduction of
  // `centeredFirstBaselineY` `renderHexagon`'s single-line branch uses.
  const label = drawActivityText(centeredLineX(cx, lineWidth), centeredFirstBaselineY(cy, fontSize, 1), node.label, {
    fontFamily: theme.fontFamily,
    fontSize,
    fill: activityFontColor(theme, 'diamond'),
  });
  return shape + label;
}

export function renderIfLabel(node: ActivityNodeGeo, theme: Theme): string {
  const fontSize = activityFontSize(theme, 'arrow');
  const label = node.label ?? '';
  const lines = label.split('\n');
  const baselineY = node.y + fontSize * ASCENT_FRACTION;
  const fill = activityFontColor(theme, 'arrow');
  if (lines.length > 1) {
    return textLines(lines, node.x, baselineY, fontSize, { fontFamily: theme.fontFamily, fontSize, fill });
  }
  return drawActivityText(node.x, baselineY, label, { fontFamily: theme.fontFamily, fontSize, fill });
}

/**
 * The hexagon shape ALONE, no label -- `FtileDiamondInside#drawU` draws
 * the polygon, then north/south, then the own label, then west/east, as
 * FIVE separate draw calls, never one combined blob
 * (`vertical/FtileDiamondInside.java:84-102`). Split out of `activity-
 * renderer-shapes.ts#renderHexagon` (T3k, that file at the 500-line cap)
 * so a walker can push the polygon and the own label as two separate
 * nodes, landing the label between south and west in document order --
 * `renderHexagon` itself is unchanged (still shape+label in one call) and
 * stays the renderer that module's own tests exercise directly. Identical
 * polygon math to `renderHexagon`'s own (not re-derived).
 */
export function renderHexagonPolygon(node: ActivityNodeGeo, theme: Theme): string {
  const { x, y, width: w, height: h } = node;
  const c = actColors(theme);
  const fill = node.color ?? c.diamondFill;
  // I (T3d): fixed dent `HEXAGON_HALF_SIZE` (12), not `height/2` -- same
  // fix as `renderHexagon`'s own copy, `activity-renderer-shapes.ts`.
  const dent = HEXAGON_HALF_SIZE;
  const first = { x: x + dent, y: y };
  return polygon(
    [
      first,
      { x: x + w - dent, y: y },
      { x: x + w, y: y + h / 2 },
      { x: x + w - dent, y: y + h },
      { x: x + dent, y: y + h },
      { x: x, y: y + h / 2 },
      first,
    ],
    { fill, stroke: c.diamondBorder, strokeWidth: activityLineThickness(theme, 'diamond') },
  );
}

/**
 * The hexagon's OWN label alone, centered in the node's own box -- the
 * SAME `cx`/`cy`/`condSize` geometry `renderHexagon` already used, just
 * callable on its own so a walker can push it as its own `'if-own-label'`
 * node (T3k, {@link renderHexagonPolygon}'s own doc).
 */
export function renderHexagonOwnLabel(node: ActivityNodeGeo, theme: Theme): string {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const condSize = activityFontSize(theme, 'diamond');
  return renderHexagonLabel(node.label, cx, cy, theme, condSize);
}

/**
 * {@link renderHexagonLabel}'s multi-line branch (IFNL, T3d,
 * `vaxiki-78-nice114`). Root's default `HorizontalAlignment left`
 * (`plantuml.skin:12`; `activityDiagram { diamond {} }` never overrides
 * it, `plantuml.skin:369-371`) positions every `Sheet` stripe at the
 * label TextBlock's own local `x=0` -- the WHOLE block is centred ONCE
 * (`FtileDiamondInside.java:94-96`'s `lx = (dimTotal.width -
 * dimLabel.width) / 2`), never each line on its own width. This is NOT
 * `activity-renderer-shapes.ts#renderMultilineText`'s per-line `coef`
 * centring -- that formula is verified correct for `FtileBox` action
 * text specifically (`activity-text-placement.ts`'s own doc), a
 * genuinely different Java draw path from the diamond's label TextBlock.
 */
export function renderHexagonMultilineLabel(
  lines: string[],
  cx: number,
  cy: number,
  theme: Theme,
  opts: ActivityTextOpts,
): string {
  const condSize = opts.fontSize ?? activityFontSize(theme, 'diamond');
  const maxWidth = Math.max(...lines.map((ln) => measureLineWidth(theme, condSize, ln)));
  const style = { fontFamily: theme.fontFamily, fontSize: condSize, fill: activityFontColor(theme, opts.sname) };
  return textLines(lines, cx - maxWidth / 2, centeredFirstBaselineY(cy, condSize, lines.length), condSize, style);
}

/**
 * J (T3d, `kafevi-44-tesu096`): the diamond's own style signature
 * `{root,element,activityDiagram,activity,diamond}` CONTAINS
 * `SName.activity` (`StyleSignatureBasic.java:271-273`), so `activity {
 * BackgroundColor/BorderColor }` cascades onto the diamond before the
 * global default -- the same tier order `activityLineThickness`'s own
 * `'arrow'` cascade already uses. Split out of `actColors`
 * (`activity-renderer-shapes.ts`, at the 500-line cap) to keep that
 * function's own CCN from rising.
 */
export function diamondColors(
  act: Theme['colors']['graph']['activity'],
  theme: Theme,
): { fill: Paint; border: string } {
  return {
    fill: act?.diamondBackground ?? act?.background ?? theme.colors.nodeBackground,
    border: act?.diamondBorder ?? act?.border ?? theme.colors.border,
  };
}
