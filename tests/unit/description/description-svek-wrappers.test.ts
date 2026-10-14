/**
 * T3 (description-svek-wrappers): the plain-family protection nesting and
 * title TABLE `buildDotClusters` hands the layout builder and the DOT emitter,
 * pinned against cached jar DOT.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDotString.java:91-155
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSync } from '../../../src/index.js';
import { setLayoutInputObserver, type LayoutInputEvent } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.types.js';
import { toSvekDot } from '../../../src/core/svek-dot-emit.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { combineAssetStores } from '../../../src/core/asset-store.js';
import { buildSpriteAssetsStore } from '../../../scripts/sprite-assets-store.js';
import { buildEmojiAssetsStore } from '../../../scripts/emoji-assets-store.js';
import { buildUtilityAssetsStore } from '../../../scripts/utility-assets-store.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { layoutParity } from '../../oracle/layout-parity.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const CACHE = join(REPO, 'test-results', 'dot-cache');
const hasCorpus = existsSync(CACHE);
const ASSET_STORE = combineAssetStores(buildSpriteAssetsStore(), buildEmojiAssetsStore(), buildUtilityAssetsStore());

function readJarDot(tree: string, slug: string): string {
  return readFileSync(join(CACHE, tree, slug, 'svek-1.dot'), 'utf-8');
}

function captureMarkup(markup: string): DotInputGraph[] {
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

function captureOurs(tree: string, slug: string): DotInputGraph[] {
  return captureMarkup(readFileSync(join(CACHE, tree, slug, 'in.puml'), 'utf-8'));
}

describe.skipIf(!hasCorpus)('description plain-family wrappers vs cached jar DOT', () => {
  it('bamami: layout-equal, p0 > base(TABLE 17x23) > p1 in the emitted DOT', () => {
    const [ours] = captureOurs('unknown', 'bamami-10-lava790');
    expect(layoutParity(readJarDot('unknown', 'bamami-10-lava790'), ours!)).toEqual({ equal: true });
    const dot = toSvekDot(ours!);
    expect(dot).toMatch(
      /subgraph cluster(\d+)p0 \{label="";\s*subgraph cluster\1 \{[^\n]*label=<<TABLE[^>]*WIDTH="17" HEIGHT="23"[\s\S]*?subgraph cluster\1p1 \{label="";/,
    );
    expect(dot).not.toMatch(/cluster\d+a \{/);
  });

  it('xagonu: cluster nesting now matches (12 vs 12); the residual is one root cluster bb', () => {
    const ours = captureOurs('unknown', 'xagonu-36-sudi116');
    const r = layoutParity(readJarDot('unknown', 'xagonu-36-sudi116'), ours[0]!);
    expect(r.firstDiff?.detail).toMatch(/^jar 12 vs ours 12; /);
  });

  it('a group that is a link endpoint gets innerMarginLevels 2 and an unwrapped anchor (balipa)', () => {
    const [ours] = captureOurs('component', 'balipa-82-feto843');
    const linked = (ours!.clusters ?? []).filter((c) => c.innerMarginLevels === 2);
    expect(linked.length).toBeGreaterThan(0);
    for (const c of linked) {
      expect(c.unwrappedNodeId).toBeDefined();
      expect(c.nodeIds).toContain(c.unwrappedNodeId);
    }
    // jar: `cluster7a` wraps the linked group, `zaent0004` sits before `cluster7i`.
    const jar = readJarDot('component', 'balipa-82-feto843');
    expect(jar).toMatch(/subgraph cluster7a \{/);
    expect(toSvekDot(ours!)).toMatch(/subgraph cluster\d+a \{/);
    const unlinked = (ours!.clusters ?? []).filter((c) => c.innerMarginLevels === 1);
    for (const c of unlinked) expect(c.unwrappedNodeId).toBeUndefined();
  });

  it('a plain group without links gets innerMarginLevels 1', () => {
    const [g] = captureMarkup('@startuml\npackage P {\n[A]\n}\n@enduml');
    const [c] = g!.clusters ?? [];
    expect(c?.innerMarginLevels).toBe(1);
    expect(c?.unwrappedNodeId).toBeUndefined();
    expect(c?.titleTableWidth).toBeGreaterThan(0);
    expect(c?.labelWidth).toBe(c?.titleTableWidth);
    expect(c?.labelHeight).toBe(c?.titleTableHeight);
  });

  it('an anonymous group keeps label-less, table-less shape (mefule)', () => {
    const [ours] = captureOurs('unknown', 'mefule-86-calo549');
    const anon = (ours!.clusters ?? []).filter((c) => c.label === undefined);
    expect(anon.length).toBeGreaterThan(0);
    for (const c of anon) expect(c.titleTableWidth).toBeUndefined();
  });

  it('port family: no protection levels, no cluster title table; the TABLE rides the rect anchor', () => {
    const [ours] = captureOurs('component', 'repoge-41-demu604');
    const ports = (ours!.clusters ?? []).filter((c) => c.portRanks !== undefined);
    expect(ports.length).toBe(1);
    expect(ports[0]!.innerMarginLevels).toBeUndefined();
    expect(ports[0]!.titleTableWidth).toBeUndefined();
    const anchor = ours!.nodes.find((n) => n.id === ports[0]!.portAnchorId);
    // jar: `zaent0001 [shape=rect,width=.01,height=.01,label=<TABLE ... WIDTH="128" HEIGHT="23">`
    expect(readJarDot('component', 'repoge-41-demu604')).toMatch(
      /zaent0001 \[shape=rect,width=\.01,height=\.01,label=<<TABLE[^>]*WIDTH="128" HEIGHT="23"/,
    );
    expect([anchor?.titleLabelWidth, anchor?.titleLabelHeight]).toEqual([128, 23]);
    expect(toSvekDot(ours!)).toMatch(
      /zaent0001 \[shape=rect,width=\.01,height=\.01,label=<<TABLE[^>]*WIDTH="128" HEIGHT="23"/,
    );
  });

  it.each(['fopako-15-labi027', 'perapa-23-mobu798'])('port fixture %s is layout-equal', (slug) => {
    const [ours] = captureOurs('component', slug);
    expect(layoutParity(readJarDot('component', slug), ours!)).toEqual({ equal: true });
  });

  it('port group that is a link endpoint still lacks the a/i pair (core: stop 7)', () => {
    // jar repoge: `cluster6a {... cluster6ee {... cluster6i {`; the layout builder ignores
    // borderPointAncestorWrap without portRanksLabelOnEe, so cluster subgraphs: jar 4 vs ours 2.
    const [ours] = captureOurs('component', 'repoge-41-demu604');
    const r = layoutParity(readJarDot('component', 'repoge-41-demu604'), ours!);
    expect(r.firstDiff).toEqual({ component: 'clusterTree', detail: 'cluster subgraphs: jar 4 vs ours 2' });
  });

  it('kermor family: gamma title TABLE dims, no protection or a/i levels', () => {
    const [ours] = captureOurs('component', 'fojamu-08-veku866');
    expect(ours!.kermor).toBe(true);
    const clusters = ours!.clusters ?? [];
    expect(clusters.length).toBe(1);
    // jar fojamu gamma: `label=<<TABLE ... WIDTH="128" HEIGHT="23">`
    expect(readJarDot('component', 'fojamu-08-veku866')).toMatch(/cluster6gamma[\s\S]*WIDTH="128" HEIGHT="23"/);
    expect([clusters[0]!.labelWidth, clusters[0]!.labelHeight]).toEqual([128, 23]);
    expect(clusters[0]!.innerMarginLevels).toBeUndefined();
    expect(clusters[0]!.borderPointAncestorWrap).toBeUndefined();
  });
});
