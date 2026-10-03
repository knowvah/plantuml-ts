/**
 * `activity-text-style.ts#activityFontFamily` (add2 T3e, family K).
 * @see net/sourceforge/plantuml/style/FromSkinparamToStyle.java:144
 * @see net/sourceforge/plantuml/style/StyleSignatureBasic.java:271-273
 */
import { describe, it, expect } from 'vitest';
import { resolveTheme } from '../../../src/core/theme.js';
import type { Theme } from '../../../src/core/theme.js';
import { activityFontFamily } from '../../../src/diagrams/activity/activity-text-style.js';

const theme = resolveTheme('default');

describe('activityFontFamily', () => {
  it('falls back to theme.fontFamily when no bucket override is set', () => {
    expect(activityFontFamily(theme, 'activity')).toBe(theme.fontFamily);
  });

  it('reads the activity bucket override (skinparam activityFontName)', () => {
    const withFont: Theme = {
      ...theme,
      colors: { ...theme.colors, elements: { ...theme.colors.elements, activity: { fontFamily: 'Verdana' } } },
    };
    expect(activityFontFamily(withFont, 'activity')).toBe('Verdana');
  });

  it("reads the diamond bucket independently of the activity bucket (kafevi-44-tesu096's own precedent)", () => {
    const withBoth: Theme = {
      ...theme,
      colors: {
        ...theme.colors,
        elements: {
          ...theme.colors.elements,
          activity: { fontFamily: 'Verdana' },
          diamond: { fontFamily: 'Courier' },
        },
      },
    };
    expect(activityFontFamily(withBoth, 'activity')).toBe('Verdana');
    expect(activityFontFamily(withBoth, 'diamond')).toBe('Courier');
  });
});
