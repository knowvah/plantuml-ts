/**
 * T3d: `activityDiamondFontSize`/`-FontStyle`/`-FontColor`/`-FontName`
 * handlers (`skinparam-key-handlers-table-a.ts`) -- the `addConFont
 * ("activityDiamond", SName.diamond)` port (`FromSkinparamToStyle
 * .java:147,424-429`). Each writes into the SAME `theme.colors.elements
 * .diamond` bucket `activityFontSize` (`activity-style-defaults.ts`)
 * already reads, mirroring `activitydiamondbackgroundcolor`/
 * `-bordercolor`'s sibling entries (`skinparam-key-handlers-table-b.ts`)
 * but routed through the bucket rather than a dedicated accumulator field,
 * since the font-size resolver was already bucket-shaped.
 */
import { describe, it, expect } from 'vitest';
import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { activityFontSize } from '../../../src/diagrams/activity/activity-style-defaults.js';

describe('T3d: activityDiamondFontSize/-FontStyle/-FontColor/-FontName', () => {
  it('maps activitydiamondfontsize into the diamond bucket fontSize', () => {
    const { theme, unknown } = resolveSkinparam(new Map([['activitydiamondfontsize', '24']]), defaultTheme);
    expect(theme.colors.elements?.['diamond']?.fontSize).toBe(24);
    expect(unknown).toEqual([]);
  });

  it('ignores a non-numeric activitydiamondfontsize value (dedicated-table match, like arrowfontsize)', () => {
    const { theme, unknown } = resolveSkinparam(new Map([['activitydiamondfontsize', 'nope']]), defaultTheme);
    expect(theme.colors.elements?.['diamond']?.fontSize).toBeUndefined();
    // A KEY_HANDLER_MAP match is always "handled" (`applyNormalKey`), unlike
    // the generic bucket fallback -- same as the pre-existing `arrowfontsize`
    // entry's identical `if (v !== undefined)` guard.
    expect(unknown).toEqual([]);
  });

  it('maps activitydiamondfontstyle into the diamond bucket fontStyle flags', () => {
    const { theme } = resolveSkinparam(new Map([['activitydiamondfontstyle', 'bold']]), defaultTheme);
    expect(theme.colors.elements?.['diamond']?.fontStyle).toEqual({ bold: true, italic: false });
  });

  it('maps activitydiamondfontcolor into the diamond bucket font (Paint)', () => {
    const { theme } = resolveSkinparam(new Map([['activitydiamondfontcolor', 'green']]), defaultTheme);
    expect(theme.colors.elements?.['diamond']?.font).toBe('green');
  });

  it('maps activitydiamondfontname into the diamond bucket fontFamily', () => {
    const { theme } = resolveSkinparam(new Map([['activitydiamondfontname', 'Courier']]), defaultTheme);
    expect(theme.colors.elements?.['diamond']?.fontFamily).toBe('Courier');
  });

  it('activityFontSize(theme, "diamond") reads the bucket the handler just wrote (end-to-end, D2 cascade)', () => {
    const { theme } = resolveSkinparam(new Map([['activitydiamondfontsize', '24']]), defaultTheme);
    expect(activityFontSize(theme, 'diamond')).toBe(24);
  });
});
