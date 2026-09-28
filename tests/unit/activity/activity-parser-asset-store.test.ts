/**
 * D6 (cdd6-T1c): `parseActivity` threads `ParseOptions.assetStore` into the
 * sprite registry — `activityPlugin.parse` previously dropped `ParseOptions`
 * entirely (`return parseActivity(block);`), so `sprite Netw
 * jar:archimate/network` always resolved to nothing even when
 * `RenderOptions.assetStore` was supplied. Mirrors
 * `class/class-parser-asset-store.test.ts` (C-3, cdd3-T23), one engine over.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandSpriteFile.java:108-112
 */
import { describe, it, expect } from 'vitest';
import { parseActivity } from '../../../src/diagrams/activity/parser.js';
import { activityPlugin } from '../../../src/diagrams/activity/index.js';
import { buildSpriteAssetsStore } from '../../helpers/sprite-assets-store.js';
import type { ActivityDiagramAST } from '../../../src/diagrams/activity/ast.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

function block(lines: string[]): UmlSource {
  return { lines, type: 'activity' };
}

describe('D6 — parseActivity threads ParseOptions.assetStore into the sprite registry', () => {
  it('with no options, the registry carries no internal store (pre-fix behavior unchanged)', () => {
    const ast = parseActivity(block(['sprite Netw jar:archimate/network', ':Download file;']));
    expect('refused' in ast).toBe(false);
    expect((ast as ActivityDiagramAST).sprites?.internal).toBeUndefined();
  });

  it('with assetStore, the registry resolves `jar:archimate/network`', () => {
    const assetStore = buildSpriteAssetsStore();
    const ast = parseActivity(block(['sprite Netw jar:archimate/network', ':Download file;']), { assetStore });
    expect('refused' in ast).toBe(false);
    const sprites = (ast as ActivityDiagramAST).sprites;
    expect(sprites?.internal).toBeDefined();
    expect(sprites?.internal?.get('archimate/network')).toBeDefined();
    expect(sprites?.byName.has('Netw')).toBe(true);
  });

  it('activityPlugin.parse forwards options.assetStore to parseActivity (D6 plugin wiring)', () => {
    const assetStore = buildSpriteAssetsStore();
    const parsed = activityPlugin.parse(block(['sprite Netw jar:archimate/network', ':Download file;']), {
      assetStore,
    });
    expect('refused' in parsed).toBe(false);
    expect((parsed as ActivityDiagramAST).sprites?.internal?.get('archimate/network')).toBeDefined();
  });
});
