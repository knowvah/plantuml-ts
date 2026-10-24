/**
 * T8p piece 3 — `CircledCharacter` (CircledCharacter.java:46-86),
 * `UCenteredCharacter` (UCenteredCharacter.java:42-61) and
 * `DriverCenteredCharacterSvg` (DriverCenteredCharacterSvg.java:56-81).
 *
 * Expected bytes are the jar's own spot markup in the `jefoke-95-jara779`
 * golden (`<< (A,#FFFF00) toto >>`, `<< (C,#00FFFF) >>`; font size 17,
 * radius 11 — SkinParam#getCircledCharacterRadius): the ellipse, then the
 * glyph `<path>` ending in the jar's trailing `Z ` (SvgGraphics.java:913-916
 * `closepath` appends "Z ").
 */
import { describe, expect, it } from 'vitest';
import { CircledCharacter } from '../../../../../src/core/klimt/shape/CircledCharacter.js';
import { UCenteredCharacter } from '../../../../../src/core/klimt/shape/UCenteredCharacter.js';
import { UGraphicSvg } from '../../../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../../../../src/core/klimt/drawing/svg/svg-graphics.js';
import type { StringBounder } from '../../../../../src/core/klimt/drawing/svg/driver-text-svg.js';
import { DriverCenteredCharacterSvg } from '../../../../../src/core/klimt/drawing/svg/driver-centered-character-svg.js';
import { UFontFactory } from '../../../../../src/core/klimt/font/UFontFactory.js';
import { HColorSimple } from '../../../../../src/core/klimt/color/HColorSimple.js';
import { HColorAutomagic } from '../../../../../src/core/klimt/color/HColorAutomagic.js';
import { XDimension2D } from '../../../../../src/core/klimt/geom/XDimension2D.js';
import { ColorMapper } from '../../../../../src/core/klimt/color/ColorMapper.js';
import { UTranslate } from '../../../../../src/core/klimt/UTranslate.js';
import { Fore } from '../../../../../src/core/klimt/Fore.js';

const bounder: StringBounder = { calculateDimension: () => ({ width: 1 }) };
const SPOT_FONT = UFontFactory.monospace(17);
const RADIUS = 11;
const BORDER = '#181818';

// nimoxu-60-xale291/golden.svg: `<< (U,#ADD1B2) >>`, size 17, radius 11, centre (104.45, 28)
// (the table's own capture) and again 109 lower (centre y 137, an integral shift).
const U_PATH =
  'M100.33,30.176 L100.33,22.357 L102.779,22.357 L102.779,30.791 Q102.779,31.72 103.252,32.247 ' +
  'Q103.725,32.774 104.563,32.774 Q105.402,32.774 105.875,32.247 Q106.348,31.72 106.348,30.791 ' +
  'L106.348,22.357 L108.797,22.357 L108.797,30.176 Q108.797,32.7 107.792,33.845 ' +
  'Q106.788,34.991 104.563,34.991 Q102.347,34.991 101.338,33.845 Q100.33,32.7 100.33,30.176 Z ';
const GOLDEN_U =
  '<ellipse cx="104.45" cy="28" rx="11" ry="11" fill="#ADD1B2" style="stroke:#181818;stroke-width:1;"/>' +
  `<path d="${U_PATH}" fill="#000"/>`;
const GOLDEN_U_LOWER =
  '<ellipse cx="104.45" cy="137" rx="11" ry="11" fill="#ADD1B2" style="stroke:#181818;stroke-width:1;"/>' +
  '<path d="M100.33,139.176 L100.33,131.357 L102.779,131.357 L102.779,139.791 Q102.779,140.72 103.252,141.247 ' +
  'Q103.725,141.774 104.563,141.774 Q105.402,141.774 105.875,141.247 Q106.348,140.72 106.348,139.791 ' +
  'L106.348,131.357 L108.797,131.357 L108.797,139.176 Q108.797,141.7 107.792,142.845 ' +
  'Q106.788,143.991 104.563,143.991 Q102.347,143.991 101.338,142.845 Q100.33,141.7 100.33,139.176 Z " fill="#000"/>';

// fakova-98-suze610/golden.svg: `skinparam CircledCharacterFontSize 10`, `<< (C,#FFFF00) >>`,
// radius 9 (SkinParam#getCircledCharacterRadius), centre (26, 26) — the table's own capture.
const GOLDEN_C10 =
  '<ellipse cx="26" cy="26" rx="9" ry="9" fill="#FF0" style="stroke:#181818;stroke-width:1;"/>' +
  '<path d="M27.278,29.79 Q26.937,29.966 26.561,30.054 Q26.185,30.142 25.77,30.142 Q24.295,30.142 23.519,29.17 ' +
  'Q22.742,28.198 22.742,26.362 Q22.742,24.521 23.519,23.55 Q24.295,22.578 25.77,22.578 ' +
  'Q26.185,22.578 26.565,22.666 Q26.946,22.754 27.278,22.93 L27.278,24.531 Q26.907,24.189 26.558,24.031 ' +
  'Q26.209,23.872 25.838,23.872 Q25.047,23.872 24.644,24.5 Q24.241,25.127 24.241,26.362 ' +
  'Q24.241,27.593 24.644,28.22 Q25.047,28.848 25.838,28.848 Q26.209,28.848 26.558,28.689 ' +
  'Q26.907,28.53 27.278,28.188 Z " fill="#000"/>';

// jefoke-95-jara779/in.svg, Bob's spot (A, #FFFF00) at (28, 28), size 17. The table holds the
// letter at a 4-decimal capture centre, so a shift that is not the capture's own can differ from
// the jar by one unit in the third decimal (jar `26.709`, table `26.71`): compared structurally.
const JEFOKE_A =
  'M27.863,23.348 L26.709,28.42 L29.025,28.42 Z M26.369,21.107 L29.366,21.107 L32.711,33.5 L30.262,33.5 ' +
  'L29.499,30.437 L26.22,30.437 L25.473,33.5 L23.024,33.5 Z ';
const ROUNDING_TOLERANCE = 0.0011;

function graphic(): UGraphicSvg {
  return UGraphicSvg.build(0, basicSvgOption(), '$version$', bounder);
}

function black(): HColorSimple {
  return HColorSimple.create({ r: 0, g: 0, b: 0, a: 255 });
}

function yellow(): HColorSimple {
  return HColorSimple.create({ r: 255, g: 255, b: 0, a: 255 });
}

function draw(letter: string, back: string, centreX: number, centreY: number, radius: number, size: number): string {
  const ug = graphic();
  const spot = new CircledCharacter(letter, radius, UFontFactory.monospace(size), back, BORDER, '#000000');
  spot.drawU(ug.apply(new UTranslate(centreX - radius, centreY - radius)));
  return ug.getSvgString();
}

describe('CircledCharacter.drawU (CircledCharacter.java:65-74)', () => {
  it('draws the ellipse, then the glyph path with the trailing "Z " — U at the capture centre', () => {
    expect(draw('U', '#ADD1B2', 104.45, 28, 11, 17)).toContain(GOLDEN_U);
  });

  it('the same glyph 109 lower: the outline follows the centre (UTranslate(radius, radius), java:72)', () => {
    expect(draw('U', '#ADD1B2', 104.45, 137, 11, 17)).toContain(GOLDEN_U_LOWER);
  });

  it('a size-10 spot (radius 9) draws its own capture of C', () => {
    expect(draw('C', '#FFFF00', 26, 26, 9, 10)).toContain(GOLDEN_C10);
  });

  it('jefoke letter A at (28, 28): same commands, coordinates within one rounding unit, trailing "Z "', () => {
    const svg = draw('A', '#FFFF00', 28, 28, 11, 17);
    expect(svg).toContain(
      '<ellipse cx="28" cy="28" rx="11" ry="11" fill="#FF0" style="stroke:#181818;stroke-width:1;"/><path d="',
    );
    const d = /<path d="([^"]*)" fill="#000"\/>/.exec(svg)?.[1] ?? '';
    expect(d.endsWith('Z ')).toBe(true);
    expect(d.replace(/[\d.,-]+/g, '#')).toBe(JEFOKE_A.replace(/[\d.,-]+/g, '#'));
    const got = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    const want = JEFOKE_A.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    expect(got).toHaveLength(want.length);
    got.forEach((n, k) => {
      expect(Math.abs(n - want[k]!)).toBeLessThanOrEqual(ROUNDING_TOLERANCE);
    });
  });

  it('draws no border stroke colour change when spotBorder is null (java:66-67)', () => {
    const ug = graphic();
    new CircledCharacter('A', RADIUS, SPOT_FONT, '#FFFF00', undefined, '#000000').drawU(
      ug.apply(new UTranslate(17, 17)).apply(new Fore('#123456')),
    );
    expect(ug.getSvgString()).toContain('style="stroke:#123456;stroke-width:1;"');
  });

  it('reports a 2r x 2r preferred size (java:76-83)', () => {
    const spot = new CircledCharacter('A', RADIUS, SPOT_FONT, yellow(), undefined, black());
    const sb = { calculateDimension: () => new XDimension2D(0, 0) };
    expect(spot.getPreferredWidth(sb)).toBe(22);
    expect(spot.getPreferredHeight(sb)).toBe(22);
    const dim = spot.calculateDimension(sb);
    expect([dim.getWidth(), dim.getHeight()]).toEqual([22, 22]);
  });

  it('resolves an automatic font colour against the back colour (java:62, HColorAutomagic.java:38-41)', () => {
    const dark = HColorSimple.create({ r: 10, g: 10, b: 10, a: 255 });
    const ug = graphic();
    new CircledCharacter('A', RADIUS, SPOT_FONT, dark, undefined, new HColorAutomagic()).drawU(
      ug.apply(new UTranslate(17, 17)),
    );
    expect(ug.getSvgString()).toContain('" fill="#FFF"/>');
  });

  it('resolves an automatic font colour against a string back colour', () => {
    const ug = graphic();
    new CircledCharacter('A', RADIUS, SPOT_FONT, '#FFFF00', undefined, new HColorAutomagic()).drawU(
      ug.apply(new UTranslate(17, 17)),
    );
    expect(ug.getSvgString()).toContain('" fill="#000"/>');
  });
});

describe('CircledCharacter automatic font colour needs a real backdrop (HColorAutomagic.java:38-41)', () => {
  it('a gradient Paint backdrop is rejected', () => {
    expect(
      () =>
        new CircledCharacter(
          'A',
          RADIUS,
          SPOT_FONT,
          { color1: '#FF0000', color2: '#FFFFFF', policy: '|' },
          undefined,
          new HColorAutomagic(),
        ),
    ).toThrow(/gradient Paint/);
  });

  it('a string that is not a colour is rejected, naming it', () => {
    expect(() => new CircledCharacter('A', RADIUS, SPOT_FONT, 'notacolour', undefined, new HColorAutomagic())).toThrow(
      /"notacolour" is not a colour/,
    );
  });
});

describe('UCenteredCharacter (UCenteredCharacter.java:42-61)', () => {
  it('carries the char and the font', () => {
    const c = new UCenteredCharacter('Q', SPOT_FONT);
    expect(c.getChar()).toBe('Q');
    expect(c.getFont()).toBe(SPOT_FONT);
  });
});

describe('DriverCenteredCharacterSvg (DriverCenteredCharacterSvg.java:56-81)', () => {
  it('is registered for UCenteredCharacter: a glyph drawn straight on the graphic emits its path', () => {
    const ug = graphic();
    ug.apply(new Fore('#000000')).apply(new UTranslate(104.45, 28)).draw(new UCenteredCharacter('U', SPOT_FONT));
    expect(ug.getSvgString()).toContain(`<path d="${U_PATH}" fill="#000"/>`);
  });

  it('draws nothing for a (size, letter) with no captured outline (AWT outlines are not computable here)', () => {
    const ug = graphic();
    ug.apply(new Fore('#000000'))
      .apply(new UTranslate(28, 28))
      .draw(new UCenteredCharacter('A', UFontFactory.monospace(99)));
    expect(ug.getSvgString()).not.toContain('<path');
  });

  it('fills a gradient font colour with its first stop (HColorGradient.java:103-104)', () => {
    const root = graphic();
    root
      .apply(new Fore({ color1: '#FF0000', color2: '#FFFFFF', policy: '|' }))
      .apply(new UTranslate(28, 28))
      .draw(new UCenteredCharacter('A', SPOT_FONT));
    expect(root.getSvgString()).toContain('" fill="#F00"/>');
  });

  it('maps the font colour through the graphic mapper (java:60,79 `toSvg(mapper)`)', () => {
    const root = UGraphicSvg.build(0, basicSvgOption({ colorMapper: ColorMapper.MONOCHROME }), '$version$', bounder);
    root.apply(new Fore('#FF0000')).apply(new UTranslate(28, 28)).draw(new UCenteredCharacter('A', SPOT_FONT));
    expect(root.getSvgString()).toContain('" fill="#4C4C4C"/>');
  });

  it('driven directly: fill colour first, then one newpath..fill path (java:79-81)', () => {
    const root = graphic();
    const param = root.apply(new Fore('#00FF00')).apply(new UTranslate(28, 28)).getParam();
    new DriverCenteredCharacterSvg(root.getSvgGraphics()).draw(
      new UCenteredCharacter('A', SPOT_FONT),
      param,
      ColorMapper.IDENTITY,
    );
    expect(root.getSvgString()).toMatch(/<path d="M27\.863,23\.348 [^"]* Z " fill="#0F0"\/>/);
  });
});
