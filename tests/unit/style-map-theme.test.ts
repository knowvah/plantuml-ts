import { describe, it, expect } from 'vitest';
import { parseStyleBlock } from '../../src/core/skinparam.js';
import { applyStyleMap } from '../../src/core/style-map-theme.js';
import type { Theme } from '../../src/core/theme.js';
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

/**
 * S1L-tail F4-e (M1, `plans/s1l-tail-fix/findings/fariba-82-residual.md`):
 * `applyStyleMap`'s element buckets must merge per SName, mirroring
 * `StyleBuilder#muteStyle` (`~/git/plantuml/src/main/java/net/sourceforge/
 * plantuml/style/StyleBuilder.java:86-104`): the incoming styles are merged
 * into a COPY of the existing storage, one `StyleSignatureBasic` at a time
 * (`orig.mergeWith(modifiedStyle, MergeStrategy.OVERWRITE_EXISTING_VALUE)`),
 * so a `file` signature can never evict a `rectangle` signature. Before this
 * fix `buildStyleMapPartialTheme` replaced `colors.elements` wholesale, so
 * ANY element-scoped `<style>` selector deleted every skinparam-derived
 * bucket -- the second of the two defects behind `fariba-82-xolu802`'s
 * 0.027778in `sh0006` residual.
 */
describe('applyStyleMap -- per-signature element-bucket merge (F4-e / M1)', () => {
  const withElements = (elements: NonNullable<Theme['colors']['elements']>): Theme => ({
    ...defaultTheme,
    colors: { ...defaultTheme.colors, elements },
  });

  it('a <style> selector for one sname does not evict another sname bucket', () => {
    // The `fariba-82-xolu802` shape: `skinparam rectangle {
    // StereotypeFontSize 12 }` built the base bucket, then the fixture's
    // `<style> file { … }` block arrives.
    const base = withElements({ rectangle: { stereotypeFontSize: 12 } });
    const styleMap = parseStyleBlock('file {\n  FontColor blue\n}');
    const theme = applyStyleMap(styleMap, base);
    expect(theme.colors.elements?.rectangle?.stereotypeFontSize).toBe(12);
    expect(theme.colors.elements?.file?.font).toBe('blue');
  });

  it('within one sname the <style> value overwrites the base value', () => {
    // OVERWRITE_EXISTING_VALUE: this is a merge fix, not a
    // "last writer loses" inversion.
    const base = withElements({ rectangle: { fontSize: 20, background: 'red' } });
    const styleMap = parseStyleBlock('rectangle {\n  FontSize 12\n}');
    const theme = applyStyleMap(styleMap, base);
    expect(theme.colors.elements?.rectangle?.fontSize).toBe(12);
  });

  it('within one sname the base fields the <style> block omits survive', () => {
    const base = withElements({ rectangle: { fontSize: 20, background: 'red' } });
    const styleMap = parseStyleBlock('rectangle {\n  FontSize 12\n}');
    const theme = applyStyleMap(styleMap, base);
    expect(theme.colors.elements?.rectangle?.background).toBe('red');
  });

  it('a per-stereotype-name rule does not evict a base rule for a different tag', () => {
    // `stereotypeFontSizeByStereo`'s keys are separate (more specific)
    // signatures upstream, so the same per-signature rule applies one
    // level deeper.
    const base = withElements({ rectangle: { stereotypeFontSizeByStereo: { alpha: 9 } } });
    const styleMap = parseStyleBlock('rectangle {\n  stereotype {\n    .beta {\n      FontSize 11\n    }\n  }\n}');
    const theme = applyStyleMap(styleMap, base);
    expect(theme.colors.elements?.rectangle?.stereotypeFontSizeByStereo).toEqual({ alpha: 9, beta: 11 });
  });

  it('leaves base buckets untouched when the StyleMap has no element selector', () => {
    const base = withElements({ rectangle: { stereotypeFontSize: 12 } });
    const styleMap = parseStyleBlock('root {\n  Shadowing 4.0\n}');
    const theme = applyStyleMap(styleMap, base);
    expect(theme.colors.elements?.rectangle?.stereotypeFontSize).toBe(12);
  });
});

/**
 * T14/D3: `applyStyleMap`'s fold of `computeCardinalityFontOverride`
 * (`style-cascade-class.ts`, T1) into `theme.cardinalityFontSize`/
 * `cardinalityFontFamily` -- the top-level Theme scalars T1 built but never
 * wired to a StyleMap. `camuna-58-veca254`'s own `<style>` block is used
 * verbatim (not synthesized), per this project's "prefer upstream fixtures"
 * convention.
 */
describe('applyStyleMap -- cardinality font fold (T14, D3)', () => {
  it("camuna-58-veca254's arrow { cardinality { FontSize 10 } } resolves theme.cardinalityFontSize to 10", () => {
    const styleMap = parseStyleBlock(
      'arrow {\n  FontSize 14\n  cardinality {\n    FontSize 10\n  }\n}',
    );
    const theme = applyStyleMap(styleMap, defaultTheme);
    expect(theme.cardinalityFontSize).toBe(10);
  });

  it('a <style> block setting only arrow { FontSize 14 } (no cardinality block) falls through to 14 -- through arrow, not the skin default', () => {
    const styleMap = parseStyleBlock('arrow {\n  FontSize 14\n}');
    const theme = applyStyleMap(styleMap, defaultTheme);
    expect(theme.cardinalityFontSize).toBe(14);
  });

  it('a StyleMap that never touches arrow leaves the base Theme cardinality font unchanged -- no fixture moves', () => {
    const styleMap = parseStyleBlock('class {\n  BackgroundColor yellow\n}');
    const theme = applyStyleMap(styleMap, defaultTheme);
    expect(theme.cardinalityFontSize).toBe(defaultTheme.cardinalityFontSize);
    expect(theme.cardinalityFontFamily).toBe(defaultTheme.cardinalityFontFamily);
  });
});

/**
 * T2/T6/D3/D4: `applyStyleMap`'s fold of `computeArrowFontOverride`
 * (`style-cascade-class.ts`) into `theme.colors.graph.arrowFontFamily`/
 * `arrowFontSize`/`arrowFontStyle`. T2 deliberately excluded `arrowFontSize`
 * from this fold (`description/layout.ts`'s pre-existing skinparam-only
 * consumer); T6 lifted that exclusion when it rewired that consumer through
 * `resolveArrowLabelFont` (`arrow-label-font.test.ts` covers the full
 * three-field resolution against a hand-built Theme).
 */
describe('applyStyleMap -- arrow-label font fold (T2, T6, D3, D4)', () => {
  it('camuna shape: arrow { FontSize 14  FontStyle bold } resolves BOTH FontSize and FontStyle', () => {
    const styleMap = parseStyleBlock('arrow {\n  FontSize 14\n  FontStyle bold\n}');
    const theme = applyStyleMap(styleMap, defaultTheme);
    expect(theme.colors.graph.arrowFontStyle).toBe('bold');
    expect(theme.colors.graph.arrowFontSize).toBe(14);
  });

  it('ticuxa shape: arrow { FontName Courier } resolves arrowFontFamily', () => {
    const styleMap = parseStyleBlock('arrow {\n  FontName Courier\n}');
    const theme = applyStyleMap(styleMap, defaultTheme);
    expect(theme.colors.graph.arrowFontFamily).toBe('Courier');
  });

  it("arrow { cardinality { FontStyle italic } } alone does NOT set the arrow-level font", () => {
    const styleMap = parseStyleBlock('arrow {\n  cardinality {\n    FontStyle italic\n  }\n}');
    const theme = applyStyleMap(styleMap, defaultTheme);
    expect(theme.colors.graph.arrowFontStyle).toBeUndefined();
  });

  it('a StyleMap that never touches arrow leaves the base Theme arrow font unchanged -- no fixture moves', () => {
    const styleMap = parseStyleBlock('class {\n  BackgroundColor yellow\n}');
    const theme = applyStyleMap(styleMap, defaultTheme);
    expect(theme.colors.graph.arrowFontSize).toBe(defaultTheme.colors.graph.arrowFontSize);
    expect(theme.colors.graph.arrowFontFamily).toBe(defaultTheme.colors.graph.arrowFontFamily);
  });
});
