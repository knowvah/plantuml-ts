import { describe, it, expect } from 'vitest';
import type { FrameGeo } from '../../../src/diagrams/sequence/ast.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { scaleSequenceTheme, type ScaledTheme } from '../../../src/diagrams/sequence/scale-geo.js';
import {
  renderGroupingHeaderBackground,
  renderGroupingHeaderForeground,
  frameHeaderCornerPath,
} from '../../../src/diagrams/sequence/renderer-frame-header.js';

const theme: ScaledTheme = scaleSequenceTheme(defaultTheme, 1);

function makeFrame(overrides: Partial<FrameGeo> = {}): FrameGeo {
  return {
    kind: 'frame',
    frameType: 'group',
    label: '',
    x: 10,
    y: 50,
    width: 200,
    height: 100,
    branchSeparators: [],
    refBody: [],
    tabText: 'foo',
    tabWidth: 90,
    tabHeight: 20,
    tabTextWidth: 60,
    ...overrides,
  };
}

/** Splits a concatenated markup string into its top-level elements (this
 *  module never nests elements, so a simple `<tag` split is exact). */
function topLevelTags(svg: string): string[] {
  return [...svg.matchAll(/<(path|rect|text)\b/g)].map((m) => m[1] as string);
}

describe('renderGroupingHeaderBackground', () => {
  it('emits exactly one <rect>, fill=none, stroke black 1.5', () => {
    const svg = renderGroupingHeaderBackground(makeFrame(), theme);
    expect(topLevelTags(svg)).toEqual(['rect']);
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('stroke="#000"');
    expect(svg).toContain('stroke-width="1.5"');
  });
});

describe('renderGroupingHeaderForeground', () => {
  it('group frame with no comment: path, rect, text(13, bold)', () => {
    const svg = renderGroupingHeaderForeground(makeFrame({ tabText: 'foo' }), theme);
    expect(topLevelTags(svg)).toEqual(['path', 'rect', 'text']);
    expect(svg).toContain('font-size="13"');
    expect(svg).toContain('font-weight="700"');
    expect(svg).toContain('>foo<');
  });

  it('corner path is filled #EEE and stroked black 1.5', () => {
    const svg = renderGroupingHeaderForeground(makeFrame(), theme);
    const pathEl = svg.slice(0, svg.indexOf('<rect'));
    expect(pathEl).toContain('fill="#EEE"');
    expect(pathEl).toContain('stroke="#000"');
    expect(pathEl).toContain('stroke-width="1.5"');
  });

  it('alt frame with a condition: path, rect, text, text(11, bracketed)', () => {
    const frame = makeFrame({ frameType: 'alt', tabText: 'alt', tabComment: 'successful' });
    const svg = renderGroupingHeaderForeground(frame, theme);
    expect(topLevelTags(svg)).toEqual(['path', 'rect', 'text', 'text']);
    expect(svg).toContain('font-size="11"');
    expect(svg).toContain('>[successful]<');
  });

  it('background rect and foreground rect share geometry (the double outline)', () => {
    const frame = makeFrame();
    const bg = renderGroupingHeaderBackground(frame, theme);
    const fg = renderGroupingHeaderForeground(frame, theme);
    const fgRect = fg.slice(fg.indexOf('<rect'));
    expect(fgRect.startsWith(bg)).toBe(true);
  });
});

describe('frameHeaderCornerPath', () => {
  it('roundCorner === 0 matches getCorner:163-171 exactly', () => {
    const d = frameHeaderCornerPath({ x: 0, y: 0 }, { width: 90, height: 20 }, 10, 0);
    expect(d).toBe('M0,0 L90,0 L90,10 L80,20 L0,20 L0,0');
  });

  it('roundCorner > 0 opens at (roundCorner/2, 0) and closes with an arc', () => {
    const d = frameHeaderCornerPath({ x: 0, y: 0 }, { width: 90, height: 20 }, 10, 8);
    expect(d).toBe('M4,0 L90,0 L90,10 L80,20 L0,20 L0,4 A4,4 0 0 1 4,0');
  });

  it('offsets every point by the given origin', () => {
    const d = frameHeaderCornerPath({ x: 10, y: 50 }, { width: 90, height: 20 }, 10, 0);
    expect(d).toBe('M10,50 L100,50 L100,60 L90,70 L10,70 L10,50');
  });
});
