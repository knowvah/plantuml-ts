/**
 * `ColorMapper.MONOCHROME` / `MONOCHROME_REVERSE` / `IDENTITY`
 * (ColorMapper.java:47-91) over `ColorUtils#getGrayScaleColor*`
 * (ColorUtils.java:45-75), and `mapPaint` — `HColor#toSvg(mapper)`
 * (HColor.java:74-79) over the port's `Paint` seam.
 *
 * Expected values are the jar's: `#EEEBDC` → `#EAEAEA` is
 * `zirabo-51-lera821`'s golden background; `#FFFFCC` → `#F9F9F9` and
 * `#FFDD88` → `#DDD` are the same golden's warning-banner fill/stroke
 * (DiagramChromeFactory.java:230-231).
 */
import { describe, expect, it } from 'vitest';
import { ColorMapper, mapPaint } from '../../../../../src/core/klimt/color/ColorMapper.js';
import { HColorSimple } from '../../../../../src/core/klimt/color/HColorSimple.js';
import { getGrayScaleColor, getGrayScaleColorReverse } from '../../../../../src/core/klimt/color/ColorUtils.js';

const rgb = (r: number, g: number, b: number, a = 255) => ({ r, g, b, a });

describe('ColorUtils grey scale', () => {
  it('(r*299 + g*587 + b*114) / 1000, truncated, opaque', () => {
    expect(getGrayScaleColor(rgb(0xee, 0xeb, 0xdc))).toEqual(rgb(0xea, 0xea, 0xea));
    expect(getGrayScaleColor(rgb(0xff, 0xff, 0xcc, 10))).toEqual(rgb(0xf9, 0xf9, 0xf9));
    expect(getGrayScaleColorReverse(rgb(0xee, 0xeb, 0xdc))).toEqual(rgb(0x15, 0x15, 0x15));
  });
});

describe('ColorMapper', () => {
  const simple = HColorSimple.create(rgb(0xff, 0xdd, 0x88));

  it('IDENTITY returns the awt colour', () => {
    expect(ColorMapper.IDENTITY.fromColorSimple(simple)).toEqual(rgb(0xff, 0xdd, 0x88));
  });

  it('MONOCHROME / MONOCHROME_REVERSE grey the colour', () => {
    expect(ColorMapper.MONOCHROME.fromColorSimple(simple)).toEqual(rgb(0xdd, 0xdd, 0xdd));
    expect(ColorMapper.MONOCHROME_REVERSE.fromColorSimple(simple)).toEqual(rgb(0x22, 0x22, 0x22));
  });
});

describe('mapPaint (HColor#toSvg(mapper))', () => {
  it('maps a solid paint', () => {
    expect(mapPaint('#EEEBDC', ColorMapper.MONOCHROME)).toBe('#EAEAEA');
    expect(mapPaint('#FFFFCC', ColorMapper.MONOCHROME)).toBe('#F9F9F9');
  });

  it('keeps a transparent paint #00000000 without consulting the mapper', () => {
    expect(mapPaint('#00000000', ColorMapper.MONOCHROME_REVERSE)).toBe('#00000000');
  });

  it('maps both gradient stops (SvgGraphics.java:181-182)', () => {
    expect(mapPaint({ color1: '#EEEBDC', color2: '#FFFFCC', policy: '-' }, ColorMapper.MONOCHROME)).toEqual({
      color1: '#EAEAEA',
      color2: '#F9F9F9',
      policy: '-',
    });
  });

  it('IDENTITY leaves the paint unchanged', () => {
    expect(mapPaint('#EEEBDC', ColorMapper.IDENTITY)).toBe('#EEEBDC');
  });
});

describe('ColorMapper.DARK_MODE / non-colour paints', () => {
  it('DARK_MODE takes the @media dark partner, else the colour itself (ColorMapper.java:68-73)', () => {
    const light = HColorSimple.create(rgb(0xff, 0xff, 0xff));
    const dark = HColorSimple.create(rgb(0x11, 0x22, 0x33));
    expect(ColorMapper.DARK_MODE.fromColorSimple(light.withDark(dark) as HColorSimple)).toEqual(rgb(0x11, 0x22, 0x33));
    expect(ColorMapper.DARK_MODE.fromColorSimple(light)).toEqual(rgb(0xff, 0xff, 0xff));
  });

  it('a paint string that is not a colour literal is returned unchanged', () => {
    expect(mapPaint('url(#g1)', ColorMapper.MONOCHROME)).toBe('url(#g1)');
  });
});
