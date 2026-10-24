import { describe, it, expect } from 'vitest';
import type { FrameGeo } from '../../../src/diagrams/sequence/ast.js';
import { drawFrameBlotter } from '../../../src/diagrams/sequence/renderer-frame-blotter.js';
import { attrsOf, tagsOf } from '../../helpers/svg-tags.js';
import { drawMarkup } from './draw-markup.js';
import { builderOf, DEFAULT_GROUP_PAINTS, groupPaintsOf } from './frame-paint-fixtures.js';

/**
 * `drawFrameBlotter` acceptance suite for T3 (`sequence-frame-background-
 * pass`). sdd1 T3a: the default band colour and the corner radius are the
 * body style's (`GroupingTile.java:308-316`), so a frame's colour now arrives
 * through its paint -- `GroupingStart#getUsedStyles` overrides the style's
 * `BackGroundColor` with the general colour (`GroupingStart.java:63-69`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/Blotter.java
 */

/** A minimal well-formed `FrameGeo`, including T1's required tab fields, so
 *  each test only overrides what it actually varies. */
function makeFrame(overrides: Partial<FrameGeo> = {}): FrameGeo {
  return {
    ...DEFAULT_GROUP_PAINTS,
    kind: 'frame',
    frameType: 'alt',
    label: '',
    x: 30,
    y: 100,
    width: 200,
    height: 90,
    branchSeparators: [],
    refBody: [],
    // A4 moved tab-text placement into layout; these suites assert box
    // geometry, never the tab's own text.
    tabRuns: [],
    tabText: 'alt',
    tabTextWidth: 20,
    tabWidth: 40,
    tabHeight: 20,
    ...overrides,
  };
}

/** A frame whose body paint carries the general colour `back`. */
function coloured(back: string, overrides: Partial<FrameGeo> = {}): FrameGeo {
  return makeFrame({ ...groupPaintsOf(undefined, { backColorGeneral: back }), backColorGeneral: back, ...overrides });
}

/** A frame under `sequenceDiagram { group { RoundCorner 20 } }`. */
function rounded(back: string, overrides: Partial<FrameGeo> = {}): FrameGeo {
  const builder = builderOf('<style>\nsequenceDiagram {\n group {\n RoundCorner 20\n }\n}\n</style>');
  return makeFrame({ ...groupPaintsOf(builder, { backColorGeneral: back }), backColorGeneral: back, ...overrides });
}

/** The blotter's markup for `frame`, drawn on the page's graphic. */
function blot(frame: FrameGeo): string {
  return drawMarkup((ug) => drawFrameBlotter(ug, frame));
}

/** The rects of a drawing: geometry and fill, style-insensitive. */
function rects(svg: string): Array<Record<string, string>> {
  return tagsOf(svg, 'rect').map((t) => ({ ...t }));
}

function paths(svg: string): Array<Record<string, string>> {
  return tagsOf(svg, 'path').map((t) => ({ ...t }));
}

/** A band's `x y width height fill`. */
function band(y: number, height: number, fill: string): Record<string, string> {
  return { x: '30', y: String(y), width: '200', height: String(height), fill };
}

describe('drawFrameBlotter', () => {
  it('draws nothing when the frame carries no colour anywhere', () => {
    expect(blot(makeFrame())).toBe('');
  });

  it('paints one full-frame rect, fill and stroke both set from backColorGeneral', () => {
    const [only, ...rest] = rects(blot(coloured('#ffa')));
    expect(rest).toEqual([]);
    // The `ug`'s own `UStroke.simple()` (`UStroke.java:75-77`).
    expect(only).toMatchObject({ ...band(100, 90, '#FFA'), stroke: '#FFA', 'stroke-width': '1' });
  });

  it('splits into three bands at each else separator y + 1', () => {
    const frame = coloured('#0000ff', {
      branchSeparators: [
        { y: 130, label: 'x', backColorGeneral: '#ff0000' },
        { y: 160, label: 'y', backColorGeneral: '#00ff00' },
      ],
    });
    // Boundaries: (130 - 100 + 1) = 31, (160 - 100 + 1) = 61. Each band is
    // painted in the colour that was in force BEFORE its own change point:
    // the span before the first separator is the frame's own default.
    expect(rects(blot(frame)).map(({ y, height, fill }) => ({ y, height, fill }))).toEqual([
      { y: '100', height: '31', fill: '#00F' }, // 0..31, default
      { y: '131', height: '30', fill: '#F00' }, // 31..61, red
      { y: '161', height: '29', fill: '#0F0' }, // 61..90, green
    ]);
  });

  it('an else with no colour of its own inherits the group colour', () => {
    const inherited = coloured('#123456', { branchSeparators: [{ y: 130, label: 'x' }] });
    // If the else had NOT inherited (i.e. fell back to transparent instead
    // of the group colour), the single visible band would stop at the
    // separator (height 31) and the rest of the frame would be blank.
    expect(rects(blot(inherited)).map(({ height, fill }) => ({ height, fill }))).toEqual([
      { height: '90', fill: '#123456' },
    ]);
  });

  it('skips the band before the first colour change when the default is transparent', () => {
    const frame = makeFrame({ branchSeparators: [{ y: 130, label: 'x', backColorGeneral: '#ff0000' }] });
    // Only the second band (from the separator to the frame end) is
    // visible; the first (default/transparent) span draws nothing.
    expect(rects(blot(frame)).map(({ y, height, fill }) => ({ y, height, fill }))).toEqual([
      { y: '131', height: '59', fill: '#F00' },
    ]);
  });

  it('de-duplicates two adjacent elses that carry the same colour', () => {
    const frame = coloured('#111111', {
      branchSeparators: [
        { y: 130, label: 'x', backColorGeneral: '#222222' },
        { y: 160, label: 'y', backColorGeneral: '#222222' },
      ],
    });
    // Only ONE boundary (at 31), not two: the second separator's colour
    // change was suppressed because it repeats the immediately-prior one.
    expect(rects(blot(frame)).map(({ y, height, fill }) => ({ y, height, fill }))).toEqual([
      { y: '100', height: '31', fill: '#111' },
      { y: '131', height: '59', fill: '#222' },
    ]);
  });

  it('round corner with exactly one band emits a single rounded rect', () => {
    const svg = blot(rounded('#ffa'));
    expect(paths(svg)).toEqual([]);
    expect(rects(svg)).toHaveLength(1);
    expect(rects(svg)[0]).toMatchObject({ rx: '10', ry: '10' });
  });

  it('round corner with multiple bands arcs the first and last, leaves middles plain', () => {
    const frame = rounded('#0000ff', {
      branchSeparators: [
        { y: 130, label: 'x', backColorGeneral: '#ff0000' },
        { y: 160, label: 'y', backColorGeneral: '#00ff00' },
      ],
    });
    const svg = blot(frame);
    // First (top) and last (bottom) bands are drawn as arced <path>s, each
    // in the colour that was in force before ITS OWN change point; the one
    // middle band stays a plain <rect> (no rx/ry), painted in the first
    // separator's colour.
    const [middle, ...otherRects] = rects(svg);
    expect(otherRects).toEqual([]);
    expect(middle).toMatchObject({ width: '200', height: '30', fill: '#F00' });
    expect(middle).not.toHaveProperty('rx');
    const arcs = paths(svg);
    expect(arcs.map((a) => a.fill)).toEqual(['#00F', '#0F0']); // top arc: default; bottom arc: 2nd else
    for (const a of arcs) expect(a.d).toContain('A10,10 0 0 1');
  });

  it('takes the band colour from the body style when no COLORS was written', () => {
    // `sequenceDiagram { group { BackGroundColor blue } }` reaches the
    // Blotter through `style.value(BackGroundColor)` (`GroupingTile.java:309-310`).
    const builder = builderOf('<style>\nsequenceDiagram {\n group {\n BackGroundColor blue\n }\n}\n</style>');
    const svg = blot(makeFrame(groupPaintsOf(builder)));
    expect(attrsOf(svg)).toEqual({
      x: '30',
      y: '100',
      width: '200',
      height: '90',
      fill: '#00F',
      stroke: '#00F',
      'stroke-width': '1',
    });
  });

  it('the else-band boundary is (sep.y - frame.y) + 1', () => {
    // `blotter.addChange(ypos + 1, backElse)` (`GroupingTile.java:340`), sep.y - frame.y = 30.
    const frame = coloured('#0000ff', {
      branchSeparators: [{ y: 130, label: 'x', backColorGeneral: '#ff0000' }],
    });
    expect(rects(blot(frame)).map(({ y, height, fill }) => ({ y, height, fill }))).toEqual([
      { y: '100', height: '31', fill: '#00F' }, // 0..30+1
      { y: '131', height: '59', fill: '#F00' }, // 31..90
    ]);
  });

  it('draws the arc-path bands strokeless and unclosed, rect bands stroked', () => {
    // `ug.apply(current).apply(current.bg())` makes fore == back, so
    // `DriverPathSvg` sets stroke "" and width 0 (`DriverPathSvg.java:65-69`);
    // `SEG_CLOSE` emits nothing (`SvgGraphics.java:855-856`) so no `Z`.
    // Rects keep `UStroke.simple()` (`DriverRectangleSvg`).
    const frame = rounded('#0000ff', {
      branchSeparators: [
        { y: 130, label: 'x', backColorGeneral: '#ff0000' },
        { y: 160, label: 'y', backColorGeneral: '#00ff00' },
      ],
    });
    const svg = blot(frame);
    const arcs = paths(svg);
    expect(arcs).toHaveLength(2);
    for (const a of arcs) {
      expect(a).not.toHaveProperty('stroke');
      expect(a.d).not.toContain('Z');
    }
    expect(arcs[0]).toEqual({
      d: 'M40,100 L220,100 A10,10 0 0 1 230,110 L230,131 L30,131 L30,110 A10,10 0 0 1 40,100',
      fill: '#00F',
    });
    expect(rects(svg)[0]).toEqual({ ...band(131, 30, '#F00'), stroke: '#F00', 'stroke-width': '1' });
  });
});
