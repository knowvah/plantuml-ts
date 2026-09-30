/**
 * The visibility icon's shape primitives (`VisibilityModifier#drawSquare`/
 * `drawCircle`/`drawDiamond`/`drawTriangle`) -- moved out of
 * ./class-visibility-icon.ts unchanged (cdd6-T3d, 500-line cap) when the
 * caller's ambient stroke was threaded through {@link IconShapeCtx}.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/VisibilityModifier.java:127-176
 */
import type { Visibility } from './ast.js';
import { attrs } from '../../core/svg.js';
import { fmt, formatDecimal, shortenColor, DEFAULT_SVG_DECIMALS } from '../../core/svg-format.js';

/** cdd-B8FU: jar's `format()` scales EVERY emitted numeral
 *  (`SvgGraphics.java:466-472,557`), this glyph's own `stroke-width`
 *  included -- multiplied by `k` at every `draw*` call site below (T29's
 *  `ScaledTheme` thread already scales `originX`/`originY`/`size`, the
 *  row-geometry inputs; this is the one remaining render-time literal). */
export const STROKE_WIDTH = 1;

/** `stroke:X;stroke-width:Y;<suffix>` -- the ONE combined `style=` value
 *  real `SvgGraphics#styleMe` emits for every shape (`rect`/`ellipse`/
 *  `polygon`), confirmed byte-for-byte against `test-results/dot-cache/
 *  class/lufide-34-cexu026/in.svg`'s eight visibility-icon shapes (T7b --
 *  before this task these three builders emitted DISCRETE `stroke`/
 *  `stroke-width` attributes, which jar never does). */
/** Rule 2 applies inside a `style=` string exactly as it does to a `stroke=`
 *  attribute -- the jar shortens both, and the conformance normalizer
 *  resolves `style` declarations into attributes, so an unshortened color
 *  here surfaces as an `@stroke` diff.
 *  @see .../klimt/drawing/svg/SvgGraphics.java#styleMe */
function styleAttr(stroke: string, strokeWidth: number, suffix = ''): string {
  return `stroke:${shortenColor(stroke)};stroke-width:${formatDecimal(strokeWidth, DEFAULT_SVG_DECIMALS)};${suffix}`;
}

/** Shared shape-draw inputs -- bundled to stay inside this project's
 *  per-function param-count cap (mirrors `renderer-arrowhead.ts
 *  #ExtremityDrawCtx`'s identical rationale, cdd-T29 round 2). */
export interface IconShapeCtx {
  readonly fill: string;
  readonly stroke: string;
  readonly size: number;
  readonly k: number;
  /** cdd6-T3d: the caller's ambient stroke thickness, UNSCALED --
   *  `VisibilityModifier#drawInternal` sets no `UStroke` of its own
   *  (`VisibilityModifier.java:127-176`), so the glyph inherits the ug's. */
  readonly strokeWidth: number;
}

function polygonTag(points: ReadonlyArray<readonly [number, number]>, ctx: IconShapeCtx): string {
  const pts = points.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(',');
  const style = styleAttr(ctx.stroke, ctx.strokeWidth * ctx.k, 'stroke-linejoin:miter;stroke-miterlimit:10;');
  const fill = ctx.fill;
  return `<polygon${attrs([
    ['points', pts],
    ['fill', fill],
    ['style', style],
  ])}/>`;
}

/**
 * `VisibilityModifier#drawSquare`: translate(x+2,y+2), size-4 square --
 * cdd3-T34 (E1-8): `x`/`y`/`ctx.size` already carry `k` (scaled row
 * position, `iconSizeOf(theme) * k`), but the RAW local constants `2`/`4`
 * do not -- upstream draws this whole shape inside ONE ambient
 * scale-wrapped `UGraphic` (`TextBlockExporter.java:205-208`), so every
 * local numeral scales too, not just `size`. `ctx.size - 4` would leave
 * the raw `4` unscaled (`(rawSize*k) - 4` instead of `(rawSize - 4) * k`);
 * multiplying the local `2`/`4` by `ctx.k` reproduces the single ambient
 * transform.
 */
function drawSquare(x: number, y: number, ctx: IconShapeCtx): string {
  const s = ctx.size - 4 * ctx.k;
  return `<rect${attrs([
    ['x', x + 2 * ctx.k],
    ['y', y + 2 * ctx.k],
    ['width', s],
    ['height', s],
    ['fill', ctx.fill],
    ['style', styleAttr(ctx.stroke, ctx.strokeWidth * ctx.k)],
  ])}/>`;
}

/** `VisibilityModifier#drawCircle`: translate(x+2,y+2), size-4 diameter --
 *  same `k`-scaling rationale as {@link drawSquare}. */
function drawCircle(x: number, y: number, ctx: IconShapeCtx): string {
  const r = (ctx.size - 4 * ctx.k) / 2;
  return `<ellipse${attrs([
    ['cx', x + 2 * ctx.k + r],
    ['cy', y + 2 * ctx.k + r],
    ['rx', r],
    ['ry', r],
    ['fill', ctx.fill],
    ['style', styleAttr(ctx.stroke, ctx.strokeWidth * ctx.k)],
  ])}/>`;
}

/** `VisibilityModifier#drawDiamond`: size-2 diamond, translate(x+1,y) --
 *  same `k`-scaling rationale as {@link drawSquare}. */
function drawDiamond(x: number, y: number, ctx: IconShapeCtx): string {
  const s = ctx.size - 2 * ctx.k;
  const ox = x + 1 * ctx.k;
  const points: Array<[number, number]> = [
    [ox + s / 2, y],
    [ox + s, y + s / 2],
    [ox + s / 2, y + s],
    [ox, y + s / 2],
  ];
  return polygonTag(points, ctx);
}

/** `VisibilityModifier#drawTriangle`: size-2 triangle, translate(x+1,y) --
 *  same `k`-scaling rationale as {@link drawSquare}. */
function drawTriangle(x: number, y: number, ctx: IconShapeCtx): string {
  const s = ctx.size - 2 * ctx.k;
  const ox = x + 1 * ctx.k;
  const points: Array<[number, number]> = [
    [ox + s / 2, y + 1 * ctx.k],
    [ox, y + s - 1 * ctx.k],
    [ox + s, y + s - 1 * ctx.k],
  ];
  return polygonTag(points, ctx);
}

/** `VisibilityModifier#drawInternal`'s per-char shape dispatch. */
export function drawIconShape(
  icon: Visibility,
  origin: { readonly x: number; readonly y: number },
  ctx: IconShapeCtx,
): string {
  return icon === '-'
    ? drawSquare(origin.x, origin.y, ctx)
    : icon === '#'
      ? drawDiamond(origin.x, origin.y, ctx)
      : icon === '~'
        ? drawTriangle(origin.x, origin.y, ctx)
        : drawCircle(origin.x, origin.y, ctx); // '+' and '*'
}
