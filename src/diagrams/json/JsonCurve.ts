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
