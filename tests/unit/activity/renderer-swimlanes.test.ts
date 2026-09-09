/**
 * Direct unit tests for `src/diagrams/activity/activity-renderer-swimlanes.ts`
 * (asr-T6). `renderer.test.ts` exercises this module indirectly through
 * `renderActivity`'s full pipeline; this file calls `renderSwimlaneChrome`
 * and `renderSwimlaneTitles` directly so the interleaving/bucketing logic
 * is pinned independent of the rest of the renderer.
 */
import { describe, it, expect } from 'vitest';
import {
  renderSwimlaneChrome,
  renderSwimlaneTitles,
} from '../../../src/diagrams/activity/activity-renderer-swimlanes.js';
import type { ActivityGeometry, ActivityNodeGeo } from '../../../src/diagrams/activity/activity-layout-types.js';
import { resolveTheme, deepMergeTheme, defaultTheme } from '../../../src/core/theme.js';

const theme = resolveTheme('default');

function node(overrides: Partial<ActivityNodeGeo> & Pick<ActivityNodeGeo, 'id' | 'swimlane'>): ActivityNodeGeo {
  return { kind: 'action', x: 0, y: 0, width: 20, height: 20, ...overrides };
}

function makeGeo(overrides: Partial<ActivityGeometry> = {}): ActivityGeometry {
  return {
    totalWidth: 300,
    totalHeight: 200,
    nodes: [],
    edges: [],
    swimlanes: [
      { name: 'A', x: 20, width: 100, contentX: 26, contentWidth: 88, titleWidth: 30 },
      { name: 'B', x: 120, width: 150, contentX: 126, contentWidth: 138, titleWidth: 25 },
    ],
    swimlaneBand: { x: 20, y: 17.5, width: 249, height: 18 },
    swimlaneDividerY: { y1: 17.5, y2: 182.5 },
    ...overrides,
  };
}

describe('renderSwimlaneChrome', () => {
  it('draws the band, then each lane’s own nodes interleaved with its divider, in lane order', () => {
    const a = node({ id: 'a', swimlane: 'A' });
    const b = node({ id: 'b', swimlane: 'B' });
    const geo = makeGeo({ nodes: [a, b] });
    const out = renderSwimlaneChrome(geo, theme);
    const bandIdx = out.indexOf('<rect');
    const firstLineIdx = out.indexOf('<line');
    const lastLineIdx = out.lastIndexOf('<line');
    expect(bandIdx).toBeGreaterThanOrEqual(0);
    expect(bandIdx).toBeLessThan(firstLineIdx);
    // Three dividers total for two lanes.
    const lineCount = (out.match(/<line /g) ?? []).length;
    expect(lineCount).toBe(3);
    expect(firstLineIdx).toBeLessThan(lastLineIdx);
  });

  it('emits exactly one divider per lane boundary, including both outer edges', () => {
    const geo = makeGeo();
    const out = renderSwimlaneChrome(geo, theme);
    // Divider x positions: lane A's own x (20), lane B's own x (120), and
    // the trailing right edge (120 + 150 = 270).
    expect(out).toContain('x1="20"');
    expect(out).toContain('x1="120"');
    expect(out).toContain('x1="270"');
  });

  it('resolves divider stroke/thickness from SwimlaneBorderColor/Thickness', () => {
    const customTheme = deepMergeTheme(defaultTheme, {
      colors: {
        ...defaultTheme.colors,
        graph: {
          ...defaultTheme.colors.graph,
          activity: { swimlaneBorder: 'blue', swimlaneBorderThickness: 5 },
        },
      },
    });
    const out = renderSwimlaneChrome(makeGeo(), customTheme);
    expect(out).toContain('stroke="#00F"');
    expect(out).toContain('stroke-width="5"');
  });

  it('a node with no matching lane is drawn before lane 0, without a divider of its own', () => {
    const stray = node({ id: 'stray', swimlane: 'not-a-lane' });
    const geo = makeGeo({ nodes: [stray] });
    const out = renderSwimlaneChrome(geo, theme);
    const bandIdx = out.indexOf('<rect');
    const firstLineIdx = out.indexOf('<line');
    const rectCount = (out.match(/<rect/g) ?? []).length;
    // The band rect plus the stray node's own action-box rect.
    expect(rectCount).toBe(2);
    expect(bandIdx).toBeLessThan(firstLineIdx);
  });

  it('emits only the band when swimlaneDividerY is absent', () => {
    const { swimlaneDividerY: _omit, ...geo } = makeGeo();
    const out = renderSwimlaneChrome(geo, theme);
    expect(out).toContain('<rect');
    expect(out).not.toContain('<line');
  });

  it('emits nothing when there is no band at all (single/zero-lane geometry)', () => {
    const { swimlaneBand: _b, swimlaneDividerY: _d, ...geo } = makeGeo();
    expect(renderSwimlaneChrome(geo, theme)).toBe('');
  });
});

describe('renderSwimlaneBand (via renderSwimlaneChrome)', () => {
  it('emits fill="none" by default (D3 — the transparent band is still drawn)', () => {
    const out = renderSwimlaneChrome(makeGeo(), theme);
    expect(out).toContain('fill="none"');
  });

  it('emits the resolved hex when SwimlaneTitleBackgroundColor is set', () => {
    const customTheme = deepMergeTheme(defaultTheme, {
      colors: {
        ...defaultTheme.colors,
        graph: {
          ...defaultTheme.colors.graph,
          activity: { swimlaneHeaderBackground: '#EEEEEE' },
        },
      },
    });
    const out = renderSwimlaneChrome(makeGeo(), customTheme);
    expect(out).toContain('fill="#EEE"');
  });
});

describe('renderSwimlaneTitles', () => {
  it('centres each title over its own lane content, left-aligned (no text-anchor)', () => {
    const out = renderSwimlaneTitles(makeGeo(), theme);
    expect(out).not.toContain('text-anchor');
    expect(out).not.toContain('font-weight');
    expect(out).toContain('>A<');
    expect(out).toContain('>B<');
  });

  it('draws at the resolved SwimlaneTitleFontSize, not the boxed-header default', () => {
    const customTheme = deepMergeTheme(defaultTheme, {
      colors: {
        ...defaultTheme.colors,
        graph: { ...defaultTheme.colors.graph, activity: { swimlaneTitleFontSize: 30 } },
      },
    });
    const out = renderSwimlaneTitles(makeGeo(), customTheme);
    expect(out).toContain('font-size="30"');
  });

  it('draws in the resolved SwimlaneTitleFontColor', () => {
    const customTheme = deepMergeTheme(defaultTheme, {
      colors: {
        ...defaultTheme.colors,
        graph: { ...defaultTheme.colors.graph, activity: { swimlaneTitleFontColor: 'red' } },
      },
    });
    const out = renderSwimlaneTitles(makeGeo(), customTheme);
    expect(out).toContain('fill="#F00"');
  });

  it('returns nothing when there is no band (single/zero-lane geometry)', () => {
    const { swimlaneBand: _omit, ...geo } = makeGeo();
    expect(renderSwimlaneTitles(geo, theme)).toBe('');
  });
});
