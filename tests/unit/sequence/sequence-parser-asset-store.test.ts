/**
 * D6 (cdd6-T1c): `parseSequence` threads `ParseOptions.assetStore` into the
 * sprite registry — `sequencePlugin.parse` previously dropped `ParseOptions`
 * entirely (`return parseSequence(source.lines);`), so `sprite Netw
 * jar:archimate/network` always resolved to nothing even when
 * `RenderOptions.assetStore` was supplied. Mirrors
 * `class/class-parser-asset-store.test.ts` (C-3, cdd3-T23), one engine over.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandSpriteFile.java:108-112
 */
import { describe, it, expect } from 'vitest';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { sequencePlugin } from '../../../src/diagrams/sequence/index.js';
import { buildSpriteAssetsStore } from '../../helpers/sprite-assets-store.js';
import type { SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

const LINES = ['sprite Netw jar:archimate/network', 'A -> B'];

describe('D6 — parseSequence threads ParseOptions.assetStore into the sprite registry', () => {
  it('with no options, the registry carries no internal store (pre-fix behavior unchanged)', () => {
    const ast = parseSequence(LINES);
    expect('refused' in ast).toBe(false);
    expect((ast as SequenceDiagramAST).sprites?.internal).toBeUndefined();
  });

  it('with assetStore, the registry resolves `jar:archimate/network`', () => {
    const assetStore = buildSpriteAssetsStore();
    const ast = parseSequence(LINES, { assetStore });
    expect('refused' in ast).toBe(false);
    const sprites = (ast as SequenceDiagramAST).sprites;
    expect(sprites?.internal).toBeDefined();
    expect(sprites?.internal?.get('archimate/network')).toBeDefined();
    expect(sprites?.byName.has('Netw')).toBe(true);
  });

  it('sequencePlugin.parse forwards options.assetStore to parseSequence (D6 plugin wiring)', () => {
    const assetStore = buildSpriteAssetsStore();
    const source: UmlSource = { lines: LINES, type: 'sequence' };
    const parsed = sequencePlugin.parse(source, { assetStore });
    expect('refused' in parsed).toBe(false);
    expect((parsed as SequenceDiagramAST).sprites?.internal?.get('archimate/network')).toBeDefined();
  });
});
