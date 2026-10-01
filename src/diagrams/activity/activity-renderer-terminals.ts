/**
 * Terminal-circle renderers: `start`/`stop`/`kill`/`end`. Split out of
 * `activity-renderer-shapes.ts` (T1c, 500-line hook) -- re-exported from
 * there so existing import sites are unchanged (same "pure-move re-export"
 * pattern as `activity-renderer-signal-shapes.ts`, which this file mirrors
 * by importing {@link actColors} back from the main shapes module).
 */
import type { ActivityNodeGeo } from './layout/tile-layout.js';
import type { Theme } from '../../core/theme.js';
import { ellipse, line, resolvePaint, type LineStyle } from '../../core/svg.js';
import { END_CROSS_THICKNESS, KILL_INNER_RATIO, STOP_INNER_DELTA } from './activity-layout-constants.js';
import { CIRCLE_END_LINE_THICKNESS, CIRCLE_INK, CIRCLE_LINE_THICKNESS } from './activity-style-defaults.js';
import { actColors } from './activity-renderer-shapes.js';

export function renderStart(node: ActivityNodeGeo, theme: Theme): string {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const r = node.height / 2;
  // @see DriverEllipseSvg.java -- upstream's start/end/kill circles are all
  // UEllipse shapes, never a dedicated circle driver. `resolvePaint` here
  // replicates `circle()`'s own pipeline byte-identically: `ellipse()`'s
  // `extraAttrs` only shortens an ALREADY-hex string, not a named CSS
  // colour, the way `circle()` did via `paintToSvg`. `LineThickness 1` on
  // the start/stop/end block (plantuml.skin:378): the jar fills AND
  // strokes the start terminal, but NOT in the same colour --
  // `FromSkinparamToStyle.java:137`: `addConvert("activityStartColor",
  // PName.BackGroundColor, SName.circle, SName.start)` -- `ActivityStart
  // Color` maps ONLY to the FILL, never `LineColor`. The stroke is always
  // the circle block's own default (`CIRCLE_INK`); it was wrongly reusing
  // the resolved fill colour, which painted the border red along with the
  // fill under `skinparam ActivityStartColor red` (T2f mechanism 7,
  // `poraji-17-goke817`).
  const fill = resolvePaint(actColors(theme).startFill).value;
  return ellipse(cx, cy, r, r, { fill, stroke: CIRCLE_INK, 'stroke-width': CIRCLE_LINE_THICKNESS });
}

/**
 * `stop` draws nothing itself -- `FtileCircleStop#drawU` (`:87-89`)
 * delegates to a `CircleEnd` field. `CircleEnd#drawU` (`svek/image/
 * CircleEnd.java:72-103`): outer ellipse unfilled, stroked in the resolved
 * circle ink at the block's own `LineThickness 1` (plantuml.skin:378);
 * inner ellipse inset by `delta` (`STOP_INNER_DELTA`, `:88`) on every side,
 * filled in the same ink. `outerR` is `node.height/2` (the tile and the
 * drawn ellipse share one SIZE by construction, `gtile-stop.ts`), so
 * `innerR = outerR - delta`, never an independent fraction (the old
 * `* 0.55` was unsourced and is deleted -- D3).
 *
 * The inner ellipse's draw call (`:102`) carries no EXPLICIT
 * `.apply(style.getStroke())` in its own chain -- reading the method body
 * alone suggests it inherits whatever ambient stroke the caller's `ug` had
 * on entry. The jar's own rendered SVG (`bareka-88-fusu160`,
 * `numalo-91-pole243`) settles it: BOTH ellipses carry the identical
 * `stroke:#222;stroke-width:1`, so this port draws the inner ellipse with
 * the SAME explicit stroke/width as the outer one, not bare `fill`.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileCircleStop.java:55,87-94
 * @see net/sourceforge/plantuml/svek/image/CircleEnd.java:55,72-103
 */
// `theme` is unused now that `stop`'s ink is the plain circle-block
// default (see the mechanism-7 comment below) -- kept for signature
// parity with every other `render*(node, theme)` dispatch target.
export function renderStop(node: ActivityNodeGeo, _theme: Theme): string {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const outerR = node.height / 2;
  const innerR = outerR - STOP_INNER_DELTA;
  // `FromSkinparamToStyle.java:139`: `addConvert("activityStopColor",
  // PName.LineColor, SName.circle, SName.stop)` -- `stop` has its OWN
  // skinparam target, distinct from `end`'s `activityEndColor` (`:138`,
  // `SName.circle, SName.end`). Reusing `actColors(theme).endFill` here
  // made `stop` incorrectly inherit `ActivityEndColor` (T2f mechanism 7,
  // `poraji-17-goke817`: `ActivityEndColor red` left `stop` red). No
  // `ActivityStopColor`-reading theme field exists yet (would need a
  // `core/theme-graph-colors-b.ts` addition, out of this task's write-set
  // -- reported, not added), so this reads the plain circle-block
  // default unconditionally, same as the jar does absent that skinparam.
  const ink = CIRCLE_INK;
  return (
    ellipse(cx, cy, outerR, outerR, {
      fill: 'none',
      stroke: ink,
      'stroke-width': CIRCLE_LINE_THICKNESS,
    }) + ellipse(cx, cy, innerR, innerR, { fill: ink, stroke: ink, 'stroke-width': CIRCLE_LINE_THICKNESS })
  );
}

/**
 * `kill`'s bullseye glyph -- historically drawn by the SAME code path as
 * `stop` (both dispatched to the pre-T1c `renderStop`), sharing its old
 * unsourced `outerR * 0.55` inner ratio. T1c (D3) corrected `stop` to the
 * Java-cited `CircleEnd` geometry above, which would have changed `kill`'s
 * pixels too since `kill`'s own tile height differs from `stop`'s post-fix
 * height -- so `kill` keeps its OWN copy of the pre-fix formula here,
 * decoupled from `stop`, via the renamed `KILL_INNER_RATIO` constant
 * (`activity-layout-constants.ts`). `kill`'s own upstream mechanism
 * (`FtileKilled`/`FtileCircleKill`) was not read this task; this function
 * exists only to keep its rendered output byte-identical until T2b
 * (detach/kill) sources it properly.
 */
export function renderKill(node: ActivityNodeGeo, theme: Theme): string {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const outerR = node.height / 2;
  const innerR = outerR * KILL_INNER_RATIO;
  const c = actColors(theme);
  return (
    ellipse(cx, cy, outerR, outerR, {
      fill: 'none',
      stroke: resolvePaint(c.endFill).value,
      'stroke-width': CIRCLE_LINE_THICKNESS,
    }) + ellipse(cx, cy, innerR, innerR, { fill: resolvePaint(c.endFill).value })
  );
}

/**
 * Every `<line>` the jar's activity engine emits has `y1 <= y2` --
 * `ActivityDiagram3.java` wraps the WHOLE diagram's drawing `UGraphic` in
 * `CompressionXorYBuilder`'s pair of `UGraphicCompressOnXorY` (ON_X then
 * ON_Y, per the project's own `activity-klimt-compress` mission), and
 * THAT class's private `drawLine(x1,y1,x2,y2)` (`UGraphicCompressOnXorY
 * .java:142-148`) swaps the endpoints whenever `y1 > y2` before drawing:
 * `if (y1 > y2) { drawLine(x2, y2, x1, y1); return; }`. A `ULine` with a
 * NEGATIVE `dy` (e.g. `FtileCircleEndCross`'s second diagonal, `size2,
 * -size2`) therefore serialises with its start/end swapped relative to
 * the raw `UTranslate`+`ULine` arithmetic (T2f mechanism 2, verified
 * against `fabexi-81-dife869`'s jar SVG byte-for-byte: the two points are
 * identical, only the x1/y1 vs x2/y2 assignment is transposed). This
 * compress wrapper lives under `core/klimt/**`, which T2f may not edit
 * (D7) -- the activity side normalises the one line it draws with a
 * negative `dy` instead of depending on a ported compress pass.
 */
function orderedLine(x1: number, y1: number, x2: number, y2: number, style: LineStyle): string {
  return y1 > y2 ? line(x2, y2, x1, y1, style) : line(x1, y1, x2, y2, style);
}

/**
 * Renders an `end` node: an unfilled, stroked circle plus an inset X --
 * `FtileCircleEndCross#drawU` (`:98-117`), which draws itself (no
 * delegate, unlike `stop`). Outer ellipse: `SIZE = 20` (`:61`), stroked at
 * `circle { end { LineThickness 1.5 } }` (plantuml.skin:383, `:106-107`).
 * Cross (`:109-115`): a HARDCODED `thickness = 2.5` (`END_CROSS_THICKNESS`,
 * independent of the style's stroke), `size2 = (SIZE - thickness) /
 * sqrt(2)`, `delta = (SIZE - size2) / 2` -- two diagonals inset `delta`
 * from the tile's own bounding box, NOT tip-to-border lines through the
 * centre at the outer radius (the old `r * SQRT1_2` construction was
 * unsourced and is deleted). The second diagonal's `dy` is negative
 * (`-size2`), so it goes through {@link orderedLine} (T2f mechanism 2).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileCircleEndCross.java:61,98-121
 */
export function renderEnd(node: ActivityNodeGeo, theme: Theme): string {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const r = node.height / 2;
  const size = node.height;
  const size2 = (size - END_CROSS_THICKNESS) / Math.SQRT2;
  const delta = (size - size2) / 2;
  const endFill = actColors(theme).endFill;
  const crossStyle = { stroke: endFill, strokeWidth: END_CROSS_THICKNESS };
  return (
    ellipse(cx, cy, r, r, {
      fill: 'none',
      stroke: resolvePaint(endFill).value,
      'stroke-width': CIRCLE_END_LINE_THICKNESS,
    }) +
    orderedLine(node.x + delta, node.y + delta, node.x + delta + size2, node.y + delta + size2, crossStyle) +
    orderedLine(node.x + delta, node.y + size - delta, node.x + delta + size2, node.y + size - delta - size2, crossStyle)
  );
}
