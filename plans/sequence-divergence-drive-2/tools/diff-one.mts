/** sdd1: print the ratchet-path diffs of one sequence fixture, filtered by a
 *  substring of the path. Usage: npx tsx diff-one.mts <slug> [filter] */
import { readFileSync } from 'node:fs';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from '../../../tests/oracle/svg-conformance/compare.js';
import { renderFixtureSequence, sequenceFixtureOptions } from '../../../tests/oracle/svg-conformance/render-fixture-sequence.js';

const [slug, filter = ''] = process.argv.slice(2);
const dir = `test-results/dot-cache/sequence/${slug}`;
const svg = renderFixtureSequence(readFileSync(`${dir}/in.puml`, 'utf8'), new DeterministicMeasurer(), sequenceFixtureOptions());
for (const d of compareSvg(svg, readFileSync(`${dir}/in.svg`, 'utf8'), 'deterministic').diffs)
  if (d.path.includes(filter)) console.log(`${d.path}  ours=${String(d.actual).slice(0, 80)}  jar=${String(d.expected).slice(0, 80)}`);
