/**
 * wep T5-cov: measure every authored wbs fixture (tests/fixtures/wbs/*.puml)
 * against its jar oracle beside it, through the same renderFixtureWbs +
 * DeterministicMeasurer + compareSvg('deterministic') path the ratchet uses.
 *
 *   npx jiti plans/wbs-engine-port/measurements/T5-cov/measure-authored.mts <out.json> [slug...]
 */
import { writeFileSync } from 'node:fs';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { compareSvg, weightedScore } from '../../../../tests/oracle/svg-conformance/compare.js';
import {
  authoredWbsIncludeStore,
  listAuthoredWbsSlugs,
  readAuthoredWbsFixture,
  renderFixtureWbs,
} from '../../../../tests/oracle/svg-conformance/render-fixture-wbs.js';

const [out, ...only] = process.argv.slice(2);
const slugs = only.length > 0 ? only : listAuthoredWbsSlugs();
const rows = slugs.map((slug) => {
  const f = readAuthoredWbsFixture(slug);
  try {
    const ours = renderFixtureWbs(f.markup, new DeterministicMeasurer(), { includeStore: authoredWbsIncludeStore() });
    const { pass, diffs } = compareSvg(ours, f.golden ?? '', 'deterministic');
    const structural = diffs.filter((d) => d.delta === undefined).length;
    return { slug, pass, weightedScore: weightedScore(diffs), diffCount: diffs.length, structural, numeric: diffs.length - structural, first: diffs.slice(0, 8) };
  } catch (err) {
    return { slug, error: err instanceof Error ? err.message : String(err) };
  }
});
for (const r of rows) console.log(JSON.stringify({ ...r, first: undefined }));
if (out !== undefined) writeFileSync(out, JSON.stringify(rows, null, 2) + '\n');
