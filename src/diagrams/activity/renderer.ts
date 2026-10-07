/**
 * Activity diagram SVG renderer.
 *
 * Pure function: ActivityGeometry + Theme → SVG string.
 * No DOM, no async.
 */

import type { ActivityGeometry, ActivityEdgeGeo } from './layout/tile-layout.js';
import type { Theme } from '../../core/theme.js';
import type { RenderFragment } from '../../core/dispatcher.js';
import { polygon, text } from '../../core/svg.js';
import {} from '../../core/latex.js';
import { renderNode, centeredFirstBaselineY } from './activity-renderer-shapes.js';
import { orderedLine } from './activity-renderer-terminals.js';
import { drawActivityText, drawActivityTextLines } from './activity-renderer-text.js';
import { renderSwimlaneChrome, renderSwimlaneTitles } from './activity-renderer-swimlanes.js';
import { activityArrowHeadColor, activityFontSize, activityLineThickness } from './activity-style-defaults.js';
import { activityFontColor } from './activity-text-style.js';
import { measureLineWidth } from './activity-text-placement.js';
import { DEFAULT_LABEL_ALIGN, getTextBlockPosition, type SnakeTextAlign } from './layout/snake-text-position.js';
import { arrowDirection, arrowHeadPointsFor, type ArrowDir } from './arrows-regular.js';
import { noGradient } from '../../core/paint.js';
import { edgeDecorationVector } from './layout/compress/shapes-of-terminal.js';
import { ACTIVITY_DOCUMENT_MARGIN, SVG_CANVAS_CEIL } from './activity-layout-constants.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The `data-diagram-type` root attribute value the jar stamps on every
 *  exported activity document -- `net.sourceforge.plantuml.core.DiagramType`
 *  (`DiagramType.java:45`), written by `TextBlockExporter
 *  #createUGraphicSVG` (`core/TextBlockExporter.java:293`). Setting it is
 *  what routes this fragment through `core/assemble-svg.ts`'s klimt document
 *  shell instead of the generic `svgRoot`, mirroring the per-engine constant
 *  class/state/description/json each declare for the same purpose. */
const DIAGRAM_TYPE_ACTIVITY = 'ACTIVITY';

// ---------------------------------------------------------------------------
// Label helpers
// ---------------------------------------------------------------------------

/** `UStroke.simple()` -- thickness 1.0 (`klimt/UStroke.java:75-77`), the
 *  stroke every start/end decoration draws through (`Worm.java:159,166`). */
const SIMPLE_STROKE_WIDTH = 1;

/**
 * Draw the `ArrowsRegular`/`ArrowsTriangle` decoration (`arrows-regular.ts`,
 * D4) at `tip`, oriented by the segment direction `vector`. Bundled into
 * two point-shaped params (rather than four numbers) to stay under this
 * file's 5-param complexity limit once `theme` (D4's strictuml selector)
 * joined `color`.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Worm.java:154-168
 * (`drawInternalOneColor`'s `startDecoration`/`endDecoration` draw).
 */
function arrowTip(
  tip: { x: number; y: number },
  vector: { dx: number; dy: number },
  color: string,
  theme: Theme,
  strokeWidth = SIMPLE_STROKE_WIDTH,
): string {
  const { x, y } = tip;
  const { dx, dy } = vector;
  if (dx === 0 && dy === 0) return '';
  const dir = arrowDirection(dx, dy);
  const points = arrowHeadPointsFor(theme, dir).map((p) => ({ x: x + p.x, y: y + p.y }));
  return polygon(
    points,
    // The arrow DECORATION draws through `.apply(UStroke.simple())`
    // (`ftile/Worm.java:159,166`), which is thickness 1.0
    // (`klimt/UStroke.java:75-77`) -- NOT the `UStroke.withThickness(1.5)`
    // applied to `ug` two lines earlier, which those `.apply` calls
    // override before the draw. Upstream applies `arrowHeadColor` to both
    // the foreground and the background (`Worm.java:152-153`), so the
    // decoration is filled AND stroked in the same colour; this port drew a
    // fill alone.
    { fill: color, stroke: color, strokeWidth },
  );
}

/**
 * {@link renderEdgeLabel}'s draw, positioned by {@link getTextBlockPosition} (T1b's port of `Snake
 * #getTextBlockPosition`, `Snake.java:244-270`); split into its own
 * function to keep `renderEdgeLabel` under this file's NLOC limit.
 * `activityDiagram { arrow { FontSize 11 } }` (plantuml.skin:373): the
 * activity-scoped block BEATS the root `arrow { FontSize 13 }` (:317) --
 * the more-specific StyleSignature wins, and `HtmlColorAndStyle.java:83`
 * / `ftile/FtileFactoryDelegator.java:84` both resolve an activity edge
 * through `of(root, element, activityDiagram, arrow)`.
 *
 * `position` is the text block's TOP-LEFT corner, exactly as upstream's
 * `UTranslate.point(position)` places it (`Snake.java:230`); no
 * `text-anchor`, no extra offset beyond what that function already
 * bakes into its own default branch (`+4`, `Snake.java:248`).
 *
 * A coloured label (`<back:color>`, T1a's `label-colored-pill` finding)
 * draws through `core/svg.ts#text`'s own `textBackColor` -- the SAME
 * `feFlood`/`feComposite` filter `getFilterBackColor` registers
 * (`klimt/drawing/svg/SvgGraphics.java:732-735,772-786`), reused here
 * rather than re-invented: upstream never draws a background RECT for
 * this, only a filter clipped to the text's own bounding box (the SVG
 * filter region default, `objectBoundingBox`). `drawActivityText`'s own
 * klimt-driver path (`activity-renderer-text.ts`) has no `textBackColor`
 * seam and is outside this task's write-set, so the coloured branch
 * calls `core/svg.ts#text` directly instead -- the uncoloured branch is
 * unchanged, still `drawActivityText`, to keep its existing
 * `textLength` emission byte-identical.
 */
function renderEdgeLabelAligned(
  label: string,
  points: ReadonlyArray<{ x: number; y: number }>,
  labelAlign: SnakeTextAlign,
  color: string | undefined,
  theme: Theme,
): string {
  const size = activityFontSize(theme, 'arrow');
  // `TextBlock.calculateDimension` -- single-line width/height, the SAME
  // measurer-blind estimate `activity-text-placement.ts#measureLineWidth`
  // already gives every other render-time label (that module's own doc);
  // height is `WidthTableMeasurer#measure`'s own `font.size` convention
  // (`core/measurer.ts:189`).
  //
  // add4-T1f (SWITCH-NL): a `\n` label is a multi-line Sheet
  // (`Branch#getTextBlock` -> `Display#create0`, `Branch.java:247-257`,
  // `HorizontalAlignment.LEFT`): `SheetBlock1#initMap` stacks each stripe
  // `y += height` (`SheetBlock1.java:146-148`), one line = the bounder's
  // height = the font size (`StringBounderFromWidthTable.java:69-71`, 11 px
  // for the activity arrow font). Width = the widest line; one `<text>` per
  // line, all at the block's own left x.
  const lines = label.split('\n');
  const width = Math.max(...lines.map((l) => measureLineWidth(theme, size, l)));
  const position = getTextBlockPosition(points, { width, height: size * lines.length }, labelAlign);
  const baselineY = centeredFirstBaselineY(position.y + (size * lines.length) / 2, size, lines.length);
  const fill = activityFontColor(theme, 'arrow');
  if (lines.length > 1 && color === undefined) {
    const style = { fill, fontFamily: theme.fontFamily, fontSize: size };
    return drawActivityTextLines(lines, position.x, baselineY, size, style);
  }
  if (color !== undefined) {
    return text(position.x, baselineY, label, {
      fontFamily: theme.fontFamily,
      fontSize: size,
      fill,
      textLength: width,
      textBackColor: color,
    });
  }
  return drawActivityText(position.x, baselineY, label, {
    fill,
    fontFamily: theme.fontFamily,
    fontSize: size,
  });
}

function renderEdgeLabel(
  label: string,
  points: ReadonlyArray<{ x: number; y: number }>,
  labelAlign: SnakeTextAlign | undefined,
  color: string | undefined,
  theme: Theme,
): string {
  return renderEdgeLabelAligned(label, points, labelAlign ?? DEFAULT_LABEL_ALIGN, color, theme); // AbstractFtile.java:108-110
}

/**
 * The edge path, drawn as ONE `<line>` PER SEGMENT -- never one `<polyline>`
 * and never one `<path>`. The matching `emphasize` segment's arrowhead is
 * interleaved INTO this same loop, drawn immediately before that segment's
 * own line -- never before the whole run, never after it.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Worm.java:134-183.
 * `Worm#drawInternalOneColor` walks its own points with
 * `for (int i = 0; i < size() - 1; i++)` (`:134`), taking `getPoint(i)` and
 * `getPoint(i + 1)` as one `XLine2D` per iteration. Per iteration (`:138-143`):
 * `if (drawn == false && emphasizeDirection != null &&
 * Direction.fromVector(p1, p2) == emphasizeDirection) { drawLine(ug, line,
 * emphasizeDirection); drawn = true; } else { drawLine(ug, line, null); }`
 * -- `drawn` latches after the FIRST match, so later segments sharing the
 * same direction draw no decoration. `drawLine`'s own body (`:178-184`)
 * draws the passed-`direction` arrowhead at the segment's midpoint BEFORE
 * `ug.draw(new ULine(x2 - x1, y2 - y1))` -- one `ULine` per segment, no
 * aggregate shape anywhere in the call. `DriverLineSvg#draw`
 * (`klimt/drawing/svg/DriverLineSvg.java:54`) renders each one as a single
 * `<line>`.
 *
 * Upstream could not emit a `<polyline>` here even if `Worm` asked it to:
 * `klimt/drawing/svg/` ships `DriverLineSvg`, `DriverPolygonSvg`,
 * `DriverEllipseSvg`, `DriverPathSvg`, `DriverRectangleSvg` and others, and
 * NO `DriverPolylineSvg` -- the only `polyline` tokens under
 * `src/main/java/net/` are in the sprite-reading SVG parser
 * (`svg/parser/SvgSaxParser.java`), the TeaVM backend, graphviz's
 * `splines=polyline` attribute (`dot/DotSplines.java`) and the
 * `linetype polyline` skinparam. There is no polyline in the SVG driver set
 * at all.
 *
 * `<path>` is equally wrong: `DriverPathSvg` exists, but `Worm` never
 * constructs a `UPath` (D1).
 *
 * This makes activity SVGs LARGER, deliberately (D9). Upstream ships two
 * "reduce SVG output size" commits inside the current pin range
 * (`ba68279df92`, `4f3a0dcc63b`, both on `SvgGraphics.java`) and STILL emits
 * one `ULine` per segment -- per-segment lines are what an output-size-
 * conscious upstream chose. Do not re-introduce a polyline "optimisation".
 *
 * Direction classification (including the diagonal/zero-length cases
 * upstream's `Worm` cannot produce) reuses {@link arrowDirection}'s ported
 * `Direction.fromVector` (`utils/Direction.java:110-128`).
 *
 * `colors.line`/`colors.head` are bundled into one param (rather than two
 * strings) to stay under this file's 5-param complexity limit now that
 * T2c's `ArrowHeadColor` split the line's `LineColor` from the decoration's
 * own `HeadColor` (`Worm.java:126-127` vs `:153-154` -- two DIFFERENT
 * `ug.apply` colors, never the same variable upstream either).
 */
/**
 * b3/T3a (family C/EMMID): `emphasis.at` -- when present -- is the
 * PRE-compression segment midpoint, already mapped through `ct()` on
 * each axis by `compress-geometry.ts#withEmphasizeAnchor`/`transformEdge`
 * (`ActivityEdgeGeo.emphasizeAt`'s own doc). Drawn via {@link DIR_VECTOR}
 * rather than the segment's own (possibly-compressed) `dx, dy` -- the
 * direction is already known (`emphasis.dir`), and `arrowTip`'s own
 * `arrowDirection(dx, dy)` call only ever needs to recover that SAME
 * `dir` back out of whatever vector it is given.
 */
function renderEdgeSegments(
  pts: ReadonlyArray<{ x: number; y: number }>,
  colors: { line: string; head: string },
  strokeWidth: number,
  emphasis: { dir: ArrowDir; at: { x: number; y: number } | undefined } | undefined,
  theme: Theme,
): string {
  let out = '';
  let emphasisDrawn = false;
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    if (!emphasisDrawn && emphasis !== undefined && arrowDirection(dx, dy) === emphasis.dir) {
      const anchor = emphasis.at ?? { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      // EMPH-STROKE (add4-T2e): `drawLine(ug, line, emphasizeDirection)`
      // (`Worm.java:139,177-181`) draws `arrows.asTo(direction)` through the
      // SAME `ug` the segment lines use -- `arrowColor` fore + back
      // (`:126-127`) and the worm's own stroke (`:128-131`). The
      // `arrowHeadColor` / `UStroke.simple()` re-applies (`:152-166`) come
      // AFTER the loop and reach the start/end decorations only.
      out += arrowTip(anchor, DIR_VECTOR[emphasis.dir], colors.line, theme, strokeWidth);
      emphasisDrawn = true;
    }
    out += orderedLine(p1.x, p1.y, p2.x, p2.y, { stroke: colors.line, strokeWidth });
  }
  return out;
}

/** Canonical unit vector per {@link ArrowDir}, so {@link arrowTip}'s own
 *  `arrowDirection(dx, dy)` recomputes the SAME `dir` a `midArrowAt` point
 *  already names -- D4, `ActivityEdgeGeo.midArrowAt`. */
const DIR_VECTOR: Record<ArrowDir, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

/** D4: the extra arrowhead a translate shape places at its own point,
 *  split out of {@link renderEdge} to keep that function under the file's
 *  NLOC limit. Draws in the decoration's own `HeadColor` (T2c), never the
 *  line's `LineColor` -- there is no line segment at a mid-arrow point to
 *  draw in the other color. */
function renderMidArrow(midArrowAt: { x: number; y: number; dir: ArrowDir }, headColor: string, theme: Theme): string {
  const { x, y, dir } = midArrowAt;
  return arrowTip({ x, y }, DIR_VECTOR[dir], headColor, theme);
}

function renderEdge(edge: ActivityEdgeGeo, theme: Theme): string {
  const pts = edge.points;
  if (pts.length < 2) return '';

  // cdd7-T1a (D3): `colors.arrow` is a Paint; this renderer draws flat.
  const edgeColor = noGradient(theme.colors.arrow);
  // T2c: `skinparam ArrowHeadColor` -- `Worm#drawInternalOneColor` applies
  // THIS color to the decoration only (`ftile/Worm.java:153-154`), AFTER
  // the line segments already drew with `edgeColor` (`:126-127`). Absent
  // -> tracks `edgeColor` itself (`activityArrowHeadColor`'s own doc).
  const headColor = noGradient(activityArrowHeadColor(theme));
  // `activityDiagram { arrow { LineThickness 1 } }` (plantuml.skin:374).
  // `Worm#drawInternalOneColor` takes the LINE's stroke from
  // `style.getStroke()` (`ftile/Worm.java:129`, the `linkStyle.isNormal()`
  // branch). The `UStroke.withThickness(1.5)` calls at `:154` and `:161`
  // are inside `if (startDecoration != null)` / `if (endDecoration !=
  // null)` -- and each of those then draws through
  // `.apply(UStroke.simple())` (`:159`, `:166`), which is thickness 1.0
  // (`klimt/UStroke.java:75-77`), so the 1.5 never reaches any output at
  // all. This port had generalised it to every segment of every edge.
  //
  // The `emphasize` arrowhead (`Snake#emphasizeDirection`, D6) is
  // interleaved INTO this segment run, immediately before its matching
  // segment's own line -- `renderEdgeSegments`' own doc comment quotes the
  // exact `Worm.java:138-143` loop body this ports.
  const emphasis = edge.emphasize === undefined ? undefined : { dir: edge.emphasize, at: edge.emphasizeAt };
  const segments = renderEdgeSegments(
    pts,
    { line: edgeColor, head: headColor },
    activityLineThickness(theme, 'arrow'),
    emphasis,
    theme,
  );

  // Terminal arrowhead, drawn AFTER the full segment loop --
  // `Worm#drawInternalOneColor`'s `startDecoration`/`endDecoration` draws
  // sit below the `for` loop that draws every segment (`ftile/Worm.java:
  // 134-171`), never interleaved with it. Direction is second-to-last point
  // to last, skipping a zero-length last segment: upstream draws the end
  // decoration whatever that segment's length (`:161-168`, no length test;
  // `edgeDecorationVector`'s own doc). `edge.arrowhead === false`
  // mirrors a `null` end decoration (`if (endDecoration != null)` never
  // firing).
  const last = pts[pts.length - 1]!;
  const vector = edgeDecorationVector(edge);
  const arrow = edge.arrowhead === false || vector === undefined ? '' : arrowTip(last, vector, headColor, theme);

  // D4/T3h: `edge.midArrowAt` (an explicit extra arrowhead a translate
  // shape places at its own point) is NO LONGER drawn here -- see
  // `renderCrossLaneDecorations`'s own doc for why it moved to a separate,
  // earlier emission phase.
  //
  // Optional edge label, positioned by `Snake#getTextBlockPosition`
  // (`renderEdgeLabel`'s own doc comment).
  let labelEl = '';
  if (edge.label !== undefined) {
    labelEl = renderEdgeLabel(edge.label, pts, edge.labelAlign, edge.color, theme);
  }

  return segments + arrow + labelEl;
}

/**
 * T3h (row XLANE, `ruzica-16-deli877`/`nikivo-06-kaxa873`/`kijazo-83-
 * kipu485`): the ONE non-`Snake` immediate decoration an activity render
 * can emit outside its own edge's deferred line -- `ActivityEdgeGeo
 * .midArrowAt`, set only by `swimlane-loop-translate-while.ts#routeWhileBack`
 * for a while-loop back edge that crosses swimlanes.
 *
 * `Swimlanes.java:252` wraps the WHOLE document render in one
 * `UGraphicForSnake`: `draw(UShape)` (`svek/UGraphicForSnake.java:137-144`)
 * queues every `Snake` (`addPendingSnake`) and draws every OTHER shape
 * immediately; `drawWhenSwimlanes` (`:318-356`) then runs the per-lane
 * content pass for every lane (`:328-347`), THEN the single cross-lane
 * `Cross` pass (`:350-351`), THEN `cross.flushUg()` (`:352`, draining every
 * queued `Snake` -- same-lane AND cross-lane -- in queue order), THEN
 * `drawTitles` (`:354`) last. `FtileWhile.ConnectionBackSimple
 * #drawTranslate` (`:277-308`, reached ONLY via `ConnectionCross
 * .java:63`, itself constructed ONLY inside `Swimlanes$Cross`, which exists
 * ONLY when `swimlanes().size() > 1`) queues its own line
 * (`ug.draw(snake)`, `:302`) and THEN draws the loop's up-arrow decoration
 * immediately (`ug.apply(...).draw(skinParam().arrows().asToUp())`,
 * `:307`) -- a plain `UPolygon` draw, never wrapped in a `Snake`, so it
 * emits right there in the Cross pass, well before the final flush drains
 * ITS OWN edge's line. No other `drawTranslate` override in the codebase
 * (`FtileRepeat`, `FtileIfWithLinks`, `FtileSwitchWithManyLinks`, the
 * `Parallel*` builders) draws a shape outside its `Snake.create(...)`
 * call -- confirmed by reading each one; their own `UPolygon`s are only
 * ever the `Snake`'s end-decoration argument, so they stay deferred with
 * everything else. That makes this the ONLY port-side carrier
 * (`ActivityEdgeGeo.midArrowAt`) of a decoration needing this split.
 *
 * Verified against `kijazo-83-kipu485`'s own element dump: jar's up-arrow
 * polygon sits at index `[17]`, immediately after the per-lane content
 * (`renderSwimlaneChrome`'s own output) and before the first deferred
 * `<line>` of the edges batch; our pre-fix render placed the same polygon
 * at `[38]`, inside its own edge's atomic `renderEdge` unit, bundled with
 * (and after) that edge's own terminal arrow. This function reproduces the
 * jar's placement: called once, between `renderSwimlaneChrome`'s per-lane
 * content and the edges loop below -- the exact position the Cross pass's
 * immediate draws occupy, before `cross.flushUg()`'s batch. A no-op
 * (returns `''`) in a diagram with no cross-lane while-loop back edge,
 * which is the only producer of `midArrowAt` (`routeWhileBack`'s own doc);
 * harmless to call unconditionally, incl. the zero/one-lane case where
 * `midArrowAt` structurally never appears (`routeWhileBack` is only
 * reachable through swimlane-translate routing).
 */
function renderCrossLaneDecorations(geo: ActivityGeometry, theme: Theme): string {
  const headColor = noGradient(activityArrowHeadColor(theme));
  let out = '';
  for (const edge of geo.edges) {
    if (edge.midArrowAt !== undefined) {
      out += renderMidArrow(edge.midArrowAt, headColor, theme);
    }
  }
  return out;
}

/**
 * T3j (journal row 36) / b3-T3a (family E): the RAW (pre-margin, pre-floor)
 * dims chrome centres against -- `svek/DecorateEntityImage.java:144-150`'s
 * `getTextX` aligns title/header/footer text against this exact un-floored
 * span, not the floored `totalWidth`/`totalHeight`. `geo.rawWidth`/
 * `rawHeight` (`canvas-origin.ts#computeCanvasOrigin`'s own `ink +
 * RECENTRED_ENLARGE`, the SAME smaller pre-document-margin padding term
 * `activity-layout-constants.ts#RECENTRED_ENLARGE`'s own doc cites) now
 * carries that value exactly (`ActivityGeometry.rawWidth`'s own doc) --
 * T3j's own margin-subtraction fallback (`totalWidth/Height - margin`,
 * which loses the ink span's fractional part whenever it does not already
 * land on the integer grid) is kept only for hand-built `ActivityGeometry`
 * test fixtures that bypass `finalizeGeometry` and so never populate it.
 */
function preChromeDims(geo: ActivityGeometry): { width: number; height: number } {
  if (geo.rawWidth !== undefined && geo.rawHeight !== undefined) {
    return { width: geo.rawWidth, height: geo.rawHeight };
  }
  const margin = 2 * ACTIVITY_DOCUMENT_MARGIN + SVG_CANVAS_CEIL;
  return { width: geo.totalWidth - margin, height: geo.totalHeight - margin };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Render an activity diagram geometry into an SVG string.
 *
 * Draw order (D5 of `plans/activity-swimlane-rendering/decisions.md`):
 * with chrome (`swimlanes.length > 1`), the band/per-lane-nodes/dividers
 * come from `renderSwimlaneChrome` (`activity-renderer-swimlanes.ts`),
 * then any cross-lane immediate decoration (T3h, `renderCrossLaneDecorations`
 * -- the Cross pass, before the deferred-`Snake` flush), then every edge,
 * then titles LAST. With zero or one lane there is no chrome to draw
 * (`Swimlanes.java:275`) and the output is the plain node-then-edge order,
 * byte-identical to a diagram with no swimlanes.
 */
export function renderActivity(geo: ActivityGeometry, theme: Theme): RenderFragment {
  const children: string[] = [];

  // NO background rect here. The jar paints one from `SvgGraphics`'s own
  // constructor, guarded (`klimt/drawing/svg/SvgGraphics.java:186-192`) so
  // that `#FFFFFF`, `#000000` and `#00000000` paint NOTHING, and it is sized
  // to the FINAL, post-chrome canvas -- neither of which `renderActivity` can
  // see. Both live in `core/assemble-svg.ts#finalizeActivityFragment`
  // alongside the identical sequence/state/json mechanisms. The background
  // itself still reaches the document, via the root `style` attribute
  // `assembleDocumentShell` builds from `fragment.background`
  // (`SvgGraphics.java:805-806`).
  const hasChrome = geo.swimlanes.length > 1;

  if (hasChrome) {
    children.push(renderSwimlaneChrome(geo, theme));
  } else {
    for (const node of geo.nodes) children.push(renderNode(node, theme));
  }

  // T3h: `Swimlanes.java:350-352`'s Cross pass draws a cross-lane
  // connection's own non-`Snake` decoration immediately, BEFORE
  // `cross.flushUg()` drains every deferred `Snake` below -- see
  // `renderCrossLaneDecorations`'s own doc.
  children.push(renderCrossLaneDecorations(geo, theme));

  for (const edge of geo.edges) {
    children.push(renderEdge(edge, theme));
  }

  if (hasChrome) {
    children.push(renderSwimlaneTitles(geo, theme));
  }

  const raw = preChromeDims(geo);
  return {
    body: children.join(''),
    width: geo.totalWidth,
    height: geo.totalHeight,
    background: theme.colors.background,
    // T2d-a pass 2 (row DOCGRAD): `skinparam backgroundColor <c1>-<c2>` --
    // see `theme.colors.backgroundGradient`'s own doc comment. Omitted
    // entirely (not `undefined`, `exactOptionalPropertyTypes`) for the
    // common case, mirroring `preserveAspectRatio` below.
    ...(theme.colors.backgroundGradient !== undefined ? { backgroundGradient: theme.colors.backgroundGradient } : {}),
    diagramType: DIAGRAM_TYPE_ACTIVITY,
    // T3j: `index.ts#applyAnnotationChrome`'s activity branch undoes the
    // document-margin shift baked into `body` above, composes chrome around
    // the result at these RAW dims, then re-applies the margin to the
    // chrome-decorated whole -- see `preChromeDims`'s own doc comment for
    // the exact inverse this subtracts.
    preChromeWidth: raw.width,
    preChromeHeight: raw.height,
    // add2 T3e (family G): `theme.preserveAspectRatio` (`core/theme-root-
    // fields.ts`) forwarded verbatim -- `RenderFragment.preserveAspectRatio`
    // reaches `document-shell.ts#assembleDocumentShell` unchanged (add2 T2d
    // plumbing; this is the first producer to set it). Omitted entirely
    // (not `undefined`, `exactOptionalPropertyTypes`) when no `skinparam
    // preserveAspectRatio` was declared, which already takes
    // `DEFAULT_PRESERVE_ASPECT_RATIO` ('none') at that consumer.
    ...(theme.preserveAspectRatio !== undefined ? { preserveAspectRatio: theme.preserveAspectRatio } : {}),
  };
}
