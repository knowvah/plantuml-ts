/**
 * Shared `<path>` `d`-string segment builder — the plain-string counterpart
 * to `UPath` (`core/klimt/shape/UPath.ts`) for this port's several
 * class-diagram renderers that draw markup as plain strings rather than
 * through a `UGraphic`/`SvgGraphics` (`class-namespace-shape.ts`'s own
 * header doc comment: "class draws plain SVG strings... never through a
 * `UGraphic`"). Before T7b these callers (`class-namespace-shape.ts`,
 * `renderer-note.ts`, `note-opale.ts`) hand-interpolated raw numbers into
 * `M`/`L`/`A`/`C` segments, bypassing every formatting rule in
 * `svg-format.ts` (ADR-1..3, `plans/svg-output-size-reduction/decisions.md`).
 *
 * Mirrors `UPath`'s ROLE — every coordinate is formatted through
 * {@link formatDecimal} exactly as `SvgGraphics#svgPath`'s
 * `renderPathSegment` formats each `UPath` segment via `this.format()`
 * (`core/klimt/drawing/svg/svg-graphics-elements.ts`) — WITHOUT adopting
 * `UPath`'s stateful segment-list class: none of these callers need
 * segment replay, inspection, or affine transforms the way klimt's real
 * draw pass does; they only need the final `d` text.
 *
 * @see ~/git/plantuml/.../klimt/shape/UPath.java (moveTo/lineTo/arcTo/cubicTo)
 * @see .../klimt/drawing/svg/svg-graphics-elements.ts#renderPathSegment
 */
import { fmt } from './svg-format.js';

/**
 * `M` — moveto. Formats through the shared {@link fmt}, the single
 * default-precision formatting entry point `svg.ts`/`svg-shapes.ts` also
 * use — so a coordinate written into a `d` string and the same coordinate
 * written through `attrs()` can never disagree.
 * @see UPath.java#moveTo
 */
export function moveTo(x: number, y: number): string {
  return `M${fmt(x)},${fmt(y)}`;
}

/** `L` — lineto. @see UPath.java#lineTo */
export function lineTo(x: number, y: number): string {
  return `L${fmt(x)},${fmt(y)}`;
}

/**
 * `A` — elliptical arc, the same-radius (`rx === ry`) form every current
 * caller needs (`UPath#arcTo`'s own 4-arg `(pt, radius, largeArcFlag,
 * sweepFlag)` overload; `xAxisRotation` is always literal `0` for both
 * callers — `class-namespace-shape.ts`'s quarter-circle tab corners and
 * `note-opale.ts`'s zero-radius `roundCorner=0` degenerate arcs). Extend
 * with a full `rx !== ry`/non-zero-rotation overload if a future caller
 * needs one — no current site does.
 */
export function arcTo(x: number, y: number, radius: number, largeArcFlag: 0 | 1, sweepFlag: 0 | 1): string {
  const r = fmt(radius);
  const end = `${fmt(x)},${fmt(y)}`;
  return `A${r},${r} 0 ${largeArcFlag} ${sweepFlag} ${end}`;
}

/**
 * A whole polyline/spline `d` string from an ordered point list — the shape
 * every edge renderer needs.
 *
 * A point count of `3n + 1` (and at least 4) is a cubic Bezier spline, the
 * form graphviz emits for a routed edge: the first point is the start and
 * each following triple is (control, control, end). Anything else is a
 * plain polyline, which is what a degenerate 2-point secant or a
 * hand-constructed test path produces.
 *
 * Shared because `class/renderer-edge.ts#buildPathData` and
 * `state/state-renderer-transitions.ts#buildPathD` were byte-identical
 * copies of this function, and both carried the same unformatted-coordinate
 * defect. Upstream has one path-emission seam (`DotPath`/`UPath` fed to
 * `SvgGraphics#svgPath`), not one per diagram type.
 *
 * @see ~/git/plantuml/.../klimt/geom/DotPath.java
 */
export function splinePathD(points: ReadonlyArray<{ readonly x: number; readonly y: number }>): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  if (first === undefined) return '';
  const start = moveTo(first.x, first.y);

  const isBezierSpline = points.length >= 4 && (points.length - 1) % 3 === 0;
  if (isBezierSpline) {
    const segments: string[] = [];
    for (let i = 1; i < points.length; i += 3) {
      segments.push(cubicTo(points[i]!, points[i + 1]!, points[i + 2]!));
    }
    return [start, ...segments].join(' ');
  }

  return [start, ...rest.map((p) => lineTo(p.x, p.y))].join(' ');
}

/**
 * A rectangle whose TOP two corners are rounded and whose bottom edge is
 * square — the classifier/state header box. Not expressible as
 * `<rect rx>` (that rounds all four), which is why the jar emits a
 * `<path>` here and why this port does too.
 *
 * Shared because `class/renderer-classifier-box.ts` and
 * `state/renderer-composite-box.ts` built byte-identical copies of it.
 */
export function roundedTopRectD(x0: number, y0: number, x1: number, y1: number, r: number): string {
  return [
    moveTo(x0 + r, y0), lineTo(x1 - r, y0), arcTo(x1, y0 + r, r, 0, 1),
    lineTo(x1, y1), lineTo(x0, y1), lineTo(x0, y0 + r), arcTo(x0 + r, y0, r, 0, 1),
  ].join(' ');
}

/**
 * The mirror of {@link roundedTopRectD}: square top edge, rounded BOTTOM
 * corners — a composite state's body below its header divider.
 */
export function roundedBottomRectD(x0: number, yTop: number, x1: number, y1: number, r: number): string {
  return [
    moveTo(x0, yTop), lineTo(x1, yTop), lineTo(x1, y1 - r), arcTo(x1 - r, y1, r, 0, 1),
    lineTo(x0 + r, y1), arcTo(x0, y1 - r, r, 0, 1), lineTo(x0, yTop),
  ].join(' ');
}

/** `C` — cubic Bezier. Takes point pairs (not 6 discrete numbers) to stay
 *  within this project's 5-parameter budget, matching the point-pair
 *  overload `UPath#cubicTo` already offers alongside its positional form.
 *  @see UPath.java#cubicTo */
export function cubicTo(
  c1: { readonly x: number; readonly y: number },
  c2: { readonly x: number; readonly y: number },
  end: { readonly x: number; readonly y: number },
): string {
  const p = (pt: { readonly x: number; readonly y: number }): string =>
    `${fmt(pt.x)},${fmt(pt.y)}`;
  return `C${p(c1)} ${p(c2)} ${p(end)}`;
}
