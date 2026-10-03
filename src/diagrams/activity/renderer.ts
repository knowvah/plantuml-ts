/**
 * Activity diagram SVG renderer.
 *
 * Pure function: ActivityGeometry + Theme → SVG string.
 * No DOM, no async.
 */

import type { ActivityGeometry, ActivityEdgeGeo } from './layout/tile-layout.js';
import type { Theme } from '../../core/theme.js';
import type { RenderFragment } from '../../core/dispatcher.js';
import { rect, polygon } from '../../core/svg.js';
import {} from '../../core/latex.js';
import { renderNode, centeredFirstBaselineY } from './activity-renderer-shapes.js';
import { orderedLine } from './activity-renderer-terminals.js';
import { drawActivityText } from './activity-renderer-text.js';
import { renderSwimlaneChrome, renderSwimlaneTitles } from './activity-renderer-swimlanes.js';
import { activityArrowHeadColor, activityFontSize, activityLineThickness } from './activity-style-defaults.js';
import { activityFontColor } from './activity-text-style.js';
import { arrowDirection, arrowHeadPointsFor, type ArrowDir } from './arrows-regular.js';
import { noGradient } from '../../core/paint.js';
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
    { fill: color, stroke: color, strokeWidth: 1 },
  );
}

/**
 * Render the label for an edge, optionally with a colored background pill.
 *
 * When `color` is provided, a filled rect is rendered behind the label text.
 * Pill dimensions: width = approx label char count × (fontSize × 0.6) + 8px
 * padding; height = fontSize + 4px padding.
 */
function renderEdgeLabel(label: string, midX: number, midY: number, color: string | undefined, theme: Theme): string {
  // `activityDiagram { arrow { FontSize 11 } }` (plantuml.skin:373). The
  // activity-scoped block BEATS the root `arrow { FontSize 13 }` (:317) --
  // the more-specific StyleSignature wins, and `HtmlColorAndStyle.java:83`
  // / `ftile/FtileFactoryDelegator.java:84` both resolve an activity edge
  // through `of(root, element, activityDiagram, arrow)`.
  const size = activityFontSize(theme, 'arrow');
  if (color !== undefined) {
    const textWidth = label.length * (size * 0.6);
    const pillW = textWidth + 8;
    const pillH = size + 4;
    const pillX = midX - pillW / 2;
    const pillY = midY - pillH / 2;
    const background = rect(pillX, pillY, pillW, pillH, {
      fill: color,
      stroke: 'none',
    });
    // D2: no `text-anchor`. `pillW - textWidth` is a CONSTANT 8 (this
    // function's own padding, two lines up), so the centring offset that
    // `text-anchor="middle"` used to give collapses to a constant `+ 4` --
    // algebra on the existing estimate, not a new guess. D1: no `dominant-
    // baseline` either (the driver emits none) -- `centeredFirstBaselineY`
    // is the same N=1 ascent-centred baseline `activity-renderer-shapes.ts`
    // uses for every other box/hexagon/diamond single-line label.
    const labelEl = drawActivityText(pillX + 4, centeredFirstBaselineY(midY, size, 1), label, {
      fill: activityFontColor(theme, 'arrow'),
      fontFamily: theme.fontFamily,
      fontSize: size,
    });
    return background + labelEl;
  }

  // No color: plain text label offset slightly from the midpoint
  return drawActivityText(midX + 4, midY - 4, label, {
    fill: activityFontColor(theme, 'arrow'),
    fontFamily: theme.fontFamily,
    fontSize: size,
  });
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
      out += arrowTip(anchor, DIR_VECTOR[emphasis.dir], colors.head, theme);
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
  // to last. `edge.arrowhead === false` mirrors a `null` end decoration
  // (`:161-168`'s `if (endDecoration != null)` never firing).
  const last = pts[pts.length - 1]!;
  const prev = pts[pts.length - 2]!;
  const dx = last.x - prev.x;
  const dy = last.y - prev.y;
  const arrow = edge.arrowhead === false ? '' : arrowTip(last, { dx, dy }, headColor, theme);

  // D4: an explicit extra arrowhead at a translate shape's own point (see
  // `ActivityEdgeGeo.midArrowAt`'s own doc) -- drawn after the terminal
  // decoration; this is a port-specific extension with no `Worm` draw-order
  // citation of its own (`emphasize`'s midpoint arrow, by contrast, has one
  // and is now interleaved above).
  const midArrowEl = edge.midArrowAt === undefined ? '' : renderMidArrow(edge.midArrowAt, headColor, theme);

  // Optional edge label near midpoint
  let labelEl = '';
  if (edge.label !== undefined) {
    const mid = Math.floor(pts.length / 2);
    const midPt = pts[mid]!;
    labelEl = renderEdgeLabel(edge.label, midPt.x, midPt.y, edge.color, theme);
  }

  return segments + arrow + midArrowEl + labelEl;
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
 * then every edge, then titles LAST. With zero or one lane there is no
 * chrome to draw (`Swimlanes.java:275`) and the output is the plain
 * node-then-edge order, byte-identical to a diagram with no swimlanes.
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
    diagramType: DIAGRAM_TYPE_ACTIVITY,
    // T3j: `index.ts#applyAnnotationChrome`'s activity branch undoes the
    // document-margin shift baked into `body` above, composes chrome around
    // the result at these RAW dims, then re-applies the margin to the
    // chrome-decorated whole -- see `preChromeDims`'s own doc comment for
    // the exact inverse this subtracts.
    preChromeWidth: raw.width,
    preChromeHeight: raw.height,
  };
}
