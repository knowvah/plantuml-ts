/**
 * `activity-text-style.ts#activityFontFamily` (add2 T3e, family K).
 * @see net/sourceforge/plantuml/style/FromSkinparamToStyle.java:144
 * @see net/sourceforge/plantuml/style/StyleSignatureBasic.java:271-273
 */
import { describe, it, expect } from 'vitest';
import { resolveTheme } from '../../../src/core/theme.js';
import type { Theme } from '../../../src/core/theme.js';
import {
  activityFontColor,
  activityFontFamily,
  linkStyleFields,
} from '../../../src/diagrams/activity/activity-text-style.js';

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

  it('add2 T3h: diamond inherits the activity bucket when it has no own FontName (dozaxu-98-xetu961)', () => {
    const activityOnly: Theme = {
      ...theme,
      colors: { ...theme.colors, elements: { ...theme.colors.elements, activity: { fontFamily: 'Verdana' } } },
    };
    expect(activityFontFamily(activityOnly, 'diamond')).toBe('Verdana');
  });

  it('add2 T3h: a non-diamond sname never falls through to the activity bucket', () => {
    const activityOnly: Theme = {
      ...theme,
      colors: { ...theme.colors, elements: { ...theme.colors.elements, activity: { fontFamily: 'Verdana' } } },
    };
    expect(activityFontFamily(activityOnly, 'note')).toBe(theme.fontFamily);
  });
});

// add4-T2d (KLIMT-FLOOR, zepima-96-peco612): `activityDiamond()` nests
// `SName.activity` (`StyleSignatureBasic.java:271-273`), so `skinparam
// activityFontColor` reaches the diamond label too.
describe('activityFontColor -- diamond inherits the activity bucket', () => {
  const RED = '#FF0000';
  const BLUE = '#0000FF';
  const withElements = (elements: NonNullable<Theme['colors']['elements']>): Theme => ({
    ...theme,
    colors: { ...theme.colors, elements: { ...theme.colors.elements, ...elements } },
  });

  it('diamond falls through to the activity bucket when it has no own FontColor', () => {
    expect(activityFontColor(withElements({ activity: { font: RED } }), 'diamond')).toBe(RED);
  });

  it("diamond's own bucket wins over the activity bucket", () => {
    expect(activityFontColor(withElements({ activity: { font: RED }, diamond: { font: BLUE } }), 'diamond')).toBe(BLUE);
  });

  it('a non-diamond sname never falls through to the activity bucket', () => {
    expect(activityFontColor(withElements({ activity: { font: RED } }), 'note')).toBe(activityFontColor(theme, 'note'));
  });
});

describe('linkStyleFields (add2 T3h, family F)', () => {
  it('omits both keys when the theme sets neither (exactOptionalPropertyTypes)', () => {
    expect(linkStyleFields(theme)).toEqual({});
  });

  it('includes only the fields the theme actually sets', () => {
    const withUnderline: Theme = { ...theme, hyperlinkUnderline: false };
    expect(linkStyleFields(withUnderline)).toEqual({ hyperlinkUnderline: false });
    const withTarget: Theme = { ...theme, svgLinkTarget: '_self' };
    expect(linkStyleFields(withTarget)).toEqual({ svgLinkTarget: '_self' });
  });
});
