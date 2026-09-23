/**
 * `skinparam mode dark` end-to-end wiring (cdd-T33): accumulator field ->
 * key handler -> `buildThemePartial`'s dark-default gate -> Theme.
 *
 * `SkinParam.isDark` (`skin/SkinParam.java:114-116`) is a case-insensitive
 * equality check against the raw `mode` value -- mirrored by the
 * `skinparam-key-handlers-table-b.ts#mode` handler. The dark-default gate
 * itself lives in `skinparam-theme-builder.ts#buildThemePartial` (a
 * necessary write-set addition beyond the brief's literal list -- see
 * `.agent-notes/cdd-T33.md`): each field is seeded with `??=`, so it is
 * skipped whenever the SAME accumulator field was already populated by an
 * explicit skinparam key, regardless of source order -- mirroring
 * upstream's `HColorSimple#darkSchemeTheme` (a user color with no baked
 * `.dark` variant is untouched by `ColorMapper.DARK_MODE`).
 */
import { describe, it, expect } from 'vitest';
import { resolveSkinparam } from '../../src/core/skinparam.js';
import { defaultTheme } from '../../src/core/theme.js';
import { DARK_MODE_DEFAULTS } from '../../src/core/theme-dark.js';

describe('resolveSkinparam — skinparam mode dark', () => {
  it('is case-insensitive, mirroring SkinParam.isDark', () => {
    const { theme } = resolveSkinparam(new Map([['mode', 'DARK']]), defaultTheme);
    expect(theme.colors.background).toBe(DARK_MODE_DEFAULTS.background);
  });

  it('a value other than "dark" is a no-op (unknown, not applied)', () => {
    const { theme } = resolveSkinparam(new Map([['mode', 'light']]), defaultTheme);
    expect(theme.colors.background).toBe(defaultTheme.colors.background);
  });

  it('sets the root canvas background', () => {
    const { theme } = resolveSkinparam(new Map([['mode', 'dark']]), defaultTheme);
    expect(theme.colors.background).toBe('#1B1B1B');
  });

  it('sets the general border/stroke color (feeds the classifier box AND the badge ellipse)', () => {
    const { theme } = resolveSkinparam(new Map([['mode', 'dark']]), defaultTheme);
    expect(theme.colors.border).toBe('#E7E7E7');
  });

  it('sets the general text color', () => {
    const { theme } = resolveSkinparam(new Map([['mode', 'dark']]), defaultTheme);
    expect(theme.colors.text).toBe('#FFF');
  });

  it('sets the classifier fill default', () => {
    const { theme } = resolveSkinparam(new Map([['mode', 'dark']]), defaultTheme);
    expect(theme.colors.graph.classBackground).toBe('#313139');
  });

  it('sets the classifier header/member text-color cascade tiers', () => {
    const { theme } = resolveSkinparam(new Map([['mode', 'dark']]), defaultTheme);
    expect(theme.colors.graph.classCascadeHeaderFontColor).toBe('#FFF');
    expect(theme.colors.graph.classCascadeFontColor).toBe('#FFF');
  });

  it('sets the spotClass badge background AND glyph font color', () => {
    const { theme } = resolveSkinparam(new Map([['mode', 'dark']]), defaultTheme);
    expect(theme.colors.elements?.spotclass?.background).toBe('#2E5233');
    expect(theme.colors.elements?.spotclass?.font).toBe('#FFF');
  });

  it('an explicit skinparam classBackgroundColor wins over the dark default, source order BEFORE mode', () => {
    const { theme } = resolveSkinparam(
      new Map([
        ['classbackgroundcolor', '#123456'],
        ['mode', 'dark'],
      ]),
      defaultTheme,
    );
    expect(theme.colors.graph.classBackground).toBe('#123456');
  });

  it('an explicit skinparam classBackgroundColor wins over the dark default, source order AFTER mode', () => {
    const { theme } = resolveSkinparam(
      new Map([
        ['mode', 'dark'],
        ['classbackgroundcolor', '#123456'],
      ]),
      defaultTheme,
    );
    expect(theme.colors.graph.classBackground).toBe('#123456');
  });

  it('an explicit skinparam backgroundColor wins over the dark default regardless of order', () => {
    const { theme } = resolveSkinparam(
      new Map([
        ['backgroundcolor', '#654321'],
        ['mode', 'dark'],
      ]),
      defaultTheme,
    );
    expect(theme.colors.background).toBe('#654321');
  });

  it('no `mode` key is a strict no-op: theme is byte-identical to an empty resolve', () => {
    const withoutMode = resolveSkinparam(new Map([['bordercolor', '#AAAAAA']]), defaultTheme).theme;
    expect(withoutMode.colors.background).toBe(defaultTheme.colors.background);
    expect(withoutMode.colors.graph.classBackground).toBe(defaultTheme.colors.graph.classBackground);
    expect(withoutMode.colors.elements?.spotclass).toBeUndefined();
  });
});
