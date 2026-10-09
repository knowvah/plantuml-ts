/**
 * Fork/split bar rendering, split out of `activity-renderer-shapes.ts` to
 * keep that file (already over the 500-line cap before this mission) from
 * growing further (mission `activity-parallel-connectors`, T3, README
 * "Push forward" -- "equivalent spellings and file organisation").
 *
 * `actColors` is imported back FROM `activity-renderer-shapes.ts`, which in
 * turn imports {@link renderBar}/{@link renderSplitLine} from here for its
 * `renderNode` dispatcher -- a circular import between the two modules,
 * safe the same way `tile-coordinates.ts`/`walk-fork-branches.ts` already
 * are: both sides are function DEFINITIONS, and neither calls into the
 * other until a render actually runs, well after both modules finish
 * loading.
 */

import type { ActivityNodeGeo } from './layout/tile-layout.js';
import type { Theme } from '../../core/theme.js';
import { line, rect } from '../../core/svg.js';
import { actColors } from './activity-renderer-shapes.js';
import { JOIN_LABEL_MARGIN } from './activity-layout-constants.js';
import { activityFontSize } from './activity-style-defaults.js';
import { activityDisplayBlock, activityTextFontConfiguration, drawActivityTextBlock } from './activity-text-sheet.js';
import { klimtStringBounder } from './activity-creole-sheet.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { CreoleMode } from '../../core/klimt/creole/CreoleMode.js';
import { activityMeasurer } from './activity-string-bounder.js';

/**
 * `URectangle.build(width, height).rounded(5)` -- the `5` is upstream's
 * ROUNDING DIAMETER; `DriverRectangleSvg` halves it to the SVG `rx`/`ry`
 * radius this port's `rect()` takes directly (`svg-rect-corners.ts`).
 * Verified on the `bixefi` golden: `rx="2.5" ry="2.5"`.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileBlackBlock.java:101-102
 */
const FORK_BAR_CORNER_RADIUS = 2.5;

/**
 * `ug.apply(UStroke.withThickness(1.5)).draw(rect)` -- the split thin
 * line's height AND its stroke width share the same literal.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileThinSplit.java:61,95
 */
const SPLIT_LINE_THICKNESS = 1.5;

/**
 * `UStroke.simple()` -- thickness 1.0, no dash (`UStroke.java:75-77`). The
 * default canvas stroke in force when `FtileBlackBlock#drawU` draws its rect
 * (no `UStroke.withThickness` call precedes it, unlike the `Worm` decoration
 * draws at `Worm.java:157,165`); confirmed against the `garuga-34-debe901`
 * golden's `stroke-width:1`.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileBlackBlock.java:110
 */
const FORK_BAR_STROKE_WIDTH = 1;

/**
 * Fork/join bar: a ROUNDED rect, stroked AND filled in the resolved bar
 * colour.
 *
 * `ug.apply(colorBar).apply(colorBar.bg()).draw(rect)` -- `colorBar` sets
 * the foreground (stroke) ink, `colorBar.bg()` the SAME colour as the fill;
 * both reach the SVG as one `<rect fill="..." stroke="..."/>` in identical
 * values, never fill-only.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileBlackBlock.java:110
 */
export function renderBar(node: ActivityNodeGeo, theme: Theme): string {
  const fill = actColors(theme).barFill;
  const bar = rect(node.x, node.y, node.width, node.height, {
    fill,
    stroke: fill,
    strokeWidth: FORK_BAR_STROKE_WIDTH,
    rx: FORK_BAR_CORNER_RADIUS,
    ry: FORK_BAR_CORNER_RADIUS,
  });
  return bar + renderJoinBarLabel(node, theme);
}

/**
 * N (add2 T3i): `end fork {label}` -- `FtileBlackBlock#drawU`'s own label
 * draw, same `fcArrow` text config every OTHER in/out link label on this
 * builder uses (`AbstractParallelFtilesBuilder#getTextBlock`). Drawn to
 * the bar's own RIGHT (`x + width + labelMargin`), vertically centred on
 * the bar's TOP edge, not its middle (`drawU`'s own `UTranslate(width +
 * labelMargin, -dimLabel.getHeight() / 2)`, relative to the bar's local
 * origin -- jar-verified against `zafoxu-20-xofe568`: bar top y=133,
 * label baseline y=136.056 = `centeredFirstBaselineY(133, 11, 1)`).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileBlackBlock.java:84-92,110-112
 */
function renderJoinBarLabel(node: ActivityNodeGeo, theme: Theme): string {
  if (node.label === undefined) return '';
  // `AbstractParallelFtilesBuilder#getTextBlock` (`:187-196`): `create7(fc,
  // LEFT, skinParam, CreoleMode.SIMPLE_LINE)` at the arrow style's font.
  const fc = activityTextFontConfiguration(theme, activityFontSize(theme, 'arrow'), 'arrow');
  const tb = activityDisplayBlock(node.label, theme, {
    fontConfiguration: fc,
    horizontalAlignment: HorizontalAlignment.LEFT,
    creoleMode: CreoleMode.SIMPLE_LINE,
  });
  const dim = tb.calculateDimension(klimtStringBounder(activityMeasurer(theme), { family: fc.family, size: fc.size }));
  // `FtileBlackBlock#drawU` (`:110-111`): `UTranslate(width + labelMargin,
  // -dimLabel.getHeight() / 2)` from the bar's own origin.
  const at = { x: node.x + (node.width + JOIN_LABEL_MARGIN), y: node.y + -dim.getHeight() / 2 };
  return drawActivityTextBlock(tb, at, theme, fc);
}

/**
 * Split top/join line: a single horizontal `<line>` at the node's `y`
 * (upstream draws `ULine.hline(last - first)` at `dx(first)` with no
 * vertical offset -- the line sits at the TOP of its 1.5-high reserved
 * band, not its middle). Colour is the activity edge renderer's own arrow
 * colour (`renderer.ts`'s `theme.colors.arrow`) -- upstream's
 * `getThin1Color` (`ParallelBuilderSplit.java:114-125`) falls back to
 * `HColors.none()` only when EVERY branch's in-link is invisible; this
 * port's fork/split AST carries no per-branch link-visibility, so it
 * always takes the visible-link branch, documented here rather than
 * silently guessed.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileThinSplit.java:87-96
 */
export function renderSplitLine(node: ActivityNodeGeo, theme: Theme): string {
  return line(node.x, node.y, node.x + node.width, node.y, {
    stroke: theme.colors.arrow,
    strokeWidth: SPLIT_LINE_THICKNESS,
  });
}
