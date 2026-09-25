/**
 * Direct unit tests for `renderer-openiconic.ts` (G2 N41) -- tested in
 * isolation per `~/.claude/rules/testability.md` (pure function, preferred
 * over exercising it only indirectly through `renderClass`'s own full
 * pipeline). Expected `<path d>` byte-verified against jar-cached fixtures
 * in `openiconic-glyphs.test.ts` -- this file only checks the render
 * function's own wrapping/dispatch (position formula application, `fill`
 * attr, unknown-glyph fallback), not re-deriving glyph geometry.
 */
import { describe, it, expect } from 'vitest';
import {
  renderOpenIconicAtom,
  renderOpenIconicAtomAtTop,
  renderRowOpenIconicAtom,
} from '../../../src/diagrams/class/renderer-openiconic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { MemberRenderAtom } from '../../../src/diagrams/class/class-member-creole.js';

describe('renderOpenIconicAtom', () => {
  it('renders a <path> with the resolved fill color at the icon origin', () => {
    const theme = { ...defaultTheme, fontSize: 14 };
    const atom: Extract<MemberRenderAtom, { kind: 'vector' }> = {
      kind: 'vector',
      name: 'key',
      factor: 1,
      fill: '#123456',
      width: 10,
      height: 8,
    };
    const out = renderOpenIconicAtom(atom, 13, 45.8889, theme);
    expect(out.startsWith('<path d="')).toBe(true);
    expect(out).toContain('fill="#123456"');
    // originX = x + 1 (flat left margin); the glyph's own M point (5.5,0 for
    // 'key') scales by factor=1 and translates by (originX, originY) --
    // matches `openiconic-glyphs.test.ts`'s own byte-exact 'key' expectation
    // shifted by this call's specific origin.
    expect(out).toContain('M19.5,38');
  });

  it('returns an empty string for an unrecognized glyph name (defensive -- should not occur in practice)', () => {
    const theme = { ...defaultTheme, fontSize: 14 };
    // F1-c (S1L tail-fix G11) extended the OpenIconic glyph table to
    // upstream's full ~223-icon set, so 'pencil' -- this test's original
    // placeholder -- is now itself a real, resolvable glyph; a genuinely
    // fake name is required to keep this "unrecognized name" case honest.
    const atom: Extract<MemberRenderAtom, { kind: 'vector' }> = {
      kind: 'vector',
      name: 'not-a-real-icon',
      factor: 1,
      fill: '#000000',
      width: 10,
      height: 8,
    };
    expect(renderOpenIconicAtom(atom, 13, 45.8889, theme)).toBe('');
  });
});

describe('renderOpenIconicAtomAtTop (cdd3-T22)', () => {
  it('draws the glyph with its box top at the given Sea top (AtomOpenIconic.java:76-83)', () => {
    const atom: Extract<MemberRenderAtom, { kind: 'vector' }> = {
      kind: 'vector',
      name: 'key',
      factor: 1,
      fill: '#123456',
      width: 10,
      height: 8,
    };
    // 'key' M point is (5.5, 0); originX = x + 1 (withMargin(…, 1, 0)).
    expect(renderOpenIconicAtomAtTop(atom, 13, 30)).toContain('M19.5,30');
  });
});

describe('renderRowOpenIconicAtom (cdd3-T22)', () => {
  const theme = { ...defaultTheme, fontSize: 14 };
  const base: Extract<MemberRenderAtom, { kind: 'vector' }> = {
    kind: 'vector',
    name: 'key',
    factor: 1,
    fill: '#000000',
    width: 10,
    height: 8,
  };

  it('places the glyph at baseline + dy when resolveMemberAtoms set a Sea-top dy', () => {
    expect(renderRowOpenIconicAtom({ ...base, dy: -9.5 }, 13, 40, theme)).toContain('M19.5,30.5');
  });

  it('falls back to the legacy baseline-keyed origin without dy', () => {
    expect(renderRowOpenIconicAtom(base, 13, 45.8889, theme)).toBe(renderOpenIconicAtom(base, 13, 45.8889, theme));
  });
});
