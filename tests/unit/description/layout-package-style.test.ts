/**
 * codd-T2 M2 -- the `package` keyword's symbol is the skin's package style
 * (`CommandPackageWithUSymbol.java:194` -> `USymbols.fromString(..., packageStyle())`, `USymbols.java:103-104`),
 * so a non-empty `package` takes that style's keyword before layout sizes and styles it by symbol.
 */
import { describe, it, expect } from 'vitest';
import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { defaultTheme, type Theme } from '../../../src/core/theme.js';
import type { DescriptiveNode } from '../../../src/diagrams/description/ast.js';
import { applyPackageStyle } from '../../../src/diagrams/description/layout-package-style.js';

function themeFor(style: string): Theme {
  return resolveSkinparam(new Map([['packagestyle', style]]), defaultTheme).theme;
}

function node(id: string, symbol: DescriptiveNode['symbol'], children: DescriptiveNode[] = []): DescriptiveNode {
  return { id, display: id, symbol, children };
}

const TREE = (): DescriptiveNode[] => [
  node('outer', 'package', [
    node('inner', 'package', [node('leaf', 'component')]),
    node('n', 'node', [node('x', 'component')]),
  ]),
  node('empty', 'package'),
];

describe('applyPackageStyle', () => {
  it.each([
    ['rect', 'rectangle'],
    ['node', 'node'],
    ['frame', 'frame'],
    ['cloud', 'cloud'],
    ['database', 'database'],
    ['card', 'card'],
  ] as const)('packagestyle %s turns every non-empty package into %s', (style, keyword) => {
    const out = applyPackageStyle(TREE(), themeFor(style));
    expect(out[0]!.symbol).toBe(keyword);
    expect(out[0]!.children[0]!.symbol).toBe(keyword);
    // an explicit `node` stays a node; leaves are never touched
    expect(out[0]!.children[1]!.symbol).toBe('node');
    expect(out[0]!.children[0]!.children[0]!.symbol).toBe('component');
  });

  it('leaves an empty package (an EMPTY_PACKAGE leaf, not a cluster) alone', () => {
    expect(applyPackageStyle(TREE(), themeFor('node'))[1]!.symbol).toBe('package');
  });

  it('keeps `package` where the style has no symbol of its own (null USymbol, resolved at draw time)', () => {
    for (const style of ['agent', 'storage', 'component1', 'component2', 'artifact', 'folder']) {
      expect(applyPackageStyle(TREE(), themeFor(style))[0]!.symbol).toBe('package');
    }
  });

  it('returns the very same tree when the style does not rewrite anything', () => {
    const tree = TREE();
    expect(applyPackageStyle(tree, defaultTheme)).toBe(tree);
  });

  it('does not mutate its input', () => {
    const tree = TREE();
    applyPackageStyle(tree, themeFor('node'));
    expect(tree[0]!.symbol).toBe('package');
  });
});
