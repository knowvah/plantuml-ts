/**
 * C-3 (cdd3-T23, bidusa-22-jutu505): `classPlugin.parse` dropped
 * `ParseOptions` entirely (`return parseClass(block)`), so `sprite Netw
 * jar:archimate/network` always resolved to nothing even when
 * `RenderOptions.assetStore` was supplied -- `parser.ts:53`'s
 * `createSpriteRegistry()` carried no internal store to resolve against.
 * Mirrors `description/index.ts#descriptionPlugin.parse`'s own asset
 * channel (`internalSpriteStoreFrom(options.assetStore)`), the one other
 * `SyncPlugin` that already wired this before cdd3-T23.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandSpriteFile.java:108-112
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from '../../../src/diagrams/class/parser.js';
import { buildSpriteAssetsStore } from '../../helpers/sprite-assets-store.js';
import type { ClassDiagramAST } from '../../../src/diagrams/class/ast.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

function block(lines: string[]): UmlSource {
  return { lines, type: 'class' };
}

describe('C-3 — parseClass threads ParseOptions.assetStore into the sprite registry', () => {
  it('with no options, the registry carries no internal store (pre-fix behavior unchanged)', () => {
    const ast = parseClass(block(['sprite Netw jar:archimate/network', 'class Foo']));
    expect('errors' in ast).toBe(false);
    expect((ast as ClassDiagramAST).sprites?.internal).toBeUndefined();
  });

  it('with assetStore, the registry resolves `jar:archimate/network`', () => {
    const assetStore = buildSpriteAssetsStore();
    const ast = parseClass(block(['sprite Netw jar:archimate/network', 'class Foo']), { assetStore });
    expect('errors' in ast).toBe(false);
    const sprites = (ast as ClassDiagramAST).sprites;
    expect(sprites?.internal).toBeDefined();
    expect(sprites?.internal?.get('archimate/network')).toBeDefined();
    // `sprite Netw jar:...` is a DEFINITION command -- it registers the
    // resolved sprite under the alias 'Netw' directly, unlike an inline
    // `<$archimate/network>` reference (which looks up `internal` by path
    // name with no alias step).
    expect(sprites?.byName.has('Netw')).toBe(true);
  });

  it('startNewPage carries the SAME internal store into every page', () => {
    const assetStore = buildSpriteAssetsStore();
    const ast = parseClass(block(['sprite Netw jar:archimate/network', 'class Foo', 'newpage', 'class Bar']), {
      assetStore,
    });
    expect('errors' in ast).toBe(false);
    const withPages = ast as ClassDiagramAST & { pages: ClassDiagramAST[] };
    expect(withPages.pages.length).toBeGreaterThan(0);
    for (const page of withPages.pages) {
      expect(page.sprites?.internal?.get('archimate/network')).toBeDefined();
    }
    expect(withPages.sprites?.internal?.get('archimate/network')).toBeDefined();
  });
});
