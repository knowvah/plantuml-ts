/**
 * ufp T3-cov: measure every authored utility fixture (tests/fixtures/utility/*.puml)
 * against its jar oracle beside it, through the ratchet's own path
 * (render-fixture-utility.ts#measureAuthoredUtility: renderSync + surveyAssetStore +
 * DeterministicMeasurer + compareSvg('deterministic')).
 *
 *   npx jiti plans/utility-factories-port/measurements/T3-cov/measure-authored.mts <out.json> [slug...]
 */
import { writeFileSync } from 'node:fs';
import { compareSvg } from '../../../../tests/oracle/svg-conformance/compare.js';
import {
  listAuthoredUtilitySlugs,
  measureAuthoredUtility,
  readAuthoredUtilityFixture,
  renderAuthoredUtility,
} from '../../../../tests/oracle/svg-conformance/render-fixture-utility.js';

const [out, ...only] = process.argv.slice(2);
const slugs = only.length > 0 ? only : listAuthoredUtilitySlugs();
const rows = slugs.map((slug) => {
  const m = measureAuthoredUtility(slug);
  if (m.errored) return { slug, error: m.reason };
  const f = readAuthoredUtilityFixture(slug);
  const first = compareSvg(renderAuthoredUtility(f.markup), f.golden ?? '', 'deterministic').diffs.slice(0, 12);
  return { slug, ...m, first };
});
for (const r of rows) console.log(JSON.stringify({ ...r, first: undefined }));
if (out !== undefined && out !== '-') writeFileSync(out, JSON.stringify(rows, null, 2) + '\n');
