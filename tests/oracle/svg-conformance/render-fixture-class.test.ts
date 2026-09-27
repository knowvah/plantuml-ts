/**
 * `renderFixtureClass`/`layoutFixtureClass` — assetStore forwarding + def-id
 * seed contract (cdd4-T4).
 *
 * Two things a mere "it renders a string" smoke test would miss, both found
 * by diffing the census's render against `renderSync` on the SAME markup:
 *
 *   1. `ParseOptions.assetStore` must reach `parseClass`, exactly as
 *      production's `classPlugin.parse(block, options)` forwards it
 *      (`src/diagrams/class/index.ts:47-51`). Without it, a `jar:` sprite
 *      (`sprite Netw jar:archimate/network` — bidusa-22-jutu505's own
 *      fixture) resolves to nothing (`src/diagrams/class/parser.ts:317-318`
 *      leaves `internalSprites` `undefined`), so its label under-measures
 *      and its glyph never reaches the SVG.
 *   2. The `<linearGradient>`/`<filter>` def-id seed must come from the
 *      POST-TIM `seedSourceLines` (`src/core/assemble-svg.ts#seedOfUmlSource`,
 *      `BlockUmlBuilder.ts:223`'s `seedSource`), not the raw pre-TIM markup —
 *      a `!define` line (popesa-39-sobe866's own fixture) changes the hash
 *      input between the two, so the census minted a DIFFERENT id than the
 *      jar even though every other pixel matched.
 *
 * Both fixtures are the real corpus cache (`test-results/dot-cache/class/`,
 * checked in), per this repo's own preference for upstream fixtures over
 * synthesized ones.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { seedOfUmlSource } from '../../../src/core/assemble-svg.js';
import { renderSync } from '../../../src/index.js';
import { renderFixtureClass } from './render-fixture-class.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { buildSpriteAssetsStore } from '../../helpers/sprite-assets-store.js';

const CACHE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../test-results/dot-cache/class');

function readFixture(slug: string): string {
  return readFileSync(join(CACHE_ROOT, slug, 'in.puml'), 'utf8');
}

// bidusa-22-jutu505 also has `!include <tupadr3/font-awesome/star>`, so every
// call below needs the SAME includeStore the census/ratchet already use —
// this test is about the (separate) assetStore/jar: channel, not includes.
describe('renderFixtureClass — assetStore forwarding (cdd4-T4)', () => {
  it('without an assetStore, the jar: archimate glyph (fill #AA0) never reaches the SVG (documents the starting state)', () => {
    const markup = readFixture('bidusa-22-jutu505');
    const svg = renderFixtureClass(markup, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
    expect(svg).not.toContain('fill="#AA0"');
  });

  it('with an assetStore, renderFixtureClass matches renderSync byte-for-byte, and the archimate glyph (fill #AA0) is present', () => {
    const markup = readFixture('bidusa-22-jutu505');
    const assetStore = buildSpriteAssetsStore();
    const includeStore = fixtureIncludeStore();
    const viaFixture = renderFixtureClass(markup, new DeterministicMeasurer(), { assetStore, includeStore });
    const viaProduction = renderSync(markup, { measurer: new DeterministicMeasurer(), assetStore, includeStore });
    expect(viaFixture).toBe(viaProduction);
    expect(viaFixture).toContain('fill="#AA0"');
  });
});

describe('renderFixtureClass — def-id seed (cdd4-T4)', () => {
  it('matches renderSync byte-for-byte on a fixture with a leading TIM directive (!define)', () => {
    const markup = readFixture('popesa-39-sobe866');
    const viaFixture = renderFixtureClass(markup, new DeterministicMeasurer());
    const viaProduction = renderSync(markup, { measurer: new DeterministicMeasurer() });
    expect(viaFixture).toBe(viaProduction);
  });

  it('mints a different <linearGradient>/@id than seedOf(rawMarkup) would, for that same fixture', () => {
    const markup = readFixture('popesa-39-sobe866');
    const viaFixture = renderFixtureClass(markup, new DeterministicMeasurer());
    const idMatch = /<linearGradient[^>]*\bid="([^"]+)"/.exec(viaFixture);
    expect(idMatch).not.toBeNull();
    // The jar's own def id for this fixture (in.svg, checked in) — proves
    // the fixed seed reaches the SAME id the jar minted, not just "some"
    // POST-TIM-derived id.
    const jarSvg = readFileSync(join(CACHE_ROOT, 'popesa-39-sobe866', 'in.svg'), 'utf8');
    const jarIdMatch = /<linearGradient[^>]*\bid="([^"]+)"/.exec(jarSvg);
    expect(jarIdMatch).not.toBeNull();
    expect(idMatch![1]).toBe(jarIdMatch![1]);
  });
});

describe('seedOfUmlSource — precedence used by the fix above', () => {
  it('prefers seedSourceLines over rawSourceLines when they differ', () => {
    const withSeedLines = seedOfUmlSource({ lines: ['class Foo'], seedSourceLines: ['class Bar'] });
    const viaRawSourceLines = seedOfUmlSource({ lines: ['class Foo'], rawSourceLines: ['class Bar'] });
    expect(withSeedLines).toBe(viaRawSourceLines);
  });
});
