/**
 * codd-T7b T6-D part 1: the draw-side stereotype font carries the per-stereotype-NAME FontSize tier.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageDescription.java:155-157
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java:208-213
 */
import { describe, it, expect } from 'vitest';
import { stereotypeTextFont } from '../../../../src/core/decoration/symbol/usymbol-resolve.js';
import { defaultTheme, type Theme } from '../../../../src/core/theme.js';
import { FontStyle } from '../../../../src/core/klimt/shape/UText.js';

const ITALIC: ReadonlySet<FontStyle> = new Set([FontStyle.ITALIC]);
const STEREO_SIZE = 6;
const FLAT_SIZE = 9;
const THEME: Theme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    elements: {
      rectangle: { stereotypeFontSize: FLAT_SIZE, stereotypeFontSizeByStereo: { boundary: STEREO_SIZE } },
    },
  },
};

describe('stereotypeTextFont (T6-D)', () => {
  it('uses the per-stereotype-name size for a matching label', () => {
    expect(stereotypeTextFont(THEME, 'rectangle', ['boundary'], ITALIC).size).toBe(STEREO_SIZE);
  });

  it('falls back to the flat stereotype size for another label', () => {
    expect(stereotypeTextFont(THEME, 'rectangle', ['other'], ITALIC).size).toBe(FLAT_SIZE);
  });

  it('falls back to the diagram font size with nothing configured', () => {
    expect(stereotypeTextFont(defaultTheme, 'rectangle', ['boundary'], ITALIC).size).toBe(defaultTheme.fontSize);
  });

  it('carries the requested styles and the element font colour', () => {
    const font = stereotypeTextFont(THEME, 'rectangle', ['boundary'], ITALIC);
    expect(font.styles).toBe(ITALIC);
    expect(font.color).toBe('#000000');
  });
});
