/**
 * D6 (cdd6-T1c): `parseState` threads `ParseOptions.assetStore` into the
 * sprite registry — `statePlugin.parse` previously dropped `ParseOptions`
 * entirely (`return parseState(block);`), so `sprite Netw
 * jar:archimate/network` always resolved to nothing even when
 * `RenderOptions.assetStore` was supplied. Mirrors
 * `class/class-parser-asset-store.test.ts` (C-3, cdd3-T23) exactly, one
 * engine over — see `.agent-notes/cdd5-T3-assetstore-gap.md` for the gap
 * this closes.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandSpriteFile.java:108-112
 */
import { describe, it, expect } from 'vitest';
import { parseState } from '../../../src/diagrams/state/parser.js';
import { statePlugin } from '../../../src/diagrams/state/index.js';
import { buildSpriteAssetsStore } from '../../helpers/sprite-assets-store.js';
import type { StateDiagramAST } from '../../../src/diagrams/state/ast.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

function block(lines: string[]): UmlSource {
  return { lines, type: 'state' };
}

describe('D6 — parseState threads ParseOptions.assetStore into the sprite registry', () => {
  it('with no options, the registry carries no internal store (pre-fix behavior unchanged)', () => {
    const ast = parseState(block(['sprite Netw jar:archimate/network', 'state Foo']));
    expect('refused' in ast).toBe(false);
    expect((ast as StateDiagramAST).sprites?.internal).toBeUndefined();
  });

  it('with assetStore, the registry resolves `jar:archimate/network`', () => {
    const assetStore = buildSpriteAssetsStore();
    const ast = parseState(block(['sprite Netw jar:archimate/network', 'state Foo']), { assetStore });
    expect('refused' in ast).toBe(false);
    const sprites = (ast as StateDiagramAST).sprites;
    expect(sprites?.internal).toBeDefined();
    expect(sprites?.internal?.get('archimate/network')).toBeDefined();
    expect(sprites?.byName.has('Netw')).toBe(true);
  });

  it('statePlugin.parse forwards options.assetStore to parseState (D6 plugin wiring)', () => {
    const assetStore = buildSpriteAssetsStore();
    const parsed = statePlugin.parse(block(['sprite Netw jar:archimate/network', 'state Foo']), { assetStore });
    expect('refused' in parsed).toBe(false);
    expect((parsed as StateDiagramAST).sprites?.internal?.get('archimate/network')).toBeDefined();
  });
});
