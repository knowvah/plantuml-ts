/**
 * The direction of an edge's END decoration, shared by the renderer
 * (`renderer.ts#renderEdge`'s terminal `arrowTip`) and the compressor's
 * shape adapter (`shapes-of.ts#terminalArrowhead`) so both see the same
 * arrowhead.
 *
 * Upstream never derives this direction from geometry. Every `Snake` is
 * built with its end decoration already oriented (`Snake.create(skinParam,
 * color, arrows().asToDown())`, `ftile/Snake.java:144-148`), and
 * `Worm#drawInternalOneColor` draws it at the last point whatever the last
 * segment's length (`ftile/Worm.java:161-168`, `if (endDecoration !=
 * null)`, no length test). `ActivityEdgeGeo` carries no decoration
 * direction, so this port reads it off the points. That agrees with the
 * creator for every segment that has a direction. The one producer that
 * ends on a zero-length segment is `ConnectionVerticalThenHorizontal`'s
 * DOWN branch (`vcompact/cond/FtileSwitchWithManyLinks.java:167-170,
 * 178-186`): points `p1, (x1, y2), ptA` with `ptA.x == x1`, decoration
 * `asToDown()`. The segment before the empty one is `p1 -> (x1, y2)`,
 * which is DOWN, so skipping zero-length segments back to the last one
 * that has a direction reproduces the creator's polygon. The jar draws
 * that arrowhead (pateca-54-lija084, duvole-80-meda461 `in.svg`).
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Worm.java:161-168
 */

type Point = { readonly x: number; readonly y: number };

type EndDirection = 'up' | 'down' | 'left' | 'right';

/** One unit step per {@link EndDirection} (SVG y grows downward). */
const UNIT: Readonly<Record<EndDirection, { dx: number; dy: number }>> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

/** add4-T1f (R1): the edge's own `endDirection` when its push site set one
 *  (the creator's fixed decoration, `Snake.java:144-148`), else the
 *  fallback below. */
export function edgeDecorationVector(edge: {
  readonly points: readonly Point[];
  readonly endDirection?: EndDirection | undefined;
}): { dx: number; dy: number } | undefined {
  return edge.endDirection !== undefined ? UNIT[edge.endDirection] : terminalDecorationVector(edge.points);
}

/** The last segment with non-zero length, as a vector, or `undefined` when
 *  no segment has length (nothing to orient an arrowhead by). The fallback
 *  for an edge whose push site sets no `endDirection`. */
export function terminalDecorationVector(points: readonly Point[]): { dx: number; dy: number } | undefined {
  for (let i = points.length - 1; i > 0; i--) {
    const dx = points[i]!.x - points[i - 1]!.x;
    const dy = points[i]!.y - points[i - 1]!.y;
    if (dx !== 0 || dy !== 0) return { dx, dy };
  }
  return undefined;
}
