import { describe, it, expect } from 'vitest';
import {
  defaultTheme,
  deepMergeTheme,
  resolveElementPaint,
  resolveElementFontSize,
  resolveElementShadowing,
} from '../../../src/core/theme.js';
import type { Theme, ElementColors } from '../../../src/core/theme.js';
import type { Paint } from '../../../src/core/paint.js';

/** Clone the default theme so per-test bucket mutations don't leak. */
function freshTheme(): Theme {
  return deepMergeTheme(defaultTheme, {});
}

describe('resolveElementPaint (T3 / D4)', () => {
  it('falls back to the root node fill for background, not the class color (AC1)', () => {
    // Make the class background distinct from the root node fill so the
    // non-aliasing is observable by value (both are #F1F1F1 by default post-D2).
    const theme = freshTheme();
    theme.colors.graph.classBackground = '#C0FFEE';
    const bg = resolveElementPaint(theme, 'database', 'background');
    // A database resolves to the root node fill, NOT the class-specific bg.
    expect(bg).toBe(theme.colors.nodeBackground);
    expect(bg).not.toBe(theme.colors.graph.classBackground);
  });

  it('returns an element-specific bucket value when set', () => {
    const theme = freshTheme();
    theme.colors.elements = {
      database: { background: '#123456', border: '#654321', font: '#abcdef' },
    };
    expect(resolveElementPaint(theme, 'database', 'background')).toBe('#123456');
    expect(resolveElementPaint(theme, 'database', 'border')).toBe('#654321');
    expect(resolveElementPaint(theme, 'database', 'font')).toBe('#abcdef');
  });

  it('carries a gradient Paint through the bucket unchanged', () => {
    const theme = freshTheme();
    const grad: Paint = { color1: '#c3d8f4', color2: '#6192d1', policy: '\\' };
    theme.colors.elements = { database: { background: grad } };
    expect(resolveElementPaint(theme, 'database', 'background')).toEqual(grad);
  });

  it('falls back to root defaults for border and font roles', () => {
    const theme = freshTheme();
    expect(resolveElementPaint(theme, 'component', 'border')).toBe(theme.colors.border);
    expect(resolveElementPaint(theme, 'component', 'font')).toBe(theme.colors.text);
  });

  it('falls through to the root default for an unrecognized sname without throwing (AC3)', () => {
    const theme = freshTheme();
    expect(() => resolveElementPaint(theme, 'totally-unknown', 'background')).not.toThrow();
    expect(resolveElementPaint(theme, 'totally-unknown', 'background')).toBe(
      theme.colors.nodeBackground,
    );
  });

  it('resolves only the role that is set, cascading the others', () => {
    const theme = freshTheme();
    theme.colors.elements = { node: { border: '#00ff00' } };
    expect(resolveElementPaint(theme, 'node', 'border')).toBe('#00ff00');
    // background is unset on the bucket → cascade to root default.
    expect(resolveElementPaint(theme, 'node', 'background')).toBe(theme.colors.nodeBackground);
  });
});

describe('Theme per-element buckets (D4)', () => {
  it('accepts a plain string as a valid Paint bucket value without a cast (AC2)', () => {
    const bucket: ElementColors = { background: '#FEFECE', border: '#181818' };
    expect(bucket.background).toBe('#FEFECE');
  });

  it('carries element buckets through deepMergeTheme', () => {
    const override = {
      colors: { elements: { database: { background: '#222222' } } },
    };
    const merged = deepMergeTheme(defaultTheme, override);
    expect(resolveElementPaint(merged, 'database', 'background')).toBe('#222222');
    // Base theme is not mutated.
    expect(defaultTheme.colors.elements).toBeUndefined();
  });

  // SI26 T1 (D1/D5): `cardinalityFontColor` rides `OPTIONAL_SCALAR_KEYS`
  // beside `cardinalityFontSize/Family`; `colors.graph.arrowFontColor` rides
  // the graph merge. Neither has a default in the theme literals -- absent
  // means "fall back", exactly like `arrowFontSize`.
  it('carries cardinalityFontColor and colors.graph.arrowFontColor through deepMergeTheme', () => {
    const merged = deepMergeTheme(defaultTheme, {
      cardinalityFontColor: '#FF0000',
      colors: { graph: { arrowFontColor: '#008000' } },
    });
    expect(merged.cardinalityFontColor).toBe('#FF0000');
    expect(merged.colors.graph.arrowFontColor).toBe('#008000');
    expect(defaultTheme.cardinalityFontColor).toBeUndefined();
    expect(defaultTheme.colors.graph.arrowFontColor).toBeUndefined();
    expect(deepMergeTheme(defaultTheme, {}).cardinalityFontColor).toBeUndefined();
  });
});

describe('resolveElementFontSize (G1 I4b)', () => {
  it('returns undefined when no bucket is set for the sname', () => {
    const theme = freshTheme();
    expect(resolveElementFontSize(theme, 'component', 'title')).toBeUndefined();
    expect(resolveElementFontSize(theme, 'component', 'stereotype')).toBeUndefined();
  });

  it('returns the plain fontSize override for the title role', () => {
    const theme = freshTheme();
    theme.colors.elements = { component: { fontSize: 18 } };
    expect(resolveElementFontSize(theme, 'component', 'title')).toBe(18);
  });

  it('falls back to fontSize for the stereotype role when no stereotypeFontSize is set (cukafa-49-fona812)', () => {
    const theme = freshTheme();
    theme.colors.elements = { component: { fontSize: 18 } };
    expect(resolveElementFontSize(theme, 'component', 'stereotype')).toBe(18);
  });

  it('prefers stereotypeFontSize over fontSize for the stereotype role (loroto-06-fano471)', () => {
    const theme = freshTheme();
    theme.colors.elements = { node: { fontSize: 12, stereotypeFontSize: 20 } };
    expect(resolveElementFontSize(theme, 'node', 'stereotype')).toBe(20);
    expect(resolveElementFontSize(theme, 'node', 'title')).toBe(12);
  });

  it('does not let a stereotypeFontSize override leak into the title role', () => {
    const theme = freshTheme();
    theme.colors.elements = { node: { stereotypeFontSize: 20 } };
    expect(resolveElementFontSize(theme, 'node', 'title')).toBeUndefined();
  });
});

// mission skin-file-loading (deferred D3 item): resolveElementShadowing.
describe('resolveElementShadowing', () => {
  it('returns 0 when neither the element bucket nor the diagram-wide value is set', () => {
    const theme = freshTheme();
    expect(resolveElementShadowing(theme, 'database')).toBe(0);
  });

  it('falls back to the diagram-wide theme.shadowing when no bucket override is set', () => {
    const theme = freshTheme();
    theme.shadowing = 4;
    expect(resolveElementShadowing(theme, 'database')).toBe(4);
  });

  it('prefers the element-specific bucket over the diagram-wide value', () => {
    const theme = freshTheme();
    theme.shadowing = 4;
    theme.colors.elements = { database: { shadowing: 3 } };
    expect(resolveElementShadowing(theme, 'database')).toBe(3);
    // A sibling element with no bucket override still cascades to global.
    expect(resolveElementShadowing(theme, 'actor')).toBe(4);
  });

  it('an element bucket value of 0 wins over a nonzero diagram-wide value (malado-53-noso561)', () => {
    // `skinparam actor { shadowing false }` alongside `skinparam
    // databaseShadowing true`, with no root-level Shadowing set at all.
    const theme = freshTheme();
    theme.colors.elements = { actor: { shadowing: 0 }, database: { shadowing: 3 } };
    expect(resolveElementShadowing(theme, 'actor')).toBe(0);
    expect(resolveElementShadowing(theme, 'database')).toBe(3);
    expect(resolveElementShadowing(theme, 'component')).toBe(0);
  });
});
