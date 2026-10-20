import { describe, it, expect } from 'vitest';
import type { FrameGeo } from '../../../src/diagrams/sequence/ast.js';
import { renderFrameBlotter } from '../../../src/diagrams/sequence/renderer-frame-blotter.js';
import { builderOf, DEFAULT_GROUP_PAINTS, groupPaintsOf } from './frame-paint-fixtures.js';

/**
 * `renderFrameBlotter` acceptance suite for T3 (`sequence-frame-background-
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

function rectCount(svg: string): number {
  return (svg.match(/<rect/g) ?? []).length;
}

function pathCount(svg: string): number {
  return (svg.match(/<path/g) ?? []).length;
}

describe('renderFrameBlotter', () => {
  it('returns an empty string when the frame carries no colour anywhere', () => {
    const frame = makeFrame();
    expect(renderFrameBlotter(frame, 1)).toBe('');
  });

  it('paints one full-frame rect, fill and stroke both set from backColorGeneral', () => {
    const frame = coloured('#ffa');
    const svg = renderFrameBlotter(frame, 1);
    expect(rectCount(svg)).toBe(1);
    expect(svg).toContain('fill="#FFA"');
    expect(svg).toContain('stroke="#FFA"');
    // The `ug`'s own `UStroke.simple()` (`UStroke.java:75-77`).
    expect(svg).toContain('stroke-width="1"');
    expect(svg).toContain('x="30"');
    expect(svg).toContain('y="100"');
    expect(svg).toContain('width="200"');
    expect(svg).toContain('height="90"');
  });

  it('splits into three bands at each else separator y + 1', () => {
    const frame = coloured('#0000ff', {
      branchSeparators: [
        { y: 130, label: 'x', backColorGeneral: '#ff0000', runs: [] },
        { y: 160, label: 'y', backColorGeneral: '#00ff00', runs: [] },
      ],
    });
    const svg = renderFrameBlotter(frame, 1);
    expect(rectCount(svg)).toBe(3);
    // Boundaries: (130 - 100 + 1) = 31, (160 - 100 + 1) = 61. Each band is
    // painted in the colour that was in force BEFORE its own change point:
    // the span before the first separator is the frame's own default.
    expect(svg).toContain('y="100" width="200" height="31" fill="#00F"'); // 0..31, default
    expect(svg).toContain('y="131" width="200" height="30" fill="#F00"'); // 31..61, red
    expect(svg).toContain('y="161" width="200" height="29" fill="#0F0"'); // 61..90, green
  });

  it('an else with no colour of its own inherits the group colour', () => {
    const inherited = coloured('#123456', {
      branchSeparators: [{ y: 130, label: 'x', runs: [] }],
    });
    const svg = renderFrameBlotter(inherited, 1);
    // If the else had NOT inherited (i.e. fell back to transparent instead
    // of the group colour), the single visible band would stop at the
    // separator (height 31) and the rest of the frame would be blank.
    expect(rectCount(svg)).toBe(1);
    expect(svg).toContain('height="90"');
    expect(svg).toContain('fill="#123456"');
  });

  it('skips the band before the first colour change when the default is transparent', () => {
    const frame = makeFrame({
      branchSeparators: [{ y: 130, label: 'x', backColorGeneral: '#ff0000', runs: [] }],
    });
    const svg = renderFrameBlotter(frame, 1);
    // Only the second band (from the separator to the frame end) is
    // visible; the first (default/transparent) span draws nothing.
    expect(rectCount(svg)).toBe(1);
    expect(svg).toContain('y="131" width="200" height="59" fill="#F00"');
  });

  it('de-duplicates two adjacent elses that carry the same colour', () => {
    const frame = coloured('#111111', {
      branchSeparators: [
        { y: 130, label: 'x', backColorGeneral: '#222222', runs: [] },
        { y: 160, label: 'y', backColorGeneral: '#222222', runs: [] },
      ],
    });
    const svg = renderFrameBlotter(frame, 1);
    // Only ONE boundary (at 31), not two: the second separator's colour
    // change was suppressed because it repeats the immediately-prior one.
    expect(rectCount(svg)).toBe(2);
    expect(svg).toContain('y="100" width="200" height="31" fill="#111"');
    expect(svg).toContain('y="131" width="200" height="59" fill="#222"');
  });

  it('round corner with exactly one band emits a single rounded rect', () => {
    const frame = rounded('#ffa');
    const svg = renderFrameBlotter(frame, 1);
    expect(rectCount(svg)).toBe(1);
    expect(pathCount(svg)).toBe(0);
    expect(svg).toContain('rx="10"');
    expect(svg).toContain('ry="10"');
  });

  it('round corner with multiple bands arcs the first and last, leaves middles plain', () => {
    const frame = rounded('#0000ff', {
      branchSeparators: [
        { y: 130, label: 'x', backColorGeneral: '#ff0000', runs: [] },
        { y: 160, label: 'y', backColorGeneral: '#00ff00', runs: [] },
      ],
    });
    const svg = renderFrameBlotter(frame, 1);
    // First (top) and last (bottom) bands are drawn as arced <path>s, each
    // in the colour that was in force before ITS OWN change point; the one
    // middle band stays a plain <rect> (no rx/ry), painted in the first
    // separator's colour.
    expect(pathCount(svg)).toBe(2);
    expect(rectCount(svg)).toBe(1);
    expect(svg).not.toContain('rx=');
    expect(svg).toContain('width="200" height="30" fill="#F00"'); // middle rect
    const pathMatches = svg.match(/<path d="([^"]*)"[^/]*\/>/g) ?? [];
    expect(pathMatches).toHaveLength(2);
    expect(pathMatches[0]).toContain('fill="#00F"'); // top arc: frame default
    expect(pathMatches[1]).toContain('fill="#0F0"'); // bottom arc: 2nd else
    for (const m of pathMatches) {
      expect(m).toContain('A10,10 0 0 1');
    }
  });

  it('takes the band colour from the body style when no COLORS was written', () => {
    // `sequenceDiagram { group { BackGroundColor blue } }` reaches the
    // Blotter through `style.value(BackGroundColor)` (`GroupingTile.java:309-310`).
    const builder = builderOf('<style>\nsequenceDiagram {\n group {\n BackGroundColor blue\n }\n}\n</style>');
    const svg = renderFrameBlotter(makeFrame(groupPaintsOf(builder)), 1);
    expect(svg).toBe('<rect x="30" y="100" width="200" height="90" fill="#00F" stroke="#00F" stroke-width="1"/>');
  });

  it('scales the band stroke at emission', () => {
    expect(renderFrameBlotter(coloured('#ffa'), 2)).toContain('stroke-width="2"');
  });
});
