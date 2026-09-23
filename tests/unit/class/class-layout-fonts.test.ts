/**
 * cdd-B7FU-R3 (`ropera-76-jico895`): `resolveAttributeFont`/
 * `resolveHeaderFont`'s new `<style> class { FontSize; FontStyle; header {
 * FontSize; FontStyle } } }` cascade tiers -- see `style-cascade-class-
 * font.ts`'s own doc comment for the upstream `file:line` derivation.
 * Direct unit coverage since `resolveAttributeFont`/`resolveHeaderFont`
 * have no pre-existing test file (exercised only indirectly through full
 * fixture renders before this task).
 */
import { describe, it, expect } from 'vitest';
import { resolveAttributeFont, resolveHeaderFont } from '../../../src/diagrams/class/class-layout-fonts.js';
import { attributeFontSize } from '../../../src/diagrams/class/renderer-classifier-rows.js';
import { defaultTheme, deepMergeTheme } from '../../../src/core/theme.js';

const FONT_SPEC = { family: defaultTheme.fontFamily, size: defaultTheme.fontSize };

describe('resolveAttributeFont -- classCascadeFontSize/Bold/Italic (cdd-B7FU-R3)', () => {
  it('a plain classCascadeFontSize/Bold/Italic override wins over the diagram default', () => {
    const theme = deepMergeTheme(defaultTheme, {});
    theme.colors.graph.classCascadeFontSize = 18;
    theme.colors.graph.classCascadeFontBold = false;
    theme.colors.graph.classCascadeFontItalic = true;
    const font = resolveAttributeFont(theme, FONT_SPEC, undefined);
    expect(font.size).toBe(18);
    expect(font.bold).toBe(false);
    expect(font.italic).toBe(true);
  });

  it('the flat classAttributeFontSize skinparam still wins when no cascade value is set (regression guard)', () => {
    const theme = deepMergeTheme(defaultTheme, {});
    theme.colors.graph.classAttributeFontSize = 20;
    const font = resolveAttributeFont(theme, FONT_SPEC, undefined);
    expect(font.size).toBe(20);
  });

  it('the cascade wins over the flat skinparam when BOTH are set', () => {
    const theme = deepMergeTheme(defaultTheme, {});
    theme.colors.graph.classCascadeFontSize = 18;
    theme.colors.graph.classAttributeFontSize = 20;
    const font = resolveAttributeFont(theme, FONT_SPEC, undefined);
    expect(font.size).toBe(18);
  });

  it('absent when neither the cascade nor the flat skinparam sets a value (falls to fontSpec.size)', () => {
    const theme = deepMergeTheme(defaultTheme, {});
    const font = resolveAttributeFont(theme, FONT_SPEC, undefined);
    expect(font.size).toBe(FONT_SPEC.size);
    expect(font.bold).toBe(false);
    expect(font.italic).toBe(false);
  });
});

describe('resolveHeaderFont -- classCascadeHeaderFontBold/Italic (cdd-B7FU-R3)', () => {
  it('a header-nested FontStyle bold wins over the inherited attribute italic (ropera-76-jico895 shape)', () => {
    const theme = deepMergeTheme(defaultTheme, {});
    theme.colors.graph.classCascadeFontSize = 18;
    theme.colors.graph.classCascadeFontItalic = true;
    theme.colors.graph.classCascadeFontBold = false;
    theme.colors.graph.classCascadeHeaderFontSize = 14;
    theme.colors.graph.classCascadeHeaderFontBold = true;
    theme.colors.graph.classCascadeHeaderFontItalic = false;
    const attributeFont = resolveAttributeFont(theme, FONT_SPEC, undefined);
    const headerFont = resolveHeaderFont(theme, attributeFont, undefined);
    expect(attributeFont.size).toBe(18);
    expect(attributeFont.italic).toBe(true);
    expect(attributeFont.bold).toBe(false);
    expect(headerFont.size).toBe(14);
    expect(headerFont.bold).toBe(true);
    expect(headerFont.italic).toBe(false);
  });

  it('inherits the attribute bold/italic when no header-scoped cascade value is set', () => {
    const theme = deepMergeTheme(defaultTheme, {});
    theme.colors.graph.classCascadeFontBold = true;
    theme.colors.graph.classCascadeFontItalic = true;
    const attributeFont = resolveAttributeFont(theme, FONT_SPEC, undefined);
    const headerFont = resolveHeaderFont(theme, attributeFont, undefined);
    expect(headerFont.bold).toBe(true);
    expect(headerFont.italic).toBe(true);
  });

  it('the flat classFontBold/Italic skinparam still wins over the inherited attribute value (regression guard)', () => {
    const theme = deepMergeTheme(defaultTheme, {});
    theme.colors.graph.classFontBold = true;
    const attributeFont = resolveAttributeFont(theme, FONT_SPEC, undefined);
    const headerFont = resolveHeaderFont(theme, attributeFont, undefined);
    expect(headerFont.bold).toBe(true);
  });
});

describe('attributeFontSize -- classCascadeFontSize tier (cdd-B7FU-R3, visibility-icon centring)', () => {
  it('reads classCascadeFontSize ahead of the flat classAttributeFontSize skinparam', () => {
    const theme = deepMergeTheme(defaultTheme, {});
    theme.colors.graph.classCascadeFontSize = 18;
    theme.colors.graph.classAttributeFontSize = 20;
    expect(attributeFontSize(theme)).toBe(18);
  });

  it('falls back to the flat skinparam, then the diagram default, when unset', () => {
    const withFlat = deepMergeTheme(defaultTheme, {});
    withFlat.colors.graph.classAttributeFontSize = 20;
    expect(attributeFontSize(withFlat)).toBe(20);

    const bare = deepMergeTheme(defaultTheme, {});
    expect(attributeFontSize(bare)).toBe(bare.fontSize);
  });
});
