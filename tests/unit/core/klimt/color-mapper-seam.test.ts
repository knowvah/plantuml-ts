/**
 * The klimt `ColorMapper` seam: a `UGraphic` carries the mapper its root was
 * built with (`UGraphic.java:60`, `AbstractCommonUGraphic.java:77-85,180-182`,
 * `UGraphicSvg.java:91`), `apply` stores an `HColor` itself
 * (`AbstractCommonUGraphic.java:123-124`), and every SVG driver maps the
 * colour at draw time (`AbstractUGraphic.java:145`, `DriverRectangleSvg.java:
 * 81-115`, `DriverLineSvg.java:76-81`, `DriverTextSvg.java:177-178`), as does
 * the SVG background (`SvgGraphics.java:176-188`).
 *
 * Dark values are the jar's, from `tests/fixtures/salt/skinparam-mode-dark.svg`
 * (`skinparam mode dark` selects `ColorMapper.DARK_MODE`, TitledDiagram.java:
 * 291-294): the button `<rect fill="#222" style="stroke:#FFF;...">`
 * (`getColorEE` = `#E`.withDark(`#2`), `getBlack` = BLACK.withDark(WHITE),
 * AbstractElement.java:47-74), the text `fill="#FFF"` (`blackBlueTrue`,
 * FontConfiguration.java:63-65) and the root `background:#1B1B1B`.
 */
import { describe, expect, it } from 'vitest';
import { FontConfiguration as StyleFontConfiguration } from '../../../../src/core/abel/FontConfiguration.js';
import { ColorMapper, toSvgPaint } from '../../../../src/core/klimt/color/ColorMapper.js';
import { HColorGradient } from '../../../../src/core/klimt/color/HColorGradient.js';
import { HColorSet } from '../../../../src/core/klimt/color/HColorSet.js';
import { HColorSimple } from '../../../../src/core/klimt/color/HColorSimple.js';
import { HColors } from '../../../../src/core/klimt/color/HColors.js';
import type { StringBounder } from '../../../../src/core/klimt/drawing/svg/driver-text-svg.js';
import { basicSvgOption, type SvgOption } from '../../../../src/core/klimt/drawing/svg/svg-graphics.js';
import { UGraphicSvg } from '../../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { UGraphicDelegator } from '../../../../src/core/klimt/drawing/UGraphicDelegator.js';
import { bridgeFontConfiguration } from '../../../../src/core/klimt/font/FontConfigurationBridge.js';
import { UFontFactory } from '../../../../src/core/klimt/font/UFontFactory.js';
import { Back } from '../../../../src/core/klimt/Back.js';
import { Fore } from '../../../../src/core/klimt/Fore.js';
import { DotPath } from '../../../../src/core/klimt/shape/DotPath.js';
import { UEllipse } from '../../../../src/core/klimt/shape/UEllipse.js';
import { ULine } from '../../../../src/core/klimt/shape/ULine.js';
import { UPath } from '../../../../src/core/klimt/shape/UPath.js';
import { UPixel } from '../../../../src/core/klimt/shape/UPixel.js';
import { UPolygon } from '../../../../src/core/klimt/shape/UPolygon.js';
import { URectangle } from '../../../../src/core/klimt/shape/URectangle.js';
import { UText } from '../../../../src/core/klimt/shape/UText.js';
import type { UChange } from '../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../src/core/klimt/UGraphic.js';
import { UStroke } from '../../../../src/core/klimt/UStroke.js';

const rgb = (r: number, g: number, b: number, a = 255) => ({ r, g, b, a });

/** Java's `(HColorSimple)` cast on an `HColor#withDark` result. */
function simple(c: unknown): HColorSimple {
  if (!(c instanceof HColorSimple)) throw new Error('not an HColorSimple');
  return c;
}

/** `AbstractElement#buildColor(color1, color2)` (AbstractElement.java:75-79). */
function buildColor(color1: string, color2: string): HColorSimple {
  const set = HColorSet.instance();
  return simple(set.getColorOrWhite(color1).withDark(set.getColorOrWhite(color2)));
}

/** `AbstractElement#getBlack` (AbstractElement.java:47-49). */
const getBlack = (): HColorSimple => simple(HColors.BLACK.withDark(HColors.WHITE));
/** `AbstractElement#getColorEE` (AbstractElement.java:67-69). */
const getColorEE = (): HColorSimple => buildColor('#E', '#2');

const stubBounder: StringBounder = {
  calculateDimension: (font, text) => ({ width: text.length * font.size * 0.5 }),
};

function graphic(overrides: Partial<SvgOption> = {}): UGraphicSvg {
  return UGraphicSvg.build(0, basicSvgOption(overrides), '$version$', stubBounder);
}

/** The drawn body of `root`, without the document shell. */
function body(root: UGraphicSvg): string {
  return root
    .getSvgString()
    .replace(/^.*?<g>/s, '')
    .replace(/<\/g><\/svg>$/s, '');
}

describe('HColorSimple#toColor / #toSvg (HColorSimple.java:172-176, HColor.java:74-79)', () => {
  it('maps through the mapper: IDENTITY the light colour, DARK_MODE the partner', () => {
    expect(getBlack().toSvg(ColorMapper.IDENTITY)).toBe('#000000');
    expect(getBlack().toSvg(ColorMapper.DARK_MODE)).toBe('#FFFFFF');
    expect(getColorEE().toColor(ColorMapper.DARK_MODE)).toEqual(rgb(0x22, 0x22, 0x22));
  });

  it('a transparent colour is #00000000 and never reaches the mapper', () => {
    const transparent = simple(HColors.transparent().withDark(HColors.WHITE));
    expect(transparent.toSvg(ColorMapper.DARK_MODE)).toBe('#00000000');
    expect(transparent.toColor(ColorMapper.DARK_MODE)).toEqual(rgb(0, 0, 0, 0));
  });
});

describe('toSvgPaint: HColor#toSvg(mapper) over HColor | Paint', () => {
  it('a Paint under IDENTITY is returned as-is (the same reference)', () => {
    const gradient = { color1: 'red', color2: 'blue', policy: '|' } as const;
    expect(toSvgPaint('red', ColorMapper.IDENTITY)).toBe('red');
    expect(toSvgPaint(gradient, ColorMapper.IDENTITY)).toBe(gradient);
  });

  it('a Paint under another mapper is mapped as a partner-less HColorSimple (mapPaint)', () => {
    expect(toSvgPaint('#FFDD88', ColorMapper.MONOCHROME)).toBe('#DDDDDD');
  });

  it('an HColorSimple maps with its dark partner', () => {
    expect(toSvgPaint(getBlack(), ColorMapper.DARK_MODE)).toBe('#FFFFFF');
    expect(toSvgPaint(getBlack(), ColorMapper.IDENTITY)).toBe('#000000');
  });

  it('an HColorGradient maps both stops with toRGB(mapper) (DriverRectangleSvg.java:87-90)', () => {
    const gr = new HColorGradient(getBlack(), buildColor('#E', '#2'), '|');
    expect(toSvgPaint(gr, ColorMapper.DARK_MODE)).toEqual({ color1: '#FFFFFF', color2: '#222222', policy: '|' });
    expect(toSvgPaint(gr, ColorMapper.IDENTITY)).toEqual({ color1: '#000000', color2: '#EEEEEE', policy: '|' });
  });
});

describe('UGraphic#getColorMapper (UGraphic.java:60, AbstractCommonUGraphic.java:77-85,180-182)', () => {
  it('is SvgOption.colorMapper, IDENTITY when unset (SvgOption.java:62), carried by every apply', () => {
    expect(graphic().getColorMapper()).toBe(ColorMapper.IDENTITY);
    const dark = graphic({ colorMapper: ColorMapper.DARK_MODE });
    expect(dark.getColorMapper()).toBe(ColorMapper.DARK_MODE);
    expect(dark.apply(new Fore('#123456')).apply(UStroke.simple()).getColorMapper?.()).toBe(ColorMapper.DARK_MODE);
  });

  it('getDefaultBackground is SvgOption.backcolor, carried by every apply (AbstractCommonUGraphic.java:77-85,98-101)', () => {
    const backcolor = getColorEE();
    const copied = graphic({ backcolor }).apply(new Fore('#123456'));
    expect(copied instanceof UGraphicSvg ? copied.getDefaultBackground() : 'not a UGraphicSvg').toBe(backcolor);
    expect(graphic().getDefaultBackground()).toBeUndefined();
  });

  it('a delegator over a graphic without a mapper answers IDENTITY (LimitFinder.java:227-229)', () => {
    class Passthrough extends UGraphicDelegator {
      apply(): UGraphic {
        return this;
      }
    }
    const bare: UGraphic = {
      apply: () => bare,
      draw: () => undefined,
      getParam: () => graphic().getParam(),
      getTranslate: () => graphic().getTranslate(),
      getStringBounder: () => graphic().getStringBounder(),
    };
    expect(new Passthrough(bare).getColorMapper()).toBe(ColorMapper.IDENTITY);
  });

  it('a delegator forwards it (UGraphicDelegator.java:79-81)', () => {
    class Passthrough extends UGraphicDelegator {
      apply(change: UChange): UGraphic {
        return new Passthrough(this.getUg().apply(change));
      }
    }
    expect(new Passthrough(graphic({ colorMapper: ColorMapper.MONOCHROME })).getColorMapper()).toBe(
      ColorMapper.MONOCHROME,
    );
  });
});

describe('apply stores the HColor itself (AbstractCommonUGraphic.java:121-126)', () => {
  it('Fore and Back keep the HColorSimple instance in the param', () => {
    const black = getBlack();
    const ee = getColorEE();
    const param = graphic().apply(new Fore(black)).apply(new Back(ee)).getParam();
    expect(param.getColor()).toBe(black);
    expect(param.getBackcolor()).toBe(ee);
  });
});

describe('the drivers map with the root mapper (AbstractUGraphic.java:145)', () => {
  it('DARK_MODE: the jar probe button rect is fill #222, stroke #FFF', () => {
    const root = graphic({ colorMapper: ColorMapper.DARK_MODE });
    root.apply(new Back(getColorEE())).apply(new Fore(getBlack())).draw(URectangle.build(10, 5));
    expect(body(root)).toContain('fill="#222" style="stroke:#FFF;');
  });

  it('IDENTITY: the same HColors paint their light colours', () => {
    const root = graphic();
    root.apply(new Back(getColorEE())).apply(new Fore(getBlack())).draw(URectangle.build(10, 5));
    expect(body(root)).toContain('fill="#EEE" style="stroke:#000;');
  });

  it('DARK_MODE: line, pixel, ellipse, polygon, path and dot path strokes take the partner', () => {
    const root = graphic({ colorMapper: ColorMapper.DARK_MODE });
    const ug = root.apply(new Fore(getBlack())).apply(new Back(getColorEE()));
    ug.draw(new ULine(4, 0));
    ug.draw(new UPixel());
    ug.draw(UEllipse.build(4, 4));
    ug.draw(
      new UPolygon([
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 0, y: 2 },
      ]),
    );
    const path = UPath.none();
    path.moveTo(0, 0);
    path.lineTo(3, 3);
    ug.draw(path);
    expect(body(root)).not.toContain('#000');
    expect(body(root).match(/stroke:#FFF;/g)?.length).toBe(5);
    expect(body(root).match(/fill="#222"/g)?.length).toBe(3);
  });

  it('DriverPathSvg: equal fore/back (HColor#equals ignores the partner) fills with the mapped colour', () => {
    const root = graphic({ colorMapper: ColorMapper.DARK_MODE });
    const path = UPath.none();
    path.moveTo(0, 0);
    path.lineTo(3, 3);
    root
      .apply(new Fore(getBlack()))
      .apply(new Back(simple(HColors.BLACK)))
      .draw(path);
    expect(body(root)).toContain('fill="#FFF"');
  });

  it('DriverDotPathSvg: a transparent HColor draws nothing (DriverDotPathSvg.java:46)', () => {
    const root = graphic({ colorMapper: ColorMapper.DARK_MODE });
    const before = root.getSvgString();
    root
      .apply(new Fore(HColors.transparent()))
      .draw(DotPath.fromBeziers([{ x1: 0, y1: 0, ctrlx1: 2, ctrly1: 0, ctrlx2: 4, ctrly2: 4, x2: 6, y2: 4 }]));
    expect(root.getSvgString()).toBe(before);
  });

  it('DriverTextSvg: the blackBlueTrue font colour fills #FFF under DARK_MODE (java:177-178)', () => {
    const font = bridgeFontConfiguration(
      StyleFontConfiguration.blackBlueTrue(UFontFactory.build('SansSerif', { cssWeight: 400, italic: false }, 12)),
    );
    const dark = graphic({ colorMapper: ColorMapper.DARK_MODE });
    dark.draw(UText.build('OK', font));
    expect(body(dark)).toContain('fill="#FFF"');
    const light = graphic();
    light.draw(UText.build('OK', font));
    expect(body(light)).toContain('fill="#000"');
  });
});

describe('SvgGraphics background: backcolor.toSvg(option.getColorMapper()) (SvgGraphics.java:176-188)', () => {
  it('a partnered HColor background paints its dark partner', () => {
    const backcolor = buildColor('#FFFFFF', '#1B1B1B');
    const root = graphic({ backcolor, colorMapper: ColorMapper.DARK_MODE });
    expect(root.getSvgString()).toContain('background:#1B1B1B;');
    expect(root.getSvgString()).toContain('fill="#1B1B1B"');
  });

  it('IDENTITY: the same background is white, which is never painted', () => {
    const root = graphic({ backcolor: buildColor('#FFFFFF', '#1B1B1B') });
    expect(root.getSvgString()).toContain('background:#FFFFFF;');
    expect(root.getSvgString()).not.toContain('<rect');
  });

  it('a gradient background maps both stops', () => {
    const backcolor = new HColorGradient(getBlack(), getColorEE(), '|');
    const root = graphic({ backcolor, colorMapper: ColorMapper.DARK_MODE });
    expect(root.getSvgString()).toMatch(/stop-color="#FFF"[\s\S]*stop-color="#222"/);
  });
});
