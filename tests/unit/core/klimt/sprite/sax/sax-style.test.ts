import { describe, expect, it, vi } from 'vitest';
import { Back } from '../../../../../../src/core/klimt/Back.js';
import { Fore } from '../../../../../../src/core/klimt/Fore.js';
import { UStroke } from '../../../../../../src/core/klimt/UStroke.js';
import { UGraphicWithScale } from '../../../../../../src/core/klimt/UGraphicWithScale.js';
import type { ColorResolver as PaintResolver } from '../../../../../../src/core/klimt/UGraphicWithScale.js';
import { ColorResolver, colorResolverToSvgHex } from '../../../../../../src/core/klimt/sprite/ColorResolver.js';
import type { RenderContext } from '../../../../../../src/core/klimt/sprite/sax/sax-context.js';
import { BufferedElement, GradientStop } from '../../../../../../src/core/klimt/sprite/sax/sax-defs.js';
import { parseSaxEvents } from '../../../../../../src/core/klimt/sprite/sax/sax-events.js';
import type { SaxAttributes } from '../../../../../../src/core/klimt/sprite/sax/sax-events.js';
import { HColorLinearGradient, SpreadMethod } from '../../../../../../src/core/klimt/sprite/sax/sax-gradient.js';
import {
  applyStyleAndTransform,
  applyTextDecoration,
  applyTransform,
  extractGradientColor,
  getAttrOrStyle,
  getDoubleAttr,
  parseFontFace,
  parseFontSize,
} from '../../../../../../src/core/klimt/sprite/sax/sax-style.js';
import { FontStyle } from '../../../../../../src/core/klimt/shape/UText.js';
import type { FontConfiguration } from '../../../../../../src/core/klimt/shape/UText.js';
import { FakeUGraphic } from './fake-ugraphic.js';

const WHITE_HEX = '#FFFFFF';
const BLACK_HEX = '#000000';
const RANGE = { getMinGrayLevel: () => 0, getMaxGrayLevel: () => 255 };
const real = new ColorResolver(undefined, undefined, RANGE);
/** The `SvgNanoParser` `PaintColorResolver` seam: real resolver, hex strings out. */
const realPaint = {
  getDefaultColor: () => colorResolverToSvgHex(real.getDefaultColor()),
  getTrueColor: (c: string) => colorResolverToSvgHex(real.getTrueColor(c)),
};
/** Identity resolver: the colour code comes back unchanged, so assertions read the Java input. */
const echo = { getDefaultColor: () => BLACK_HEX, getTrueColor: (c: string) => c };

function makeUgs(scale = 1, resolver: PaintResolver = echo): UGraphicWithScale {
  return UGraphicWithScale.create(new FakeUGraphic(), resolver, scale);
}

function attrsOf(entries: Record<string, string>): SaxAttributes {
  const keys = Object.keys(entries);
  return {
    length: keys.length,
    qName: (i) => keys[i] ?? '',
    value: (i) => entries[keys[i] ?? ''] ?? '',
    get: (name) => entries[name],
  };
}

function makeCtx(ugs: UGraphicWithScale, definitions: Map<string, BufferedElement> = new Map()): RenderContext {
  return { ugs, colorResolver: real, definitions, renderFragment: vi.fn() };
}

function gradient(
  tag: string,
  attributes: Record<string, string>,
  stops: [string, string, (string | undefined)?][],
): BufferedElement {
  const el = new BufferedElement(tag, '', new Map(Object.entries(attributes)));
  for (const [offset, color, opacity] of stops) el.stops.push(new GradientStop(offset, color, opacity));
  return el;
}

/** Everything `FakeUGraphic#apply` saw, in order. */
function applied(ugs: UGraphicWithScale): readonly unknown[] {
  return (ugs.getUg() as FakeUGraphic).applied;
}

const foreOf = (ugs: UGraphicWithScale): unknown => [...applied(ugs)].reverse().find((c) => c instanceof Fore);
const backOf = (ugs: UGraphicWithScale): unknown => [...applied(ugs)].reverse().find((c) => c instanceof Back);
const colorOf = (c: unknown): unknown => (c as Fore).getColor();
const backColorOf = (c: unknown): unknown => (c as Back).getBackColor();

describe('applyTransform (SvgSaxParser.java:1190-1226)', () => {
  it('returns the same graphic for an empty transform (:1191-1193)', () => {
    const ugs = makeUgs();
    expect(applyTransform(ugs, '')).toBe(ugs);
  });

  it('applies translate with one value as ty = 0 (:1204-1205)', () => {
    const at = applyTransform(makeUgs(), 'translate(3)').getAffineTransform();
    expect([at.getTranslateX(), at.getTranslateY()]).toEqual([3, 0]);
  });

  it('applies translate with two values, comma and whitespace separated (:1227-1253)', () => {
    for (const form of ['translate(3,4)', 'translate(3 4)', 'translate( 3 , 4 )', 'translate(3,\n4)']) {
      const at = applyTransform(makeUgs(), form).getAffineTransform();
      expect([form, at.getTranslateX(), at.getTranslateY()]).toEqual([form, 3, 4]);
    }
  });

  it('composes matrix(1 0 0 1 4 5) then translate(3) as the Java does (:1190-1253)', () => {
    // matrix: concatenate [1 0 0 1 4 5] -> m02=4, m12=5; translate(3,0): m02 += m00*3 -> 7.
    const at = applyTransform(makeUgs(), 'matrix(1 0 0 1 4 5) translate(3)').getAffineTransform();
    expect(at.toString()).toBe('XAffineTransform[[1, 0, 7], [0, 1, 5]]');
  });

  it('multiplies the matrix operands in (m00 m10 m01 m11 m02 m12) order (:1220-1222)', () => {
    // matrix(a b c d e f): m00=a, m10=b, m01=c, m11=d.
    const at = applyTransform(makeUgs(), 'matrix(2 3 4 5 6 7)').getAffineTransform();
    expect(at.toString()).toBe('XAffineTransform[[2, 4, 6], [3, 5, 7]]');
  });

  it('ignores a matrix with fewer than six numbers (:1221)', () => {
    const ugs = makeUgs();
    expect(applyTransform(ugs, 'matrix(1 0 0 1 4)').getAffineTransform().toString()).toBe(
      ugs.getAffineTransform().toString(),
    );
  });

  it('applies a uniform scale through applyScale, updating the initial scale (:1209-1211)', () => {
    const scaled = applyTransform(makeUgs(), 'scale(2)');
    expect(scaled.getAffineTransform().getScaleX()).toBe(2);
    expect(scaled.getAffineTransform().getScaleY()).toBe(2);
    expect(scaled.getInitialScale()).toBe(2);
  });

  it('treats scale(2 2) as uniform and scale(2 3) as a matrix (:1208-1213)', () => {
    const uniform = applyTransform(makeUgs(), 'scale(2 2)');
    expect(uniform.getInitialScale()).toBe(2);
    const skewed = applyTransform(makeUgs(), 'scale(2 3)');
    expect(skewed.getAffineTransform().toString()).toBe('XAffineTransform[[2, 0, 0], [0, 3, 0]]');
    expect(skewed.getInitialScale()).toBe(1);
  });

  it('defaults scale() with no numbers to 1 (:1207)', () => {
    const at = applyTransform(makeUgs(), 'scale()').getAffineTransform();
    expect(at.toString()).toBe('XAffineTransform[[1, 0, 0], [0, 1, 0]]');
  });

  it('rotates about the origin for rotate(a) (:1215-1218)', () => {
    const rotated = applyTransform(makeUgs(), 'rotate(90)');
    const p = rotated.getAffineTransform().transform({ x: 1, y: 0 });
    expect(p.x).toBeCloseTo(0, 12);
    expect(p.y).toBeCloseTo(1, 12);
    expect(rotated.getAngle()).toBe(90);
  });

  it('ignores a two-number rotate centre: only the 3-argument form carries one (:1217-1218)', () => {
    const two = applyTransform(makeUgs(), 'rotate(90 10)');
    const none = applyTransform(makeUgs(), 'rotate(90)');
    expect(two.getAffineTransform().toString()).toBe(none.getAffineTransform().toString());
  });

  it('rotates about (cx, cy) for the 3-argument form, leaving the centre fixed', () => {
    const at = applyTransform(makeUgs(), 'rotate(90 10 20)').getAffineTransform();
    const centre = at.transform({ x: 10, y: 20 });
    expect(centre.x).toBeCloseTo(10, 12);
    expect(centre.y).toBeCloseTo(20, 12);
    expect(at.getTranslateX()).toBeCloseTo(30, 12);
    expect(at.getTranslateY()).toBeCloseTo(10, 12);
  });

  it('applies chained operations left to right (:1198-1224)', () => {
    // XAffineTransform.java:188-195 scale() multiplies m02/m12 too: translate(1 2) -> (1,2), then x2.
    const at = applyTransform(makeUgs(), 'translate(1 2) scale(2)').getAffineTransform();
    expect(at.toString()).toBe('XAffineTransform[[2, 0, 2], [0, 2, 4]]');
  });

  it('skips non-numeric tokens, shifting the rest (:1241-1245)', () => {
    const at = applyTransform(makeUgs(), 'translate(a 5)').getAffineTransform();
    expect([at.getTranslateX(), at.getTranslateY()]).toEqual([5, 0]);
  });

  it('does not recognise skewX/skewY: the Java pattern lists only four operations (:1187)', () => {
    const ugs = makeUgs();
    const out = applyTransform(ugs, 'skewX(30) skewY(10)');
    expect(out.getAffineTransform().toString()).toBe(ugs.getAffineTransform().toString());
  });

  it('accepts Java Double.parseDouble syntax: exponents, signs, a trailing d/f suffix', () => {
    const at = applyTransform(makeUgs(), 'translate(1e1 -2.5f)').getAffineTransform();
    expect([at.getTranslateX(), at.getTranslateY()]).toEqual([10, -2.5]);
  });
});

describe('getAttrOrStyle / getDoubleAttr (SvgSaxParser.java:1156-1189, 1321-1335)', () => {
  it('prefers a non-empty style value over the attribute (:1156-1163)', () => {
    const attrs = attrsOf({ fill: '#aaa', style: 'fill:#bbb' });
    expect(getAttrOrStyle(attrs, 'fill', 'fill')).toBe('#bbb');
  });

  it('falls back to the attribute when style lacks the key or holds an empty value', () => {
    expect(getAttrOrStyle(attrsOf({ fill: '#aaa', style: 'stroke:#bbb' }), 'fill', 'fill')).toBe('#aaa');
    expect(getAttrOrStyle(attrsOf({ fill: '#aaa', style: 'fill: ' }), 'fill', 'fill')).toBe('#aaa');
    expect(getAttrOrStyle(attrsOf({ fill: '#aaa', style: '' }), 'fill', 'fill')).toBe('#aaa');
    expect(getAttrOrStyle(attrsOf({}), 'fill', 'fill')).toBeUndefined();
  });

  it('matches style names case-insensitively, trims, and skips malformed parts (:1164-1189)', () => {
    const attrs = attrsOf({ style: 'junk; :nope; FILL : #123 ;stroke:#456' });
    expect(getAttrOrStyle(attrs, 'fill', 'fill')).toBe('#123');
    expect(getAttrOrStyle(attrs, 'stroke', 'stroke')).toBe('#456');
  });

  it('keeps everything after the first colon of a style value', () => {
    expect(getAttrOrStyle(attrsOf({ style: 'fill:url(#g:1)' }), 'fill', 'fill')).toBe('url(#g:1)');
  });

  it('reads a double attribute, defaulting when absent, empty or invalid (:1321-1335)', () => {
    const attrs = attrsOf({ a: '2.5', b: '', c: 'x', d: ' 7 ', e: 'NaN', f: '1e2', g: '0x10' });
    expect(getDoubleAttr(attrs, 'a', 9)).toBe(2.5);
    expect(getDoubleAttr(attrs, 'b', 9)).toBe(9);
    expect(getDoubleAttr(attrs, 'c', 9)).toBe(9);
    expect(getDoubleAttr(attrs, 'missing', 9)).toBe(9);
    expect(getDoubleAttr(attrs, 'd', 9)).toBe(7);
    expect(getDoubleAttr(attrs, 'e', 9)).toBeNaN();
    expect(getDoubleAttr(attrs, 'f', 9)).toBe(100);
    expect(getDoubleAttr(attrs, 'g', 9)).toBe(9);
  });
});

describe('applyStyleAndTransform (SvgSaxParser.java:1094-1155)', () => {
  it('reads fill and stroke from style when no attributes are given (:1156-1189)', () => {
    const ugs = makeUgs();
    const out = applyStyleAndTransform(makeCtx(ugs), attrsOf({ style: 'fill:#f00;stroke:#00f' }), ugs);
    expect(colorOf(foreOf(out))).toBe('#00f');
    expect(backColorOf(backOf(out))).toBe('#f00');
  });

  it('lets a style value win over the attribute (:1156-1163)', () => {
    const ugs = makeUgs();
    const out = applyStyleAndTransform(makeCtx(ugs), attrsOf({ fill: '#111', style: 'fill:#222' }), ugs);
    expect(backColorOf(backOf(out))).toBe('#222');
  });

  it('applies a transform before colours (:1095-1098)', () => {
    const ugs = makeUgs();
    const out = applyStyleAndTransform(makeCtx(ugs), attrsOf({ transform: 'translate(3 4)', fill: '#f00' }), ugs);
    expect(out.getAffineTransform().getTranslateX()).toBe(3);
    expect(out.getAffineTransform().getTranslateY()).toBe(4);
  });

  it('applies stroke-width scaled by the initial scale (:1104-1107)', () => {
    const ugs = makeUgs(2);
    const out = applyStyleAndTransform(makeCtx(ugs), attrsOf({ 'stroke-width': '1.5' }), ugs);
    const stroke = applied(out).find((c) => c instanceof UStroke) as UStroke;
    expect(stroke.getThickness()).toBe(3);
  });

  it('takes stroke-width from style, and ignores an unparseable one (:1103-1111)', () => {
    const ugs = makeUgs();
    const fromStyle = applyStyleAndTransform(makeCtx(ugs), attrsOf({ style: 'stroke-width:4' }), ugs);
    expect((applied(fromStyle).find((c) => c instanceof UStroke) as UStroke).getThickness()).toBe(4);
    const bad = applyStyleAndTransform(makeCtx(ugs), attrsOf({ 'stroke-width': 'thick' }), ugs);
    expect(applied(bad).some((c) => c instanceof UStroke)).toBe(false);
  });

  it('with a stroke and no fill, fills with the default colour (:1113-1119)', () => {
    const ugs = makeUgs();
    const out = applyStyleAndTransform(makeCtx(ugs), attrsOf({ stroke: '#00f' }), ugs);
    expect(colorOf(foreOf(out))).toBe('#00f');
    expect(backColorOf(backOf(out))).toBe(BLACK_HEX);
  });

  it('with an empty stroke attribute behaves as no stroke (:1113)', () => {
    const ugs = makeUgs();
    const out = applyStyleAndTransform(makeCtx(ugs), attrsOf({ stroke: '', fill: '#0f0' }), ugs);
    expect(colorOf(foreOf(out))).toBe('#0f0');
  });

  it('fill without stroke also sets the foreground (:1141-1146)', () => {
    const ugs = makeUgs();
    const out = applyStyleAndTransform(makeCtx(ugs), attrsOf({ fill: '#0f0' }), ugs);
    expect(colorOf(foreOf(out))).toBe('#0f0');
    expect(backColorOf(backOf(out))).toBe('#0f0');
  });

  it('with stroke and fill leaves the foreground on the stroke (:1141-1146)', () => {
    const ugs = makeUgs();
    const out = applyStyleAndTransform(makeCtx(ugs), attrsOf({ fill: '#0f0', stroke: '#f00' }), ugs);
    expect(colorOf(foreOf(out))).toBe('#f00');
    expect(backColorOf(backOf(out))).toBe('#0f0');
  });

  it('fill="none" applies the transparent background via the resolver (:1121-1122)', () => {
    const ugs = makeUgs(1, realPaint);
    const out = applyStyleAndTransform(makeCtx(ugs), attrsOf({ fill: 'none', stroke: '#00f' }), ugs);
    expect(backColorOf(backOf(out))).toBe('#00000000');
  });

  it('only the exact lowercase "none" is the fill keyword (:1121)', () => {
    const ugs = makeUgs();
    const out = applyStyleAndTransform(makeCtx(ugs), attrsOf({ fill: 'None' }), ugs);
    expect(backColorOf(backOf(out))).toBe('None');
  });

  it('resolves currentColor and unknown names through the colour resolver (white fallback)', () => {
    const ugs = makeUgs(1, realPaint);
    const out = applyStyleAndTransform(makeCtx(ugs), attrsOf({ fill: 'currentColor' }), ugs);
    expect(backColorOf(backOf(out))).toBe(WHITE_HEX);
  });

  it('resolves fill="url(#id)" through the definitions to a gradient (:1123-1140)', () => {
    const defs = new Map([
      [
        'g',
        gradient('linearGradient', {}, [
          ['0', '#ff0000'],
          ['1', '#0000ff'],
        ]),
      ],
    ]);
    const ugs = makeUgs();
    const out = applyStyleAndTransform(makeCtx(ugs, defs), attrsOf({ fill: 'url(#g)' }), ugs);
    const fore = colorOf(foreOf(out));
    const back = backColorOf(backOf(out));
    expect(fore).toBeInstanceOf(HColorLinearGradient);
    expect(back).toBe(fore);
  });

  it('with a gradient fill and a stroke, keeps the stroke as foreground (:1133-1136)', () => {
    const defs = new Map([
      [
        'g',
        gradient('linearGradient', {}, [
          ['0', '#f00'],
          ['1', '#00f'],
        ]),
      ],
    ]);
    const ugs = makeUgs();
    const out = applyStyleAndTransform(makeCtx(ugs, defs), attrsOf({ fill: 'url(#g)', stroke: '#123' }), ugs);
    expect(colorOf(foreOf(out))).toBe('#123');
    expect(backColorOf(backOf(out))).toBeInstanceOf(HColorLinearGradient);
  });

  it('a radial gradient fill degrades to its first stop colour (:1049-1056)', () => {
    const defs = new Map([
      [
        'r',
        gradient('radialGradient', {}, [
          ['0', '#abc'],
          ['1', '#def'],
        ]),
      ],
    ]);
    const ugs = makeUgs();
    const out = applyStyleAndTransform(makeCtx(ugs, defs), attrsOf({ fill: 'url(#r)' }), ugs);
    expect(backColorOf(backOf(out))).toBe('#abc');
  });

  it('an unresolvable gradient reference applies no fill (:1147-1149)', () => {
    const ugs = makeUgs();
    const out = applyStyleAndTransform(makeCtx(ugs), attrsOf({ fill: 'url(#missing)' }), ugs);
    expect(applied(out)).toEqual(applied(ugs));
  });

  it('cuts the last character of the reference whatever it is (:1129 substring(5, length-1))', () => {
    const defs = new Map([['g', gradient('radialGradient', {}, [['0', '#abc']])]]);
    const ugs = makeUgs();
    const out = applyStyleAndTransform(makeCtx(ugs, defs), attrsOf({ fill: 'url(#g!' }), ugs);
    expect(backColorOf(backOf(out))).toBe('#abc');
  });

  it('throws where the Java substring(5, 4) throws StringIndexOutOfBounds (:1129)', () => {
    const ugs = makeUgs();
    expect(() => applyStyleAndTransform(makeCtx(ugs), attrsOf({ fill: 'url(#' }), ugs)).toThrow(/url\(#/);
  });
});

describe('extractGradientColor (SvgSaxParser.java:921-962)', () => {
  it('returns undefined for an unknown id (:922-925)', () => {
    expect(extractGradientColor(makeCtx(makeUgs()), 'nope')).toBeUndefined();
  });

  it('builds a two-stop linear gradient with defaults x1=0 y1=0 x2=1 y2=0, PAD, objectBoundingBox (:935-941)', () => {
    const defs = new Map([
      [
        'g',
        gradient('linearGradient', {}, [
          ['0', '#f00'],
          ['1', '#00f'],
        ]),
      ],
    ]);
    const g = extractGradientColor(makeCtx(makeUgs(), defs), 'g') as HColorLinearGradient;
    expect(g).toBeInstanceOf(HColorLinearGradient);
    expect([g.x1, g.y1, g.x2, g.y2]).toEqual([0, 0, 1, 0]);
    expect(g.userSpaceOnUse).toBe(false);
    expect(g.spreadMethod).toBe(SpreadMethod.PAD);
    expect(g.stops).toEqual([
      { offset: 0, color: '#f00', opacity: 1 },
      { offset: 1, color: '#00f', opacity: 1 },
    ]);
  });

  it('reads vector, units and spread from the element attributes, percentages as fractions (:930-941, :1079-1093)', () => {
    const defs = new Map([
      [
        'g',
        gradient(
          'linearGradient',
          { x1: '10%', y1: '20', x2: '0.5', y2: '100%', gradientUnits: 'userSpaceOnUse', spreadMethod: 'Reflect' },
          [
            ['0', '#f00'],
            ['1', '#00f'],
          ],
        ),
      ],
    ]);
    const g = extractGradientColor(makeCtx(makeUgs(), defs), 'g') as HColorLinearGradient;
    expect([g.x1, g.y1, g.x2, g.y2]).toEqual([0.1, 20, 0.5, 1]);
    expect(g.userSpaceOnUse).toBe(true);
    expect(g.spreadMethod).toBe(SpreadMethod.REFLECT);
  });

  it('falls back to the default for unparseable vector numbers and unknown spread values (:1019-1035, :1085-1092)', () => {
    const defs = new Map([
      [
        'g',
        gradient('linearGradient', { x1: 'a', x2: '', spreadMethod: 'weird' }, [
          ['0', '#f00'],
          ['1', '#00f'],
        ]),
      ],
    ]);
    const g = extractGradientColor(makeCtx(makeUgs(), defs), 'g') as HColorLinearGradient;
    expect([g.x1, g.x2]).toEqual([0, 1]);
    expect(g.spreadMethod).toBe(SpreadMethod.PAD);
  });

  it('maps spreadMethod repeat and an empty value (:1019-1035)', () => {
    const mk = (spread: string): HColorLinearGradient =>
      extractGradientColor(
        makeCtx(
          makeUgs(),
          new Map([
            [
              'g',
              gradient('linearGradient', { spreadMethod: spread }, [
                ['0', '#f00'],
                ['1', '#00f'],
              ]),
            ],
          ]),
        ),
        'g',
      ) as HColorLinearGradient;
    expect(mk('REPEAT').spreadMethod).toBe(SpreadMethod.REPEAT);
    expect(mk('').spreadMethod).toBe(SpreadMethod.PAD);
  });

  it('parses offsets (percent or number, clamped, invalid -> 0) and opacity (clamped, invalid -> 1) (:987-1018)', () => {
    const defs = new Map([
      [
        'g',
        gradient('linearGradient', {}, [
          ['25%', '#111', '0.5'],
          ['1.5', '#222', '7'],
          ['bad', '#333', 'x'],
          ['-3', '#444', '-1'],
          ['', '#555', ''],
          ['50%', '#666', undefined],
        ]),
      ],
    ]);
    const g = extractGradientColor(makeCtx(makeUgs(), defs), 'g') as HColorLinearGradient;
    // HColorLinearGradient.java:200-222 normalizeStops sorts by offset, then nudges ties by 1e-6.
    expect(g.stops.map((s) => [s.color, s.offset, s.opacity])).toEqual([
      ['#333', 0, 1],
      ['#444', 0.000001, 0],
      ['#555', 0.000002, 1],
      ['#111', 0.25, 0.5],
      ['#666', 0.5, 1],
      ['#222', 1, 1],
    ]);
  });

  it('skips stops whose colour is empty or "none" in any case (:977-986)', () => {
    const defs = new Map([
      [
        'g',
        gradient('linearGradient', {}, [
          ['0', 'NONE'],
          ['0.5', '#f00'],
          ['1', ''],
        ]),
      ],
    ]);
    // one stop survives -> fewer than two -> fallback to stops[0], whose colour is "none" -> null -> undefined
    expect(extractGradientColor(makeCtx(makeUgs(), defs), 'g')).toBeUndefined();
  });

  it('with fewer than two usable stops falls back to the first stop colour (:943-948)', () => {
    const defs = new Map([['g', gradient('linearGradient', {}, [['0', '#abc']])]]);
    expect(extractGradientColor(makeCtx(makeUgs(), defs), 'g')).toBe('#abc');
  });

  it('a linear gradient with no stops yields undefined (:943)', () => {
    const defs = new Map([['g', gradient('linearGradient', {}, [])]]);
    expect(extractGradientColor(makeCtx(makeUgs(), defs), 'g')).toBeUndefined();
  });

  it('a radial gradient yields its first stop colour, or undefined without one (:951-958)', () => {
    const defs = new Map([
      [
        'r',
        gradient('radialGradient', {}, [
          ['0', '#abc'],
          ['1', '#def'],
        ]),
      ],
      ['e', gradient('radialGradient', {}, [])],
      ['n', gradient('radialGradient', {}, [['0', 'none']])],
    ]);
    const ctx = makeCtx(makeUgs(), defs);
    expect(extractGradientColor(ctx, 'r')).toBe('#abc');
    expect(extractGradientColor(ctx, 'e')).toBeUndefined();
    expect(extractGradientColor(ctx, 'n')).toBeUndefined();
  });

  it('any other element tag resolves to undefined (:961)', () => {
    const defs = new Map([['s', gradient('symbol', {}, [])]]);
    expect(extractGradientColor(makeCtx(makeUgs(), defs), 's')).toBeUndefined();
  });

  it('resolves stop colours through the graphic, so currentColor reads the resolver (:977-986)', () => {
    const defs = new Map([
      [
        'g',
        gradient('linearGradient', {}, [
          ['0', 'currentColor'],
          ['1', '#000000'],
        ]),
      ],
    ]);
    const g = extractGradientColor(makeCtx(makeUgs(1, realPaint), defs), 'g') as HColorLinearGradient;
    expect(g.stops[0]?.color).toBe(WHITE_HEX);
  });

  it('is fed by pass-1 definitions end to end', async () => {
    const { DefsCollector } = await import('../../../../../../src/core/klimt/sprite/sax/sax-defs.js');
    const collector = new DefsCollector();
    parseSaxEvents(
      '<svg><defs><linearGradient id="g" x2="0" y2="1"><stop offset="0" stop-color="#f00" stop-opacity="0.4"/>' +
        '<stop offset="1" style="stop-color:#00f"/></linearGradient></defs></svg>',
      collector,
    );
    const g = extractGradientColor(
      makeCtx(makeUgs(), new Map(collector.getDefinitions())),
      'g',
    ) as HColorLinearGradient;
    expect([g.x2, g.y2]).toEqual([0, 1]);
    expect(g.stops).toEqual([
      { offset: 0, color: '#f00', opacity: 0.4 },
      { offset: 1, color: '#00f', opacity: 1 },
    ]);
  });
});

describe('HColorLinearGradient.normalizeStops ordering (HColorLinearGradient.java:200-225, Double.compare)', () => {
  it('sorts -0 before 0 and NaN last, keeping equal NaNs in input order', () => {
    const defs = new Map([
      [
        'g',
        gradient('linearGradient', {}, [
          ['0', '#a'],
          ['NaN', '#c'],
          ['-0', '#b'],
          ['NaN', '#e'],
          ['0.5', '#d'],
        ]),
      ],
    ]);
    const g = extractGradientColor(makeCtx(makeUgs(), defs), 'g') as HColorLinearGradient;
    expect(g.stops.map((s) => s.color)).toEqual(['#b', '#a', '#d', '#c', '#e']);
    expect(g.stops[3]?.offset).toBeNaN();
  });

  it('holds a tied offset at 1 once the nudge would pass it (:219-220)', () => {
    const defs = new Map([
      [
        'g',
        gradient('linearGradient', {}, [
          ['1', '#a'],
          ['1', '#b'],
          ['1', '#c'],
        ]),
      ],
    ]);
    const g = extractGradientColor(makeCtx(makeUgs(), defs), 'g') as HColorLinearGradient;
    expect(g.stops.map((s) => s.offset)).toEqual([1, 1, 1]);
  });
});

describe('HColorLinearGradient Paint bridge (port seam; Paint has no multi-stop gradient)', () => {
  const stopsOf = (): [string, string][] => [
    ['0', '#f00'],
    ['1', '#00f'],
  ];
  const policyFor = (attrs: Record<string, string>): string => {
    const defs = new Map([['g', gradient('linearGradient', attrs, stopsOf())]]);
    return (extractGradientColor(makeCtx(makeUgs(), defs), 'g') as HColorLinearGradient).policy;
  };

  it('exposes first and last stop colours as color1/color2', () => {
    const defs = new Map([
      [
        'g',
        gradient('linearGradient', {}, [
          ['0', '#f00'],
          ['0.5', '#0f0'],
          ['1', '#00f'],
        ]),
      ],
    ]);
    const g = extractGradientColor(makeCtx(makeUgs(), defs), 'g') as HColorLinearGradient;
    expect([g.color1, g.color2]).toEqual(['#f00', '#00f']);
  });

  it('takes the policy from determineGradientPolicy (:1036-1078): horizontal, vertical, both diagonals, default', () => {
    expect(policyFor({})).toBe('|'); // :1053-1055 |dy|<0.1 && |dx|>0.5
    expect(policyFor({ x2: '0', y2: '1' })).toBe('-'); // :1058-1060
    expect(policyFor({ x2: '1', y2: '1' })).toBe('/'); // :1063-1069, dx*dy > 0
    expect(policyFor({ x1: '1', x2: '0', y2: '1' })).toBe('\\'); // dx*dy < 0
    expect(policyFor({ x2: '0.2', y2: '0.2' })).toBe('|'); // :1072-1073 default
  });

  it('flattens a gradient-valued stop colour to its first colour', () => {
    const nested = {
      getDefaultColor: () => BLACK_HEX,
      getTrueColor: () => ({ color1: '#aaa', color2: '#bbb', policy: '|' as const }),
    };
    const defs = new Map([
      [
        'g',
        gradient('linearGradient', {}, [
          ['0', 'x'],
          ['1', 'y'],
        ]),
      ],
    ]);
    const g = extractGradientColor(makeCtx(makeUgs(1, nested), defs), 'g') as HColorLinearGradient;
    expect([g.color1, g.color2]).toEqual(['#aaa', '#aaa']);
  });
});

describe('parseFontSize (SvgSaxParser.java:1254-1284)', () => {
  it.each([
    ['12', 12],
    ['12px', 12],
    ['12PT', 12],
    ['12em', 12],
    ['12rem', 12],
    ['+8', 8],
    ['-3', -3],
  ])('parses %s as %i', (input, expected) => {
    expect(parseFontSize(input, 99)).toBe(expected);
  });

  it.each([[' 12 px'], ['12.5'], ['12.5px'], ['abc'], ['12%'], ['12pxpx'], ['99999999999'], ['']])(
    'returns the default for %j (Integer.parseInt rejects it)',
    (input) => {
      expect(parseFontSize(input, 99)).toBe(99);
    },
  );

  it('returns the default for undefined', () => {
    expect(parseFontSize(undefined, 14)).toBe(14);
  });
});

describe('parseFontFace (SvgSaxParser.java:1285-1302, UFontFace.java:117-141)', () => {
  it('defaults to normal 400 upright', () => {
    expect(parseFontFace(undefined, undefined)).toEqual({ cssWeight: 400, italic: false });
    expect(parseFontFace('', '')).toEqual({ cssWeight: 400, italic: false });
  });

  it.each([
    ['normal', 400],
    ['bold', 700],
    [' BOLD ', 700],
    ['lighter', 300],
    ['bolder', 800],
    ['600', 600],
    ['650', 700],
    ['640', 600],
    ['50', 100],
    ['1000', 900],
    ['-20', 100],
  ])('maps font-weight %j to %i (UFontWeight.fromCssValue clamps and rounds to hundreds)', (input, weight) => {
    expect(parseFontFace(input, undefined).cssWeight).toBe(weight);
  });

  it('keeps normal weight for an unparseable font-weight', () => {
    expect(parseFontFace('heavy', undefined).cssWeight).toBe(400);
  });

  it('sets the italic axis for italic and oblique in any case, trimmed', () => {
    expect(parseFontFace(undefined, 'italic').italic).toBe(true);
    expect(parseFontFace(undefined, ' Oblique ').italic).toBe(true);
    expect(parseFontFace(undefined, 'normal').italic).toBe(false);
  });

  it('combines weight and style', () => {
    expect(parseFontFace('bold', 'italic')).toEqual({ cssWeight: 700, italic: true });
  });
});

describe('applyTextDecoration (SvgSaxParser.java:1303-1320, FontConfiguration.java:301-309)', () => {
  const base: FontConfiguration = { family: 'sans', size: 12, color: '#000', styles: new Set([FontStyle.BOLD]) };

  it('returns the same configuration for undefined, empty or "none" (any case)', () => {
    expect(applyTextDecoration(base, undefined)).toBe(base);
    expect(applyTextDecoration(base, '')).toBe(base);
    expect(applyTextDecoration(base, 'None')).toBe(base);
  });

  it('adds UNDERLINE and STRIKE, keeping existing styles and leaving the input untouched', () => {
    const out = applyTextDecoration(base, 'underline line-through');
    expect([...out.styles].sort()).toEqual([FontStyle.BOLD, FontStyle.STRIKE, FontStyle.UNDERLINE]);
    expect([...base.styles]).toEqual([FontStyle.BOLD]);
    expect(out.family).toBe('sans');
  });

  it('adds only the decoration named', () => {
    expect([...applyTextDecoration(base, 'underline').styles].sort()).toEqual([FontStyle.BOLD, FontStyle.UNDERLINE]);
    expect([...applyTextDecoration(base, 'line-through').styles].sort()).toEqual([FontStyle.BOLD, FontStyle.STRIKE]);
  });

  it('returns the same configuration when the keyword is unknown (:1308 contains is case-sensitive)', () => {
    expect([...applyTextDecoration(base, 'overline').styles]).toEqual([FontStyle.BOLD]);
    expect([...applyTextDecoration(base, 'UNDERLINE').styles]).toEqual([FontStyle.BOLD]);
  });
});
