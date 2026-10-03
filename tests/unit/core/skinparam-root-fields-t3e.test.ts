/**
 * add2 T3e (batch 3, families F/G): `skinparam hyperlinkUnderline false`,
 * `skinparam svgLinkTarget <value>`, `skinparam preserveAspectRatio <value>`.
 * @see net/sourceforge/plantuml/skin/SkinParam.java:1056-1060 (useUnderlineForHyperlink)
 * @see net/sourceforge/plantuml/skin/SkinParam.java:1080-1082 (getSvgLinkTarget)
 * @see net/sourceforge/plantuml/skin/SkinParam.java:1085-1087 (getPreserveAspectRatio)
 */
import { describe, it, expect } from 'vitest';
import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { defaultTheme } from '../../../src/core/theme.js';

describe('resolveSkinparam — hyperlinkunderline', () => {
  it('an explicit "false" turns underline off', () => {
    const { theme, unknown } = resolveSkinparam(new Map([['hyperlinkunderline', 'false']]), defaultTheme);
    expect(theme.hyperlinkUnderline).toBe(false);
    expect(unknown).toEqual([]);
  });

  it('is case-insensitive (valueIs uses equalsIgnoreCase, java:347-349)', () => {
    const { theme } = resolveSkinparam(new Map([['hyperlinkunderline', 'False']]), defaultTheme);
    expect(theme.hyperlinkUnderline).toBe(false);
  });

  it('any other explicit value keeps underline on', () => {
    const { theme } = resolveSkinparam(new Map([['hyperlinkunderline', 'true']]), defaultTheme);
    expect(theme.hyperlinkUnderline).toBe(true);
  });

  it('absent key leaves hyperlinkUnderline unset on the base theme', () => {
    expect(defaultTheme.hyperlinkUnderline).toBeUndefined();
  });
});

describe('resolveSkinparam — svglinktarget', () => {
  it('stores the raw value verbatim (no validation upstream)', () => {
    const { theme, unknown } = resolveSkinparam(new Map([['svglinktarget', '_self']]), defaultTheme);
    expect(theme.svgLinkTarget).toBe('_self');
    expect(unknown).toEqual([]);
  });

  it('absent key leaves svgLinkTarget unset on the base theme', () => {
    expect(defaultTheme.svgLinkTarget).toBeUndefined();
  });
});

describe('resolveSkinparam — preserveaspectratio', () => {
  it('stores the raw value verbatim (no validation upstream)', () => {
    const { theme, unknown } = resolveSkinparam(new Map([['preserveaspectratio', 'xMinYMid slice']]), defaultTheme);
    expect(theme.preserveAspectRatio).toBe('xMinYMid slice');
    expect(unknown).toEqual([]);
  });

  it('absent key leaves preserveAspectRatio unset on the base theme', () => {
    expect(defaultTheme.preserveAspectRatio).toBeUndefined();
  });
});

describe('resolveSkinparam — activityfontname (family K)', () => {
  it('sets the activity element bucket fontFamily', () => {
    const { theme, unknown } = resolveSkinparam(new Map([['activityfontname', 'Verdana']]), defaultTheme);
    expect(theme.colors.elements?.['activity']?.fontFamily).toBe('Verdana');
    expect(unknown).toEqual([]);
  });

  it('does not disturb the sibling diamond bucket', () => {
    const { theme } = resolveSkinparam(
      new Map([
        ['activityfontname', 'Verdana'],
        ['activitydiamondfontname', 'Courier'],
      ]),
      defaultTheme,
    );
    expect(theme.colors.elements?.['activity']?.fontFamily).toBe('Verdana');
    expect(theme.colors.elements?.['diamond']?.fontFamily).toBe('Courier');
  });
});
