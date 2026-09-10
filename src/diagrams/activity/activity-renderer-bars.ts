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
 * Fork/join bar: a filled, ROUNDED rect, no stroke (`FtileBlackBlock
 * .java:101-110` also strokes the rect in the same colour as the fill --
 * a separately filed defect, not reproduced here per this task's brief).
 */
export function renderBar(node: ActivityNodeGeo, theme: Theme): string {
  return rect(node.x, node.y, node.width, node.height, {
    fill: actColors(theme).barFill,
    rx: FORK_BAR_CORNER_RADIUS,
    ry: FORK_BAR_CORNER_RADIUS,
  });
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
