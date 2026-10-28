/** gdd T0a: render ONE gantt row (corpus or authored) through the production
 *  harness and print its compareSvg diffs plus both `<svg>` headers.
 *  Usage: npx tsx plans/gantt-divergence-drive/tools/diff-one.mts <slug> [filter]
 *  Corpus rows read `test-results/dot-cache/gantt/<slug>/in.{puml,svg}`;
 *  authored rows read `tests/fixtures/gantt/<slug>.{puml,svg}`.
 *  Model: plans/sequence-divergence-drive-3/tools/diff-one.mts. */
import { existsSync, readFileSync } from 'node:fs';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from '../../../tests/oracle/svg-conformance/compare.js';
import {
  AUTHORED_GANTT_ROOT,
  authoredGanttIncludeStore,
  ganttRenderOptions,
  readAuthoredGanttFixture,
  renderFixtureGantt,
} from '../../../tests/oracle/svg-conformance/render-fixture-gantt.js';

const [slug, filter = ''] = process.argv.slice(2);
if (!slug) throw new Error('usage: diff-one.mts <slug> [filter]');

const corpusDir = `test-results/dot-cache/gantt/${slug}`;
let markup: string;
let oracle: string;
let options;
if (existsSync(`${corpusDir}/in.puml`)) {
  markup = readFileSync(`${corpusDir}/in.puml`, 'utf8');
  oracle = readFileSync(`${corpusDir}/in.svg`, 'utf8');
  options = ganttRenderOptions(slug);
} else {
  const fixture = readAuthoredGanttFixture(slug);
  if (fixture.golden === undefined) throw new Error(`no oracle for ${slug} under ${AUTHORED_GANTT_ROOT}`);
  markup = fixture.markup;
  oracle = fixture.golden;
  options = ganttRenderOptions(slug, authoredGanttIncludeStore());
}

const ours = renderFixtureGantt(markup, new DeterministicMeasurer(), options);
const header = (svg: string): string => svg.slice(svg.indexOf('<svg'), svg.indexOf('>', svg.indexOf('<svg')) + 1);
const diffs = compareSvg(ours, oracle, 'deterministic').diffs.filter((d) => d.path.includes(filter));
for (const d of diffs)
  console.log(`${d.path}  ours=${String(d.actual).slice(0, 80)}  jar=${String(d.expected).slice(0, 80)}`);
console.log(`diffs: ${diffs.length}`);
console.log(`ours: ${header(ours)}`);
console.log(`jar:  ${header(oracle)}`);
