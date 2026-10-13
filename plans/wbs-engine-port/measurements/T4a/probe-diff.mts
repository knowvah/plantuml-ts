/** compareSvg of renderSync(<puml>) against <svg>: `npx jiti probe-diff.mts <puml> <svg>` */
import { readFileSync, writeFileSync } from 'node:fs';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { renderSync } from '../../../../src/index.js';
import { compareSvg } from '../../../../tests/oracle/svg-conformance/compare.js';
const [puml, svg, out] = process.argv.slice(2);
const ours = renderSync(readFileSync(puml!, 'utf8'), { measurer: new DeterministicMeasurer() });
if (out) writeFileSync(out, ours);
for (const d of compareSvg(ours, readFileSync(svg!, 'utf8'), 'deterministic').diffs) console.log(JSON.stringify(d));
