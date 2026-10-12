/**
 * `npx jiti plans/salt-engine-port/measurements/T5a/probe-diff.mts <name...>`
 * Renders `tests/fixtures/salt/<name>.puml` through render-diff's production
 * call and prints compareSvg's structural/numeric diffs against `<name>.svg`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { combineAssetStores } from '../../../../src/core/asset-store.js';
import { buildSpriteAssetsStore } from '../../../../scripts/sprite-assets-store.js';
import { buildEmojiAssetsStore } from '../../../../scripts/emoji-assets-store.js';
import { compareSvg } from '../../../../tests/oracle/svg-conformance/compare.js';
import { formatDiffLine, renderFixture, splitDiffs } from '../../../class-divergence-drive/tools/render-diff.mts';

const repo = join(import.meta.dirname, '..', '..', '..', '..');
const store = combineAssetStores(buildSpriteAssetsStore(), buildEmojiAssetsStore());
for (const name of process.argv.slice(2)) {
  const base = name.startsWith('./') ? join(import.meta.dirname, name.slice(2)) : join(repo, 'tests', 'fixtures', 'salt', name);
  const svg = renderFixture(readFileSync(`${base}.puml`, 'utf-8'), store);
  writeFileSync(join(import.meta.dirname, `${name.replace('./', '')}.ours.svg`), svg);
  const { pass, diffs } = compareSvg(svg, readFileSync(`${base}.svg`, 'utf-8'), 'deterministic');
  const { structural, numeric } = splitDiffs(diffs);
  console.log(`\n### probe/${name}  pass=${pass} structural=${structural.length} numeric=${numeric.length}`);
  for (const d of [...structural, ...numeric]) console.log(formatDiffLine(d));
}
