/**
 * cdd4-T9 residual probe: renders lecelo-92-loma110 with the combined
 * sprite+emoji store (post-fix) and dumps ent0003's full diff list plus its
 * `<g>` contents side-by-side with the jar's own. See
 * `../lecelo-header-line-stacking-residual.md` for the mechanism this
 * isolates (line 1 byte-identical; lines 2/3 each short by a cumulative
 * 8.75px, `class-stereotype-layout.ts#headerLineY`'s flat `i*fontSize` step).
 * `npx jiti plans/class-divergence-drive-4/diagnosis/scratch/lecelo-header-stacking-residual.mts`
 */
import { readFileSync } from 'node:fs';
import { renderSync } from '../../../../src/index.js';
import { WidthTableMeasurer } from '../../../../src/core/measurer.js';
import { combineAssetStores } from '../../../../src/core/asset-store.js';
import { buildSpriteAssetsStore } from '../../../../scripts/sprite-assets-store.js';
import { buildEmojiAssetsStore } from '../../../../scripts/emoji-assets-store.js';
import { fixtureIncludeStore } from '../../../../tests/helpers/fixture-include-store.js';
import { compareSvg } from '../../../../tests/oracle/svg-conformance/compare.js';

const dir = 'test-results/dot-cache/class/lecelo-92-loma110';
const markup = readFileSync(`${dir}/in.puml`, 'utf-8');
const jar = readFileSync(`${dir}/in.svg`, 'utf-8');
const store = combineAssetStores(buildSpriteAssetsStore(), buildEmojiAssetsStore());
const svg = renderSync(markup, { measurer: new WidthTableMeasurer(), assetStore: store, includeStore: fixtureIncludeStore() });
const { diffs } = compareSvg(svg, jar, 'deterministic');
for (const d of diffs.slice(0, 30)) console.log(JSON.stringify(d));
console.log('total', diffs.length);

const i = svg.indexOf('id="ent0003"');
console.log(svg.slice(i, svg.indexOf('</g>', i)));
console.log('---JAR---');
const j = jar.indexOf('id="ent0003"');
console.log(jar.slice(j, jar.indexOf('</g>', j)));
