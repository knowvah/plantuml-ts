/**
 * driver-pixel-svg.ts — the `UPixel` → SVG `<rect>` driver.
 *
 * Upstream: klimt/drawing/svg/DriverPixelSvg.java:44-58, ported in full.
 * The pixel is a 0.5 x 0.5 rect stroked in the graphic's foreground
 * (a gradient ink strokes with its first colour, not a gradient def) at
 * stroke width 0.5, no dash. The driver sets NO fill: the rect carries
 * whatever fill `SvgGraphics` last held (`fill="black"` before any other
 * shape, `fill="#000"` after one — `kaziri-68-fofu065/in.svg`), the
 * writer's own fill state, exactly as upstream.
 *
 * `ColorMapper` is dropped like every sibling driver's (this port's
 * `UParam` carries resolved `Paint`, see `driver-rectangle-svg.ts`).
 * Upstream builds the driver with no `SvgGraphics` and receives it per
 * draw; this port's drivers take it at construction (`UDriver#draw(shape,
 * param)`), as `DriverRectangleSvg` does.
 */

import type { UDriver } from '../../AbstractCommonUGraphic.js';
import type { UParam } from '../../UParam.js';
import type { UPixel } from '../../shape/UPixel.js';
import type { SvgGraphics } from './svg-graphics.js';

/** The pixel's side and stroke width. @see DriverPixelSvg.java:54,56 */
const PIXEL_SIZE = 0.5;

/** Upstream: `DriverPixelSvg`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/DriverPixelSvg.java:44-58 */
export class DriverPixelSvg implements UDriver<UPixel> {
  constructor(private readonly svg: SvgGraphics) {}

  /** Upstream: `draw(UPixel, double x, double y, ColorMapper, UParam, SvgGraphics)`. @see DriverPixelSvg.java:46-57 */
  draw(_pixel: UPixel, param: UParam): void {
    const x = param.getTranslate().getDx();
    const y = param.getTranslate().getDy();
    const color = param.getColor();
    if (typeof color === 'string') this.svg.setStrokeColor(color);
    else this.svg.setStrokeColor(color.color1);
    this.svg.setStrokeWidth(PIXEL_SIZE, null);

    this.svg.svgRectangle({ x, y, width: PIXEL_SIZE, height: PIXEL_SIZE, rx: 0, ry: 0 }, 0);
  }
}
