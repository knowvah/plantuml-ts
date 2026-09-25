/**
 * class-member-sprite-render.ts — draws a member row's `'drawable'` atom
 * (C-4, cdd3-T23): the `DrawablePrimitive[]` decomposition
 * `class-member-atom-resolve.ts#resolveSpriteAtom` already resolved at
 * LAYOUT time, placed at the row's own RENDER-time origin.
 *
 * This is the class engine's lightweight, non-`UGraphic` counterpart to
 * `core/annotations/blocks-creole.ts#drawAtomImage`'s identical
 * `'drawable'` branch (that file's own doc comment: "SvgNanoParser-
 * decomposed primitives re-apply their own translate/paint" -- same loop,
 * same shapes, this file's own `renderMemberRowDrawable` just emits raw
 * SVG element strings instead of driving a live `UGraphic`, matching how
 * `renderer-classifier-rows.ts` already draws every OTHER atom kind
 * (`'image'`, `'vector'`, ...).
 *
 * A `UPath` primitive carries its own ABSOLUTE coordinates already
 * (`translate` is always `UTranslate.none()` for it --
 * `core/creole-atoms.ts#DrawablePrimitive`'s own doc comment) -- the row's
 * origin is added directly to its segments via `UPath#translate` before
 * the `d` string is built. `UEllipse`/`UText` instead carry the position
 * on their own `translate` field, added the same way.
 *
 * `d`-string building is a pure port of
 * `klimt/drawing/svg/svg-graphics-elements.ts#renderPathSegment` (itself
 * `SvgGraphics#svgPath`'s per-segment switch), minus the DOM/shadow-
 * management half this lightweight renderer has no equivalent for.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/DriverPathSvg.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/DriverEllipseSvg.java
 *
 * Jar-verified target: bidusa-22-jutu505/ruliki-78-biji661's `<$Netw>`
 * (`assets/sprites/archimate/network.svg`) -- ONE `<path>` element, no
 * `fill=`/`stroke=` attribute of its own, so `SvgNanoParser` resolves BOTH
 * fore and back to the forced/ambient tint (`svg-nanoparser-shapes.ts
 * #applyFillAndStroke`'s `strokeString === undefined` branch) -- the exact
 * fast path `DriverPathSvg.java`'s own `paintsEqual` branch takes,
 * confirmed against the cached jar SVG: `<path d="M20.975,77.278 ..."
 * fill="#AA0"/>`, no `stroke`/`style` attribute at all. The `fore !== back`
 * stroke branch and the `UEllipse`/`UText` branches below are ported from
 * the same drivers' logic (same source read, same fill/stroke seam every
 * OTHER primitive driver in this port already uses -- `driver-rectangle-
 * svg.ts#applyFillColor`/`applyStrokeColor`) but have ZERO corpus reach
 * today -- see `.agent-notes/cdd3-T23.md`.
 */
import { UPath, USegmentType, type USegment } from '../../core/klimt/shape/UPath.js';
import { UEllipse } from '../../core/klimt/shape/UEllipse.js';
import { UText, getFont } from '../../core/klimt/shape/UText.js';
import type { DrawablePrimitive } from '../../core/creole-atoms.js';
import type { Paint } from '../../core/paint.js';
import { fmt } from '../../core/svg-format.js';
import { path, ellipse, text as svgText } from '../../core/svg.js';

/** `driver-path-svg.ts#paintsEqual` -- a gradient `Paint` never takes the
 *  flat-fill fast path (matches upstream's own `HColor#equals` restriction
 *  to non-gradient colors, that driver's own doc comment). */
function paintsEqual(a: Paint, b: Paint): boolean {
  return typeof a === 'string' && typeof b === 'string' && a === b;
}

/** `SvgGraphics#formatBoolean` -- an arc flag is always `'0'`/`'1'`. */
function formatFlag(x: number): string {
  return x === 0 ? '0' : '1';
}

/** One `USegment` -> its `d`-string command, `renderPathSegment`'s
 *  per-case math (coordinates are ALREADY absolute -- see this module's
 *  own doc comment -- so no `x`/`y` offset is threaded here). */
function segmentToD(seg: USegment): string {
  const c = seg.coord;
  switch (seg.segmentType) {
    case USegmentType.SEG_MOVETO:
      return `M${fmt(c[0]!)},${fmt(c[1]!)} `;
    case USegmentType.SEG_LINETO:
      return `L${fmt(c[0]!)},${fmt(c[1]!)} `;
    case USegmentType.SEG_QUADTO:
      return `Q${fmt(c[0]!)},${fmt(c[1]!)} ${fmt(c[2]!)},${fmt(c[3]!)} `;
    case USegmentType.SEG_CUBICTO:
      return `C${fmt(c[0]!)},${fmt(c[1]!)} ${fmt(c[2]!)},${fmt(c[3]!)} ${fmt(c[4]!)},${fmt(c[5]!)} `;
    case USegmentType.SEG_ARCTO:
      return (
        `A${fmt(c[0]!)},${fmt(c[1]!)} ${fmt(c[2]!)} ` +
        `${formatFlag(c[3]!)} ${formatFlag(c[4]!)} ${fmt(c[5]!)},${fmt(c[6]!)} `
      );
    default:
      return ''; // SEG_CLOSE: matches upstream's empty branch.
  }
}

function pathToD(shifted: UPath): string {
  let d = '';
  for (const seg of shifted) d += segmentToD(seg);
  return d.trim();
}

function renderPathPrimitive(shape: UPath, primitive: DrawablePrimitive, originX: number, originY: number): string {
  const shifted = shape.translate(originX + primitive.translate.getDx(), originY + primitive.translate.getDy());
  const d = pathToD(shifted);
  if (d.length === 0) return '';
  // `DriverPathSvg.java`'s own fast path: `fore === back` draws flat-filled,
  // no stroke at all (`styleMe`'s `strokeWidth === '0'` early return).
  if (paintsEqual(primitive.fore, primitive.back)) return path(d, { fill: primitive.fore });
  const dasharray = primitive.stroke.getDasharraySvg();
  return path(d, {
    fill: primitive.back,
    stroke: primitive.fore,
    strokeWidth: primitive.stroke.getThickness(),
    ...(dasharray !== undefined ? { strokeDasharray: `${dasharray[0]},${dasharray[1]}` } : {}),
  });
}

/** `DriverEllipseSvg.java`'s `start === 0 && extend === 0` full-ellipse
 *  case only -- `SvgNanoParser`'s only `UEllipse` producer, `drawCircle`
 *  (`svg-nanoparser-shapes.ts`), always builds via `UEllipse.build(w, h)`
 *  (start/extend 0); an arc `UEllipse` is never reachable from a sprite
 *  decomposition (`drawEllipse` builds a `UPath` instead, see this
 *  module's own doc comment). */
function renderEllipsePrimitive(
  shape: UEllipse,
  primitive: DrawablePrimitive,
  originX: number,
  originY: number,
): string {
  const x = originX + primitive.translate.getDx();
  const y = originY + primitive.translate.getDy();
  const rx = shape.getWidth() / 2;
  const ry = shape.getHeight() / 2;
  const cx = x + rx;
  const cy = y + ry;
  return paintsEqual(primitive.fore, primitive.back)
    ? ellipse(cx, cy, rx, ry, { fill: primitive.fore })
    : ellipse(cx, cy, rx, ry, { fill: primitive.back, stroke: primitive.fore });
}

/** `SvgNanoParser#drawText` draws directly at its own resolved `(x, y)`
 *  baseline (`ugs.getUg().apply(new UTranslate(x, y)).draw(utext)`) -- the
 *  SAME point this primitive's own `translate` carries. */
function renderTextPrimitive(shape: UText, primitive: DrawablePrimitive, originX: number, originY: number): string {
  const x = originX + primitive.translate.getDx();
  const y = originY + primitive.translate.getDy();
  const fc = shape.getFontConfiguration();
  const font = getFont(fc);
  return svgText(x, y, shape.getText(), {
    fontFamily: font.family,
    fontSize: font.size,
    fill: fc.color ?? primitive.fore,
  });
}

/** Draws every primitive of one resolved SVG-sprite atom
 *  (`class-member-render-atom.ts#MemberRenderAtom`'s `'drawable'` kind) at
 *  the member row's own `(originX, originY)` -- see this module's own doc
 *  comment for the coordinate-system split between `UPath` (self-absolute)
 *  and `UEllipse`/`UText` (carried on `translate`). */
export function renderMemberRowDrawable(
  primitives: readonly DrawablePrimitive[],
  originX: number,
  originY: number,
): string {
  let out = '';
  for (const primitive of primitives) {
    const shape = primitive.shape;
    if (shape instanceof UPath) out += renderPathPrimitive(shape, primitive, originX, originY);
    else if (shape instanceof UEllipse) out += renderEllipsePrimitive(shape, primitive, originX, originY);
    else if (shape instanceof UText) out += renderTextPrimitive(shape, primitive, originX, originY);
  }
  return out;
}
