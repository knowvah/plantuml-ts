import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSync } from '../../../src/index.js';
import { setLayoutInputObserver, type LayoutInputEvent } from '../../../src/core/graph-layout.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { combineAssetStores } from '../../../src/core/asset-store.js';
import { buildSpriteAssetsStore } from '../../../scripts/sprite-assets-store.js';
import { buildEmojiAssetsStore } from '../../../scripts/emoji-assets-store.js';
import { buildUtilityAssetsStore } from '../../../scripts/utility-assets-store.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { computeLayoutEqual } from '../../../scripts/lib/survey-layout-equal.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const CACHE = join(REPO, 'test-results', 'dot-cache');
const hasCorpus = existsSync(CACHE);
const ASSET_STORE = combineAssetStores(buildSpriteAssetsStore(), buildEmojiAssetsStore(), buildUtilityAssetsStore());

function capture(markup: string): LayoutInputEvent[] {
  const events: LayoutInputEvent[] = [];
  setLayoutInputObserver((e) => events.push(e));
  try {
    renderSync(markup, {
      measurer: new DeterministicMeasurer(),
      assetStore: ASSET_STORE,
      includeStore: fixtureIncludeStore(),
    });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return events;
}

function fixture(tree: string, slug: string): { markup: string; dots: string[]; events: LayoutInputEvent[] } {
  const dir = join(CACHE, tree, slug);
  const markup = readFileSync(join(dir, 'in.puml'), 'utf-8');
  const dots: string[] = [];
  for (let i = 1; existsSync(join(dir, `svek-${i}.dot`)); i++)
    dots.push(readFileSync(join(dir, `svek-${i}.dot`), 'utf-8'));
  return { markup, dots, events: capture(markup) };
}

const CONTROLS: readonly [string, string][] = [
  ['component', 'xenusu-76-sabi405'],
  ['state', 'pavuzo-79-zodu430'],
  ['unknown', 'rubebe-45-sura795'],
  ['class', 'zuduxu-90-kosi876'],
];

describe('computeLayoutEqual (synthetic cases)', () => {
  it('is n/a when the fixture is oracle-blind', () => {
    expect(computeLayoutEqual(['digraph{}'], [], true, '')).toEqual({ layoutEqual: 'n/a' });
  });

  it('is n/a when the jar dumped no svek DOT', () => {
    expect(computeLayoutEqual([], [], false, '')).toEqual({ layoutEqual: 'n/a' });
  });

  it('is n/a when the page counts differ (no newpage)', () => {
    expect(computeLayoutEqual(['digraph{}', 'digraph{}'], [], false, '')).toEqual({ layoutEqual: 'n/a' });
  });
});

describe.skipIf(!hasCorpus)('computeLayoutEqual over cached jar DOT', () => {
  it.each(CONTROLS)('control %s/%s is layout-equal', (tree, slug) => {
    const f = fixture(tree, slug);
    expect(computeLayoutEqual(f.dots, f.events, false, f.markup)).toEqual({ layoutEqual: true });
  });

  it('bamami is layout-equal once description emits the p0/p1 wrappers (dsw T3)', () => {
    const f = fixture('unknown', 'bamami-10-lava790');
    expect(computeLayoutEqual(f.dots, f.events, false, f.markup)).toEqual({ layoutEqual: true });
  });

  // codd-T9 emits xagonu's two self links; its layout now equals the jar's.
  it('xagonu is layout-equal (codd-T9 self links)', () => {
    const f = fixture('unknown', 'xagonu-36-sudi116');
    const r = computeLayoutEqual(f.dots, f.events, false, f.markup);
    expect(r.layoutEqual).toBe(true);
    expect(r.layoutFirstDiff).toBeUndefined();
  });

  it('a doctored graph (extra node) reports unequal', () => {
    const f = fixture('component', 'xenusu-76-sabi405');
    const doctored = f.events.map((e) =>
      e.nestedDepth === 0
        ? { ...e, graph: { ...e.graph, nodes: [...e.graph.nodes, { ...e.graph.nodes[0]!, id: 'zzdoctored' }] } }
        : e,
    );
    expect(computeLayoutEqual(f.dots, doctored, false, f.markup).layoutEqual).toBe(false);
  });

  it('a newpage source compares only the first dots.length pages', () => {
    const f = fixture('unknown', 'racujo-01-veme537');
    expect(f.dots).toHaveLength(1);
    expect(f.events.filter((e) => e.nestedDepth === 0).length).toBeGreaterThan(1);
    expect(computeLayoutEqual(f.dots, f.events, false, f.markup).layoutEqual).not.toBe('n/a');
  });
});
