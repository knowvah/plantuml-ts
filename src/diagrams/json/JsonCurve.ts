/**
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/JsonCurve.java
 *
 * The path a json edge draws, built from the layout engine's OWN spline rather
 * than re-derived. Upstream's shape is: a spot 13 units back from the spline
 * start, a straight stub from that spot to the start, then the spline's cubic
 * segments, then an arrowhead.
 *
 * Replaces this port's earlier approximation, which kept the 13-unit stub but
 * pointed it horizontally and substituted a hand-built S-curve for the engine's
 * bezier (`renderer.ts#buildEdgePathD`). With T7's record ports in place the
 * engine now routes each edge out of the specific row it belongs to, so its
 * spline is worth consuming.
 */

export interface CurvePoint {
  readonly x: number;
  readonly y: number;
}

/**
 * The distance the leading stub and its spot sit back from the spline start.
 * Upstream passes it at the call site — `getCurve(edge, 13)`
 * (`SmetanaForJson.java:213`) — rather than as a constant on the curve.
 */
export const VERY_FIRST_LINE = 13;

/**
 * @see .../jsondiagram/JsonCurve.java#supp
 *
 * Extrapolate `len` units from `center`, directly AWAY from `direction`.
 * Upstream divides by the full distance without guarding it; a zero-length
 * segment would yield NaN there. Guarded here because a degenerate spline is a
 * rendering artefact, not something worth propagating into a path string —
 * documented rather than silent.
 */
export function supp(center: CurvePoint, direction: CurvePoint, len: number): CurvePoint {
  const full = Math.hypot(center.x - direction.x, center.y - direction.y);
  if (full === 0) return center;
  const dx = (center.x - direction.x) / full;
  const dy = (center.y - direction.y) / full;
  return { x: center.x + dx * len, y: center.y + dy * len };
}

/**
 * The point the stub starts from, and where the spot is drawn.
 * @see .../jsondiagram/JsonCurve.java#getVeryFirst
 */
export function veryFirstPoint(points: readonly CurvePoint[]): CurvePoint | undefined {
  const p0 = points[0];
  const p1 = points[1];
  if (p0 === undefined) return undefined;
  if (p1 === undefined) return p0;
  return supp(p0, p1, VERY_FIRST_LINE);
}

/**
 * graphviz's `#define ARROW_LENGTH 10.`
 * (`~/git/graphviz/lib/common/arrows.c:29`) scaled by the `arrowsize` upstream
 * sets on every json edge — `agsafeset(zz, edge, "arrowsize", ".75")`
 * (`SmetanaForJson.java:221`, alongside `arrowhead=normal` at :223).
 */
const ARROW_LENGTH = 10 * 0.75;

/**
 * `Arrow#getPoint` — polar offset with sin on x and cos on y (note the
 * ordering, which is not the usual convention and pairs with the equally
 * unusual `atan2(dx, dy)` below).
 * @see .../jsondiagram/Arrow.java#getPoint
 */
function arrowPoint(center: CurvePoint, alpha: number, len: number): CurvePoint {
  return { x: center.x + len * Math.sin(alpha), y: center.y + len * Math.cos(alpha) };
}

/**
 * Where the spline ENDS, as distinct from its last control point.
 *
 * graphviz stores this on the spline as `ep` (`bezier.ep`), separate from the
 * control-point list, and upstream reads it straight off
 * (`JsonCurve.java:78-82`). **`@knowvah/dot-engine` does not expose `sp`/`ep`**
 * — `EdgeGeometry` carries only `points` — so this port extrapolates it from
 * the spline's own terminal direction by one arrow length.
 *
 * That is an approximation of a value the engine already computed, not a
 * fitted constant: both numbers behind `ARROW_LENGTH` are cited upstream. It
 * is the arrowhead's DEPTH that is approximate; its direction and shape come
 * from the spline. Tracked in `docs/graphviz-issues/` — exposing `sp`/`ep`
 * removes the approximation entirely.
 */
function endPointOf(points: readonly CurvePoint[]): CurvePoint | undefined {
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  if (last === undefined || prev === undefined) return undefined;
  return supp(last, prev, ARROW_LENGTH);
}

/**
 * The filled arrowhead upstream draws INLINE at the spline's end — not an SVG
 * `<marker>`. `drawCurve` closes with
 * `new Arrow(last, trueEp).drawArrow(ug.apply(color.bg()))`, and `drawArrow`
 * builds a four-point path: the two barbs at `±90°` off the axis at `0.4·dist`,
 * a notch at `0.3·dist` along it, and the tip at `p2`.
 *
 * Returns `''` for a spline too short to have a direction.
 *
 * @see .../jsondiagram/Arrow.java#drawArrow
 * @see .../jsondiagram/JsonCurve.java#drawCurve
 */
export function buildArrowHeadPath(points: readonly CurvePoint[]): string {
  const p1 = points[points.length - 1];
  const p2 = endPointOf(points);
  if (p1 === undefined || p2 === undefined) return '';

  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  if (dist === 0) return '';
  // `Math.atan2(p1p2.getDX(), p1p2.getDY())` — dx first, matching `arrowPoint`.
  const alpha = Math.atan2(p2.x - p1.x, p2.y - p1.y);

  const p3 = arrowPoint(p1, alpha + Math.PI / 2, dist * 0.4);
  const p4 = arrowPoint(p1, alpha - Math.PI / 2, dist * 0.4);
  const p11 = arrowPoint(p1, alpha, dist * 0.3);

  return (
    `M ${p4.x} ${p4.y} L ${p11.x} ${p11.y} L ${p3.x} ${p3.y} ` +
    `L ${p2.x} ${p2.y} L ${p4.x} ${p4.y}`
  );
}

/**
 * @see .../jsondiagram/JsonCurve.java#drawCurve
 *
 * `moveTo(veryFirst)`, `lineTo(points[0])`, then cubic segments consuming the
 * remaining points three at a time — the engine emits `1 + 3n` points for a
 * cubic spline, which is exactly what upstream's `for (i = 1; i < size; i += 3)`
 * assumes. A trailing partial group (a malformed spline) is skipped rather than
 * read past the end.
 */
export function buildCurvePath(points: readonly CurvePoint[]): string {
  const first = veryFirstPoint(points);
  const p0 = points[0];
  if (first === undefined || p0 === undefined) return '';

  const parts = [`M ${first.x} ${first.y}`, `L ${p0.x} ${p0.y}`];
  for (let i = 1; i + 2 < points.length; i += 3) {
    const c1 = points[i]!;
    const c2 = points[i + 1]!;
    const end = points[i + 2]!;
    parts.push(`C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y}`);
  }
  return parts.join(' ');
}
