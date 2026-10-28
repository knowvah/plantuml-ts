/**
 * driver-path-svg.ts — the `UPath` → SVG `<path>` driver.
 *
 * Upstream: klimt/drawing/svg/DriverPathSvg.java (~80 ln). Ported:
 * `draw`, including the "color equals backcolor, neither a gradient"
 * fast path (flat fill, no stroke — `svg.setStrokeColor("")`,
 * `setStrokeWidth(0, null)`, both ported literally, including the empty-
 * string stroke value upstream itself passes). Fill/stroke resolution in
 * the general branch reuses `DriverRectangleSvg.applyFillColor`/
 * `applyStrokeColor` — see that module's doc comment for the shared
 * Paint-resolution seam (D3′).
 *
 * `paintsEqual` stands in for `HColor#equals`: two `HColorSimple`s compare
 * their light colours, the dark partner ignored (`HColorSimple.java:84-90`);
 * two plain-string paints compare `===`; a `Paint` and an `HColor` are
 * never equal (a port-only pairing no caller makes); a gradient
 * is never "equal" to anything here (matching upstream's own
 * `&& !(color instanceof HColorGradient) && !(color instanceof
 * HColorLinearGradient)` guard — a gradient never takes the fast path).
 *
 * NOT ported: `DriverShadowedG2d` (upstream's `extends
 * DriverShadowedG2d` — an AWT-`Graphics2D` shadow-rendering base class
 * for the G2D/PNG backend family; irrelevant to the pure-SVG renderer,
 * `SvgGraphics#svgPath` already handles `deltaShadow` itself via
 * `manageShadow`/`addFilterShadowId`, see `svg-graphics-elements.ts`).
 *
 * `UClip`/`ClipContainer` — not ported (same as `DriverRectangleSvg`);
 * this driver's constructor takes no `clipContainer` param and never
 * early-returns for an off-clip path.
 */

import type { UDriver } from '../../AbstractCommonUGraphic.js';
import type { UParam } from '../../UParam.js';
import { toSvgPaint, type ColorMapper, type HColorOrPaint } from '../../color/ColorMapper.js';
import { HColorSimple } from '../../color/HColorSimple.js';
import type { UPath } from '../../shape/UPath.js';
import type { SvgGraphics } from './svg-graphics.js';
import { DriverRectangleSvg } from './driver-rectangle-svg.js';

// See the module doc comment above for the HColor#equals adaptation.
function paintsEqual(a: HColorOrPaint, b: HColorOrPaint): boolean {
  if (a instanceof HColorSimple && b instanceof HColorSimple) return a.equals(b);
  // The port seeds colour/back with the string 'none' (AbstractCommonUGraphic.ts)
  // where upstream seeds `HColors.none()` (AbstractCommonUGraphic.java:61-62),
  // which IS the transparent HColorSimple `TRANSPARENT` (HColors.java:133-135);
  // HColorSimple#equals compares the XColor (HColorSimple.java:85-89) by
  // r/g/b/alpha (XColor.java:91-98), so 'none' equals any alpha-0 simple
  // colour, as upstream's transparent-vs-transparent comparison does.
  if (typeof a === 'string' && a === 'none' && b instanceof HColorSimple) return b.isTransparent();
  if (typeof b === 'string' && b === 'none' && a instanceof HColorSimple) return a.isTransparent();
  return typeof a === 'string' && typeof b === 'string' && a === b;
}

/** Upstream: `DriverPathSvg`. Ported in full — see the module doc
 * comment above. */
export class DriverPathSvg implements UDriver<UPath> {
  constructor(private readonly svg: SvgGraphics) {}

  draw(shape: UPath, param: UParam, mapper: ColorMapper): void {
    const x = param.getTranslate().getDx();
    const y = param.getTranslate().getDy();
    const color = param.getColor();
    const back = param.getBackcolor();

    if (paintsEqual(color, back)) {
      this.svg.setFillColor(toSvgPaint(color, mapper) as string); // DriverPathSvg.java:66-67
      this.svg.setStrokeColor('');
      this.svg.setStrokeWidth(0, null);
    } else {
      DriverRectangleSvg.applyFillColor(this.svg, mapper, param);
      DriverRectangleSvg.applyStrokeColor(this.svg, mapper, param);
      this.svg.setStrokeWidth(param.getStroke().getThickness(), param.getStroke().getDasharraySvg() ?? null);
    }

    this.svg.svgPath(x, y, shape, shape.getDeltaShadow());
  }
}
