import { describe, it, expect } from 'vitest';
import { parseStyleBlock } from '../../src/core/skinparam.js';
import { applyStyleMap } from '../../src/core/style-map-theme.js';
import { defaultTheme } from '../../src/core/theme.js';

/**
 * mission skin-file-loading Batch 1 (D3): Shadowing/root-element-color
 * resolution is a GENERIC `applyStyleMap` capability -- it applies to ANY
 * StyleMap (an inline `<style>` block's, not just a loaded `.skin` file's),
 * since `skin-loader.ts` feeds a skin's own StyleMap through this SAME
 * function. These tests exercise the mechanism directly, independent of
 * the skin registry.
 */
describe('applyStyleMap -- root/element universal-selector cascade (D3)', () => {
  it('resolves Shadowing from a bare element {} selector', () => {
    const styleMap = parseStyleBlock('element {\n  Shadowing 4.0\n}');
    const theme = applyStyleMap(styleMap, defaultTheme);
    expect(theme.shadowing).toBe(4);
  });

  it('resolves Shadowing from a bare root {} selector', () => {
    const styleMap = parseStyleBlock('root {\n  Shadowing 2.5\n}');
    const theme = applyStyleMap(styleMap, defaultTheme);
    expect(theme.shadowing).toBe(2.5);
  });

  it('a LATER element {} Shadowing declaration overrides an EARLIER root {} one', () => {
    const styleMap = parseStyleBlock(
      'root {\n  Shadowing 0.0\n}\nelement {\n  Shadowing 4.0\n}',
    );
    const theme = applyStyleMap(styleMap, defaultTheme);
    expect(theme.shadowing).toBe(4);
  });

  it('an EARLIER element {} Shadowing declaration is overridden by a LATER root {} one', () => {
    const styleMap = parseStyleBlock(
      'element {\n  Shadowing 4.0\n}\nroot {\n  Shadowing 0.0\n}',
    );
    const theme = applyStyleMap(styleMap, defaultTheme);
    expect(theme.shadowing).toBe(0);
  });

  it('is undefined (falls through unchanged) when neither bare selector sets Shadowing', () => {
    const styleMap = parseStyleBlock('state {\n  Shadowing 4.0\n}');
    const theme = applyStyleMap(styleMap, defaultTheme);
    expect(theme.shadowing).toBeUndefined();
  });

  it('resolves LineColor into theme.colors.border directly', () => {
    const styleMap = parseStyleBlock('root {\n  LineColor #A80036\n}');
    const theme = applyStyleMap(styleMap, defaultTheme);
    expect(theme.colors.border).toBe('#A80036');
  });

  it('resolves BackgroundColor into the dedicated rootElementBackground field', () => {
    // A bare root {} BackgroundColor with no document {} override present
    // ALSO reaches theme.colors.background via the PRE-EXISTING
    // resolveDocumentBackground precedence tier (root is one of its
    // tiers) -- that mechanism is unrelated to this batch and unchanged
    // by it. What THIS batch adds is the SEPARATE rootElementBackground
    // field, which state (and later, other diagram types) reads as the
    // entity-fill default -- see the next test for the case where the
    // two fields genuinely diverge (a document {} override present).
    const styleMap = parseStyleBlock('root {\n  BackGroundColor #FEFECE\n}');
    const theme = applyStyleMap(styleMap, defaultTheme);
    expect(theme.colors.graph.rootElementBackground).toBe('#FEFECE');
  });

  it('a document {} BackgroundColor still wins the canvas field over a root {} one', () => {
    const styleMap = parseStyleBlock(
      'root {\n  BackGroundColor red\n}\ndocument {\n  BackGroundColor white\n}',
    );
    const theme = applyStyleMap(styleMap, defaultTheme);
    expect(theme.colors.background).toBe('white');
    expect(theme.colors.graph.rootElementBackground).toBe('red');
  });

  it('a StyleMap with no root/element/document content returns base unchanged', () => {
    const styleMap = parseStyleBlock('actor {\n  BackgroundColor blue\n}');
    const theme = applyStyleMap(styleMap, defaultTheme);
    expect(theme.shadowing).toBeUndefined();
    expect(theme.colors.graph.rootElementBackground).toBeUndefined();
    expect(theme.colors.border).toBe(defaultTheme.colors.border);
  });
});
