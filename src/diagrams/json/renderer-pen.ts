/**
 * The seam between "which shapes this diagram draws" and "how they are drawn".
 *
 * Upstream inserts that seam as a `UGraphic` DECORATOR — `JsonDiagram#drawU`
 * wraps its graphic in `UGraphicHandwritten` and every later `draw()` is
 * transparently rerouted. This renderer emits SVG strings directly and has no
 * `UGraphic` to decorate, so the same seam is expressed as a pen the renderer
 * draws through instead. Same boundary, one layer lower.
 *
 * The plain pen is the shape emitters unchanged, so a non-handwritten diagram
 * emits byte-identical markup to before this existed.
 *
 * @see ~/git/plantuml/.../klimt/drawing/hand/UGraphicHandwritten.java
 */

import { rect, line, path, ellipse, polygon } from '../../core/svg.js';
import { fmt } from '../../core/svg-format.js';
import type { BoxStyle, LineStyle } from '../../core/svg.js';
import { JavaRandom } from '../../core/klimt/drawing/hand/JavaRandom.js';

/** `new Random(424242L)` — `UGraphicHandwritten.java:54`. */
const HANDWRITTEN_SEED = 424242;

/** `LimitFinder#drawUPolygon`'s x-only padding (`LimitFinder.java:169`). It is
 *  why a handwritten document is WIDER than its drawn content: every rectangle
 *  has become a polygon, and each one claims 10 units of ink on both sides. */
const HACK_X_FOR_POLYGON = 10;
import { rectangleHand, lineHand, ellipseHand, pathHand } from '../../core/klimt/drawing/hand/shapes.js';
import type { HandSegment } from '../../core/klimt/drawing/hand/shapes.js';
import type { HandPoint } from '../../core/klimt/drawing/hand/HandJiggle.js';

/** The extent a `LimitFinder` pass would record for what this pen drew. */
export interface PenInk {
  minX: number; minY: number; maxX: number; maxY: number;
}

export interface JsonPen {
  /**
   * The drawn extent, or `undefined` when the document is sized the ordinary
   * way (the plain pen).
   *
   * Handwritten needs it because upstream's `calculateDimension` measures by
   * DRAWING into a `LimitFinder`, and `JsonDiagram#drawU` wraps that finder in
   * `UGraphicHandwritten` too — so the measured shapes are the jiggled ones,
   * and a rectangle is measured as a POLYGON. That changes the answer twice
   * over: see {@link HACK_X_FOR_POLYGON}, and the `-1` ink corner of
   * `LimitFinder#drawRectangle` no longer applies because no rectangle is
   * drawn at all.
   */
  ink(): PenInk | undefined;
}

export interface JsonPen {
  rect(x: number, y: number, w: number, h: number, style: BoxStyle): string;
  line(x1: number, y1: number, x2: number, y2: number, style: LineStyle): string;
  ellipse(cx: number, cy: number, rx: number, ry: number, attrs: Record<string, string | number>): string;
  /** `segments` describe the path; `d` is the already-built plain form. */
  path(segments: readonly HandSegment[], d: string, style: LineStyle): string;
}

const PLAIN_PEN: JsonPen = {
  ink: () => undefined,
  rect: (x, y, w, h, style) => rect(x, y, w, h, style),
  line: (x1, y1, x2, y2, style) => line(x1, y1, x2, y2, style),
  ellipse: (cx, cy, rx, ry, attrs) => ellipse(cx, cy, rx, ry, attrs),
  path: (_segments, d, style) => path(d, style),
};

/** Absolute points from a builder's shape-local ones. */
function at(origin: HandPoint, pts: readonly HandPoint[]): { x: number; y: number }[] {
  return pts.map((p) => ({ x: origin.x + p.x, y: origin.y + p.y }));
}

/**
 * A pen whose every shape is jiggled, sharing ONE {@link JavaRandom} for the
 * whole diagram exactly as `UGraphicHandwritten` does.
 *
 * That sharing is why this must be constructed once per render and why the
 * renderer's draw ORDER has to match the jar's: each shape consumes a variable
 * number of draws, so an extra or missing shape desynchronises everything
 * after it. The json renderer's order was established against the jar by A5's
 * mechanism 2, which is what makes this reproducible at all.
 *
 * Shape mapping, read off `UGraphicHandwritten#draw`: rectangles and ellipses
 * become POLYGONS, lines and paths become polyline PATHS.
 */
function handwrittenPen(): JsonPen {
  // A FRESH stream per shape — see this function's doc comment.
  const rnd = (): JavaRandom => new JavaRandom(HANDWRITTEN_SEED);
  let ink: PenInk | undefined;
  const addPoint = (x: number, y: number): void => {
    ink = ink === undefined
      ? { minX: x, minY: y, maxX: x, maxY: y }
      : {
          minX: Math.min(ink.minX, x), minY: Math.min(ink.minY, y),
          maxX: Math.max(ink.maxX, x), maxY: Math.max(ink.maxY, y),
        };
  };
  /** `LimitFinder#drawUPolygon` (`:171-177`) — a polygon's ink reaches
   *  {@link HACK_X_FOR_POLYGON} beyond its bounds on each side IN X ONLY. */
  const addPolygonInk = (pts: readonly { x: number; y: number }[]): void => {
    if (pts.length === 0) return;
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    addPoint(Math.min(...xs) - HACK_X_FOR_POLYGON, Math.min(...ys));
    addPoint(Math.max(...xs) + HACK_X_FOR_POLYGON, Math.max(...ys));
  };
  /** `LimitFinder#drawUPath` — the path's own bounds, unpadded. */
  const addPathInk = (pts: readonly { x: number; y: number }[]): void => {
    for (const p of pts) addPoint(p.x, p.y);
  };
  return {
    ink: () => ink,
    rect(x, y, w, h, style) {
      // `URectangleHand` halves `URectangle#getRx()`, which carries the
      // un-halved `RoundCorner`; `style.rx` here is already halved for SVG,
      // so it is doubled back to the value upstream starts from.
      const roundCorner = (style.rx ?? 0) * 2;
      const pts = at({ x, y }, rectangleHand(w, h, roundCorner, rnd()));
      addPolygonInk(pts);
      return polygon(pts, {
        ...(style.fill !== undefined ? { fill: style.fill } : {}),
        ...(style.stroke !== undefined ? { stroke: style.stroke } : {}),
        ...(style.strokeWidth !== undefined ? { strokeWidth: style.strokeWidth } : {}),
      });
    },
    line(x1, y1, x2, y2, style) {
      const pts = at({ x: x1, y: y1 }, lineHand(x2 - x1, y2 - y1, rnd()));
      addPathInk(pts);
      return path(polylineData(pts), { ...style, fill: 'none' });
    },
    ellipse(cx, cy, rx, ry, attrs) {
      // `UEllipseHand` works from the ellipse's top-left in a width/height
      // frame, so the centre is converted back.
      const pts = at({ x: cx - rx, y: cy - ry }, ellipseHand(rx * 2, ry * 2, rnd()));
      addPolygonInk(pts);
      const fill = attrs['fill'];
      const stroke = attrs['stroke'];
      const strokeWidth = attrs['stroke-width'];
      return polygon(pts, {
        ...(typeof fill === 'string' ? { fill } : {}),
        ...(typeof stroke === 'string' ? { stroke } : {}),
        ...(typeof strokeWidth === 'number' ? { strokeWidth } : {}),
      });
    },
    path(segments, _d, style) {
      const runs = pathHand(segments, rnd());
      for (const r of runs) addPathInk([r.move, ...r.lines]);
      const data = runs
        .map((r) => polylineData([r.move, ...r.lines]))
        .join(' ');
      return path(data, style);
    },
  };
}

function polylineData(pts: readonly { x: number; y: number }[]): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${fmt(p.x)},${fmt(p.y)}`).join(' ');
}

export function penFor(handwritten: boolean | undefined): JsonPen {
  return handwritten === true ? handwrittenPen() : PLAIN_PEN;
}
