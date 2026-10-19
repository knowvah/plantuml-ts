/**
 * svg-defs-scale.ts -- the document scale applied to the shadow `<filter>` def.
 *
 * `SvgGraphics#addFilter` writes `stdDeviation = format(2)` and `dx = dy = format(4)` (SvgGraphics.java:1081,1084);
 * `format` multiplies by `option.getScale()` (`:468-475`), so a scaled document's filter blurs by `2 * scale` and
 * offsets by `4 * scale`. A fragment whose body is scaled as a string after composition (`assemble-svg.ts
 * #finalizeDescriptionFragment`) carries its defs unscaled; this applies the same multiply-then-round once.
 */
import { DEFAULT_SVG_DECIMALS, formatDecimal } from './svg-format.js';

const NUMBER = '(-?\\d+(?:\\.\\d+)?)';
const BLUR_RE = new RegExp('(<feGaussianBlur [^>]*?stdDeviation=")' + NUMBER + '(")', 'g');
// `dx` and `dy` sit together on one `<feOffset>` (SvgGraphics.java:1084).
const OFFSET_RE = new RegExp('(<feOffset [^>]*?dx=")' + NUMBER + '(" dy=")' + NUMBER + '(")', 'g');

function scaled(value: string, factor: number): string {
  return formatDecimal(Number(value) * factor, DEFAULT_SVG_DECIMALS);
}

/** The shadow filter's `stdDeviation`/`dx`/`dy`, multiplied by `factor` and formatted once. */
export function scaleShadowFilterDefs(defs: string, factor: number): string {
  if (factor === 1) return defs;
  return defs
    .replace(BLUR_RE, (_m, head: string, v: string, tail: string) => head + scaled(v, factor) + tail)
    .replace(
      OFFSET_RE,
      (_m, head: string, dx: string, mid: string, dy: string, tail: string) =>
        head + scaled(dx, factor) + mid + scaled(dy, factor) + tail,
    );
}
