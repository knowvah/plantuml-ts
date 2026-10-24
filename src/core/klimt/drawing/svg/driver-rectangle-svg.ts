/**
 * driver-rectangle-svg.ts — the `URectangle` → SVG `<rect>` driver.
 *
 * Upstream: klimt/drawing/svg/DriverRectangleSvg.java (~113 ln). Ported:
 * `draw`, plus the two `static` fill/stroke-color resolution helpers
 * (`applyFillColor`, `applyStrokeColor`) that `DriverEllipseSvg`,
 * `DriverPolygonSvg`, and `DriverPathSvg` also call — kept as `static`
 * methods on this class, matching upstream's own placement and call
 * sites (`DriverRectangleSvg.applyFillColor(svg, mapper, param)`)
 * exactly, just dropping the `mapper: ColorMapper` param (this port's
 * `UParam` already carries resolved `Paint` values, not raw `HColor` —
 * see `UParam.ts`, T2).
 *
 * Color-resolution seam (D3′, this task's decision — see the module doc
 * comment on `u-graphic-svg.ts` for the full rationale): a plain-string
 * `Paint` is used as-is for `setFillColor`/`setStrokeColor`, mirroring
 * `HColor#toSvg(mapper)` for the non-gradient branch. A `Gradient` Paint
 * is registered through `SvgGraphics#createSvgGradient` (T4's
 * seed/counter id policy — see `svg-graphics-core.ts`'s doc comment),
 * NOT through `paint.ts#paintToSvg`'s content-hash id scheme — the two
 * id schemes are deliberately kept separate; only `SvgGraphics`'s is
 * used at this driver seam, matching upstream's `svg.createSvgGradient
 * (...)` call exactly. Our `Paint`'s `Gradient` variant models upstream's
 * `HColorGradient` (2-stop, `color1`/`color2`/`policy`); upstream's
 * `HColorLinearGradient` (multi-stop) is a `LinearGradientPaint`
 * (`paint.ts`, `isLinearGradientPaint`), checked FIRST as upstream does
 * (`DriverRectangleSvg.java:83,99`) and registered through
 * `SvgGraphics#createSvgLinearGradient` -- the `createSvgGradient(
 * HColorLinearGradient, ColorMapper)` overload -- with the RAW paint, since
 * the mapper is applied per stop inside it.
 *
 * Deferred (out of scope, reported): `background.transparentFillBehavior
 * ()` — upstream's second `setFillColor` arg, an `HColor`-only property
 * (`WITH_FILL_NONE` default vs. `WITH_FILL_OPACITY` override) with no
 * representation on this port's `Paint` type (`src/core/paint.ts`, not in
 * this task's write-set). `setFillColor` is called with its default
 * (`TransparentFillBehavior.WITH_FILL_NONE`, see `svg-graphics-core.ts`),
 * matching upstream's overwhelmingly common case — every `HColor` except
 * the rare caller of `withTransparentFillBehavior(WITH_FILL_OPACITY)`
 * (`HColorSimple.java:231`) already resolves to `WITH_FILL_NONE`.
 *
 * `UClip`/`ClipContainer` — not ported (see `URectangle.ts`'s own
 * deferred-methods note); this driver's constructor accordingly takes no
 * `clipContainer` param and never early-returns for an off-clip rect.
 */

import type { UDriver } from '../../AbstractCommonUGraphic.js';
import type { UParam } from '../../UParam.js';
import { isLinearGradientPaint } from '../../../paint.js';
import { toSvgPaint, type ColorMapper } from '../../color/ColorMapper.js';
import type { URectangle } from '../../shape/URectangle.js';
import type { SvgGraphics } from './svg-graphics.js';

/** Upstream: `DriverRectangleSvg`. Ported in full (see the module doc
 * comment above for the two `static` helpers' scope). */
export class DriverRectangleSvg implements UDriver<URectangle> {
  constructor(private readonly svg: SvgGraphics) {}

  /** Upstream: `DriverRectangleSvg.applyFillColor(SvgGraphics, ColorMapper, UParam)`. */
  static applyFillColor(svg: SvgGraphics, mapper: ColorMapper, param: UParam): void {
    const raw = param.getBackcolor();
    if (isLinearGradientPaint(raw)) {
      svg.setFillColor(`url(#${svg.createSvgLinearGradient(raw, mapper)})`); // DriverRectangleSvg.java:83-86
      return;
    }
    const background = toSvgPaint(raw, mapper);
    if (typeof background === 'string') {
      svg.setFillColor(background);
    } else {
      const id = svg.createSvgGradient(background.color1, background.color2, background.policy);
      svg.setFillColor(`url(#${id})`);
    }
  }

  /** Upstream: `DriverRectangleSvg.applyStrokeColor(SvgGraphics, ColorMapper, UParam)`. */
  static applyStrokeColor(svg: SvgGraphics, mapper: ColorMapper, param: UParam): void {
    const raw = param.getColor();
    if (isLinearGradientPaint(raw)) {
      svg.setStrokeColor(`url(#${svg.createSvgLinearGradient(raw, mapper)})`); // DriverRectangleSvg.java:99-102
      return;
    }
    const color = toSvgPaint(raw, mapper);
    if (typeof color === 'string') {
      svg.setStrokeColor(color);
    } else {
      const id = svg.createSvgGradient(color.color1, color.color2, color.policy);
      svg.setStrokeColor(`url(#${id})`);
    }
  }

  /** Upstream: `draw(URectangle, double x, double y, ColorMapper, UParam, SvgGraphics)`. */
  draw(rect: URectangle, param: UParam, mapper: ColorMapper): void {
    const x = param.getTranslate().getDx();
    const y = param.getTranslate().getDy();
    const rx = rect.getRx();
    const ry = rect.getRy();
    const width = rect.getWidth();
    const height = rect.getHeight();

    DriverRectangleSvg.applyFillColor(this.svg, mapper, param);
    DriverRectangleSvg.applyStrokeColor(this.svg, mapper, param);
    this.svg.setStrokeWidth(param.getStroke().getThickness(), param.getStroke().getDasharraySvg() ?? null);

    // rx/ry halved at serialization time — see URectangle.ts's own note
    // on `rounded()` storing the round value un-halved.
    this.svg.svgRectangle({ x, y, width, height, rx: rx / 2, ry: ry / 2 }, rect.getDeltaShadow());
  }
}
