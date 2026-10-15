import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, render } from '@knowvah/dot-engine';
import { renderSync } from '../../../src/index.js';
import { setLayoutInputObserver, type LayoutInputEvent } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.types.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { combineAssetStores } from '../../../src/core/asset-store.js';
import { buildSpriteAssetsStore } from '../../../scripts/sprite-assets-store.js';
import { buildEmojiAssetsStore } from '../../../scripts/emoji-assets-store.js';
import { buildUtilityAssetsStore } from '../../../scripts/utility-assets-store.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { dotTextSummary, layoutParity, layoutParityPages, MAX_DETAIL } from '../../oracle/layout-parity.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const CACHE = join(REPO, 'test-results', 'dot-cache');
const hasCorpus = existsSync(CACHE);
// `.claude/worktrees/<name>` -> the main checkout, where b0's untracked data lives.
const NATIVE_DIRS = [
  join(REPO, 'plans/description-svek-wrappers/measurements/b0-native'),
  join(REPO, '../../../plans/description-svek-wrappers/measurements/b0-native'),
];
const nativeDir = NATIVE_DIRS.find((d) => existsSync(d));

// Same sprite/emoji/utility stores as the survey's renderOneMode
// (scripts/svg-parity-survey.ts:73-78,303-311).
const ASSET_STORE = combineAssetStores(buildSpriteAssetsStore(), buildEmojiAssetsStore(), buildUtilityAssetsStore());

function fixtureDir(tree: string, slug: string): string {
  return join(CACHE, tree, slug);
}

function readJarDot(tree: string, slug: string, index = 1): string {
  return readFileSync(join(fixtureDir(tree, slug), `svek-${index}.dot`), 'utf-8');
}

/** The top-level (`nestedDepth === 0`) layout graphs one render hands the engine. */
function captureOurs(tree: string, slug: string): DotInputGraph[] {
  const markup = readFileSync(join(fixtureDir(tree, slug), 'in.puml'), 'utf-8');
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
  return events.filter((e) => e.nestedDepth === 0).map((e) => e.graph);
}

const CONTROLS: readonly [string, string][] = [
  ['component', 'xenusu-76-sabi405'],
  ['state', 'pavuzo-79-zodu430'],
  ['unknown', 'rubebe-45-sura795'],
  ['class', 'zuduxu-90-kosi876'],
];

describe.skipIf(!hasCorpus)('layoutParity over cached jar DOT', () => {
  it.each(CONTROLS)('control %s/%s is layout-equal', (tree, slug) => {
    const ours = captureOurs(tree, slug);
    expect(ours.length).toBeGreaterThan(0);
    expect(
      layoutParityPages([readJarDot(tree, slug, 1), ...(ours.length > 1 ? [readJarDot(tree, slug, 2)] : [])], ours),
    ).toEqual({
      equal: true,
    });
  });

  it('bamami is layout-equal once description emits the jar wrapper chain (dsw T3)', () => {
    const [ours] = captureOurs('unknown', 'bamami-10-lava790');
    expect(layoutParity(readJarDot('unknown', 'bamami-10-lava790'), ours!)).toEqual({ equal: true });
  });

  // codd-T9 emits the two self links the jar has (sh0050, zaent0019), which
  // closed the 6px root cluster bb diff this test used to pin.
  it('xagonu equals the jar once its self links are emitted (codd-T9)', () => {
    const [ours] = captureOurs('unknown', 'xagonu-36-sudi116');
    const r = layoutParity(readJarDot('unknown', 'xagonu-36-sudi116'), ours!);
    expect(r.firstDiff).toBeUndefined();
  });

  it('is deterministic: identical inputs give deep-equal results', () => {
    const [ours] = captureOurs('unknown', 'bamami-10-lava790');
    const jar = readJarDot('unknown', 'bamami-10-lava790');
    expect(layoutParity(jar, ours!)).toEqual(layoutParity(jar, ours!));
  });
});

describe.skipIf(!hasCorpus || nativeDir === undefined)(
  'jar-side layout vs native dot -Tdot 16.1.0 (D2, stop 8)',
  () => {
    it.each([
      ['unknown', 'bamami-10-lava790'],
      ['component', 'xenusu-76-sabi405'],
    ] as const)('%s/%s bb and edge pos agree with native', (tree, slug) => {
      const engine = dotTextSummary(render(parse(readJarDot(tree, slug)), 'dot'));
      const native = dotTextSummary(readFileSync(join(nativeDir!, `${slug}.dot`), 'utf-8'));
      expect(engine.bb).not.toBe('');
      expect(engine).toEqual(native);
    });
  },
);

describe('layoutParity on synthetic graphs', () => {
  const node = (id: string) => ({ id, width: 40, height: 30 });
  const plain: DotInputGraph = { nodes: [node('a'), node('b')], edges: [{ id: 'e', from: 'a', to: 'b' }] };

  it('reports equal for a graph and the DOT it corresponds to', () => {
    const jar =
      'digraph g { a [shape=rect,width=0.555556,height=0.416667]; b [shape=rect,width=0.555556,height=0.416667]; a -> b; }';
    expect(layoutParity(jar, plain)).toEqual({ equal: true });
  });

  it('reports a nodeSizes difference after clusterTree and bb agree', () => {
    const jar = 'digraph g { a [shape=rect,width=1,height=1]; b [shape=rect,width=1,height=1]; a -> b; }';
    const r = layoutParity(jar, plain);
    expect(r.equal).toBe(false);
    expect(r.firstDiff?.component === 'bb' || r.firstDiff?.component === 'nodeSizes').toBe(true);
  });

  it('reports a node-count difference at bb, the first component both sides disagree on', () => {
    const jar = 'digraph g { a [shape=rect,width=0.555556,height=0.416667]; }';
    const one: DotInputGraph = { nodes: [node('a')], edges: [] };
    const two: DotInputGraph = { nodes: [node('a'), node('b')], edges: [] };
    expect(layoutParity(jar, one)).toEqual({ equal: true });
    expect(layoutParity(jar, two).firstDiff).toEqual({
      component: 'bb',
      detail: 'jar 0,0,40.000032000000004,30.000024 vs ours 0,0,98.000032,30.000024',
    });
  });

  it('reports an empty candidate graph against a non-empty jar graph', () => {
    const r = layoutParity('digraph g { a; }', { nodes: [], edges: [] });
    expect(r.equal).toBe(false);
  });

  it('clips firstDiff.detail to the contract limit', () => {
    const many = Array.from({ length: 40 }, (_, i) => `n${i} [width=${i + 1}.123456789];`).join(' ');
    const r = layoutParity(`digraph g { ${many} }`, plain);
    expect(r.firstDiff?.detail.length).toBeLessThanOrEqual(MAX_DETAIL);
  });
});

describe('layoutParityPages', () => {
  const g: DotInputGraph = { nodes: [{ id: 'a', width: 40, height: 30 }], edges: [] };
  const jar = 'digraph g { a [shape=rect,width=0.555556,height=0.416667]; }';

  it('pairs pages by index and passes when each page is equal', () => {
    expect(layoutParityPages([jar, jar], [g, g])).toEqual({ equal: true });
  });

  it('reports a page-count mismatch as clusterTree', () => {
    expect(layoutParityPages([jar], [g, g])).toEqual({
      equal: false,
      firstDiff: { component: 'clusterTree', detail: 'page count: jar 1 vs ours 2' },
    });
  });

  it('prefixes the failing page number', () => {
    const r = layoutParityPages([jar, 'digraph g { a; b; }'], [g, g]);
    expect(r.firstDiff?.detail.startsWith('page 2: ')).toBe(true);
  });
});

describe('dotTextSummary', () => {
  it('reads the graph bb and sorted edge pos strings, with unrouted edges as empty', () => {
    const text = [
      'digraph g {',
      '\tgraph [bb="0,0,10,20"];',
      '\ta -> b\t[label="x ] y", pos="2,2 3,3"];',
      '\ta -> c\t[pos="1,1 5,5"];',
      '\tb -> c;',
      '}',
    ].join('\n');
    expect(dotTextSummary(text)).toEqual({ bb: '0,0,10,20', edgePos: ['1,1 5,5', '2,2 3,3'] });
  });
});

describe('cluster tree reading', () => {
  const graph: DotInputGraph = {
    nodes: [{ id: 'a', width: 40, height: 30 }],
    edges: [],
    clusters: [{ id: 'c', nodeIds: ['a'] }],
  };
  const plainJar = 'digraph g { subgraph cluster1 { label=""; a [shape=rect,width=0.555556,height=0.416667]; } }';
  const wrappedJar =
    'digraph g { subgraph cluster1p0 { label=""; subgraph cluster1 { label=""; a [shape=rect,width=0.555556,height=0.416667]; } } }';

  it('treats a plain cluster as equal to the same plain cluster', () => {
    expect(layoutParity(plainJar, graph)).toEqual({ equal: true });
  });

  it('names the subgraph count when the jar wraps a cluster and ours does not', () => {
    expect(layoutParity(wrappedJar, graph).firstDiff).toEqual({
      component: 'clusterTree',
      detail: 'cluster subgraphs: jar 2 vs ours 1',
    });
  });

  it('names the wrapper chain when counts match but the wrapper differs', () => {
    const innerJar =
      'digraph g { subgraph cluster1p0 { label=""; subgraph cluster1 { label=""; subgraph cluster1i { label=""; a [shape=rect,width=0.555556,height=0.416667]; } } } }';
    const outerGraph: DotInputGraph = { ...graph, clusters: [{ id: 'c', nodeIds: ['a'], innerMarginLevels: 1 }] };
    const detail = layoutParity(innerJar, outerGraph).firstDiff?.detail ?? '';
    expect(detail).toMatch(/depth 0 wrappers -\/p0\/i\/- bb .* vs ours depth 0 wrappers -\/p0\/-\/p1 bb /);
  });
});
