/**
 * S1L-b T5 — scoped `<style> <sname> { MinimumWidth N }` floors leaf boxes
 * per element type, cascading over the global `skinparam minClassWidth`
 * (ADR-3). `zotiru-33`'s `<style> package { MinimumWidth 300 }` floors package
 * boxes at 300 while a sibling `card` is unfloored.
 *
 * See `src/core/theme-element-resolve.ts#resolveElementMinimumWidth`,
 * `src/core/style-map-element.ts`, and the leaf-sizing floor in
 * `src/core/svek/image/leaf-sizing.ts#measureBox`.
 */

import { describe, it, expect } from 'vitest';
import { collectElementStyleBuckets } from '../../../src/core/style-map-element.js';
import { applyStyleMap } from '../../../src/core/style-map-theme.js';
import { defaultTheme, resolveElementMinimumWidth } from '../../../src/core/theme.js';
import type { StyleMap } from '../../../src/core/skinparam.js';
import { measureLeafNode } from '../../../src/core/svek/image/leaf-sizing.js';
import type { FontSpec, StringMeasurer } from '../../../src/core/measurer.js';
import type { DescriptiveNode } from '../../../src/diagrams/description/ast.js';

function styleMap(spec: Record<string, Record<string, string>>): StyleMap {
  const m: StyleMap = new Map();
  for (const [sel, decls] of Object.entries(spec)) m.set(sel, new Map(Object.entries(decls)));
  return m;
}

const fontSpec: FontSpec = { family: 'Helvetica', size: 14 };
const stub: StringMeasurer = {
  measure: (t: string, f: FontSpec) => ({ width: t.length * 10, height: f.size }),
  getDescent: () => 0,
};
function leaf(symbol: DescriptiveNode['symbol'], display = 'x'): DescriptiveNode {
  return { id: 'n', display, symbol, children: [] };
}

describe('scoped <style> MinimumWidth (S1L-b T5)', () => {
  it('parses MinimumWidth into the element bucket', () => {
    const buckets = collectElementStyleBuckets(styleMap({ package: { minimumwidth: '300' } }));
    expect(buckets.package?.minimumWidth).toBe(300);
  });

  it('resolveElementMinimumWidth returns the scoped floor for the styled element only', () => {
    const theme = applyStyleMap(styleMap({ package: { minimumwidth: '300' } }), defaultTheme);
    expect(resolveElementMinimumWidth(theme, 'package')).toBe(300);
    // A sibling with no scoped override and no global floor is unfloored.
    expect(resolveElementMinimumWidth(theme, 'card')).toBeUndefined();
  });

  it('the global skinparam minClassWidth still applies where no scoped value exists', () => {
    const theme = { ...defaultTheme, minimumWidth: 200 };
    // No elements bucket → falls through to the global.
    expect(resolveElementMinimumWidth(theme, 'card')).toBe(200);
    // A scoped value wins over the global for its own element.
    const scoped = applyStyleMap(styleMap({ package: { minimumwidth: '300' } }), theme);
    expect(resolveElementMinimumWidth(scoped, 'package')).toBe(300);
    expect(resolveElementMinimumWidth(scoped, 'card')).toBe(200);
  });

  it('measureBox floors a package content width at the scoped minimum, not a card', () => {
    const theme = applyStyleMap(styleMap({ package: { minimumwidth: '300' } }), defaultTheme);
    const pkgMin = resolveElementMinimumWidth(theme, 'package');
    const cardMin = resolveElementMinimumWidth(theme, 'card');
    // narrow display ("x") — the package floors at 300 + margin/icon; the card
    // uses its own default (no scoped floor), so it stays much narrower.
    const pkg = measureLeafNode(leaf('package'), fontSpec, stub, { minimumWidth: pkgMin });
    const card = measureLeafNode(leaf('card'), fontSpec, stub, { minimumWidth: cardMin });
    expect(pkg.width).toBeGreaterThanOrEqual(300);
    expect(card.width).toBeLessThan(300);
  });
});
