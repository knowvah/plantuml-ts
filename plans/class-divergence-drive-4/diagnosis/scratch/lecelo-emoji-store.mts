/**
 * cdd4-T5 lecelo probe: render with the survey's store (sprites only) vs
 * sprites + emoji artwork, and report the compareSvg diff and the element
 * shape drawn for ent0003.
 * `npx jiti plans/class-divergence-drive-4/diagnosis/scratch/lecelo-emoji-store.mts`
 */
import { readFileSync } from 'node:fs';
import { renderSync } from '../../../../src/index.js';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { combineAssetStores } from '../../../../src/core/asset-store.js';
import { buildSpriteAssetsStore } from '../../../../scripts/sprite-assets-store.js';
import { buildEmojiAssetsStore } from '../../../../scripts/emoji-assets-store.js';
import { fixtureIncludeStore } from '../../../../tests/helpers/fixture-include-store.js';
import { compareSvg } from '../../../../tests/oracle/svg-conformance/compare.js';

const slug = process.argv[2] ?? 'lecelo-92-loma110';
const dir = `test-results/dot-cache/class/${slug}`;
const markup = readFileSync(`${dir}/in.puml`, 'utf-8');
const jar = readFileSync(`${dir}/in.svg`, 'utf-8');
const stores = {
  'sprites-only (survey)': buildSpriteAssetsStore(),
  'sprites+emoji': combineAssetStores(buildSpriteAssetsStore(), buildEmojiAssetsStore()),
};
for (const [name, store] of Object.entries(stores)) {
  const svg = renderSync(markup, { measurer: new DeterministicMeasurer(), assetStore: store, includeStore: fixtureIncludeStore() });
  const { diffs } = compareSvg(svg, jar, 'deterministic');
  const s = diffs.filter((d) => d.delta === undefined).length;
  const i = svg.indexOf('id="ent0003"');
  const g = svg.slice(i, svg.indexOf('</g>', i));
  const tags = [...g.matchAll(/<(\w+)[ >]/g)].map((m) => m[1]).join(',');
  console.log(`${name}: structural=${s} numeric=${diffs.length - s} ent0003 tags=[${tags}]`);
}
