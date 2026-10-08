/**
 * Terminal-circle renderers: `start`/`stop`/`kill`/`end`, plus the
 * `spot` connector (mission add2-T2g). Split out of
 * `activity-renderer-shapes.ts` (T1c, 500-line hook) -- re-exported from
 * there so existing import sites are unchanged (same "pure-move re-export"
 * pattern as `activity-renderer-signal-shapes.ts`, which this file mirrors
 * by importing {@link actColors} back from the main shapes module).
 */
import type { ActivityNodeGeo } from './layout/tile-layout.js';
import type { Theme } from '../../core/theme.js';
import type { Paint } from '../../core/paint.js';
import { ellipse, line, path, resolvePaint, text, type LineStyle } from '../../core/svg.js';
import { END_CROSS_THICKNESS, STOP_INNER_DELTA } from './activity-layout-constants.js';
import {
  CIRCLE_END_LINE_THICKNESS,
  CIRCLE_INK,
  CIRCLE_LINE_THICKNESS,
  ELEMENT_LINE_THICKNESS,
} from './activity-style-defaults.js';
import { activityFontColor } from './activity-text-style.js';
import { spotGlyphPath } from './activity-spot-glyph.js';
import { actColors, renderNode } from './activity-renderer-shapes.js';

/**
 * `circle { start, stop, end { LineColor #2 } } }` (`plantuml.skin:379-380`
 * light, `:687-692` `#d` dark) -- the three terminal circles' shared
 * STROKE default. Independent of `activityStartColor`/`activityEndColor`
 * (`Theme['colors']['graph']['activity']`'s `startColor`/`endColor`),
 * which are `BackgroundColor`-only converts (`FromSkinparamToStyle.java:
 * 137-138`) -- there is no upstream skinparam key mapping to `start`/
 * `end`'s `LineColor` at all (confirmed by grep of that file: only `stop`
 * has one, via `ActivityStopColor`, also unported), so this field is
 * NEVER set by a key handler and reads only the dark-mode seed
 * (`skinparam-theme-builder.ts#DARK_SCALAR_SEEDS`) or the light default.
 */
function circleInk(theme: Theme): string {
  return theme.colors.graph.activity?.circleInk ?? CIRCLE_INK;
}

/**
 * add4-T3f: a circle's merged-style colours (`core/activity-circle-style
 * .ts`) -- priority-ordered, so a later `<style> root` (a theme's) or a
 * `skin` beats plantuml.skin's circle rule exactly as upstream merges
 * (`StyleStorage.java:101-115`, `DarkString.java:54-57,73-78`). Each half
 * falls back to the pre-existing default only when absent (a hand-built
 * `Theme`, or an unparsable `<style>` block).
 */
function circleColors(
  theme: Theme,
  leaf: 'start' | 'stop',
  back: Paint,
  line: string,
): { back: string | undefined; line: string | undefined } {
  const merged = theme.colors.graph.activity?.circleStyle?.[leaf];
  return {
    back: resolvePaint(merged?.back ?? back).value,
    line: resolvePaint(merged?.line ?? line).value,
  };
}

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
  // the circle block's own (dark-seedable) {@link circleInk} default; it
  // was wrongly reusing the resolved fill colour, which painted the
  // border red along with the fill under `skinparam ActivityStartColor
  // red` (T2f mechanism 7, `poraji-17-goke817`), and before T2d-a it
  // stayed the light-only `CIRCLE_INK` constant even in dark mode
  // (`levuma-67-cego489`: jar stroke `#DDD`, ours `#222`).
  // add4-T3f: `CircleStart#drawU` -- `lineColor` stroke, `backColor` fill
  // (`svek/image/CircleStart.java:72-82`), both off the merged style.
  const { back, line } = circleColors(theme, 'start', actColors(theme).startFill, circleInk(theme));
  return ellipse(cx, cy, r, r, { fill: back, stroke: line, 'stroke-width': CIRCLE_LINE_THICKNESS });
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
export function renderStop(node: ActivityNodeGeo, theme: Theme): string {
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
  // `ActivityStopColor`-reading theme field exists yet (would need its
  // own dedicated field the same way {@link circleInk} is its own field,
  // not this task's `circleInk` -- reported, not added), so this reads
  // the plain circle-block default (dark-seeded via {@link circleInk}),
  // same as the jar does absent that skinparam (T2d-a: was the light-only
  // `CIRCLE_INK` constant; `levuma-67-cego489`'s jar SVG shows BOTH
  // ellipses at `fill`/`stroke` `#DDD` in dark mode, ours stayed `#222`).
  // add4-T3f: `CircleEnd#drawU` -- outer ring `lineColor`, inner disc
  // `backColor` fill + `lineColor` stroke (`CircleEnd.java:74-102`; equal
  // colours take `HColors.middle`, which is that same colour). Both off the
  // merged style, which carries `ActivityStopColor` too (`LineColor`,
  // `FromSkinparamToStyle.java:139`).
  const ink = circleInk(theme);
  const { back, line } = circleColors(theme, 'stop', ink, ink);
  return (
    ellipse(cx, cy, outerR, outerR, {
      fill: 'none',
      stroke: line,
      'stroke-width': CIRCLE_LINE_THICKNESS,
    }) + ellipse(cx, cy, innerR, innerR, { fill: back, stroke: line, 'stroke-width': CIRCLE_LINE_THICKNESS })
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
 * T3g: the character itself now draws as the platform AWT glyph OUTLINE
 * `UCenteredCharacter` actually produces (`:110-111`), via
 * {@link spotGlyphPath}'s captured-table lookup -- replacing the earlier
 * plain-`<text>` substitute (`activity-spot-glyph-data.ts`'s own doc
 * comment: `DriverCenteredCharacterSvg.java:56-81`'s `<text>` branch
 * (`:64-69`) fires only for `FileFormat.SVG_DETERMINISTIC`, a format this
 * port's oracle renders never select, so the jar always draws the `<path>`
 * branch; `svg.setFillColor(fc.getColor())` at `:79`, independent of this
 * circle's own `backColor`/`color` override). A letter with no captured
 * outline still falls back to that `<text>` branch's own literal geometry
 * (`x - 5, y + 5`, `monospace`, size 14) rather than drawing nothing --
 * {@link spotGlyphPath}'s own doc comment names which letters that is
 * (none, today: every corpus letter is captured).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileCircleSpot.java:84-111
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
  const glyphFill = activityFontColor(theme, 'circle');
  const d = spotGlyphPath(char, cx, cy);
  const glyph =
    d === undefined
      ? text(cx - 5, cy + 5, char, { fill: glyphFill, fontFamily: 'monospace', fontSize: 14 })
      : path(d, { fill: glyphFill });
  return circle + glyph;
}

/** The `UParam` default stroke a `UGraphic` carries before any `.apply(
 *  UStroke)` -- `UStroke.simple()`, thickness 1. `drawGoto` applies colours
 *  only, so its two lines keep it. Same value as `renderer.ts`'s private
 *  `SIMPLE_STROKE_WIDTH` (not exported; outside this task's write-set).
 * @see net/sourceforge/plantuml/klimt/UStroke.java:75-77 */
const GOTO_STROKE_WIDTH = 1;

/**
 * `FtileGoto`'s jump line, drawn by the dispatcher rather than the tile
 * (`FtileGoto` itself draws nothing): from the goto's point-in --
 * `FtileEmpty`'s `(width / 2, 0)`, i.e. the zero-size node's own `(x, y)`
 * -- `ULine.hline(dx)` then, translated by `dx`, `ULine.vline(dy)` to the
 * recorded label translate. Coloured by `gotoColor`, the merged
 * `activityDiagram.goto` LineColor (`Swimlanes.java:246-249`); `plantuml.skin`
 * has no `goto` rule, so that is root `LineColor` -- `theme.colors.border`.
 * No stroke is applied, so the default `UStroke` (thickness 1). A goto with
 * no label drawn before it (`dest == null`) draws nothing (`:108-109`).
 * Both lines go through {@link orderedLine}: a jump back up has `dy < 0`.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/UGraphicDispatchFtile.java:101-119
 */
function renderGoto(node: ActivityNodeGeo, dest: { x: number; y: number } | undefined, theme: Theme): string {
  if (dest === undefined) return '';
  const style = { stroke: theme.colors.border, strokeWidth: GOTO_STROKE_WIDTH };
  return orderedLine(node.x, node.y, dest.x, node.y, style) + orderedLine(dest.x, node.y, dest.x, dest.y, style);
}

/**
 * `UGraphicDispatchFtile#draw` over a node sequence in draw order: every
 * node renders as {@link renderNode}; a `label` node records its translate
 * under its name (`positions.put`, so a later label of the same name wins)
 * AFTER drawing, and a `goto` node appends {@link renderGoto} after its own
 * (empty) draw. A node flagged `dispatched: false` was drawn by its
 * parent's direct `drawU` call, which never reaches the dispatcher's
 * `instanceof` hooks (`vertical/FtileDecorate.java:79-80`), so it is
 * neither recorded nor drawn. Upstream installs the dispatcher only on the single-lane
 * path (`Swimlanes.java:251-258` -- `drawWhenSwimlanes` never wraps it), so
 * this is for the plain node loop, not the swimlane chrome pass.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/UGraphicDispatchFtile.java:70-85
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/TextBlockInterceptorUDrawable.java:61-64
 */
export function renderNodesDispatchingGotos(nodes: readonly ActivityNodeGeo[], theme: Theme): string[] {
  const positions = new Map<string, { x: number; y: number }>();
  return nodes.map((node) => {
    const svg = renderNode(node, theme);
    const name = node.label ?? '';
    if (node.dispatched === false) return svg;
    if (node.kind === 'label') positions.set(name, { x: node.x, y: node.y });
    if (node.kind === 'goto') return svg + renderGoto(node, positions.get(name), theme);
    return svg;
  });
}
