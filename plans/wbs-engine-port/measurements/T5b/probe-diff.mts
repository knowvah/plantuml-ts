/** compareSvg of every T5b probe against its jar render: `npx jiti <this>`. */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { renderSync } from '../../../../src/index.js';
import { compareSvg } from '../../../../tests/oracle/svg-conformance/compare.js';

const DIR = resolve(import.meta.dirname, 'probes');
const measurer = new DeterministicMeasurer();
for (const f of readdirSync(DIR).filter((n) => n.endsWith('.puml')).sort()) {
  const ours = renderSync(readFileSync(join(DIR, f), 'utf8'), { measurer });
  const jar = readFileSync(join(DIR, f.replace(/\.puml$/, '.svg')), 'utf8');
  const diffs = compareSvg(ours, jar, 'deterministic').diffs;
  console.log(`${f} ${diffs.length}`);
  for (const d of diffs.slice(0, 8)) console.log(`  ${JSON.stringify(d)}`);
}
