/**
 * S1L-tail G4/G5 — the per-stereotype-NAME font-size cascade and the
 * per-element `LineThickness` sizer thread.
 *
 * One file rather than appends to `theme.test.ts` / `style-map-element
 * .test.ts` / `skinparam.test.ts` because F3-fix's declared write-set admits
 * only test files it AUTHORS; the three sibling suites are pre-existing.
 *
 * Covers all four legs of the mechanism the fix threads end to end:
 *   1. the `<style> <sname> { stereotype { .tag { FontSize N } } }` front-end
 *      (`collectElementStyleBuckets`),
 *   2. the `skinparam <sname>StereotypeFontSize<<tag>> N` front-end
 *      (`resolveSkinparam` → `applyStereoOverride`),
 *   3. the three-tier read (`resolveElementFontSize`),
 *   4. delivery into the SIZER (`measureLeafNode` via `BoxSizingOpts`),
 * plus the G5 `lineThickness` slot on the same `BoxSizingOpts` thread.
 *
 * Fixture numbers below are the pinned oracle's, from
 * `oracle/goldens/description/<slug>/svek-1.dot` (DOT inches ×72 = px).
 */
import { describe, it, expect } from 'vitest';

import { collectElementStyleBuckets } from '../../../src/core/style-map-element.js';
import { parseStyleBlock, resolveSkinparam } from '../../../src/core/skinparam.js';
import type { StyleMap } from '../../../src/core/skinparam.js';
import { defaultTheme, deepMergeTheme, resolveElementFontSize } from '../../../src/core/theme.js';
import type { Theme } from '../../../src/core/theme.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import type { FontSpec } from '../../../src/core/measurer.js';
import { measureLeafNode } from '../../../src/core/svek/image/leaf-sizing.js';
import type { DescriptiveNode } from '../../../src/diagrams/description/ast.js';
import { ActorStyle } from '../../../src/core/skin/ActorStyle.js';

/** Clone the default theme so per-test bucket mutations don't leak. */
function freshTheme(): Theme {
  return deepMergeTheme(defaultTheme, {});
}

/** `loroto-06-fano471`'s own `<style>` block, verbatim. */
const LOROTO_STYLE = `node {
  stereotype {
    FontSize 20

    .bar {
    	FontSize 10
    }
  }
}`;

const BASE_FONT: FontSpec = { family: 'sans-serif', size: 14 };

function measurer(): WidthTableMeasurer {
  return new WidthTableMeasurer();
}

function nodeLeaf(id: string, stereotype: readonly string[]): DescriptiveNode {
  return { id, display: id, symbol: 'node', children: [], stereotype };
}

describe('<style> front-end: <sname> { stereotype { .tag { FontSize N } } }', () => {
  it('captures BOTH tiers off loroto-06-fano471’s own block', () => {
    const buckets = collectElementStyleBuckets(parseStyleBlock(LOROTO_STYLE));
    expect(buckets.node).toEqual({
      stereotypeFontSize: 20,
      stereotypeFontSizeByStereo: { bar: 10 },
    });
  });

  it('CLEANS the tag token the way StyleSignatureBasic#clean does (case, `_`, `.`)', () => {
    const buckets = collectElementStyleBuckets(
      parseStyleBlock('node {\n stereotype {\n  .My_Style {\n   FontSize 9\n  }\n }\n}'),
    );
    expect(buckets.node?.stereotypeFontSizeByStereo).toEqual({ mystyle: 9 });
  });

  it('accumulates two tags on one element rather than overwriting', () => {
    const map: StyleMap = new Map([
      ['node.stereotype..bar', new Map([['fontsize', '10']])],
      ['node.stereotype..baz', new Map([['fontsize', '11']])],
    ]);
    expect(collectElementStyleBuckets(map).node?.stereotypeFontSizeByStereo).toEqual({
      bar: 10,
      baz: 11,
    });
  });

  it('ignores a tag selector under a non-bucket SName, and a non-numeric size', () => {
    const map: StyleMap = new Map([
      ['widget.stereotype..bar', new Map([['fontsize', '10']])],
      ['node.stereotype..qux', new Map([['fontsize', 'huge']])],
    ]);
    expect(collectElementStyleBuckets(map)).toEqual({});
  });

  it('leaves the plain `<sname>.stereotype` selector on its own field', () => {
    const map: StyleMap = new Map([['node.stereotype', new Map([['fontsize', '20']])]]);
    expect(collectElementStyleBuckets(map).node).toEqual({ stereotypeFontSize: 20 });
  });
});

describe('skinparam front-end: <sname>StereotypeFontSize<<tag>>', () => {
  it('routes toxine-81-xofo986’s two keys to the SAME theme state as loroto-06’s <style>', () => {
    const { theme, unknown } = resolveSkinparam(
      new Map([
        ['nodestereotypefontsize', '20'],
        ['nodestereotypefontsize<<bar>>', '10'],
      ]),
      defaultTheme,
    );
    expect(theme.colors.elements?.node).toEqual({
      stereotypeFontSize: 20,
      stereotypeFontSizeByStereo: { bar: 10 },
    });
    expect(unknown).toEqual([]);
  });

  it('accumulates two tags and leaves the plain per-element key untouched', () => {
    const { theme } = resolveSkinparam(
      new Map([
        ['actorstereotypefontsize<<one>>', '8'],
        ['actorstereotypefontsize<<two>>', '9'],
        ['actorfontsize', '15'],
      ]),
      defaultTheme,
    );
    expect(theme.colors.elements?.actor).toEqual({
      fontSize: 15,
      stereotypeFontSizeByStereo: { one: 8, two: 9 },
    });
  });

  it('records a non-bucket SName and a non-numeric value as unknown, not silently dropped', () => {
    const { theme, unknown } = resolveSkinparam(
      new Map([
        ['widgetstereotypefontsize<<bar>>', '10'],
        ['nodestereotypefontsize<<baz>>', 'huge'],
      ]),
      defaultTheme,
    );
    expect(theme.colors.elements?.node).toBeUndefined();
    expect(unknown).toEqual(['widgetstereotypefontsize<<bar>>', 'nodestereotypefontsize<<baz>>']);
  });

  it('does not shadow the pre-existing classAttributeFontSize<<X>> matcher', () => {
    const { theme, unknown } = resolveSkinparam(
      new Map([['classattributefontsize<<x>>', '7']]),
      defaultTheme,
    );
    expect(theme.colors.graph.classAttributeFontSizeByStereo).toEqual({ x: 7 });
    expect(unknown).toEqual([]);
  });
});

describe('resolveElementFontSize — three-tier stereotype cascade', () => {
  it('prefers the name-scoped tier over the flat tier over fontSize', () => {
    const theme = freshTheme();
    theme.colors.elements = {
      node: { fontSize: 12, stereotypeFontSize: 20, stereotypeFontSizeByStereo: { bar: 10 } },
    };
    expect(resolveElementFontSize(theme, 'node', 'stereotype', ['bar'])).toBe(10);
    expect(resolveElementFontSize(theme, 'node', 'stereotype', ['foo'])).toBe(20);
    expect(resolveElementFontSize(theme, 'node', 'stereotype', [])).toBe(20);
    expect(resolveElementFontSize(theme, 'node', 'title', ['bar'])).toBe(12);
  });

  it('is byte-identical to the pre-tier behaviour when no labels are supplied', () => {
    const theme = freshTheme();
    theme.colors.elements = { node: { stereotypeFontSize: 20, stereotypeFontSizeByStereo: { bar: 10 } } };
    expect(resolveElementFontSize(theme, 'node', 'stereotype')).toBe(20);
  });

  it('cleans the element’s OWN label before matching (`<<My.Bar>>` hits key `mybar`)', () => {
    const theme = freshTheme();
    theme.colors.elements = { node: { stereotypeFontSizeByStereo: { mybar: 10 } } };
    expect(resolveElementFontSize(theme, 'node', 'stereotype', ['My.Bar'])).toBe(10);
  });

  it('falls through to fontSize when the element’s label matches no key', () => {
    const theme = freshTheme();
    theme.colors.elements = { node: { fontSize: 12, stereotypeFontSizeByStereo: { bar: 10 } } };
    expect(resolveElementFontSize(theme, 'node', 'stereotype', ['other'])).toBe(12);
  });
});

describe('BoxSizingOpts.stereotypeFontSize — the SIZER slot (G4)', () => {
  // Oracle: loroto-06-fano471 / toxine-81-xofo986 svek-1.dot --
  // sh0006 1.277778x0.888889in = 92x64px, sh0007 1.268924x0.750000in
  // = 91.363x54px.
  it('sizes nodefoo/nodebar to the jar’s exact numbers at 20 and 10', () => {
    const m = measurer();
    const foo = measureLeafNode(nodeLeaf('nodefoo', ['foo']), BASE_FONT, m, { stereotypeFontSize: 20 });
    const bar = measureLeafNode(nodeLeaf('nodebar', ['bar']), BASE_FONT, m, { stereotypeFontSize: 10 });
    expect(foo.width).toBeCloseTo(92, 3);
    expect(foo.height).toBeCloseTo(64, 3);
    // 1.268924in × 72 = 91.362528; the DOT oracle stores 6 decimals, so the
    // last 3e-5px is the golden's own rounding, not a measurement error.
    expect(bar.width).toBeCloseTo(1.268924 * 72, 2);
    expect(bar.height).toBeCloseTo(54, 3);
  });

  it('does NOT inflate the TITLE — the measured trap of repointing the single font slot', () => {
    // The naive one-slot fix measured 112.250x70 / 113.375x70 for these two
    // nodes (`plans/s1l-tail-diagnosis/findings/element-font.md`, loroto-06
    // `ruledOut`). A second slot must not reproduce either number.
    const m = measurer();
    const foo = measureLeafNode(nodeLeaf('nodefoo', ['foo']), BASE_FONT, m, { stereotypeFontSize: 20 });
    expect(foo.width).not.toBeCloseTo(112.25, 3);
    expect(foo.height).not.toBeCloseTo(70, 3);
  });

  it('absent ⇒ the pre-thread measurement, unchanged (ADR-4 discipline)', () => {
    const m = measurer();
    const node = nodeLeaf('nodefoo', ['foo']);
    expect(measureLeafNode(node, BASE_FONT, m, {})).toEqual(measureLeafNode(node, BASE_FONT, m));
  });

  it('falls back to the resolved TITLE size when only `fontSize` is threaded', () => {
    const m = measurer();
    const node = nodeLeaf('nodefoo', ['foo']);
    expect(measureLeafNode(node, BASE_FONT, m, { fontSize: 20 })).toEqual(
      measureLeafNode(node, BASE_FONT, m, { fontSize: 20, stereotypeFontSize: 20 }),
    );
  });
});

describe('BoxSizingOpts.lineThickness — the SIZER slot (G5)', () => {
  // Oracle: revusu-28-pexi248 svek-1.dot sh0006 0.861111x1.152778in
  // = 62x83px, an `awesome` actor at LineThickness 4 with a 15pt label.
  const actorAt = (thickness: number | undefined) =>
    measureLeafNode(
      { id: 'a', display: 'a', symbol: 'actor' },
      { family: 'sans-serif', size: 15 },
      measurer(),
      thickness === undefined
        ? { actorStyle: ActorStyle.AWESOME }
        : { actorStyle: ActorStyle.AWESOME, lineThickness: thickness },
    );

  it('reproduces the jar’s 62x83 for `<style> actor { LineThickness 4 }`', () => {
    const dim = actorAt(4);
    expect(dim.width).toBeCloseTo(62, 3);
    expect(dim.height).toBeCloseTo(83, 3);
  });

  it('moves BOTH dimensions by exactly 2×(t − 0.5), the ActorAwesome thickness term', () => {
    const base = actorAt(undefined);
    const thick = actorAt(4);
    expect(thick.width - base.width).toBeCloseTo(2 * (4 - 0.5), 6);
    expect(thick.height - base.height).toBeCloseTo(2 * (4 - 0.5), 6);
  });

  it('absent ⇒ the DEFAULT_SIZING_STROKE_THICKNESS measurement, unchanged', () => {
    expect(actorAt(0.5)).toEqual(actorAt(undefined));
  });
});
