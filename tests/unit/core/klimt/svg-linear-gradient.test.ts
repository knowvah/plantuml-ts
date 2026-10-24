/**
 * `SvgGraphics#createSvgGradient(HColorLinearGradient, ColorMapper)`
 * (`SvgGraphics.java:411-448`) and the driver seam that reaches it
 * (`DriverRectangleSvg.java:83-86,99-102`). Expected values quote the jar's
 * own SVG for `sequence/bucebo-91-xavo442` (`in.svg`): the opacity gradient
 * `Azure-linearGradient-2` is written as
 * `<linearGradient x1="59.719%" y1="52.313%" x2="52.691%" y2="54.864%" id="glke1elco5cta1">`
 * with `<stop offset="7.1%" stop-color="#000" stop-opacity="0.2"/>` stops.
 */
import { describe, expect, it } from 'vitest';
import { Back } from '../../../../src/core/klimt/Back.js';
import { Fore } from '../../../../src/core/klimt/Fore.js';
import { UStroke } from '../../../../src/core/klimt/UStroke.js';
import { UTranslate } from '../../../../src/core/klimt/UTranslate.js';
import { ColorMapper } from '../../../../src/core/klimt/color/ColorMapper.js';
import { SvgGraphics, basicSvgOption } from '../../../../src/core/klimt/drawing/svg/svg-graphics.js';
import { UGraphicSvg } from '../../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { UPath } from '../../../../src/core/klimt/shape/UPath.js';
import { NO_TEXT_BOUNDER } from '../../../../src/diagrams/sequence/sequence-label-primitives.js';
import { HColorLinearGradient, SpreadMethod } from '../../../../src/core/klimt/sprite/sax/sax-gradient.js';
import type { LinearGradientStopPaint } from '../../../../src/core/paint.js';

const OPACITY_STOPS: readonly LinearGradientStopPaint[] = [
  { offset: 0, color: '#000000', opacity: 0.3 },
  { offset: 0.071, color: '#000000', opacity: 0.2 },
  { offset: 0.321, color: '#000000', opacity: 0.1 },
  { offset: 0.623, color: '#000000', opacity: 0.05 },
  { offset: 1, color: '#000000', opacity: 0 },
];

function linear(
  stops: readonly LinearGradientStopPaint[],
  vector = { x1: 0.597188447, y1: 0.523127289, x2: 0.526914332, y2: 0.548636556 },
  userSpaceOnUse = false,
  spread: SpreadMethod = SpreadMethod.PAD,
): HColorLinearGradient {
  return new HColorLinearGradient(vector, userSpaceOnUse, spread, stops);
}

function xmlOf(register: (svg: SvgGraphics) => void, seed = 0): string {
  const svg = new SvgGraphics(seed, basicSvgOption(), 'v');
  register(svg);
  return svg.createXml();
}

describe('SvgGraphics#createSvgLinearGradient -- SvgGraphics.java:411-448', () => {
  it('writes objectBoundingBox percentages and one <stop> per stop, in the jar attribute order', () => {
    const xml = xmlOf((svg) => svg.createSvgLinearGradient(linear(OPACITY_STOPS), ColorMapper.IDENTITY));
    expect(xml).toContain(
      '<linearGradient x1="59.719%" y1="52.313%" x2="52.691%" y2="54.864%" id="g00">' +
        '<stop offset="0%" stop-color="#000" stop-opacity="0.3"/>' +
        '<stop offset="7.1%" stop-color="#000" stop-opacity="0.2"/>' +
        '<stop offset="32.1%" stop-color="#000" stop-opacity="0.1"/>' +
        '<stop offset="62.3%" stop-color="#000" stop-opacity="0.05"/>' +
        '<stop offset="100%" stop-color="#000" stop-opacity="0"/>' +
        '</linearGradient>',
    );
  });

  it('puts the element in <defs>, not in the root <g> (java:448 defs.appendChild)', () => {
    const xml = xmlOf((svg) => svg.createSvgLinearGradient(linear(OPACITY_STOPS), ColorMapper.IDENTITY));
    expect(xml).toMatch(/<defs><linearGradient .*<\/linearGradient><\/defs><g /);
  });

  it('omits stop-opacity for a fully opaque stop (java:441 `opacity < 0.9999`) and shortens #RRGGBB', () => {
    const gr = linear([
      { offset: 0, color: '#114A8B', opacity: 1 },
      { offset: 1, color: '#0669BC', opacity: 1 },
    ]);
    const xml = xmlOf((svg) => svg.createSvgLinearGradient(gr, ColorMapper.IDENTITY));
    expect(xml).toContain('<stop offset="0%" stop-color="#114A8B"/><stop offset="100%" stop-color="#0669BC"/>');
  });

  it("folds the colour's own alpha into stop-opacity (java:439 alpha/255 * stop opacity)", () => {
    const gr = linear([
      { offset: 0, color: '#FF000080', opacity: 1 },
      { offset: 1, color: '#00FF00', opacity: 0.5 },
    ]);
    const xml = xmlOf((svg) => svg.createSvgLinearGradient(gr, ColorMapper.IDENTITY));
    expect(xml).toContain('<stop offset="0%" stop-color="#F00" stop-opacity="0.502"/>'); // 0x80/255 = 0.50196 -> %.3f;
    expect(xml).toContain('<stop offset="100%" stop-color="#0F0" stop-opacity="0.5"/>');
  });

  it('writes gradientUnits and user-space numbers for userSpaceOnUse (java:416-421)', () => {
    const gr = linear(
      [
        { offset: 0, color: '#FF0000', opacity: 1 },
        { offset: 1, color: '#0000FF', opacity: 1 },
      ],
      { x1: 10, y1: 20.5, x2: 30, y2: 0 },
      true,
    );
    const xml = xmlOf((svg) => svg.createSvgLinearGradient(gr, ColorMapper.IDENTITY));
    expect(xml).toContain('<linearGradient gradientUnits="userSpaceOnUse" x1="10" y1="20.5" x2="30" y2="0" id="g00">');
  });

  it.each([
    [SpreadMethod.REFLECT, ' spreadMethod="reflect"'],
    [SpreadMethod.REPEAT, ' spreadMethod="repeat"'],
    [SpreadMethod.PAD, ''],
  ])('spread %s -> %j between the vector and the id (java:428-430)', (spread, attr) => {
    const gr = linear(
      [
        { offset: 0, color: '#FF0000', opacity: 1 },
        { offset: 1, color: '#0000FF', opacity: 1 },
      ],
      { x1: 0, y1: 0, x2: 1, y2: 0 },
      false,
      spread,
    );
    const xml = xmlOf((svg) => svg.createSvgLinearGradient(gr, ColorMapper.IDENTITY));
    expect(xml).toContain(`<linearGradient x1="0%" y1="0%" x2="100%" y2="0%"${attr} id="g00">`);
  });

  it('mints gradientId + gradients.size() over the ONE map the two-colour overload shares (java:393,431)', () => {
    const ids: string[] = [];
    xmlOf((svg) => {
      ids.push(svg.createSvgGradient('#FF0000', '#00FF00', '/'));
      ids.push(svg.createSvgLinearGradient(linear(OPACITY_STOPS), ColorMapper.IDENTITY));
      ids.push(svg.createSvgGradient('#0000FF', '#FFFFFF', '|'));
    }, 0x1abc);
    // getSeed(0x1abc) = base36(6844) = "5a4" (java:285-287)
    expect(ids).toEqual(['g5a40', 'g5a41', 'g5a42']);
  });

  it('answers the existing id for an equal gradient (java:412-414 map hit) and a new one for a changed stop', () => {
    const ids: string[] = [];
    const xml = xmlOf((svg) => {
      ids.push(svg.createSvgLinearGradient(linear(OPACITY_STOPS), ColorMapper.IDENTITY));
      ids.push(svg.createSvgLinearGradient(linear(OPACITY_STOPS), ColorMapper.IDENTITY));
      ids.push(svg.createSvgLinearGradient(linear(OPACITY_STOPS.slice(0, 4)), ColorMapper.IDENTITY));
    });
    expect(ids).toEqual(['g00', 'g00', 'g01']);
    expect(xml.match(/<linearGradient/g)).toHaveLength(2);
  });

  it('keys on the RGB, never the alpha byte (java:459-461): stops differing only in alpha share an id', () => {
    const half = linear([
      { offset: 0, color: '#FF000080', opacity: 1 },
      { offset: 1, color: '#0000FF', opacity: 1 },
    ]);
    const solid = linear([
      { offset: 0, color: '#FF0000', opacity: 1 },
      { offset: 1, color: '#0000FF', opacity: 1 },
    ]);
    const ids: string[] = [];
    xmlOf((svg) => {
      ids.push(svg.createSvgLinearGradient(half, ColorMapper.IDENTITY));
      ids.push(svg.createSvgLinearGradient(solid, ColorMapper.IDENTITY));
    });
    expect(ids).toEqual(['g00', 'g00']);
  });

  it('reads a stop that is itself a two-colour paint as its first colour (HColorLinearGradient#getColor1)', () => {
    const gr = linear([
      { offset: 0, color: { color1: '#00FF00', color2: '#0000FF', policy: '|' }, opacity: 1 },
      { offset: 1, color: '#FFFFFF', opacity: 1 },
    ]);
    const xml = xmlOf((svg) => svg.createSvgLinearGradient(gr, ColorMapper.IDENTITY));
    expect(xml).toContain('<stop offset="0%" stop-color="#0F0"/>');
  });

  it('draws a stop colour that is not a colour literal as opaque black', () => {
    const gr = linear([
      { offset: 0, color: 'not-a-colour', opacity: 1 },
      { offset: 1, color: '#FFFFFF', opacity: 1 },
    ]);
    const xml = xmlOf((svg) => svg.createSvgLinearGradient(gr, ColorMapper.IDENTITY));
    expect(xml).toContain('<stop offset="0%" stop-color="#000"/>');
  });

  it('keys -0.0 apart from 0.0, as Double.equals does (java:453-456)', () => {
    const stops: readonly LinearGradientStopPaint[] = [
      { offset: 0, color: '#FF0000', opacity: 1 },
      { offset: 1, color: '#0000FF', opacity: 1 },
    ];
    const ids: string[] = [];
    xmlOf((svg) => {
      ids.push(svg.createSvgLinearGradient(linear(stops, { x1: 0, y1: 0, x2: 1, y2: 0 }), ColorMapper.IDENTITY));
      ids.push(svg.createSvgLinearGradient(linear(stops, { x1: -0, y1: 0, x2: 1, y2: 0 }), ColorMapper.IDENTITY));
    });
    expect(ids).toEqual(['g00', 'g01']);
  });

  it('applies the mapper per stop at emission (java:437 stop.getColor().toColor(mapper))', () => {
    const gr = linear([
      { offset: 0, color: '#FF0000', opacity: 1 },
      { offset: 1, color: '#FFFFFF', opacity: 1 },
    ]);
    const xml = xmlOf((svg) => svg.createSvgLinearGradient(gr, ColorMapper.MONOCHROME));
    expect(xml).not.toContain('stop-color="#F00"');
    expect(xml).toMatch(/<stop offset="0%" stop-color="#([0-9A-F]{3}|[0-9A-F]{6})"\/>/);
  });
});

describe('DriverRectangleSvg fill/stroke -- DriverRectangleSvg.java:83-86,99-102', () => {
  function drawPath(back: Back, fore: Fore): string {
    const ug = UGraphicSvg.build(0, basicSvgOption(), 'v', NO_TEXT_BOUNDER);
    const path = UPath.none();
    path.moveTo(0, 0);
    path.lineTo(10, 0);
    path.lineTo(10, 10);
    path.closePath();
    ug.apply(new UTranslate(0, 0)).apply(fore).apply(back).apply(UStroke.simple()).draw(path);
    return ug.getSvgString();
  }

  it('a linear-gradient back/fore becomes url(#id) for fill AND stroke, the def only in <defs>', () => {
    const gr = linear(OPACITY_STOPS);
    const svg = drawPath(new Back(gr), new Fore(gr));
    expect(svg).toContain('style="stroke:url(#g00);stroke-width:1;" fill="url(#g00)"');
    expect(svg.match(/<linearGradient/g)).toHaveLength(1);
    expect(svg.indexOf('<linearGradient')).toBeLessThan(svg.indexOf('</defs>'));
  });

  it('a two-colour Gradient still takes the two-stop overload (unchanged)', () => {
    const gr = { color1: '#FF0000', color2: '#0000FF', policy: '|' as const };
    const svg = drawPath(new Back(gr), new Fore('#000000'));
    expect(svg).toContain('<linearGradient x1="0%" y1="50%" x2="100%" y2="50%" id="g00">');
    expect(svg).toContain('<stop stop-color="#F00" offset="0%"/><stop stop-color="#00F" offset="100%"/>');
  });
});
