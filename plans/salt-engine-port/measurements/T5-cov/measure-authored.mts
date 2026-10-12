/**
 * sep T5-cov: measure every authored salt fixture (tests/fixtures/salt/*.puml)
 * against its jar oracle beside it, through the same renderFixtureSalt +
 * DeterministicMeasurer + compareSvg('deterministic') path the ratchet uses.
 *
 *   npx jiti plans/salt-engine-port/measurements/T5-cov/measure-authored.mts <out.json> [slug...]
 */
import { writeFileSync } from 'node:fs';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { compareSvg, weightedScore } from '../../../../tests/oracle/svg-conformance/compare.js';
import {
  authoredSaltIncludeStore,
  listAuthoredSaltSlugs,
  readAuthoredSaltFixture,
  renderFixtureSalt,
} from '../../../../tests/oracle/svg-conformance/render-fixture-salt.js';

const [out, ...only] = process.argv.slice(2);
const slugs = only.length > 0 ? only : listAuthoredSaltSlugs();
const rows = slugs.map((slug) => {
  const f = readAuthoredSaltFixture(slug);
  try {
    const ours = renderFixtureSalt(f.markup, new DeterministicMeasurer(), { includeStore: authoredSaltIncludeStore() });
    const { pass, diffs } = compareSvg(ours, f.golden ?? '', 'deterministic');
    const structural = diffs.filter((d) => d.delta === undefined).length;
    return { slug, pass, weightedScore: weightedScore(diffs), diffCount: diffs.length, structural, numeric: diffs.length - structural, first: diffs.slice(0, 8) };
  } catch (err) {
    return { slug, error: err instanceof Error ? err.message : String(err) };
  }
});
for (const r of rows) console.log(JSON.stringify({ ...r, first: undefined }));
if (out !== undefined) writeFileSync(out, JSON.stringify(rows, null, 2) + '\n');
