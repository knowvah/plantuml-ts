/**
 * Activity diagram SVG renderer.
 *
 * Pure function: ActivityGeometry + Theme → SVG string.
 * No DOM, no async.
 */

import type { ActivityGeometry, ActivityEdgeGeo, SwimlaneGeo } from './layout/tile-layout.js';
import type { Theme } from '../../core/theme.js';
import type { RenderFragment } from '../../core/dispatcher.js';
import { rect, line, text, polygon } from '../../core/svg.js';
import {} from '../../core/latex.js';
import { renderNode } from './activity-renderer-shapes.js';
import { SWIMLANE_HEADER_H } from './activity-layout-constants.js';


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

function arrowTip(
  x: number,
  y: number,
  dx: number,
  dy: number,
  color: string,
): string {
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return '';
  const udx = dx / len;
  const udy = dy / len;
  const size = 8;
  const px = -udy * size * 0.4;
  const py = udx * size * 0.4;
  const x1 = x - udx * size + px;
  const y1 = y - udy * size + py;
  const x2 = x - udx * size - px;
  const y2 = y - udy * size - py;
  return polygon([{ x, y }, { x: x1, y: y1 }, { x: x2, y: y2 }], { fill: color });
}

/**
 * Render the label for an edge, optionally with a colored background pill.
 *
 * When `color` is provided, a filled rect is rendered behind the label text.
 * Pill dimensions: width = approx label char count × (fontSize × 0.6) + 8px
 * padding; height = fontSize + 4px padding.
 */
function renderEdgeLabel(
  label: string,
  midX: number,
  midY: number,
  color: string | undefined,
  theme: Theme,
): string {
  if (color !== undefined) {
    const textWidth = label.length * (theme.fontSize * 0.6);
    const pillW = textWidth + 8;
    const pillH = theme.fontSize + 4;
    const pillX = midX - pillW / 2;
    const pillY = midY - pillH / 2;
    const background = rect(pillX, pillY, pillW, pillH, {
      fill: color,
      stroke: 'none',
    });
    const labelEl = text(midX, midY, label, {
      fill: theme.colors.text,
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSize,
      textAnchor: 'middle',
      dominantBaseline: 'central',
    });
    return background + labelEl;
  }

  // No color: plain text label offset slightly from the midpoint
  return text(midX + 4, midY - 4, label, {
    fill: theme.colors.text,
    fontFamily: theme.fontFamily,
    fontSize: theme.fontSize,
  });
}

/**
 * The edge path, drawn as ONE `<line>` PER SEGMENT -- never one `<polyline>`
 * and never one `<path>`.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Worm.java:134-183.
 * `Worm#drawInternal` walks its own points with
 * `for (int i = 0; i < size() - 1; i++)` (`:134`), taking `getPoint(i)` and
 * `getPoint(i + 1)` as one `XLine2D` per iteration, and its `drawLine`
 * helper bottoms out at `ug.draw(new ULine(x2 - x1, y2 - y1))` (`:183`) --
 * one `ULine` per segment, no aggregate shape anywhere in the call.
 * `DriverLineSvg#draw`
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
 */
function renderEdgeSegments(
  pts: ReadonlyArray<{ x: number; y: number }>,
  edgeColor: string,
): string {
  let out = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    out += line(p1.x, p1.y, p2.x, p2.y, { stroke: edgeColor, strokeWidth: 1.5 });
  }
  return out;
}

function renderEdge(edge: ActivityEdgeGeo, theme: Theme): string {
  const pts = edge.points;
  if (pts.length < 2) return '';


  const edgeColor = theme.colors.arrow;
  const segments = renderEdgeSegments(pts, edgeColor);

  // Arrowhead at last point, direction from second-to-last to last
  const last = pts[pts.length - 1]!;
  const prev = pts[pts.length - 2]!;
  const dx = last.x - prev.x;
  const dy = last.y - prev.y;
  const arrow = arrowTip(last.x, last.y, dx, dy, edgeColor);

  // Optional mid-segment arrowhead (used for repeat back-edges)
  let midArrowEl = '';
  if (edge.midArrow === true && pts.length >= 2) {
    let maxLen = 0;
    let maxI = 1;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1]!;
      const p1 = pts[i]!;
      const len = Math.sqrt((p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2);
      if (len > maxLen) { maxLen = len; maxI = i; }
    }
    const segStart = pts[maxI - 1]!;
    const segEnd = pts[maxI]!;
    const midX = (segStart.x + segEnd.x) / 2;
    const midY = (segStart.y + segEnd.y) / 2;
    midArrowEl = arrowTip(midX, midY, segEnd.x - segStart.x, segEnd.y - segStart.y, edgeColor);
  }

  // Optional edge label near midpoint
  let labelEl = '';
  if (edge.label !== undefined) {
    const mid = Math.floor(pts.length / 2);
    const midPt = pts[mid]!;
    labelEl = renderEdgeLabel(edge.label, midPt.x, midPt.y, edge.color, theme);
  }

  return segments + arrow + midArrowEl + labelEl;
}

// ---------------------------------------------------------------------------
// Swimlane renderer
// ---------------------------------------------------------------------------

function renderSwimlanes(
  swimlanes: readonly SwimlaneGeo[],
  totalHeight: number,
  theme: Theme,
): string {
  if (swimlanes.length === 0) return '';

  const parts: string[] = [];

  // Header band background
  parts.push(
    rect(0, 0, swimlanes.reduce((acc, s) => acc + s.width, 0), SWIMLANE_HEADER_H, {
      fill: theme.colors.background,
      stroke: theme.colors.border,
    }),
  );

  for (const lane of swimlanes) {
    // Lane header text, centered
    parts.push(
      text(lane.x + lane.width / 2, SWIMLANE_HEADER_H / 2 + theme.fontSize / 3, lane.name, {
        textAnchor: 'middle',
        fill: theme.colors.text,
        fontFamily: theme.fontFamily,
        fontSize: theme.fontSize,
        fontWeight: 'bold',
      }),
    );

    // Vertical divider on the left edge of this lane (skip the very first)
    if (lane.x > 0) {
      parts.push(
        line(lane.x, 0, lane.x, totalHeight, {
          stroke: theme.colors.border,
          strokeWidth: 1,
        }),
      );
    }
  }

  // Horizontal line separating header from diagram body
  const totalWidth = swimlanes.reduce((acc, s) => acc + s.width, 0);
  parts.push(
    line(0, SWIMLANE_HEADER_H, totalWidth, SWIMLANE_HEADER_H, {
      stroke: theme.colors.border,
      strokeWidth: 1,
    }),
  );

  return parts.join('');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Render an activity diagram geometry into an SVG string.
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

  // Swimlanes (drawn before nodes so nodes appear on top)
  if (geo.swimlanes.length > 0) {
    children.push(renderSwimlanes(geo.swimlanes, geo.totalHeight, theme));
  }

  // Nodes
  for (const node of geo.nodes) {
    children.push(renderNode(node, theme));
  }

  // Edges
  for (const edge of geo.edges) {
    children.push(renderEdge(edge, theme));
  }

  return {
    body: children.join(''),
    width: geo.totalWidth,
    height: geo.totalHeight,
    background: theme.colors.background,
    diagramType: DIAGRAM_TYPE_ACTIVITY,
  };
}
