/** b4 close: list wbs rows with compareSvg zero diffs against the cached jar SVG (pin candidates). */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../../tests/helpers/fixture-include-store.js';
import { compareSvg } from '../../../tests/oracle/svg-conformance/compare.js';
import { renderFixtureWbs } from '../../../tests/oracle/svg-conformance/render-fixture-wbs.js';

const CACHE = 'test-results/dot-cache/wbs';
const out: { zero: string[]; nonzero: Record<string, number> } = { zero: [], nonzero: {} };
for (const slug of readdirSync(CACHE).sort()) {
  const src = readFileSync(join(CACHE, slug, 'in.puml'), 'utf8');
  const jar = readFileSync(join(CACHE, slug, 'in.svg'), 'utf8');
  const ours = renderFixtureWbs(src, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
  const { diffs } = compareSvg(ours, jar, 'deterministic');
  if (diffs.length === 0) out.zero.push(slug);
  else out.nonzero[slug] = diffs.length;
}
writeFileSync(process.argv[2]!, `${JSON.stringify(out, null, 1)}\n`);
console.log(`zero ${out.zero.length}, nonzero ${Object.keys(out.nonzero).length}`);
