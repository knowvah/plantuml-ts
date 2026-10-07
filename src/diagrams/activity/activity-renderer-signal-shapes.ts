/**
 * SDL signal shapes (`<<input>>`/`<<output>>`/`<<save>>` action
 * stereotypes): chevrons and the parallelogram, plus their shared label
 * helper. Split out of `activity-renderer-shapes.ts` (mission
 * `activity-if-tile-port`, T2) to keep that file under the 500-line
 * complexity-hook cap after adding the `if-merge`/`if-label` renderers --
 * a pure-move extraction plus re-export, pre-authorised by the mission's
 * stop condition 1 / README "Push forward" list (same pattern already used
 * by `activity-renderer-bars.ts` for the fork/join bar and split line).
 *
 * `actColors`/`renderMultilineText`/`renderLabel` are imported back FROM
 * `activity-renderer-shapes.ts`, which in turn imports {@link
 * renderChevronLeft}/{@link renderChevronRight}/{@link renderParallelogram}
 * from here for its `renderNode` dispatcher and re-exports all four (plus
 * {@link renderSignalLabel}) so existing importers of
 * `activity-renderer-shapes.js` are unaffected -- a circular import between
 * the two modules, safe the same way `activity-renderer-bars.ts` already
 * documents: both sides are function DEFINITIONS, and neither calls into
 * the other until a render actually runs, well after both modules finish
 * loading.
 */

import type { ActivityNodeGeo } from './layout/tile-layout.js';
import type { Theme } from '../../core/theme.js';
import { polygon } from '../../core/svg.js';
import { activityFontSize, activityLineThickness } from './activity-style-defaults.js';
import { activityFontColor } from './activity-text-style.js';
import { type ActivityTextOpts, activityTextLineX, measureLineWidth } from './activity-text-placement.js';
import { actColors, centeredFirstBaselineY, renderMultilineText, renderLabel } from './activity-renderer-shapes.js';
import { drawActivityText } from './activity-renderer-text.js';
import { floorActionLineHeight } from './tiles/gtile-action.js';

export function renderSignalLabel(label: string, x: number, width: number, cy: number, theme: Theme): string {
  // A signal/chevron is an `FtileBox` with an SDL `BoxStyle`, so it resolves
  // `SName.activity` like the plain box (`FtileBox.java:97-99`, `:146`) --
  // the same SName `tiles/gtile-action.ts` sizes it at, and the same
  // LEFT/CENTER/RIGHT branch (`FtileBox.java:224-233`) the action box uses.
  const size = activityFontSize(theme, 'activity');
  const cx = x + width / 2;
  const opts: ActivityTextOpts = { sname: 'activity', fontSize: size, width };
  const lines = label.split('\n');
  if (lines.length === 1) {
    const lineWidth = measureLineWidth(theme, size, label);
    const lx = activityTextLineX(theme, cx, lineWidth, opts);
    // D1: no `dominant-baseline` (the driver emits none) -- the chevron is
    // sized by the SAME `tiles/gtile-action.ts` FtileBox model the plain
    // action box uses (this function's own doc comment, `FtileBox.java
    // :97-99,146`), so its single-line baseline reduces to the identical
    // N=1 `centeredFirstBaselineY` already jar-verified for that box.
    return drawActivityText(lx, centeredFirstBaselineY(cy, floorActionLineHeight(size), 1), label, {
      fill: activityFontColor(theme, 'activity'),
      fontFamily: theme.fontFamily,
      fontSize: size,
      floorCoordinated: true,
    });
  }
  return renderMultilineText(lines, cx, cy, theme, opts);
}

export function renderChevronLeft(node: ActivityNodeGeo, theme: Theme): string {
  const { x, y, width: w, height: h } = node;
  const c = actColors(theme);
  const fill = node.color ?? c.nodeFill;
  // <<input>> = UML receive signal: flat left side (right-angle corners at
  // top-left and bottom-left). Right side: two lines from top-right and
  // bottom-right corners go inward/left at 60° to horizontal, meeting at
  // the midpoint of the right edge → concave right notch pointing left.
  // dent = (h/2) / tan(60°) = h / (2√3)
  const dent = h / (2 * Math.sqrt(3));
  const shape = polygon(
    [
      { x: x, y: y },
      { x: x + w, y: y },
      { x: x + w - dent, y: y + h / 2 },
      { x: x + w, y: y + h },
      { x: x, y: y + h },
    ],
    { fill, stroke: c.nodeBorder, strokeWidth: activityLineThickness(theme, 'activity') },
  );
  return shape + renderSignalLabel(node.label ?? '', x, w, y + h / 2, theme);
}

export function renderChevronRight(node: ActivityNodeGeo, theme: Theme): string {
  const { x, y, width: w, height: h } = node;
  const c = actColors(theme);
  const fill = node.color ?? c.nodeFill;
  // 60° to horizontal: dent = (h/2) / tan(60°) = h / (2√3)
  const dent = h / (2 * Math.sqrt(3));
  // <<output>> = right-pointing arrow: body rectangle indented on right,
  // vertex pointing right at the midpoint of the right edge.
  const shape = polygon(
    [
      { x: x, y: y },
      { x: x + w - dent, y: y },
      { x: x + w, y: y + h / 2 },
      { x: x + w - dent, y: y + h },
      { x: x, y: y + h },
    ],
    { fill, stroke: c.nodeBorder, strokeWidth: activityLineThickness(theme, 'activity') },
  );
  return shape + renderSignalLabel(node.label ?? '', x, w, y + h / 2, theme);
}

export function renderParallelogram(node: ActivityNodeGeo, theme: Theme): string {
  const { x, y, width: w, height: h } = node;
  const c = actColors(theme);
  const fill = node.color ?? c.nodeFill;
  // Right-leaning parallelogram: interior angles 75° (acute) / 105° (obtuse).
  // tan(75°) = h/d  →  d = h / (2 + √3) = h · (2 − √3)
  const d = h * (2 - Math.sqrt(3));
  const shape = polygon(
    [
      { x: x + d, y: y },
      { x: x + w, y: y },
      { x: x + w - d, y: y + h },
      { x: x, y: y + h },
    ],
    { fill, stroke: c.nodeBorder, strokeWidth: activityLineThickness(theme, 'activity') },
  );
  const cx = x + w / 2;
  const cy = y + h / 2;
  const boxSize = activityFontSize(theme, 'activity');
  const lines = (node.label ?? '').split('\n');
  const labelEl =
    lines.length > 1
      ? // `BoxStyle.SDL_SAVE` (`BoxStyle.java:73`) is still an `FtileBox`, so
        // it resolves `SName.activity` like the plain box (`FtileBox.java
        // :97-99`) -- the same SName `tiles/gtile-action.ts` measured it at.
        renderMultilineText(lines, cx, cy, theme, { sname: 'activity', fontSize: boxSize, width: w })
      : // Same `cy + boxSize/3` box-centre approximation T1b already replaced
        // on the action/diamond/hexagon single-line paths (0.667px off at
        // size 12) -- `BoxStyle.SDL_SAVE` is still an `FtileBox` (this
        // function's own comment above), so the identical N=1
        // `centeredFirstBaselineY` reduction applies here too.
        renderLabel(node.label ?? '', cx, centeredFirstBaselineY(cy, floorActionLineHeight(boxSize), 1), theme, {
          sname: 'activity',
          fontSize: boxSize,
          width: w,
        });
  return shape + labelEl;
}
