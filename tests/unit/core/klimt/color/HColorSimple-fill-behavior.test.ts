/**
 * T8p piece 2 — `HColor.TransparentFillBehavior` on `HColorSimple`
 * (HColorSimple.java:47,137-138,231-233; HColors.java:129-131) and its
 * honouring at the rect/polygon drivers, `DriverRectangleSvg.java:81-96`
 * (`svg.setFillColor(background.toSvg(mapper), background.transparentFillBehavior())`)
 * reached by `DriverPolygonSvg.java:63`.
 *
 * Expected bytes: the jar's hover rect of `ComponentRoseLine`
 * (`HColors.transparent(TransparentFillBehavior.WITH_FILL_OPACITY)`) is
 * `fill="#000" fill-opacity="0"` — the `pafene` golden (handwritten.md F3).
 */
import { describe, expect, it } from 'vitest';
import { HColors } from '../../../../../src/core/klimt/color/HColors.js';
import { HColorSimple } from '../../../../../src/core/klimt/color/HColorSimple.js';
import { TransparentFillBehavior } from '../../../../../src/core/klimt/drawing/svg/svg-graphics.js';
import { UGraphicSvg } from '../../../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../../../../src/core/klimt/drawing/svg/svg-graphics.js';
import type { StringBounder } from '../../../../../src/core/klimt/drawing/svg/driver-text-svg.js';
import { URectangle } from '../../../../../src/core/klimt/shape/URectangle.js';
import { UPolygon } from '../../../../../src/core/klimt/shape/UPolygon.js';
import { UStroke } from '../../../../../src/core/klimt/UStroke.js';
import { Back } from '../../../../../src/core/klimt/Back.js';
import { Fore } from '../../../../../src/core/klimt/Fore.js';
import { ColorMapper } from '../../../../../src/core/klimt/color/ColorMapper.js';

const bounder: StringBounder = { calculateDimension: () => ({ width: 1 }) };
const HOVER_FILL = 'fill="#000" fill-opacity="0"';

function graphic(): UGraphicSvg {
  return UGraphicSvg.build(0, basicSvgOption(), '$version$', bounder);
}

describe('HColorSimple.transparentFillBehavior (HColorSimple.java:137-138)', () => {
  it('defaults to WITH_FILL_NONE (HColorSimple.java:141-143)', () => {
    expect(HColors.transparent().transparentFillBehavior()).toBe(TransparentFillBehavior.WITH_FILL_NONE);
    expect(HColors.BLACK.transparentFillBehavior()).toBe(TransparentFillBehavior.WITH_FILL_NONE);
  });

  it('HColors.transparent(behavior) is a fresh transparent colour carrying the behaviour (HColors.java:129-131)', () => {
    const hover = HColors.transparent(TransparentFillBehavior.WITH_FILL_OPACITY);
    expect(hover.transparentFillBehavior()).toBe(TransparentFillBehavior.WITH_FILL_OPACITY);
    expect(hover.isTransparent()).toBe(true);
    expect(hover).not.toBe(HColors.transparent());
    expect(HColors.transparent().transparentFillBehavior()).toBe(TransparentFillBehavior.WITH_FILL_NONE);
  });

  it('withTransparentFillBehavior keeps the colour and the dark partner (HColorSimple.java:231-233)', () => {
    const dark = HColorSimple.create({ r: 1, g: 2, b: 3, a: 255 });
    const base = HColorSimple.create({ r: 9, g: 8, b: 7, a: 255 }).withDark(dark) as HColorSimple;
    const next = base.withTransparentFillBehavior(TransparentFillBehavior.WITH_FILL_OPACITY);
    expect(next.getAwtColor()).toEqual({ r: 9, g: 8, b: 7, a: 255 });
    expect(next.darkSchemeTheme()).toBe(dark);
    expect(next.transparentFillBehavior()).toBe(TransparentFillBehavior.WITH_FILL_OPACITY);
    expect(base.transparentFillBehavior()).toBe(TransparentFillBehavior.WITH_FILL_NONE);
  });

  it('toString appends the behaviour when it is not WITH_FILL_NONE (HColorSimple.java:62-63)', () => {
    expect(HColors.transparent(TransparentFillBehavior.WITH_FILL_OPACITY).toString()).toBe(
      '[r=0,g=0,b=0,a=0] α=0 transparent WITH_FILL_OPACITY',
    );
    expect(HColors.transparent().toString()).toBe('[r=0,g=0,b=0,a=0] α=0 transparent');
  });
});

describe('WITH_FILL_OPACITY at the drivers (DriverRectangleSvg.java:81-96)', () => {
  it('a rect filled with transparent(WITH_FILL_OPACITY) writes fill="#000" fill-opacity="0"', () => {
    const ug = graphic();
    ug.apply(new Fore(HColors.transparent(TransparentFillBehavior.WITH_FILL_OPACITY)))
      .apply(new UStroke(0, 0, 0))
      .apply(new Back(HColors.transparent(TransparentFillBehavior.WITH_FILL_OPACITY)))
      .draw(URectangle.build(8, 20));
    expect(ug.getSvgString()).toContain(`<rect x="0" y="0" width="8" height="20" ${HOVER_FILL}`);
  });

  it('a polygon filled with transparent(WITH_FILL_OPACITY) writes the same fill (DriverPolygonSvg.java:63)', () => {
    const ug = graphic();
    const polygon = new UPolygon();
    polygon.addPoint(0, 0);
    polygon.addPoint(8, 0);
    polygon.addPoint(8, 20);
    ug.apply(new Back(HColors.transparent(TransparentFillBehavior.WITH_FILL_OPACITY))).draw(polygon);
    expect(ug.getSvgString()).toContain(`<polygon points="0,0,8,0,8,20" ${HOVER_FILL}`);
  });

  it('the same colour without the behaviour stays fill="none" (WITH_FILL_NONE, SvgGraphics.java:523-525)', () => {
    const ug = graphic();
    ug.apply(new Back(HColors.transparent())).draw(URectangle.build(8, 20));
    expect(ug.getSvgString()).toContain('fill="none"');
    expect(ug.getSvgString()).not.toContain('fill-opacity');
  });

  it('a dark mapper maps the colour but keeps the behaviour (toSvg(mapper), DriverRectangleSvg.java:93)', () => {
    const ug = UGraphicSvg.build(0, basicSvgOption({ colorMapper: ColorMapper.DARK_MODE }), '$version$', bounder);
    ug.apply(new Back(HColors.transparent(TransparentFillBehavior.WITH_FILL_OPACITY))).draw(URectangle.build(8, 20));
    expect(ug.getSvgString()).toContain(HOVER_FILL);
  });
});
