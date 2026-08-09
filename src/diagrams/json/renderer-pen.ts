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
import { rectangleHand, lineHand, ellipseHand, pathHand } from '../../core/klimt/drawing/hand/shapes.js';
import type { HandSegment } from '../../core/klimt/drawing/hand/shapes.js';
import type { HandPoint } from '../../core/klimt/drawing/hand/HandJiggle.js';

export interface JsonPen {
  rect(x: number, y: number, w: number, h: number, style: BoxStyle): string;
  line(x1: number, y1: number, x2: number, y2: number, style: LineStyle): string;
  ellipse(cx: number, cy: number, rx: number, ry: number, attrs: Record<string, string | number>): string;
  /** `segments` describe the path; `d` is the already-built plain form. */
  path(segments: readonly HandSegment[], d: string, style: LineStyle): string;
}

const PLAIN_PEN: JsonPen = {
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
  return {
    rect(x, y, w, h, style) {
      // `URectangleHand` halves `URectangle#getRx()`, which carries the
      // un-halved `RoundCorner`; `style.rx` here is already halved for SVG,
      // so it is doubled back to the value upstream starts from.
      const roundCorner = (style.rx ?? 0) * 2;
      const pts = at({ x, y }, rectangleHand(w, h, roundCorner, rnd()));
      return polygon(pts, {
        ...(style.fill !== undefined ? { fill: style.fill } : {}),
        ...(style.stroke !== undefined ? { stroke: style.stroke } : {}),
        ...(style.strokeWidth !== undefined ? { strokeWidth: style.strokeWidth } : {}),
      });
    },
    line(x1, y1, x2, y2, style) {
      const pts = at({ x: x1, y: y1 }, lineHand(x2 - x1, y2 - y1, rnd()));
      return path(polylineData(pts), { ...style, fill: 'none' });
    },
    ellipse(cx, cy, rx, ry, attrs) {
      // `UEllipseHand` works from the ellipse's top-left in a width/height
      // frame, so the centre is converted back.
      const pts = at({ x: cx - rx, y: cy - ry }, ellipseHand(rx * 2, ry * 2, rnd()));
      const fill = attrs['fill'];
      const stroke = attrs['stroke'];
      return polygon(pts, {
        ...(typeof fill === 'string' ? { fill } : {}),
        ...(typeof stroke === 'string' ? { stroke } : {}),
      });
    },
    path(segments, _d, style) {
      const runs = pathHand(segments, rnd());
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
