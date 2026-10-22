/**
 * Layout-parity RATCHET (description-svek-wrappers D3, T2).
 *
 * Every row pinned in `oracle/goldens/svg-conformance/layout-parity-baseline.json`
 * must stay layout-equal: our `DotInputGraph` (captured through
 * `setLayoutInputObserver`, post-`withSameContainerConstraints`) lays out under
 * dot-engine to the same cluster tree, bb, node sizes/positions and edge `pos` as
 * the jar's cached `svek-N.dot` (`tests/oracle/layout-parity.ts`).
 *
 * Pin population (D3 clarification, 2026-10-14): the description-family trees
 * (`component`, `usecase`, `c4`, and `unknown` rows whose routing-baseline
 * `ourType` is DESCRIPTION) plus the four controls. Class/object/state carry
 * byte-exact SVG ratchets that subsume layout equality.
 *
 * Shrink-only: rows are added at batch closes by the orchestrator, never removed
 * to make the gate pass. Skips cleanly without `test-results/dot-cache`.
 * The capture mirrors scripts/svg-parity-survey.ts#renderFrame (same stores).
 */
import { describe, it, expect, vi } from 'vitest';
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
import { computeLayoutEqual } from '../../../scripts/lib/survey-layout-equal.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { CI_RENDER_BUDGET_MS } from '../../helpers/ci-test-budgets.js';

// Renders past half of vitest's 5s default on the CI runner (worst observed:
// unknown/migene-71-rogu145, 4,387ms);
// derivation in tests/helpers/ci-test-budgets.ts.
vi.setConfig({ testTimeout: CI_RENDER_BUDGET_MS });

interface PinnedRow {
  tree: string;
  slug: string;
  addedAt: string;
}

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const CACHE = join(REPO, 'test-results', 'dot-cache');
const BASELINE = join(REPO, 'oracle/goldens/svg-conformance/layout-parity-baseline.json');
const ASSET_STORE = combineAssetStores(buildSpriteAssetsStore(), buildEmojiAssetsStore(), buildUtilityAssetsStore());

const rows = (JSON.parse(readFileSync(BASELINE, 'utf8')) as { fixtures: PinnedRow[] }).fixtures;
const hasCorpus = existsSync(CACHE);

function jarDots(dir: string): string[] {
  const dots: string[] = [];
  for (let i = 1; existsSync(join(dir, `svek-${i}.dot`)); i++)
    dots.push(readFileSync(join(dir, `svek-${i}.dot`), 'utf8'));
  return dots;
}

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

describe.skipIf(!hasCorpus)('layout-parity ratchet', () => {
  it('pins at least one row', () => {
    expect(rows.length).toBeGreaterThan(0);
  });

  it.each(rows.map((r) => [r.tree, r.slug] as const))('%s/%s stays layout-equal to the jar', (tree, slug) => {
    const dir = join(CACHE, tree, slug);
    const markup = readFileSync(join(dir, 'in.puml'), 'utf8');
    const r = computeLayoutEqual(jarDots(dir), capture(markup), false, markup);
    expect(r.layoutEqual, `first diff: ${JSON.stringify(r.layoutFirstDiff)}`).toBe(true);
  });
});
