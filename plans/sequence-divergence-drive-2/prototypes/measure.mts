import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { DeterministicMeasurer } from './src/core/measurer-deterministic.js';
import { renderFixtureSequence } from './tests/oracle/svg-conformance/render-fixture-sequence.js';
import { fixtureIncludeStore } from './tests/helpers/fixture-include-store.js';
import { compareSvg } from './tests/oracle/svg-conformance/compare.js';
const out = process.argv[2]!;
const rows = JSON.parse(readFileSync('/Users/scottseely/git/knowvah/plantuml-ts/plans/sequence-divergence-drive/measurements/final-classify.json','utf8'));
const res: Record<string, number> = {};
const origLog = console.log; console.log = () => {};
for (const r of rows) {
  if (r.cohort === 'error') continue;
  const dir = `/Users/scottseely/git/knowvah/plantuml-ts/test-results/dot-cache/sequence/${r.slug}`;
  if (!existsSync(`${dir}/in.svg`)) continue;
  try {
    const svg = renderFixtureSequence(readFileSync(`${dir}/in.puml`,'utf8'), new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
    res[r.slug] = compareSvg(svg, readFileSync(`${dir}/in.svg`,'utf8'), 'deterministic').diffs.length;
  } catch (e) { res[r.slug] = -1; }
}
console.log = origLog;
writeFileSync(out, JSON.stringify(res));
