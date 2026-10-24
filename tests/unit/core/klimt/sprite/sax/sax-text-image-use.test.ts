import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Paint } from '../../../../../../src/core/paint.js';
import type { StringBounder } from '../../../../../../src/core/klimt/font/StringBounder.js';
import type { UChange } from '../../../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../../../src/core/klimt/UGraphic.js';
import type { UParam } from '../../../../../../src/core/klimt/UParam.js';
import type { UShape } from '../../../../../../src/core/klimt/UShape.js';
import { UTranslate } from '../../../../../../src/core/klimt/UTranslate.js';
import { XDimension2D } from '../../../../../../src/core/klimt/geom/XDimension2D.js';
import { UGraphicWithScale } from '../../../../../../src/core/klimt/UGraphicWithScale.js';
import { UImageSvg } from '../../../../../../src/core/klimt/shape/UImageSvg.js';
import { FontStyle, UText, type FontConfiguration } from '../../../../../../src/core/klimt/shape/UText.js';
import type { RenderContext } from '../../../../../../src/core/klimt/sprite/sax/sax-context.js';
import { BufferedElement } from '../../../../../../src/core/klimt/sprite/sax/sax-defs.js';
import type { SaxAttributes } from '../../../../../../src/core/klimt/sprite/sax/sax-events.js';

const mocks = vi.hoisted(() => ({
  applyStyleAndTransform: vi.fn(),
  getAttrOrStyle: vi.fn(),
  getDoubleAttr: vi.fn(),
  parseFontSize: vi.fn(),
  parseFontFace: vi.fn(),
  applyTextDecoration: vi.fn(),
}));

vi.mock('../../../../../../src/core/klimt/sprite/sax/sax-style.js', () => mocks);

const { handleText, handleImage, handleUse } =
  await import('../../../../../../src/core/klimt/sprite/sax/sax-text-image-use.js');

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

const WIDTH_PER_CHAR = 10;
const UNUSED = 'not used in these tests';

const PARAM: UParam = {
  getStroke: () => {
    throw new Error(UNUSED);
  },
  getColor: () => '#000000',
  getBackcolor: () => '#FFFFFF',
  getTranslate: () => {
    throw new Error(UNUSED);
  },
};

interface Drawn {
  readonly shape: UShape;
  readonly applied: readonly UChange[];
}

/** Records every `draw` with the changes applied so far; measures 10 px per char. */
class RecordingUGraphic implements UGraphic {
  readonly measured: { family: string; size: number; text: string }[] = [];
  private readonly bounder: StringBounder;

  constructor(
    readonly drawn: Drawn[] = [],
    readonly applied: readonly UChange[] = [],
    measured?: { family: string; size: number; text: string }[],
  ) {
    this.measured = measured ?? [];
    this.bounder = {
      calculateDimension: (font, text) => {
        this.measured.push({ family: font.family, size: font.size, text });
        return new XDimension2D(text.length * WIDTH_PER_CHAR, font.size);
      },
    };
  }

  apply(change: UChange): UGraphic {
    return new RecordingUGraphic(this.drawn, [...this.applied, change], this.measured);
  }

  draw(shape: UShape): void {
    this.drawn.push({ shape, applied: this.applied });
  }

  getParam(): UParam {
    return PARAM;
  }

  getTranslate(): UTranslate {
    throw new Error(UNUSED);
  }

  getStringBounder(): StringBounder {
    return this.bounder;
  }
}

const DEFAULT_COLOR = '#112233';
const paintResolver = {
  getDefaultColor: (): Paint => DEFAULT_COLOR,
  getTrueColor: (c: string): Paint => `true:${c}`,
};

function baseUgs(resolver = paintResolver, scale = 1): { ugs: UGraphicWithScale; rec: RecordingUGraphic } {
  const rec = new RecordingUGraphic();
  return { ugs: UGraphicWithScale.create(rec, resolver, scale), rec };
}

function attrsOf(record: Record<string, string>): SaxAttributes {
  const entries = Object.entries(record);
  return {
    length: entries.length,
    qName: (i) => entries[i]![0],
    value: (i) => entries[i]![1],
    get: (name) => record[name],
  };
}

interface Fixture {
  ctx: RenderContext;
  rec: RecordingUGraphic;
  fragments: { xml: string; ugs: UGraphicWithScale }[];
}

function fixture(definitions: Map<string, BufferedElement> = new Map(), scale = 1): Fixture {
  const { ugs, rec } = baseUgs(paintResolver, scale);
  const fragments: Fixture['fragments'] = [];
  const ctx = {
    ugs,
    colorResolver: undefined as never,
    definitions,
    renderFragment: (xml: string, u: UGraphicWithScale) => {
      fragments.push({ xml, ugs: u });
    },
  } satisfies RenderContext;
  return { ctx, rec, fragments };
}

const translates = (applied: readonly UChange[]): UTranslate[] =>
  applied.filter((c): c is UTranslate => c instanceof UTranslate);

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  // The documented defaults of the real helpers (SvgSaxParser.java:1156-1162, 1254-1319, 1321-1335).
  mocks.applyStyleAndTransform.mockImplementation((_c: RenderContext, _a: SaxAttributes, u: UGraphicWithScale) => u);
  mocks.getAttrOrStyle.mockImplementation((a: SaxAttributes, name: string) => a.get(name));
  mocks.getDoubleAttr.mockImplementation((a: SaxAttributes, name: string, def: number) => {
    const v = a.get(name);
    return v === undefined || v === '' || Number.isNaN(Number(v)) ? def : Number(v);
  });
  mocks.parseFontSize.mockImplementation((s: string | undefined, def: number) => (s === undefined ? def : Number(s)));
  mocks.parseFontFace.mockReturnValue({ cssWeight: 400, italic: false });
  mocks.applyTextDecoration.mockImplementation((fc: FontConfiguration) => fc);
});

// ---------------------------------------------------------------------------
// handleText  (SvgSaxParser.java:628-679)
// ---------------------------------------------------------------------------

function drawnText(rec: RecordingUGraphic): { text: UText; applied: readonly UChange[] } {
  expect(rec.drawn).toHaveLength(1);
  const { shape, applied } = rec.drawn[0]!;
  expect(shape).toBeInstanceOf(UText);
  return { text: shape as UText, applied };
}

describe('handleText (SvgSaxParser.java:628-679)', () => {
  it('draws one UText at (x, y) with the :646 / :641 defaults when no anchor is given', () => {
    const { ctx, rec } = fixture();
    const attrs = attrsOf({ x: '1', y: '9' });

    handleText(ctx, attrs, 'Hi');

    expect(mocks.applyStyleAndTransform).toHaveBeenCalledWith(ctx, attrs, ctx.ugs);
    expect(mocks.parseFontSize).toHaveBeenCalledWith(undefined, 12); // :641
    expect(mocks.parseFontFace).toHaveBeenCalledWith(undefined, undefined); // :642
    const { text, applied } = drawnText(rec);
    expect(text.getText()).toBe('Hi');
    const fc = text.getFontConfiguration();
    expect(fc.family).toBe('SansSerif'); // :646
    expect(fc.size).toBe(12);
    expect(fc.color).toBe(DEFAULT_COLOR); // :651 getDefaultColor
    expect(fc.styles.size).toBe(0);
    expect(translates(applied).map((t) => [t.getDx(), t.getDy()])).toEqual([[1, 9]]); // :664-677
    expect(rec.measured).toHaveLength(0); // anchor measured only when text-anchor is non-empty (:667)
  });

  it('shifts by -width/2 for text-anchor=middle (:669-670)', () => {
    const { ctx, rec } = fixture();
    handleText(ctx, attrsOf({ x: '1', y: '9', 'text-anchor': 'middle' }), 'Hi');

    expect(rec.measured).toEqual([{ family: 'SansSerif', size: 12, text: 'Hi' }]);
    const t = translates(drawnText(rec).applied);
    expect(t.map((u) => [u.getDx(), u.getDy()])).toEqual([[1 - 10, 9]]); // width 2 chars * 10 = 20
  });

  it('shifts by -width for text-anchor=end, matched case-insensitively (:671-672)', () => {
    const { ctx, rec } = fixture();
    handleText(ctx, attrsOf({ x: '1', y: '9', 'text-anchor': 'END' }), 'Hi');
    expect(translates(drawnText(rec).applied).map((u) => u.getDx())).toEqual([1 - 20]);
  });

  it('measures but does not shift for another anchor such as start (:667-675)', () => {
    const { ctx, rec } = fixture();
    handleText(ctx, attrsOf({ x: '4', 'text-anchor': 'start' }), 'Hi');
    expect(rec.measured).toHaveLength(1);
    expect(translates(drawnText(rec).applied).map((u) => [u.getDx(), u.getDy()])).toEqual([[4, 0]]);
  });

  it('treats an empty text-anchor as absent (:667)', () => {
    const { ctx, rec } = fixture();
    handleText(ctx, attrsOf({ 'text-anchor': '' }), 'Hi');
    expect(rec.measured).toHaveLength(0);
  });

  it('measures the trimmed content with the muted font (:640, :668)', () => {
    const { ctx, rec } = fixture();
    handleText(ctx, attrsOf({ 'font-size': '20', 'text-anchor': 'middle' }), '  \n abc\t ');
    expect(rec.measured).toEqual([{ family: 'SansSerif', size: 20, text: 'abc' }]);
    expect(drawnText(rec).text.getText()).toBe('abc');
  });

  it('trims only Java whitespace (chars <= U+0020), not NBSP (String#trim :640)', () => {
    const { ctx, rec } = fixture();
    handleText(ctx, attrsOf({}), ' x ');
    expect(drawnText(rec).text.getText()).toBe(' x ');
  });

  it('reads each font attribute through getAttrOrStyle with its own key (:630-635)', () => {
    const { ctx } = fixture();
    const attrs = attrsOf({});
    handleText(ctx, attrs, 'x');
    expect(mocks.getAttrOrStyle.mock.calls).toEqual([
      [attrs, 'font-family', 'font-family'],
      [attrs, 'font-size', 'font-size'],
      [attrs, 'font-weight', 'font-weight'],
      [attrs, 'font-style', 'font-style'],
      [attrs, 'text-decoration', 'text-decoration'],
      [attrs, 'fill', 'fill'],
    ]);
  });

  it('builds the font from family, parsed size and parsed face; bold/italic become styles (:641-659)', () => {
    const { ctx, rec } = fixture();
    mocks.getAttrOrStyle.mockImplementation(
      (a: SaxAttributes, name: string) =>
        ({ 'font-family': 'Arial', 'font-size': '18', 'font-weight': 'bold', 'font-style': 'italic' })[name] ??
        a.get(name),
    );
    mocks.parseFontFace.mockReturnValue({ cssWeight: 700, italic: true });

    handleText(ctx, attrsOf({}), 'x');

    expect(mocks.parseFontFace).toHaveBeenCalledWith('bold', 'italic');
    const fc = drawnText(rec).text.getFontConfiguration();
    expect(fc.family).toBe('Arial');
    expect(fc.size).toBe(18);
    expect(fc.fontFace).toEqual({ cssWeight: 700, italic: true });
    expect([...fc.styles].sort()).toEqual([FontStyle.BOLD, FontStyle.ITALIC].sort());
  });

  it('maps a bold-only and an italic-only face to the single matching style (FontConfiguration.java:67-80)', () => {
    const { ctx, rec } = fixture();
    mocks.parseFontFace.mockReturnValueOnce({ cssWeight: 700, italic: false });
    handleText(ctx, attrsOf({}), 'b');
    mocks.parseFontFace.mockReturnValueOnce({ cssWeight: 400, italic: true });
    handleText(ctx, attrsOf({}), 'i');
    const styles = rec.drawn.map((d) => [...(d.shape as UText).getFontConfiguration().styles]);
    expect(styles).toEqual([[FontStyle.BOLD], [FontStyle.ITALIC]]);
  });

  it('falls back to SansSerif for an empty font-family (:645-647)', () => {
    const { ctx, rec } = fixture();
    mocks.getAttrOrStyle.mockImplementation((_a: SaxAttributes, name: string) =>
      name === 'font-family' ? '' : undefined,
    );
    handleText(ctx, attrsOf({}), 'x');
    expect(drawnText(rec).text.getFontConfiguration().family).toBe('SansSerif');
  });

  it('resolves fill through the true colour; none and empty keep the default (:651-657)', () => {
    const { ctx, rec } = fixture();
    const fillOf = (fill: string | undefined): string | null => {
      mocks.getAttrOrStyle.mockImplementation((_a: SaxAttributes, name: string) =>
        name === 'fill' ? fill : undefined,
      );
      handleText(ctx, attrsOf({}), 'x');
      return (rec.drawn.at(-1)!.shape as UText).getFontConfiguration().color;
    };
    expect(fillOf('red')).toBe('true:red');
    expect(fillOf('none')).toBe(DEFAULT_COLOR);
    expect(fillOf('')).toBe(DEFAULT_COLOR);
    expect(fillOf(undefined)).toBe(DEFAULT_COLOR);
  });

  it('uses the same colour for the hyperlink colour and the simple underline stroke (:659 create(font, c, c, simple, 8))', () => {
    const { ctx, rec } = fixture();
    handleText(ctx, attrsOf({}), 'x');
    const fc = drawnText(rec).text.getFontConfiguration();
    expect(fc.hyperlinkColor).toBe(DEFAULT_COLOR);
    expect(fc.hyperlinkUnderlineStroke?.getThickness()).toBe(1);
  });

  it('passes the configuration through applyTextDecoration and draws what it returns (:660)', () => {
    const { ctx, rec } = fixture();
    mocks.getAttrOrStyle.mockImplementation((_a: SaxAttributes, name: string) =>
      name === 'text-decoration' ? 'underline' : undefined,
    );
    mocks.applyTextDecoration.mockImplementation((fc: FontConfiguration) => ({ ...fc, extendedColor: 'decorated' }));

    handleText(ctx, attrsOf({}), 'x');

    expect(mocks.applyTextDecoration.mock.calls[0]![1]).toBe('underline');
    expect(drawnText(rec).text.getFontConfiguration().extendedColor).toBe('decorated');
  });

  it('draws through the graphic applyStyleAndTransform returned (:629, :677)', () => {
    const { ctx, rec } = fixture();
    const styled = ctx.ugs.applyTranslate(5, 5);
    mocks.applyStyleAndTransform.mockReturnValue(styled);
    handleText(ctx, attrsOf({ x: '2' }), 'x');
    expect(drawnText(rec).applied.filter((c) => c instanceof UTranslate)).toHaveLength(1);
  });

  it('throws NumberFormatException-style for an unparsable x (Double.parseDouble :664)', () => {
    const { ctx, rec } = fixture();
    expect(() => handleText(ctx, attrsOf({ x: 'abc' }), 'x')).toThrow(/NumberFormatException.*"abc"/);
    expect(rec.drawn).toHaveLength(0);
    expect(() => handleText(ctx, attrsOf({ y: '1,5' }), 'x')).toThrow(/NumberFormatException/);
  });

  it('parses x and y as Double.parseDouble does: trimmed, exponent, f/d suffix, sign (:664-665)', () => {
    const { ctx, rec } = fixture();
    handleText(ctx, attrsOf({ x: ' +1.5e1 ', y: '.5d' }), 'x');
    handleText(ctx, attrsOf({ x: '2f', y: '-3.' }), 'x');
    handleText(ctx, attrsOf({ x: '', y: '' }), 'x');
    const dxdy = rec.drawn.map((d) => translates(d.applied).map((t) => [t.getDx(), t.getDy()])[0]);
    expect(dxdy).toEqual([
      [15, 0.5],
      [2, -3],
      [0, 0],
    ]);
  });

  it('rejects a non-solid fill: a gradient cannot be a text colour', () => {
    const gradient: Paint = { color1: '#000000', color2: '#ffffff', policy: '-' };
    const { ugs } = baseUgs({ getDefaultColor: () => DEFAULT_COLOR, getTrueColor: () => gradient });
    const ctx: RenderContext = { ...fixture().ctx, ugs };
    mocks.getAttrOrStyle.mockImplementation((_a: SaxAttributes, name: string) =>
      name === 'fill' ? 'url(#g)' : undefined,
    );
    expect(() => handleText(ctx, attrsOf({}), 'x')).toThrow(/gradient/);
  });
});

// ---------------------------------------------------------------------------
// handleImage  (SvgSaxParser.java:680-815)
// ---------------------------------------------------------------------------

function base64(bytes: readonly number[]): string {
  return btoa(String.fromCharCode(...bytes));
}

const u32 = (n: number): number[] => [Math.floor(n / 16777216) % 256, (n >> 16) & 255, (n >> 8) & 255, n & 255];

/** PNG signature + IHDR (width x height, 8-bit RGBA) + padding (png-ihdr.ts layout, ISO 15948 11.2.2). */
function pngBytes(width: number, height: number): number[] {
  return [
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    ...u32(13),
    0x49,
    0x48,
    0x44,
    0x52,
    ...u32(width),
    ...u32(height),
    8,
    6,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  ];
}

/** SOI + APP0 + a marker-less fill + `sof` segment (precision 8, height, width, 1 component). */
function jpegBytes(width: number, height: number, sof = 0xc0): number[] {
  const app0 = [0xff, 0xe0, 0x00, 0x04, 0x4a, 0x46];
  const frame = [
    0xff,
    sof,
    0x00,
    0x0b,
    8,
    (height >> 8) & 255,
    height & 255,
    (width >> 8) & 255,
    width & 255,
    1,
    1,
    0x11,
    0,
  ];
  return [0xff, 0xd8, ...app0, 0xff, 0xff, 0xd0, ...frame, 0xff, 0xd9];
}

const pngUri = (w: number, h: number, mime = 'png'): string => `data:image/${mime};base64,${base64(pngBytes(w, h))}`;
const jpegUri = (w: number, h: number, mime = 'jpeg', sof = 0xc0): string =>
  `data:image/${mime};base64,${base64(jpegBytes(w, h, sof))}`;

const svgImageOf = (rec: RecordingUGraphic): { image: UImageSvg; applied: readonly UChange[] } => {
  expect(rec.drawn).toHaveLength(1);
  const { shape, applied } = rec.drawn[0]!;
  expect(shape).toBeInstanceOf(UImageSvg);
  return { image: shape as UImageSvg, applied };
};

/** `buildSvgImage` (SvgSaxParser.java:801-808). */
const expectedSvg = (href: string, w: string, h: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}">` +
  `<image x="0" y="0" width="${w}" height="${h}" xlink:href="${href}"/></svg>`;

describe('handleImage (SvgSaxParser.java:680-725)', () => {
  it('draws one UImageSvg at the image size when no width/height is given (:693-713)', () => {
    const { ctx, rec } = fixture();
    const href = pngUri(24, 18);
    handleImage(ctx, attrsOf({ href, x: '3', y: '4' }));

    const { image, applied } = svgImageOf(rec);
    expect(image.getSvg(true)).toBe(expectedSvg(href, '24', '18'));
    expect(image.getScale()).toBe(1); // new UImageSvg(svgImage, 1.0) :712
    expect(translates(applied).map((t) => [t.getDx(), t.getDy()])).toEqual([[3, 4]]);
    expect(mocks.applyStyleAndTransform).toHaveBeenCalledWith(ctx, expect.anything(), ctx.ugs);
  });

  it('reads xlink:href when href is absent or empty (getHref :726-731)', () => {
    const a = fixture();
    handleImage(a.ctx, attrsOf({ 'xlink:href': pngUri(2, 3) }));
    expect(svgImageOf(a.rec).image.getSvg(true)).toBe(expectedSvg(pngUri(2, 3), '2', '3'));

    const b = fixture();
    handleImage(b.ctx, attrsOf({ href: '', 'xlink:href': pngUri(2, 3) }));
    expect(b.rec.drawn).toHaveLength(1);
  });

  it('uses the declared width and height as the drawn size (:699-709)', () => {
    const { ctx, rec } = fixture();
    const href = pngUri(24, 24);
    handleImage(ctx, attrsOf({ href, width: '48', height: '12' }));
    expect(svgImageOf(rec).image.getSvg(true)).toBe(expectedSvg(href, '48', '12'));
  });

  it('takes the missing dimension from the image (:699-700)', () => {
    const { ctx, rec } = fixture();
    const href = pngUri(24, 18);
    handleImage(ctx, attrsOf({ href, width: '48' }));
    expect(svgImageOf(rec).image.getSvg(true)).toBe(expectedSvg(href, '48', '18'));
  });

  it('formats a non-integral size with Double.toString and an integral one without ".0" (formatNumber :809-815)', () => {
    const { ctx, rec } = fixture();
    const href = pngUri(1, 1);
    handleImage(ctx, attrsOf({ href, width: '2.5', height: '1e1' }));
    expect(svgImageOf(rec).image.getSvg(true)).toBe(expectedSvg(href, '2.5', '10'));
  });

  it('formats Double.toString exponent forms for |v| < 1e-3 and v >= 1e7 (formatNumber :809-815)', () => {
    const { ctx, rec } = fixture();
    const href = pngUri(1, 1);
    handleImage(ctx, attrsOf({ href, width: '0.0001', height: '12345678.5' }));
    expect(svgImageOf(rec).image.getSvg(true)).toBe(expectedSvg(href, '1.0E-4', '1.23456785E7'));
  });

  it('keeps the default size for an unparsable width (getDoubleAttr :1321-1335)', () => {
    const { ctx, rec } = fixture();
    const href = pngUri(7, 8);
    handleImage(ctx, attrsOf({ href, width: 'abc' }));
    expect(svgImageOf(rec).image.getSvg(true)).toBe(expectedSvg(href, '7', '8'));
  });

  it('draws nothing for a non-positive width or height (:702-703)', () => {
    const a = fixture();
    handleImage(a.ctx, attrsOf({ href: pngUri(5, 5), width: '0' }));
    handleImage(a.ctx, attrsOf({ href: pngUri(5, 5), height: '-3' }));
    expect(a.rec.drawn).toHaveLength(0);
  });

  it('a NaN width passes both size guards and is formatted "NaN", as the Java comparisons do (:702, :707, :809-815)', () => {
    mocks.getDoubleAttr.mockImplementation((_a: SaxAttributes, name: string, def: number) =>
      name === 'width' ? Number.NaN : def,
    );
    const { ctx, rec } = fixture();
    handleImage(ctx, attrsOf({ href: pngUri(5, 5), width: 'NaN' }));
    expect(svgImageOf(rec).image.getSvg(true)).toBe(expectedSvg(pngUri(5, 5), 'NaN', '5'));
  });

  it('draws nothing when there is no href, an empty href or a non-data href (:681-691, :761-765)', () => {
    const { ctx, rec } = fixture();
    handleImage(ctx, attrsOf({}));
    handleImage(ctx, attrsOf({ href: '' }));
    handleImage(ctx, attrsOf({ href: 'http://example.com/a.png' }));
    handleImage(ctx, attrsOf({ href: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' }));
    expect(rec.drawn).toHaveLength(0);
    expect(mocks.applyStyleAndTransform).not.toHaveBeenCalled();
  });

  it('skips an embedded SVG data URI, in any case (:756-760)', () => {
    const { ctx, rec } = fixture();
    handleImage(ctx, attrsOf({ href: 'DATA:IMAGE/SVG+XML;BASE64,PHN2Zz48L3N2Zz4=' }));
    expect(rec.drawn).toHaveLength(0);
  });

  it('draws nothing for base64 Base64Coder rejects: bad length or illegal character (:768-774)', () => {
    const { ctx, rec } = fixture();
    const good = base64(pngBytes(5, 5));
    handleImage(ctx, attrsOf({ href: `data:image/png;base64,${good.slice(0, -1)}` })); // length % 4 != 0
    handleImage(ctx, attrsOf({ href: `data:image/png;base64,${good.slice(0, 8)} ${good.slice(9)}` })); // space
    handleImage(ctx, attrsOf({ href: `data:image/png;base64,${good.slice(0, 8)}é${good.slice(9)}` })); // > 127
    expect(rec.drawn).toHaveLength(0);
  });

  it('draws nothing for bytes no reader recognises (SImageIO.read null :777-780)', () => {
    const { ctx, rec } = fixture();
    handleImage(ctx, attrsOf({ href: `data:image/png;base64,${base64([1, 2, 3, 4, 5, 6, 7, 8, 9])}` }));
    handleImage(ctx, attrsOf({ href: `data:image/png;base64,${base64([])}` }));
    expect(rec.drawn).toHaveLength(0);
  });

  it('accepts the three data prefixes, matching them case-insensitively (getDataImagePrefix :788-800)', () => {
    const { ctx, rec } = fixture();
    const sizes = [
      ['png', pngUri(1, 2)],
      ['jpeg', jpegUri(3, 4, 'jpeg')],
      ['jpg', jpegUri(5, 6, 'jpg')],
      ['mixed case', pngUri(7, 8).replace('data:image/png;base64,', 'Data:Image/PNG;Base64,')],
    ] as const;
    for (const [, href] of sizes) handleImage(ctx, attrsOf({ href }));
    const svgs = rec.drawn.map((d) => (d.shape as UImageSvg).getSvg(true));
    expect(svgs).toEqual([
      expectedSvg(sizes[0][1], '1', '2'),
      expectedSvg(sizes[1][1], '3', '4'),
      expectedSvg(sizes[2][1], '5', '6'),
      expectedSvg(sizes[3][1], '7', '8'),
    ]);
  });

  it('reads a JPEG by content, whatever the MIME says (ImageIO.read(byte[]))', () => {
    const { ctx, rec } = fixture();
    handleImage(ctx, attrsOf({ href: jpegUri(40, 40, 'png') }));
    expect(svgImageOf(rec).image.getSvg(true)).toBe(expectedSvg(jpegUri(40, 40, 'png'), '40', '40'));
  });

  it('reads progressive and extended-sequential JPEG frames, ignores unsupported ones', () => {
    const { ctx, rec } = fixture();
    handleImage(ctx, attrsOf({ href: jpegUri(9, 10, 'jpeg', 0xc2) }));
    handleImage(ctx, attrsOf({ href: jpegUri(11, 12, 'jpeg', 0xc1) }));
    expect(rec.drawn).toHaveLength(2);
    handleImage(ctx, attrsOf({ href: jpegUri(13, 14, 'jpeg', 0xc9) })); // arithmetic coding
    handleImage(ctx, attrsOf({ href: jpegUri(13, 14, 'jpeg', 0xc3) })); // lossless
    expect(rec.drawn).toHaveLength(2);
  });

  it('rejects malformed JPEGs: truncated, zero-sized, no frame header, missing marker prefix', () => {
    const { ctx, rec } = fixture();
    const uri = (bytes: number[]): string => `data:image/jpeg;base64,${base64(bytes)}`;
    const good = jpegBytes(8, 8);
    handleImage(ctx, attrsOf({ href: uri(good.slice(0, 14)) })); // cut inside the frame header
    handleImage(ctx, attrsOf({ href: uri(jpegBytes(0, 8)) }));
    handleImage(ctx, attrsOf({ href: uri(jpegBytes(8, 0)) }));
    handleImage(ctx, attrsOf({ href: uri([0xff, 0xd8, 0xff, 0xd9]) })); // EOI before any frame
    handleImage(ctx, attrsOf({ href: uri([0xff, 0xd8, 0x00, 0x01]) })); // no marker prefix
    handleImage(ctx, attrsOf({ href: uri([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x01]) })); // segment length < 2
    handleImage(ctx, attrsOf({ href: uri([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x20]) })); // segment past the end
    expect(rec.drawn).toHaveLength(0);
  });

  it('rejects PNG whose IHDR is invalid (SImageIO.read null / IOException :777-785)', () => {
    const { ctx, rec } = fixture();
    const bad = pngBytes(5, 5);
    bad[24] = 3; // bit depth 3 is not a PNG depth
    handleImage(ctx, attrsOf({ href: `data:image/png;base64,${base64(bad)}` }));
    expect(rec.drawn).toHaveLength(0);
  });

  it('calls applyStyleAndTransform only after the image decoded (:693)', () => {
    const { ctx } = fixture();
    handleImage(ctx, attrsOf({ href: 'data:image/png;base64,AAAA' }));
    expect(mocks.applyStyleAndTransform).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleUse  (SvgSaxParser.java:816-912)
// ---------------------------------------------------------------------------

const element = (tag: string, xml: string, attributes: Record<string, string> = {}): BufferedElement =>
  new BufferedElement(tag, xml, new Map(Object.entries(attributes)));

const WRAP_OPEN = '<svg xmlns="http://www.w3.org/2000/svg">'; // SvgSaxParser.java:895
const WRAP_CLOSE = '</svg>';

describe('handleUse (SvgSaxParser.java:816-865)', () => {
  it('hands the wrapped fragment and the translated graphic to renderFragment (:841-862, :895)', () => {
    const xml = '<rect x="0" y="0" width="5" height="5"/>';
    const { ctx, fragments } = fixture(new Map([['a', element('rect', xml)]]));
    const attrs = attrsOf({ href: '#a', x: '3' });

    handleUse(ctx, attrs);

    expect(mocks.applyStyleAndTransform).toHaveBeenCalledWith(ctx, attrs, ctx.ugs);
    expect(fragments).toHaveLength(1);
    expect(fragments[0]!.xml).toBe(WRAP_OPEN + xml + WRAP_CLOSE);
    const applied = (fragments[0]!.ugs.getUg() as RecordingUGraphic).applied;
    expect(translates(applied).map((t) => [t.getDx(), t.getDy()])).toEqual([[3, 0]]);
  });

  it('scales the x/y translate by the transform scale (:841-844)', () => {
    const { ctx, fragments } = fixture(new Map([['a', element('g', '<g/>')]]), 2);
    handleUse(ctx, attrsOf({ href: '#a', x: '3', y: '5' }));
    const applied = (fragments[0]!.ugs.getUg() as RecordingUGraphic).applied;
    expect(translates(applied).map((t) => [t.getDx(), t.getDy()])).toEqual([[6, 10]]);
  });

  it('does not translate when x and y are both zero or absent (:840)', () => {
    const { ctx, fragments } = fixture(new Map([['a', element('g', '<g/>')]]));
    handleUse(ctx, attrsOf({ href: '#a', x: '0', y: '0' }));
    handleUse(ctx, attrsOf({ href: '#a' }));
    expect(fragments).toHaveLength(2);
    for (const f of fragments) expect(translates((f.ugs.getUg() as RecordingUGraphic).applied)).toHaveLength(0);
  });

  it('translates by y alone (:840)', () => {
    const { ctx, fragments } = fixture(new Map([['a', element('g', '<g/>')]]));
    handleUse(ctx, attrsOf({ href: '#a', y: '2' }));
    expect(
      translates((fragments[0]!.ugs.getUg() as RecordingUGraphic).applied).map((t) => [t.getDx(), t.getDy()]),
    ).toEqual([[0, 2]]);
  });

  it('reads xlink:href when href is absent or empty (:817-820)', () => {
    const { ctx, fragments } = fixture(new Map([['a', element('g', '<g/>')]]));
    handleUse(ctx, attrsOf({ 'xlink:href': '#a' }));
    handleUse(ctx, attrsOf({ href: '', 'xlink:href': '#a' }));
    expect(fragments).toHaveLength(2);
  });

  it('draws nothing for a missing, empty or non-fragment href (:821-823)', () => {
    const { ctx, fragments } = fixture(new Map([['a', element('g', '<g/>')]]));
    handleUse(ctx, attrsOf({}));
    handleUse(ctx, attrsOf({ href: '' }));
    handleUse(ctx, attrsOf({ href: 'a' }));
    handleUse(ctx, attrsOf({ href: 'http://x/#a' }));
    expect(fragments).toHaveLength(0);
    expect(mocks.applyStyleAndTransform).not.toHaveBeenCalled();
  });

  it('draws nothing for an id that is not defined (:826-830)', () => {
    const { ctx, fragments } = fixture(new Map([['a', element('g', '<g/>')]]));
    handleUse(ctx, attrsOf({ href: '#nope' }));
    expect(fragments).toHaveLength(0);
    expect(mocks.applyStyleAndTransform).not.toHaveBeenCalled();
  });

  it('draws nothing for a definition with no buffered content (:852-855)', () => {
    const { ctx, fragments } = fixture(new Map([['a', element('linearGradient', '')]]));
    handleUse(ctx, attrsOf({ href: '#a' }));
    expect(fragments).toHaveLength(0);
  });
});

describe('handleUse symbol viewport (SvgSaxParser.java:857-893)', () => {
  const symbol = (viewBox: string | undefined): Map<string, BufferedElement> =>
    new Map([['s', element('symbol', '<symbol/>', viewBox === undefined ? {} : { viewBox })]]);

  const matrixOf = (f: Fixture): [number, number, number] => {
    const at = f.fragments[0]!.ugs.getAffineTransform();
    return [at.getScaleX(), at.getTranslateX(), at.getTranslateY()];
  };

  it('translates by -min and scales by width/vbWidth, height/vbHeight (:886-890)', () => {
    const f = fixture(symbol('10 20 100 50'));
    handleUse(f.ctx, attrsOf({ href: '#s', width: '200', height: '100' }));
    // applyTranslate(-10, -20) then applyScale(2, 2): XAffineTransform.scale multiplies m02/m12 too.
    expect(matrixOf(f)).toEqual([2, -20, -40]);
  });

  it('leaves the scale at 1 when width/height are absent (:886-887)', () => {
    const f = fixture(symbol('10 20 100 50'));
    handleUse(f.ctx, attrsOf({ href: '#s' }));
    expect(matrixOf(f)).toEqual([1, -10, -20]);
  });

  it('splits the viewBox on commas and whitespace and skips invalid numbers (parseNumberList :1227-1250)', () => {
    const f = fixture(symbol(' ,1,, 2\t3 x 4  '));
    handleUse(f.ctx, attrsOf({ href: '#s', width: '6', height: '8' }));
    // values [1, 2, 3, 4]: translate(-1, -2), scale(6/3 = 2, 8/4 = 2)
    expect(matrixOf(f)).toEqual([2, -2, -4]);
  });

  it.each([
    ['no viewBox', undefined],
    ['an empty viewBox', ''],
    ['a blank viewBox', '   '],
    ['fewer than four numbers', '0 0 10'],
    ['a zero width', '0 0 0 10'],
    ['a zero height', '0 0 10 0'],
  ])('keeps the graphic untouched for %s (:867-883)', (_name, viewBox) => {
    const f = fixture(symbol(viewBox));
    handleUse(f.ctx, attrsOf({ href: '#s', width: '10', height: '10' }));
    expect(matrixOf(f)).toEqual([1, 0, 0]);
  });

  it('does not apply a viewBox to a non-symbol definition (:857)', () => {
    const f = fixture(new Map([['g1', element('g', '<g/>', { viewBox: '5 5 10 10' })]]));
    handleUse(f.ctx, attrsOf({ href: '#g1', width: '20', height: '20' }));
    expect(matrixOf(f)).toEqual([1, 0, 0]);
  });

  it('propagates applyScale rejecting a non-uniform scale, as upstream throws IllegalArgumentException', () => {
    const f = fixture(symbol('0 0 10 10'));
    expect(() => handleUse(f.ctx, attrsOf({ href: '#s', width: '20', height: '30' }))).toThrow(/non-uniform/);
    expect(f.fragments).toHaveLength(0);
  });
});
