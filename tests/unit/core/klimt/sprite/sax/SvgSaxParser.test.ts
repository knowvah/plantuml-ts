import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RenderContext } from '../../../../../../src/core/klimt/sprite/sax/sax-context.js';
import type { SaxAttributes } from '../../../../../../src/core/klimt/sprite/sax/sax-events.js';
import { URectangle } from '../../../../../../src/core/klimt/shape/URectangle.js';
import { FakeUGraphic } from './fake-ugraphic.js';

const mocks = vi.hoisted(() => ({
  rect: vi.fn(),
  text: vi.fn(),
  applyTransform: vi.fn(),
}));

vi.mock('../../../../../../src/core/klimt/sprite/sax/sax-shapes.js', () => ({
  handleRect: mocks.rect,
  handleCircle: vi.fn(),
  handleEllipse: vi.fn(),
  handleLine: vi.fn(),
  handlePolyline: vi.fn(),
  handlePolygon: vi.fn(),
  handlePath: vi.fn(),
}));
vi.mock('../../../../../../src/core/klimt/sprite/sax/sax-text-image-use.js', () => ({
  handleText: mocks.text,
  handleImage: vi.fn(),
  handleUse: vi.fn(),
}));
vi.mock('../../../../../../src/core/klimt/sprite/sax/sax-style.js', () => ({
  applyTransform: mocks.applyTransform,
}));

const { SvgSaxParser } = await import('../../../../../../src/core/klimt/sprite/sax/SvgSaxParser.js');

const SVG = '<svg width="10" height="20"><defs><rect id="d"/></defs><rect id="r"/></svg>';

beforeEach(() => {
  mocks.rect.mockReset();
  mocks.text.mockReset();
});

describe('SvgSaxParser (SvgSaxParser.java:101-185)', () => {
  it('reports the 0..255 gray range (:146-154)', () => {
    const parser = new SvgSaxParser(SVG);
    expect([parser.getMinGrayLevel(), parser.getMaxGrayLevel()]).toEqual([0, 255]);
  });

  it('drawU runs pass 2 over the document with the pass-1 definitions (:157-175)', () => {
    new SvgSaxParser(SVG).drawU(new FakeUGraphic(), 1, undefined, undefined);
    expect(mocks.rect).toHaveBeenCalledTimes(1);
    const [ctx, attrs] = mocks.rect.mock.calls[0] as [RenderContext, SaxAttributes];
    expect(attrs.get('id')).toBe('r');
    expect([...ctx.definitions.keys()]).toEqual(['d']);
  });

  it('drawU wraps a parse failure as "Failed to parse SVG" with the cause (:111-122)', () => {
    const parser = new SvgSaxParser('<svg><rect></svg>');
    let thrown: unknown;
    try {
      parser.drawU(new FakeUGraphic(), 1, undefined, undefined);
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe('Failed to parse SVG');
    expect((thrown as Error).cause).toBeInstanceOf(Error);
  });

  it('drawU wraps a handler failure and a non-Error throw alike', () => {
    mocks.rect.mockImplementationOnce(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- exercises the non-Error branch
      throw 'plain';
    });
    expect(() => new SvgSaxParser(SVG).drawU(new FakeUGraphic(), 1, undefined, undefined)).toThrow(
      'Failed to parse SVG',
    );
  });

  it('drawU refuses a DOCTYPE (:163)', () => {
    expect(() => new SvgSaxParser('<!DOCTYPE svg><svg/>').drawU(new FakeUGraphic(), 1, undefined, undefined)).toThrow(
      'Failed to parse SVG',
    );
  });

  it('hands the colour resolver the font colour as the default colour (:112)', () => {
    new SvgSaxParser(SVG).drawU(new FakeUGraphic(), 1, { r: 1, g: 2, b: 3, a: 255 }, undefined);
    const ctx = mocks.rect.mock.calls[0]?.[0] as RenderContext;
    expect(ctx.colorResolver.getDefaultColor()).toEqual({ r: 1, g: 2, b: 3, a: 255 });
    expect(ctx.ugs.getDefaultColor()).toBe('#010203');
    expect(ctx.ugs.getTrueColor('#FF0000')).toBe('#FF0000');
  });
});

describe('SvgSaxParser.asTextBlock (SvgSaxParser.java:124-144)', () => {
  it('measures the declared box times scale', () => {
    const block = new SvgSaxParser(SVG).asTextBlock(undefined, undefined, 2, undefined);
    const dim = block.calculateDimension(new FakeUGraphic().getStringBounder());
    expect([dim.getWidth(), dim.getHeight()]).toEqual([20, 40]);
  });

  it('draws only the sprite when there is no back colour', () => {
    const ug = new FakeUGraphic();
    new SvgSaxParser(SVG).asTextBlock(undefined, undefined, 1, undefined).drawU(ug);
    expect(ug.drawn).toEqual([]);
    expect(mocks.rect).toHaveBeenCalledTimes(1);
  });

  it('draws the backing rectangle first when a back colour is given', () => {
    const ug = new FakeUGraphic();
    new SvgSaxParser(SVG).asTextBlock(undefined, undefined, 2, '#ff0000').drawU(ug);
    expect(ug.drawn).toHaveLength(1);
    const rect = ug.drawn[0] as URectangle;
    expect(rect).toBeInstanceOf(URectangle);
    expect([rect.getWidth(), rect.getHeight()]).toEqual([20, 40]);
    expect(mocks.rect).toHaveBeenCalledTimes(1);
  });
});
