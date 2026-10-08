/**
 * D6 (cdd6-T1c): `parseJson`/`parseYaml`/`parseHcl` all thread
 * `ParseOptions.assetStore` into the sprite registry via the SHARED
 * `jsonSpriteRegistryFor` helper (json/parser.ts) — each plugin's `parse`
 * previously dropped `ParseOptions` entirely, so `sprite Netw
 * jar:archimate/network` always resolved to nothing even when
 * `RenderOptions.assetStore` was supplied. Mirrors
 * `class/class-parser-asset-store.test.ts` (C-3, cdd3-T23), three engines
 * over.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandSpriteFile.java:108-112
 */
import { describe, it, expect } from 'vitest';
import { parseJson } from '../../../src/diagrams/json/parser.js';
import { parseYaml } from '../../../src/diagrams/yaml/parser.js';
import { parseHcl } from '../../../src/diagrams/hcl/parser.js';
import { jsonPlugin } from '../../../src/diagrams/json/index.js';
import { yamlPlugin } from '../../../src/diagrams/yaml/index.js';
import { hclPlugin } from '../../../src/diagrams/hcl/index.js';
import { buildSpriteAssetsStore } from '../../helpers/sprite-assets-store.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

function block(type: 'json' | 'yaml' | 'hcl', lines: readonly string[]): UmlSource {
  return { lines: [...lines], type };
}

describe.each([
  ['json', ['sprite Netw jar:archimate/network', '{"a":1}'], parseJson, jsonPlugin] as const,
  ['yaml', ['sprite Netw jar:archimate/network', 'a: 1'], parseYaml, yamlPlugin] as const,
  ['hcl', ['sprite Netw jar:archimate/network', 'a = 1'], parseHcl, hclPlugin] as const,
])('D6 — parse%s threads ParseOptions.assetStore into the sprite registry', (type, lines, parseFn, plugin) => {
  it('with no options, the registry carries no internal store (pre-fix behavior unchanged)', () => {
    const ast = parseFn(block(type, lines));
    expect(ast.sprites?.internal).toBeUndefined();
  });

  it('with assetStore, the registry resolves `jar:archimate/network`', () => {
    const assetStore = buildSpriteAssetsStore();
    const ast = parseFn(block(type, lines), { assetStore });
    expect(ast.sprites?.internal).toBeDefined();
    expect(ast.sprites?.internal?.get('archimate/network')).toBeDefined();
    // unwind-U1: the json family has no command table, so the `sprite` line
    // itself is payload (StyleExtractor.java:63-103; jar:
    // tests/fixtures/unwind-U1/json-sprite-stdlib) -- nothing is defined.
    expect(ast.sprites?.byName.has('Netw')).toBe(false);
  });

  it(`${type}Plugin.parse forwards options.assetStore (D6 plugin wiring)`, () => {
    const assetStore = buildSpriteAssetsStore();
    const parsed = plugin.parse(block(type, lines), { assetStore });
    expect('refused' in parsed).toBe(false);
    if (!('refused' in parsed)) {
      expect(parsed.sprites?.internal?.get('archimate/network')).toBeDefined();
    }
  });
});
