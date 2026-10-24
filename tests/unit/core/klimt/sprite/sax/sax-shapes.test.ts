import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UPath } from '../../../../../../src/core/klimt/shape/UPath.js';
import type { RenderContext } from '../../../../../../src/core/klimt/sprite/sax/sax-context.js';
import type { SaxAttributes } from '../../../../../../src/core/klimt/sprite/sax/sax-events.js';
import { UGraphicWithScale } from '../../../../../../src/core/klimt/UGraphicWithScale.js';
import { FakeUGraphic } from './fake-ugraphic.js';

const styleMocks = vi.hoisted(() => ({
  applyStyleAndTransform: vi.fn(),
  // SvgSaxParser.java:1321-1335 getDoubleAttr, as the real T4e helper behaves.
  getDoubleAttr: vi.fn((attrs: { get(n: string): string | undefined }, name: string, def: number): number => {
    const value = attrs.get(name);
    if (value === undefined || value === '') return def;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? def : parsed;
  }),
}));

vi.mock('../../../../../../src/core/klimt/sprite/sax/sax-style.js', () => styleMocks);

const { handleRect, handleCircle, handleEllipse, handleLine, handlePolyline, handlePolygon, handlePath } =
  await import('../../../../../../src/core/klimt/sprite/sax/sax-shapes.js');

const resolver = { getDefaultColor: () => '#000000', getTrueColor: (c: string) => c };

function attrsOf(record: Record<string, string>): SaxAttributes {
  const names = Object.keys(record);
  return {
    length: names.length,
    qName: (i) => names[i]!,
    value: (i) => record[names[i]!]!,
    get: (name) => record[name],
  };
}

interface Rig {
  ctx: RenderContext;
  drawn: UPath[];
  base: UGraphicWithScale;
}

function rig(prepare: (ugs: UGraphicWithScale) => UGraphicWithScale = (u) => u): Rig {
  const fake = new FakeUGraphic();
  const base = UGraphicWithScale.create(fake, resolver, 1);
  const element = prepare(base);
  styleMocks.applyStyleAndTransform.mockImplementation(() => element);
  const ctx: RenderContext = {
    ugs: base,
    colorResolver: undefined as never,
    definitions: new Map(),
    renderFragment: () => undefined,
  };
  return { ctx, drawn: fake.drawn as UPath[], base };
}

function segmentsOf(path: UPath): [string, readonly number[]][] {
  return Array.from(path, (s) => [s.segmentType, s.coord]);
}

const scaled2 = (u: UGraphicWithScale): UGraphicWithScale => u.applyScale(2, 2).applyTranslate(1, 1);

beforeEach(() => {
  styleMocks.applyStyleAndTransform.mockReset();
});

describe('handleRect (SvgSaxParser.java:487-504)', () => {
  it('draws one closed UPath of moveTo + 4 lineTo, ignoring rx (no URectangle upstream)', () => {
    const { ctx, drawn, base } = rig();
    const attrs = attrsOf({ x: '1', y: '2', width: '3', height: '4', rx: '1' });
    handleRect(ctx, attrs);
    expect(styleMocks.applyStyleAndTransform).toHaveBeenCalledWith(ctx, attrs, base);
    expect(drawn).toHaveLength(1);
    expect(segmentsOf(drawn[0]!)).toEqual([
      ['SEG_MOVETO', [1, 2]],
      ['SEG_LINETO', [4, 2]],
      ['SEG_LINETO', [4, 6]],
      ['SEG_LINETO', [1, 6]],
      ['SEG_LINETO', [1, 2]],
    ]);
  });

  it('defaults every missing attribute to 0 (:490-493 via getDoubleAttr default 0)', () => {
    const { ctx, drawn } = rig();
    handleRect(ctx, attrsOf({}));
    expect(segmentsOf(drawn[0]!)).toEqual([
      ['SEG_MOVETO', [0, 0]],
      ['SEG_LINETO', [0, 0]],
      ['SEG_LINETO', [0, 0]],
      ['SEG_LINETO', [0, 0]],
      ['SEG_LINETO', [0, 0]],
    ]);
  });

  it('runs the path through affine(at, angle, scale) of the style-applied graphic (:501)', () => {
    const { ctx, drawn } = rig(scaled2);
    handleRect(ctx, attrsOf({ x: '1', y: '2', width: '3', height: '4' }));
    // at = scale 2 then translate (1,1): (x, y) -> (2x + 2, 2y + 2)
    expect(segmentsOf(drawn[0]!)).toEqual([
      ['SEG_MOVETO', [4, 6]],
      ['SEG_LINETO', [10, 6]],
      ['SEG_LINETO', [10, 14]],
      ['SEG_LINETO', [4, 14]],
      ['SEG_LINETO', [4, 6]],
    ]);
  });

  it('never reassigns ctx.ugs', () => {
    const { ctx, base } = rig(scaled2);
    handleRect(ctx, attrsOf({}));
    expect(ctx.ugs).toBe(base);
  });
});

describe('handleCircle / handleEllipse (SvgSaxParser.java:506-529, buildEllipsePath :606-617)', () => {
  it('circle cx=5 cy=5 r=3 equals buildEllipsePath(5,5,3,3): four arcs translated by (2,2)', () => {
    const { ctx, drawn } = rig();
    handleCircle(ctx, attrsOf({ cx: '5', cy: '5', r: '3' }));
    expect(drawn).toHaveLength(1);
    // moveTo(0,ry) (:608), arcs to (rx,0) (2*rx,ry) (rx,2*ry) (0,ry) (:610-613), lineTo(0,ry) (:614), translate(cx-rx, cy-ry) (:616)
    expect(segmentsOf(drawn[0]!)).toEqual([
      ['SEG_MOVETO', [2, 5]],
      ['SEG_ARCTO', [3, 3, 0, 0, 1, 5, 2]],
      ['SEG_ARCTO', [3, 3, 0, 0, 1, 8, 5]],
      ['SEG_ARCTO', [3, 3, 0, 0, 1, 5, 8]],
      ['SEG_ARCTO', [3, 3, 0, 0, 1, 2, 5]],
      ['SEG_LINETO', [2, 5]],
    ]);
  });

  it('ellipse uses rx and ry separately', () => {
    const { ctx, drawn } = rig();
    handleEllipse(ctx, attrsOf({ cx: '10', cy: '20', rx: '4', ry: '2' }));
    // translate(10 - 4, 20 - 2) = (6, 18)
    expect(segmentsOf(drawn[0]!)).toEqual([
      ['SEG_MOVETO', [6, 20]],
      ['SEG_ARCTO', [4, 2, 0, 0, 1, 10, 18]],
      ['SEG_ARCTO', [4, 2, 0, 0, 1, 14, 20]],
      ['SEG_ARCTO', [4, 2, 0, 0, 1, 10, 22]],
      ['SEG_ARCTO', [4, 2, 0, 0, 1, 6, 20]],
      ['SEG_LINETO', [6, 20]],
    ]);
  });

  it('affine scales the arc radii by the initial scale and maps the end points (UPath#affine)', () => {
    const { ctx, drawn } = rig(scaled2);
    handleCircle(ctx, attrsOf({ cx: '5', cy: '5', r: '3' }));
    expect(segmentsOf(drawn[0]!)).toEqual([
      ['SEG_MOVETO', [6, 12]],
      ['SEG_ARCTO', [6, 6, 0, 0, 1, 12, 6]],
      ['SEG_ARCTO', [6, 6, 0, 0, 1, 18, 12]],
      ['SEG_ARCTO', [6, 6, 0, 0, 1, 12, 18]],
      ['SEG_ARCTO', [6, 6, 0, 0, 1, 6, 12]],
      ['SEG_LINETO', [6, 12]],
    ]);
  });

  it('a circle with no attributes is a degenerate zero-radius path, still drawn', () => {
    const { ctx, drawn } = rig();
    handleCircle(ctx, attrsOf({}));
    expect(segmentsOf(drawn[0]!)[1]).toEqual(['SEG_ARCTO', [0, 0, 0, 0, 1, 0, 0]]);
  });
});

describe('handleLine (SvgSaxParser.java:531-545)', () => {
  it('draws moveTo(x1,y1) lineTo(x2,y2)', () => {
    const { ctx, drawn } = rig();
    handleLine(ctx, attrsOf({ x1: '1', y1: '2', x2: '3', y2: '4' }));
    expect(segmentsOf(drawn[0]!)).toEqual([
      ['SEG_MOVETO', [1, 2]],
      ['SEG_LINETO', [3, 4]],
    ]);
  });

  it('defaults to a zero-length line at the origin', () => {
    const { ctx, drawn } = rig();
    handleLine(ctx, attrsOf({}));
    expect(segmentsOf(drawn[0]!)).toEqual([
      ['SEG_MOVETO', [0, 0]],
      ['SEG_LINETO', [0, 0]],
    ]);
  });

  it('applies the transform of the style-applied graphic', () => {
    const { ctx, drawn } = rig(scaled2);
    handleLine(ctx, attrsOf({ x1: '1', y1: '2', x2: '3', y2: '4' }));
    expect(segmentsOf(drawn[0]!)).toEqual([
      ['SEG_MOVETO', [4, 6]],
      ['SEG_LINETO', [8, 10]],
    ]);
  });
});

describe('handlePolygon / handlePolyline (SvgSaxParser.java:547-605)', () => {
  it('polygon "0,0 4,0 4,4" is closed by a final lineTo(first), commented "polygon" (:582, :600-605)', () => {
    const { ctx, drawn } = rig();
    handlePolygon(ctx, attrsOf({ points: '0,0 4,0 4,4' }));
    expect(drawn[0]!.getComment()).toBe('polygon');
    expect(segmentsOf(drawn[0]!)).toEqual([
      ['SEG_MOVETO', [0, 0]],
      ['SEG_LINETO', [4, 0]],
      ['SEG_LINETO', [4, 4]],
      ['SEG_LINETO', [0, 0]],
    ]);
  });

  it('polyline with the same points stays open, commented "polyline"', () => {
    const { ctx, drawn } = rig();
    handlePolyline(ctx, attrsOf({ points: '0,0 4,0 4,4' }));
    expect(drawn[0]!.getComment()).toBe('polyline');
    expect(segmentsOf(drawn[0]!)).toEqual([
      ['SEG_MOVETO', [0, 0]],
      ['SEG_LINETO', [4, 0]],
      ['SEG_LINETO', [4, 4]],
    ]);
  });

  it('ignores an odd trailing number (i + 1 < size, :585)', () => {
    const { ctx, drawn } = rig();
    handlePolyline(ctx, attrsOf({ points: '0 0 4 0 7' }));
    expect(segmentsOf(drawn[0]!)).toEqual([
      ['SEG_MOVETO', [0, 0]],
      ['SEG_LINETO', [4, 0]],
    ]);
  });

  it('scans numbers with whitespace, commas, signs, decimals and exponents (P_POINTS_NUMBER :1187)', () => {
    const { ctx, drawn } = rig();
    handlePolyline(ctx, attrsOf({ points: '1-2,.5 +3.e1 -1.5E-1,2' }));
    expect(segmentsOf(drawn[0]!)).toEqual([
      ['SEG_MOVETO', [1, -2]],
      ['SEG_LINETO', [0.5, 30]],
      ['SEG_LINETO', [-0.15, 2]],
    ]);
  });

  it('a one-point polygon is moveTo + lineTo back to the same point', () => {
    const { ctx, drawn } = rig();
    handlePolygon(ctx, attrsOf({ points: '3 4' }));
    expect(segmentsOf(drawn[0]!)).toEqual([
      ['SEG_MOVETO', [3, 4]],
      ['SEG_LINETO', [3, 4]],
    ]);
  });

  it('a polygon with no complete pair draws an empty path with no closing lineTo (:602 first == false)', () => {
    const { ctx, drawn } = rig();
    handlePolygon(ctx, attrsOf({ points: '9' }));
    expect(drawn).toHaveLength(1);
    expect(drawn[0]!.size()).toBe(0);
  });

  it.each([[{}], [{ points: '' }]])(
    'draws nothing without points (%j, :561-563) but still applies the style',
    (rec) => {
      const { ctx, drawn } = rig();
      handlePolygon(ctx, attrsOf(rec));
      expect(drawn).toHaveLength(0);
      expect(styleMocks.applyStyleAndTransform).toHaveBeenCalledTimes(1);
    },
  );

  it('applies the transform of the style-applied graphic', () => {
    const { ctx, drawn } = rig(scaled2);
    handlePolygon(ctx, attrsOf({ points: '0,0 4,0' }));
    expect(segmentsOf(drawn[0]!)).toEqual([
      ['SEG_MOVETO', [2, 2]],
      ['SEG_LINETO', [10, 2]],
      ['SEG_LINETO', [2, 2]],
    ]);
  });
});

describe('handlePath (SvgSaxParser.java:618-626, SvgPath#drawMe :244-248)', () => {
  it('parses d through SvgPath and draws it', () => {
    const { ctx, drawn } = rig();
    handlePath(ctx, attrsOf({ d: 'M0,0 L4,0 L4,4' }));
    expect(segmentsOf(drawn[0]!)).toEqual([
      ['SEG_MOVETO', [0, 0]],
      ['SEG_LINETO', [4, 0]],
      ['SEG_LINETO', [4, 4]],
    ]);
  });

  it('bakes the accumulated affine transform in at parse time (drawMe(ug, at))', () => {
    const { ctx, drawn } = rig(scaled2);
    handlePath(ctx, attrsOf({ d: 'M0,0 L4,0' }));
    expect(segmentsOf(drawn[0]!)).toEqual([
      ['SEG_MOVETO', [2, 2]],
      ['SEG_LINETO', [10, 2]],
    ]);
  });

  it('draws nothing for a path of bare moves (isInvisible, SvgPath.java:246)', () => {
    const { ctx, drawn } = rig();
    handlePath(ctx, attrsOf({ d: 'M1,2' }));
    expect(drawn).toHaveLength(0);
  });

  it.each([[{}], [{ d: '' }]])('draws nothing without d (%j, :621)', (rec) => {
    const { ctx, drawn } = rig();
    handlePath(ctx, attrsOf(rec));
    expect(drawn).toHaveLength(0);
    expect(styleMocks.applyStyleAndTransform).toHaveBeenCalledTimes(1);
  });
});
