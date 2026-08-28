import { describe, it, expect } from 'vitest';
import type { FrameGeo } from '../../../src/diagrams/sequence/ast.js';
import { renderFrameBlotter } from '../../../src/diagrams/sequence/renderer-frame-blotter.js';

/**
 * `renderFrameBlotter` acceptance suite for T3 (`sequence-frame-background-
 * pass`). Nothing in the production renderer calls this function yet (T6
 * wires it) -- this file is that contract's only coverage.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/Blotter.java
 */

/** A minimal well-formed `FrameGeo`, including T1's required tab fields, so
 *  each test only overrides what it actually varies. */
function makeFrame(overrides: Partial<FrameGeo> = {}): FrameGeo {
  return {
    kind: 'frame',
    frameType: 'alt',
    label: '',
    x: 30,
    y: 100,
    width: 200,
    height: 90,
    branchSeparators: [],
    refBody: [],
    tabText: 'alt',
    tabTextWidth: 20,
    tabWidth: 40,
    tabHeight: 20,
    ...overrides,
  };
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
    expect(renderFrameBlotter(frame, 0)).toBe('');
  });

  it('paints one full-frame rect, fill and stroke both set from backColorGeneral', () => {
    const frame = makeFrame({ backColorGeneral: '#ffa' });
    const svg = renderFrameBlotter(frame, 0);
    expect(rectCount(svg)).toBe(1);
    expect(svg).toContain('fill="#FFA"');
    expect(svg).toContain('stroke="#FFA"');
    expect(svg).toContain('x="30"');
    expect(svg).toContain('y="100"');
    expect(svg).toContain('width="200"');
    expect(svg).toContain('height="90"');
  });

  it('splits into three bands at each else separator y + 1', () => {
    const frame = makeFrame({
      backColorGeneral: '#0000ff',
      branchSeparators: [
        { y: 130, label: 'x', backColorGeneral: '#ff0000' },
        { y: 160, label: 'y', backColorGeneral: '#00ff00' },
      ],
    });
    const svg = renderFrameBlotter(frame, 0);
    expect(rectCount(svg)).toBe(3);
    // Boundaries: (130 - 100 + 1) = 31, (160 - 100 + 1) = 61. Each band is
    // painted in the colour that was in force BEFORE its own change point:
    // the span before the first separator is the frame's own default.
    expect(svg).toContain('y="100" width="200" height="31" fill="#00F"'); // 0..31, default
    expect(svg).toContain('y="131" width="200" height="30" fill="#F00"'); // 31..61, red
    expect(svg).toContain('y="161" width="200" height="29" fill="#0F0"'); // 61..90, green
  });

  it('an else with no colour of its own inherits the group colour', () => {
    const inherited = makeFrame({
      backColorGeneral: '#123456',
      branchSeparators: [{ y: 130, label: 'x' }],
    });
    const svg = renderFrameBlotter(inherited, 0);
    // If the else had NOT inherited (i.e. fell back to transparent instead
    // of the group colour), the single visible band would stop at the
    // separator (height 31) and the rest of the frame would be blank.
    expect(rectCount(svg)).toBe(1);
    expect(svg).toContain('height="90"');
    expect(svg).toContain('fill="#123456"');
  });

  it('skips the band before the first colour change when the default is transparent', () => {
    const frame = makeFrame({
      branchSeparators: [{ y: 130, label: 'x', backColorGeneral: '#ff0000' }],
    });
    const svg = renderFrameBlotter(frame, 0);
    // Only the second band (from the separator to the frame end) is
    // visible; the first (default/transparent) span draws nothing.
    expect(rectCount(svg)).toBe(1);
    expect(svg).toContain('y="131" width="200" height="59" fill="#F00"');
  });

  it('de-duplicates two adjacent elses that carry the same colour', () => {
    const frame = makeFrame({
      backColorGeneral: '#111111',
      branchSeparators: [
        { y: 130, label: 'x', backColorGeneral: '#222222' },
        { y: 160, label: 'y', backColorGeneral: '#222222' },
      ],
    });
    const svg = renderFrameBlotter(frame, 0);
    // Only ONE boundary (at 31), not two: the second separator's colour
    // change was suppressed because it repeats the immediately-prior one.
    expect(rectCount(svg)).toBe(2);
    expect(svg).toContain('y="100" width="200" height="31" fill="#111"');
    expect(svg).toContain('y="131" width="200" height="59" fill="#222"');
  });

  it('round corner with exactly one band emits a single rounded rect', () => {
    const frame = makeFrame({ backColorGeneral: '#ffa' });
    const svg = renderFrameBlotter(frame, 20);
    expect(rectCount(svg)).toBe(1);
    expect(pathCount(svg)).toBe(0);
    expect(svg).toContain('rx="10"');
    expect(svg).toContain('ry="10"');
  });

  it('round corner with multiple bands arcs the first and last, leaves middles plain', () => {
    const frame = makeFrame({
      backColorGeneral: '#0000ff',
      branchSeparators: [
        { y: 130, label: 'x', backColorGeneral: '#ff0000' },
        { y: 160, label: 'y', backColorGeneral: '#00ff00' },
      ],
    });
    const svg = renderFrameBlotter(frame, 20);
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
});
