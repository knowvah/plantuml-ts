import { UPath } from '../../shape/UPath.js';
import type { UGraphicWithScale } from '../../UGraphicWithScale.js';
import { UTranslate } from '../../UTranslate.js';
import { parseSvgPath } from '../SvgPath.js';
import type { RenderContext } from './sax-context.js';
import type { SaxAttributes } from './sax-events.js';
import { applyStyleAndTransform, getDoubleAttr } from './sax-style.js';

/**
 * The basic-shape handlers of `RenderHandler` (`// ---- Shape Handlers ----`).
 * Upstream draws every one of them as a `UPath` run through
 * `path.affine(at, angle, initialScale)` and `elementUgs.draw(path)` — there is
 * no `URectangle`/`UEllipse` here, and `<rect rx ry>` is not read (the task
 * spec's `URectangle`/rounding wording is contradicted by `:487-504`; the Java
 * wins). The handlers read `ctx.ugs` and never reassign it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgSaxParser.java:486-626
 */

/** Default for every missing geometry attribute (`SvgSaxParser.java:490-493` etc.). */
const DEFAULT_GEOMETRY = 0;

/** `new UPath(closed ? "polygon" : "polyline", null)` (`SvgSaxParser.java:582-583`). */
const POLYGON_COMMENT = 'polygon';
const POLYLINE_COMMENT = 'polyline';

/**
 * `P_POINTS_NUMBER` (`SvgSaxParser.java:1187-1188`): optional sign, then
 * `d+.d*`, `.d+` or `d+`, then an optional exponent.
 */
const POINTS_NUMBER = /[+-]?(?:\d+\.\d*|\.\d+|\d+)(?:[eE][+-]?\d+)?/g;

/** Arc flags of `buildEllipsePath`: large-arc 0, sweep 1 (`SvgSaxParser.java:610-613`). */
const ARC_ROTATION = 0;
const ARC_LARGE = 0;
const ARC_SWEEP = 1;

/** `path.affine(elementUgs.getAffineTransform(), getAngle(), getInitialScale())` then `draw`. */
function drawAffine(elementUgs: UGraphicWithScale, path: UPath): void {
  elementUgs.draw(path.affine(elementUgs.getAffineTransform(), elementUgs.getAngle(), elementUgs.getInitialScale()));
}

/** `getDoubleAttr(attrs, name, 0)` for each name, in order. */
function geometry(attrs: SaxAttributes, names: readonly string[]): number[] {
  return names.map((name) => getDoubleAttr(attrs, name, DEFAULT_GEOMETRY));
}

/**
 * @see SvgSaxParser.java:606-617 buildEllipsePath
 */
function buildEllipsePath(cx: number, cy: number, rx: number, ry: number): UPath {
  const path = UPath.none();
  path.moveTo(0, ry);
  path.arcTo(rx, ry, ARC_ROTATION, ARC_LARGE, ARC_SWEEP, rx, 0);
  path.arcTo(rx, ry, ARC_ROTATION, ARC_LARGE, ARC_SWEEP, 2 * rx, ry);
  path.arcTo(rx, ry, ARC_ROTATION, ARC_LARGE, ARC_SWEEP, rx, 2 * ry);
  path.arcTo(rx, ry, ARC_ROTATION, ARC_LARGE, ARC_SWEEP, 0, ry);
  path.lineTo(0, ry);
  return path.translate(cx - rx, cy - ry);
}

/** @see SvgSaxParser.java:487-504 handleRect */
export function handleRect(ctx: RenderContext, attrs: SaxAttributes): void {
  const elementUgs = applyStyleAndTransform(ctx, attrs, ctx.ugs);
  const [x, y, width, height] = geometry(attrs, ['x', 'y', 'width', 'height']) as [number, number, number, number];

  const path = UPath.none();
  path.moveTo(x, y);
  path.lineTo(x + width, y);
  path.lineTo(x + width, y + height);
  path.lineTo(x, y + height);
  path.lineTo(x, y);
  drawAffine(elementUgs, path);
}

/** @see SvgSaxParser.java:506-516 handleCircle */
export function handleCircle(ctx: RenderContext, attrs: SaxAttributes): void {
  const elementUgs = applyStyleAndTransform(ctx, attrs, ctx.ugs);
  const [cx, cy, r] = geometry(attrs, ['cx', 'cy', 'r']) as [number, number, number];
  drawAffine(elementUgs, buildEllipsePath(cx, cy, r, r));
}

/** @see SvgSaxParser.java:518-529 handleEllipse */
export function handleEllipse(ctx: RenderContext, attrs: SaxAttributes): void {
  const elementUgs = applyStyleAndTransform(ctx, attrs, ctx.ugs);
  const [cx, cy, rx, ry] = geometry(attrs, ['cx', 'cy', 'rx', 'ry']) as [number, number, number, number];
  drawAffine(elementUgs, buildEllipsePath(cx, cy, rx, ry));
}

/** @see SvgSaxParser.java:531-545 handleLine */
export function handleLine(ctx: RenderContext, attrs: SaxAttributes): void {
  const elementUgs = applyStyleAndTransform(ctx, attrs, ctx.ugs);
  const [x1, y1, x2, y2] = geometry(attrs, ['x1', 'y1', 'x2', 'y2']) as [number, number, number, number];

  const path = UPath.none();
  path.moveTo(x1, y1);
  path.lineTo(x2, y2);
  drawAffine(elementUgs, path);
}

/**
 * Every numeric token of `points`, in order (`SvgSaxParser.java:565-573`).
 * The `NumberFormatException` skip at `:571` cannot fire: every match of
 * {@link POINTS_NUMBER} is a valid `Double.parseDouble` / `Number` input.
 */
function scanNumbers(pointsStr: string): number[] {
  return Array.from(pointsStr.matchAll(POINTS_NUMBER), (m) => Number(m[0]));
}

/**
 * Pairs consumed while `i + 1 < size` (`SvgSaxParser.java:585-598`); a closed
 * shape gets a final `lineTo(firstX, firstY)` and NO `closePath`
 * (`:600-605`, "Keep polygons open to avoid SEG_CLOSE dependency in klimt").
 */
function buildPolyPath(nums: readonly number[], closed: boolean): UPath {
  const path = new UPath(closed ? POLYGON_COMMENT : POLYLINE_COMMENT, null);
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i]!;
    const y = nums[i + 1]!;
    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  if (closed && nums.length >= 2) path.lineTo(nums[0]!, nums[1]!);
  return path;
}

/** @see SvgSaxParser.java:555-616 handlePolyShape */
function handlePolyShape(ctx: RenderContext, attrs: SaxAttributes, closed: boolean): void {
  const elementUgs = applyStyleAndTransform(ctx, attrs, ctx.ugs);

  const pointsStr = attrs.get('points');
  if (pointsStr === undefined || pointsStr === '') return;

  drawAffine(elementUgs, buildPolyPath(scanNumbers(pointsStr), closed));
}

/** @see SvgSaxParser.java:547-549 handlePolyline (via handlePolyShape :555-616) */
export function handlePolyline(ctx: RenderContext, attrs: SaxAttributes): void {
  handlePolyShape(ctx, attrs, false);
}

/** @see SvgSaxParser.java:551-553 handlePolygon (via handlePolyShape :555-616) */
export function handlePolygon(ctx: RenderContext, attrs: SaxAttributes): void {
  handlePolyShape(ctx, attrs, true);
}

/**
 * `new SvgPath(pathData, UTranslate.none())` then
 * `drawMe(elementUgs.getUg(), elementUgs.getAffineTransform())`, which draws
 * unless the path is invisible (`SvgPath.java:244-248`, `parseSvgPath` is that
 * overload's port). The transform is baked in at parse time, so `affine` is
 * not applied here.
 *
 * @see SvgSaxParser.java:618-626 handlePath
 */
export function handlePath(ctx: RenderContext, attrs: SaxAttributes): void {
  const elementUgs = applyStyleAndTransform(ctx, attrs, ctx.ugs);

  const pathData = attrs.get('d');
  if (pathData === undefined || pathData === '') return;

  const path = parseSvgPath(pathData, UTranslate.none(), elementUgs.getAffineTransform());
  if (!path.isInvisible()) elementUgs.getUg().draw(path);
}
