/**
 * Terminal-circle renderers: `start`/`stop`/`kill`/`end`, plus the
 * `spot` connector (mission add2-T2g). Split out of
 * `activity-renderer-shapes.ts` (T1c, 500-line hook) -- re-exported from
 * there so existing import sites are unchanged (same "pure-move re-export"
 * pattern as `activity-renderer-signal-shapes.ts`, which this file mirrors
 * by importing {@link actColors}/{@link centeredFirstBaselineY} back from
 * the main shapes module).
 */
import type { ActivityNodeGeo } from './layout/tile-layout.js';
import type { Theme } from '../../core/theme.js';
import { ellipse, line, resolvePaint, type LineStyle } from '../../core/svg.js';
import { END_CROSS_THICKNESS, STOP_INNER_DELTA } from './activity-layout-constants.js';
import {
  CIRCLE_END_LINE_THICKNESS,
  CIRCLE_INK,
  CIRCLE_LINE_THICKNESS,
  ELEMENT_LINE_THICKNESS,
  activityFontSize,
} from './activity-style-defaults.js';
import { activityFontColor } from './activity-text-style.js';
import { measureLineWidth } from './activity-text-placement.js';
import { drawActivityText } from './activity-renderer-text.js';
import { actColors, centeredFirstBaselineY } from './activity-renderer-shapes.js';

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
 * (D7) -- the activity side normalises every line it draws with this
 * SAME helper, rather than depending on a ported compress pass.
 *
 * b3/T3a (family B/ORD): exported so `renderer.ts#renderEdgeSegments` can
 * apply the IDENTICAL swap to every edge segment line, not just this
 * file's end-cross diagonals -- one normalisation, every `<line>` draw
 * site, matching `UGraphicCompressOnXorY.java:142-146`'s own unconditional
 * scope (it wraps the WHOLE diagram, every `ULine`, not a chosen few).
 */
export function orderedLine(x1: number, y1: number, x2: number, y2: number, style: LineStyle): string {
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
    orderedLine(
      node.x + delta,
      node.y + size - delta,
      node.x + delta + size2,
      node.y + size - delta - size2,
      crossStyle,
    )
  );
}

/**
 * `(X)` / `#color:(X)` -- the circled-character connector (mission
 * add2-T2g). `FtileCircleSpot#drawU` (`:98-105,108-109`) fills AND
 * strokes the circle in the merged style's BackgroundColor/LineColor,
 * then draws the character centred via `UCenteredCharacter`. `circle,
 * spot`'s merged `Style` carries NO skinparam convert of its own
 * (confirmed by grep of `FromSkinparamToStyle.java`, unlike `circle,
 * start/stop/end`, which have `activityStartColor`/`activityStopColor`/
 * `activityEndColor`) -- so, unlike {@link renderStart}/{@link renderStop}/
 * {@link renderEnd}, this draws the PLAIN root ink
 * (`theme.colors.nodeBackground`/`theme.colors.border`), never through
 * {@link actColors}'s themed `start`/`stop`/`end` buckets. `color`
 * overrides ONLY the fill (`addSpot(spot, color)`,
 * `ActivityDiagram3.java:131-137`).
 *
 * Stroke width is {@link ELEMENT_LINE_THICKNESS} (0.5), NOT
 * `activityLineThickness(theme, 'circle')`'s own default
 * (`CIRCLE_LINE_THICKNESS` = 1): that default exists for `start`/`stop`/
 * `end`'s own
 * MORE SPECIFIC `circle,start,stop,end{LineThickness 1}` rule
 * (`plantuml.skin:379`), which `circle,spot` has no equivalent of, so its
 * merged style falls through to the generic `element{LineThickness 0.5}`
 * tier instead (`plantuml.skin:93`). Verified against the jar's own SVG
 * (`vilecu-41-tete416`: `stroke:#181818;stroke-width:0.5`), not assumed.
 *
 * The character itself draws as a plain `<text>`, not upstream's
 * `UCenteredCharacter` path-outline glyph -- `DriverCenteredCharacterSvg`
 * is an EXISTING, project-wide, pre-this-task D3-prime stub
 * (`core/klimt/drawing/svg/driver-svg-stubs.ts`: "centered-character
 * drawing ... not yet ported"; the `UCenteredCharacter` shape class does
 * not exist anywhere in this port). A `<text>` substitute preserves the
 * information (which character is shown) that drawing nothing at all
 * would lose (CLAUDE.md's "preserve information-carrying output").
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileCircleSpot.java:84-109
 * @see net/sourceforge/plantuml/style/FromSkinparamToStyle.java:137-139
 */
export function renderSpot(node: ActivityNodeGeo, theme: Theme): string {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const r = node.width / 2;
  const fill = resolvePaint(node.color ?? theme.colors.nodeBackground).value;
  const circle = ellipse(cx, cy, r, r, {
    fill,
    stroke: theme.colors.border,
    'stroke-width': ELEMENT_LINE_THICKNESS,
  });
  const char = node.label ?? '';
  if (char === '') return circle;
  const size = activityFontSize(theme, 'circle');
  const charWidth = measureLineWidth(theme, size, char);
  const text = drawActivityText(cx - charWidth / 2, centeredFirstBaselineY(cy, size, 1), char, {
    fill: activityFontColor(theme, 'circle'),
    fontFamily: theme.fontFamily,
    fontSize: size,
  });
  return circle + text;
}
