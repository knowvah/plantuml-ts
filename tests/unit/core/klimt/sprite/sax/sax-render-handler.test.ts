import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SaxAttributes } from '../../../../../../src/core/klimt/sprite/sax/sax-events.js';
import { parseSaxEvents } from '../../../../../../src/core/klimt/sprite/sax/sax-events.js';
import { DefsCollector } from '../../../../../../src/core/klimt/sprite/sax/sax-defs.js';
import type { RenderContext } from '../../../../../../src/core/klimt/sprite/sax/sax-context.js';
import { ColorResolver } from '../../../../../../src/core/klimt/sprite/ColorResolver.js';
import { UGraphicWithScale } from '../../../../../../src/core/klimt/UGraphicWithScale.js';
import { FakeUGraphic } from './fake-ugraphic.js';

const mocks = vi.hoisted(() => ({
  rect: vi.fn(),
  circle: vi.fn(),
  ellipse: vi.fn(),
  line: vi.fn(),
  polyline: vi.fn(),
  polygon: vi.fn(),
  path: vi.fn(),
  text: vi.fn(),
  image: vi.fn(),
  use: vi.fn(),
  applyTransform: vi.fn(),
}));

vi.mock('../../../../../../src/core/klimt/sprite/sax/sax-shapes.js', () => ({
  handleRect: mocks.rect,
  handleCircle: mocks.circle,
  handleEllipse: mocks.ellipse,
  handleLine: mocks.line,
  handlePolyline: mocks.polyline,
  handlePolygon: mocks.polygon,
  handlePath: mocks.path,
}));
vi.mock('../../../../../../src/core/klimt/sprite/sax/sax-text-image-use.js', () => ({
  handleText: mocks.text,
  handleImage: mocks.image,
  handleUse: mocks.use,
}));
vi.mock('../../../../../../src/core/klimt/sprite/sax/sax-style.js', () => ({
  applyTransform: mocks.applyTransform,
}));

const { GroupState, RenderHandler } = await import('../../../../../../src/core/klimt/sprite/sax/sax-render-handler.js');

const RANGE = { getMinGrayLevel: () => 0, getMaxGrayLevel: () => 255 };
const resolver = new ColorResolver(undefined, undefined, RANGE);
const paintResolver = { getDefaultColor: () => '#000000', getTrueColor: (c: string) => c };

function baseUgs(): UGraphicWithScale {
  return UGraphicWithScale.create(new FakeUGraphic(), paintResolver, 1);
}

function render(xml: string, ugs = baseUgs()): InstanceType<typeof RenderHandler> {
  const defs = new DefsCollector();
  parseSaxEvents(xml, defs);
  const handler = new RenderHandler(ugs, resolver, defs.getDefinitions());
  parseSaxEvents(xml, handler);
  return handler;
}

const attrOf = (attrs: SaxAttributes, name: string): string | undefined => attrs.get(name);

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
});

describe('RenderHandler dispatch (SvgSaxParser.java:374-436)', () => {
  it.each([
    ['rect', mocks.rect],
    ['circle', mocks.circle],
    ['ellipse', mocks.ellipse],
    ['line', mocks.line],
    ['polyline', mocks.polyline],
    ['polygon', mocks.polygon],
    ['path', mocks.path],
    ['image', mocks.image],
    ['use', mocks.use],
  ])('dispatches <%s> to its handler with the context and attributes', (tag, mock) => {
    const handler = render(`<svg><${tag} id="e1"/></svg>`);
    expect(mock).toHaveBeenCalledTimes(1);
    const [ctx, attrs] = mock.mock.calls[0] as [RenderContext, SaxAttributes];
    expect(ctx).toBe(handler);
    expect(attrOf(attrs, 'id')).toBe('e1');
  });

  it('calls no handler for the root, ignored tags or unknown tags (:376-377, :422-435)', () => {
    render(
      '<svg><title>t</title><desc/><metadata/><clipPath/><mask/><filter/><pattern/><marker/><style/><script/><foo/><symbol/></svg>',
    );
    for (const m of Object.values(mocks)) expect(m).not.toHaveBeenCalled();
  });

  it('skips every element inside <defs>, including nested <defs> (:366-372)', () => {
    render('<svg><defs><rect/><g transform="x"><circle/></g><defs><path/></defs><line/></defs><polygon/></svg>');
    expect(mocks.rect).not.toHaveBeenCalled();
    expect(mocks.circle).not.toHaveBeenCalled();
    expect(mocks.path).not.toHaveBeenCalled();
    expect(mocks.line).not.toHaveBeenCalled();
    expect(mocks.applyTransform).not.toHaveBeenCalled();
    expect(mocks.polygon).toHaveBeenCalledTimes(1);
  });

  it('renders elements after a </defs> that closed (:438-441)', () => {
    render('<svg><defs><rect/></defs><rect/></svg>');
    expect(mocks.rect).toHaveBeenCalledTimes(1);
  });

  it('renders the children of a <symbol> outside <defs>, as upstream does (:429 only breaks)', () => {
    render('<svg><symbol id="s"><rect/></symbol></svg>');
    expect(mocks.rect).toHaveBeenCalledTimes(1);
  });
});

describe('RenderHandler groups (SvgSaxParser.java:466-485)', () => {
  it('applies <g transform> to the first rect only; the stack pops at </g>', () => {
    const base = baseUgs();
    const translated = base.applyTranslate(5, 7);
    mocks.applyTransform.mockReturnValue(translated);
    const seen: UGraphicWithScale[] = [];
    mocks.rect.mockImplementation((ctx: RenderContext) => seen.push(ctx.ugs));

    const handler = render('<svg><g transform="translate(5,7)"><rect/></g><rect/></svg>', base);

    expect(mocks.applyTransform).toHaveBeenCalledWith(base, 'translate(5,7)');
    expect(seen).toHaveLength(2);
    expect(seen[0]).toBe(translated);
    expect(seen[1]).toBe(base);
    expect(handler.ugs).toBe(base);
  });

  it('restores through nested groups, one level per </g>', () => {
    const base = baseUgs();
    const outer = base.applyTranslate(1, 1);
    const inner = outer.applyTranslate(2, 2);
    mocks.applyTransform.mockImplementation((u: UGraphicWithScale, t: string) => (t === 'a' ? outer : inner));
    const seen: UGraphicWithScale[] = [];
    mocks.rect.mockImplementation((ctx: RenderContext) => seen.push(ctx.ugs));

    render('<svg><g transform="a"><g transform="b"><rect/></g><rect/></g><rect/></svg>', base);

    expect(seen).toEqual([inner, outer, base]);
  });

  it('does not transform a group with no or an empty transform, and still pops it', () => {
    const base = baseUgs();
    const seen: UGraphicWithScale[] = [];
    mocks.rect.mockImplementation((ctx: RenderContext) => seen.push(ctx.ugs));
    render('<svg><g><rect/></g><g transform=""><rect/></g></svg>', base);
    expect(mocks.applyTransform).not.toHaveBeenCalled();
    expect(seen).toEqual([base, base]);
  });

  it('GroupState reads id, class and transform (:1337-1347)', () => {
    let state: InstanceType<typeof GroupState> | undefined;
    parseSaxEvents('<g id="i" class="c" transform="t"/>', {
      startElement: (_q, attrs) => {
        state = new GroupState(attrs);
      },
    });
    expect([state?.id, state?.className, state?.transform]).toEqual(['i', 'c', 't']);
  });
});

describe('RenderHandler text buffering (SvgSaxParser.java:411-415, :444-455, :458-465)', () => {
  it('calls handleText(attrs, content) once at </text> with the buffered characters', () => {
    const handler = render('<svg><text x="3">a<tspan>b</tspan>c</text></svg>');
    expect(mocks.text).toHaveBeenCalledTimes(1);
    const [ctx, attrs, content] = mocks.text.mock.calls[0] as [RenderContext, SaxAttributes, string];
    expect(ctx).toBe(handler);
    expect(attrOf(attrs, 'x')).toBe('3');
    expect(content).toBe('abc');
  });

  it('starts each <text> with a fresh buffer and does not leak characters outside text', () => {
    render('<svg>ignored<text>one</text>between<text>two</text></svg>');
    expect(mocks.text.mock.calls.map((c) => String(c[2]))).toEqual(['one', 'two']);
  });

  it('does not buffer or dispatch text inside <defs>', () => {
    render('<svg><defs><text>hidden</text></defs></svg>');
    expect(mocks.text).not.toHaveBeenCalled();
  });
});

describe('RenderHandler.renderFragment (SvgSaxParser.java:898-912)', () => {
  it('renders a fragment through a new handler over the same definitions', () => {
    const base = baseUgs();
    const handler = render('<svg/>', base);
    const other = base.applyTranslate(9, 9);
    const seen: RenderContext[] = [];
    mocks.rect.mockImplementation((ctx: RenderContext) => seen.push(ctx));

    handler.renderFragment('<svg><rect/></svg>', other);

    expect(seen).toHaveLength(1);
    expect(seen[0]).not.toBe(handler);
    expect(seen[0]?.ugs).toBe(other);
    expect(seen[0]?.colorResolver).toBe(resolver);
    expect(seen[0]?.definitions).toBe(handler.definitions);
    expect(handler.ugs).toBe(base);
  });

  it('swallows a malformed fragment (:909-911)', () => {
    const handler = render('<svg/>');
    handler.renderFragment('<svg><rect></svg>', baseUgs());
    expect(mocks.rect).not.toHaveBeenCalled();
  });

  it('swallows an error thrown by a handler, including a non-Error throw', () => {
    const handler = render('<svg/>');
    mocks.rect.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    mocks.rect.mockImplementationOnce(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- exercises the non-Error throw
      throw 'plain';
    });
    handler.renderFragment('<svg><rect/></svg>', baseUgs());
    handler.renderFragment('<svg><rect/></svg>', baseUgs());
    expect(mocks.rect).toHaveBeenCalledTimes(2);
  });
});
