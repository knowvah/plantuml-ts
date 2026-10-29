/** jse T0a (copied from ddc): render ONE json/yaml/hcl/files row (corpus or authored) through the
 *  production harness and print its compareSvg diffs plus both `<svg>` headers.
 *  Usage: npx tsx plans/json-style-engine/tools/diff-one.mts <json|yaml|hcl|files> <slug> [--structural] [filter]
 *  Corpus rows read `test-results/dot-cache/<type>/<slug>/in.{puml,svg}`;
 *  authored rows read `tests/fixtures/<type>/<slug>.{puml,svg}`.
 *  json/yaml/hcl render through `renderFixtureJson` (the structural gate's
 *  path); files through `renderFixtureFiles` (T0b) when it exists, else the
 *  byte-identical `renderSync` + `withJarCompatibleStyleInput` it wraps.
 *  `--structural` drops positional diffs with `isPositionalDiff`, exactly as
 *  `json-family-structural.ts#structuralDiffs` does (D1: the json-family bar).
 *  `--survey` keeps only the diffs the SURVEY calls structural -- those with
 *  no numeric `delta` (`scripts/svg-parity-survey.ts:214-218`), the ones that
 *  make a row `diverged` rather than `structural-match`; a path `@d` whose
 *  segment shape differs (the T1a edge-order symptom) is one of these even
 *  though the gate's `isPositionalDiff` drops it.
 *  Model: plans/gantt-divergence-drive/tools/diff-one.mts. */
import { existsSync, readFileSync } from 'node:fs';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderSync } from '../../../src/index.js';
import { withJarCompatibleStyleInput } from '../../../src/core/internal-render-options.js';
import { compareSvg } from '../../../tests/oracle/svg-conformance/compare.js';
import { renderFixtureJson } from '../../../tests/oracle/svg-conformance/render-fixture-json.js';
import { isPositionalDiff } from '../../../tests/oracle/svg-conformance/json-family-structural.js';

const argv = process.argv.slice(2);
const structural = argv.includes('--structural');
const survey = argv.includes('--survey');
const [type, slug, filter = ''] = argv.filter((a) => a !== '--structural' && a !== '--survey');
const TYPES = ['json', 'yaml', 'hcl', 'files'];
if (!type || !slug || !TYPES.includes(type)) throw new Error('usage: diff-one.mts <json|yaml|hcl|files> <slug> [--structural|--survey] [filter]');

const corpusDir = `test-results/dot-cache/${type}/${slug}`;
const authored = `tests/fixtures/${type}/${slug}`;
let markup: string;
let oracle: string;
if (existsSync(`${corpusDir}/in.puml`)) {
  markup = readFileSync(`${corpusDir}/in.puml`, 'utf8');
  oracle = readFileSync(`${corpusDir}/in.svg`, 'utf8');
} else if (existsSync(`${authored}.puml`)) {
  markup = readFileSync(`${authored}.puml`, 'utf8');
  if (!existsSync(`${authored}.svg`)) throw new Error(`no oracle for ${slug} at ${authored}.svg`);
  oracle = readFileSync(`${authored}.svg`, 'utf8');
} else {
  throw new Error(`no fixture ${type}/${slug} under ${corpusDir} or ${authored}.puml`);
}

async function renderFiles(src: string): Promise<string> {
  const measurer = new DeterministicMeasurer();
  try {
    const mod = (await import('../../../tests/oracle/svg-conformance/render-fixture-files.js')) as {
      renderFixtureFiles: (markup: string, options: { measurer: DeterministicMeasurer }) => string;
    };
    return mod.renderFixtureFiles(src, { measurer });
  } catch {
    return renderSync(src, withJarCompatibleStyleInput({ measurer }));
  }
}

const ours = type === 'files' ? await renderFiles(markup) : renderFixtureJson(markup, new DeterministicMeasurer());
const header = (svg: string): string => svg.slice(svg.indexOf('<svg'), svg.indexOf('>', svg.indexOf('<svg')) + 1);
const diffs = compareSvg(ours, oracle, 'deterministic').diffs.filter(
  (d) => d.path.includes(filter) && !(structural && isPositionalDiff(d.path)) && !(survey && d.delta !== undefined),
);
for (const d of diffs)
  console.log(`${d.path}  ours=${String(d.actual).slice(0, 80)}  jar=${String(d.expected).slice(0, 80)}`);
console.log(`diffs: ${diffs.length}${structural ? ' (structural)' : ''}${survey ? ' (survey-structural: no numeric delta)' : ''}`);
console.log(`ours: ${header(ours)}`);
console.log(`jar:  ${header(oracle)}`);
