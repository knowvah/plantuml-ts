// T5c probe: render salt probe fixtures through the ratchet seam
// (renderFixtureSalt + DeterministicMeasurer) and compareSvg vs the jar.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { compareSvg, weightedScore } from '../../../../tests/oracle/svg-conformance/compare.js';
import { renderFixtureSalt } from '../../../../tests/oracle/svg-conformance/render-fixture-salt.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const slugs = process.argv.slice(2);
for (const slug of slugs) {
  const dir = join(ROOT, 'tests/fixtures/salt');
  const markup = readFileSync(join(dir, `${slug}.puml`), 'utf8');
  const golden = readFileSync(join(dir, `${slug}.svg`), 'utf8');
  const ours = renderFixtureSalt(markup, new DeterministicMeasurer());
  const { diffs } = compareSvg(ours, golden, 'deterministic');
  console.log(`${slug}: ${diffs.length} diffs, weighted ${weightedScore(diffs)}`);
  for (const d of diffs) console.log('  ', JSON.stringify(d));
  if (process.env.DUMP) console.log(ours);
}
