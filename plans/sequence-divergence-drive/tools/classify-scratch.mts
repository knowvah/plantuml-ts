/**
 * Planning-time source for T0a's classifier (sdd1, 2026-10-19). Renders every
 * `baseline` row of `oracle/goldens/svg-sequence/diff-baseline.json` through
 * the RATCHET path (`renderFixtureSequence` + `DeterministicMeasurer`, D6),
 * compares against the cached jar SVG, and writes one row per fixture with its
 * cohort. The cohort predicates below are the ones the Phase 1 numbers in
 * README.md came from; T0a promotes this into `classify.mts` + a test.
 *
 *   npx tsx plans/sequence-divergence-drive/tools/classify-scratch.mts <out.json>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg, weightedScore, type Diff } from '../../../tests/oracle/svg-conformance/compare.js';
import { renderFixtureSequence } from '../../../tests/oracle/svg-conformance/render-fixture-sequence.js';
import { fixtureIncludeStore } from '../../../tests/helpers/fixture-include-store.js';

const PAINT_SUFFIXES = [
  '@stroke-width', '@rx', '@ry', '@stroke-dasharray', '@fill', '@stroke', '@font-weight',
  '@font-size', '@font-style', '@font-family', '@fill-opacity', '@filter',
];

const shape = (p: string): string => p.replace(/\[\d+\]/g, '');
const isPaint = (d: Diff): boolean => PAINT_SUFFIXES.some((s) => shape(d.path).endsWith(s));
const isStructural = (d: Diff): boolean => d.path.includes('childCount') || /\/[a-z]+$/.test(shape(d.path));

function cohortOf(diffs: readonly Diff[]): 'zero' | 'paint-only' | 'geometry' | 'structural' {
  if (diffs.length === 0) return 'zero';
  const rest = diffs.filter((d) => !isPaint(d));
  if (rest.some(isStructural)) return 'structural';
  return rest.length === 0 ? 'paint-only' : 'geometry';
}

const base = JSON.parse(readFileSync('oracle/goldens/svg-sequence/diff-baseline.json', 'utf8')) as {
  fixtures: { slug: string; status: string }[];
};
const out: unknown[] = [];
for (const f of base.fixtures) {
  const dir = `test-results/dot-cache/sequence/${f.slug}`;
  if (f.status !== 'baseline') {
    out.push({ slug: f.slug, cohort: 'error' });
    continue;
  }
  let svg: string;
  try {
    svg = renderFixtureSequence(readFileSync(`${dir}/in.puml`, 'utf8'), new DeterministicMeasurer(), {
      includeStore: fixtureIncludeStore(),
    });
  } catch (e) {
    out.push({ slug: f.slug, cohort: 'error', error: String(e).slice(0, 200) });
    continue;
  }
  const { diffs } = compareSvg(svg, readFileSync(`${dir}/in.svg`, 'utf8'), 'deterministic');
  out.push({
    slug: f.slug,
    ws: weightedScore(diffs),
    n: diffs.length,
    cohort: cohortOf(diffs),
    nonPaint: diffs.filter((d) => !isPaint(d)).length,
  });
}
writeFileSync(process.argv[2] ?? 'classify.json', JSON.stringify(out, null, 1));
