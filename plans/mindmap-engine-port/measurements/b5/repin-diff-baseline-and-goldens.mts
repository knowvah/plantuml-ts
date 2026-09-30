/**
 * mmp b5 close (D7): re-seed `oracle/goldens/svg-mindmap/diff-baseline.json`
 * from a fresh measurement through the diff-baseline gate's own seam
 * (renderFixtureMindmap + DeterministicMeasurer + fixtureIncludeStore +
 * compareSvg/weightedScore), and pin every fixture with diffCount 0 that the
 * survey calls conformant and the routing gate routes MINDMAP into
 * `oracle/goldens/svg-mindmap/<slug>/{in.puml,golden.svg}` + ratchet.json.
 *
 *   npx jiti plans/mindmap-engine-port/measurements/b5/repin-diff-baseline-and-goldens.mts <sha> <parity-mindmap.json>
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../../../tests/helpers/fixture-include-store.js';
import { compareSvg, weightedScore } from '../../../../tests/oracle/svg-conformance/compare.js';
import { renderFixtureMindmap } from '../../../../tests/oracle/svg-conformance/render-fixture-mindmap.js';

const [sha, parityPath] = process.argv.slice(2);
if (!sha || !parityPath) throw new Error('usage: <sha> <parity-mindmap.json>');
const today = new Date().toISOString().slice(0, 10);
const tree = 'test-results/dot-cache/mindmap';
const goldens = 'oracle/goldens/svg-mindmap';
const parity = JSON.parse(readFileSync(parityPath, 'utf8')) as { fixtures: { slug: string; verdict: string }[] };
const verdict = new Map(parity.fixtures.map((f) => [f.slug, f.verdict]));
const routing = JSON.parse(readFileSync('oracle/goldens/svg-conformance/routing-baseline.json', 'utf8')) as {
  fixtures: { type: string; slug: string; ourType: string }[];
};
const routed = new Map(routing.fixtures.filter((f) => f.type === 'mindmap').map((f) => [f.slug, f.ourType]));

const manifestPath = join(goldens, 'diff-baseline.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { fixtures: Record<string, unknown>[] };
const ratchetPath = join(goldens, 'ratchet.json');
const ratchet = JSON.parse(readFileSync(ratchetPath, 'utf8')) as { fixtures: { slug: string; addedAt: string; source: string }[] };
const pinned = new Set(ratchet.fixtures.map((f) => f.slug));
const store = fixtureIncludeStore();
let baseline = 0, errors = 0, pins = 0, zero = 0;
for (const row of manifest.fixtures) {
  const slug = row.slug as string;
  const dir = join(tree, slug);
  const markup = readFileSync(join(dir, 'in.puml'), 'utf8');
  const golden = readFileSync(join(dir, 'in.svg'), 'utf8');
  let result: { weightedScore: number; diffCount: number } | { reason: string };
  try {
    const ours = renderFixtureMindmap(markup, new DeterministicMeasurer(), { includeStore: store });
    if (ours.includes('Error: unknown diagram type')) throw new Error('ERROR_SENTINEL');
    const { diffs } = compareSvg(ours, golden, 'deterministic');
    result = { weightedScore: weightedScore(diffs), diffCount: diffs.length };
  } catch (err) {
    result = { reason: err instanceof Error ? err.message : String(err) };
  }
  if ('reason' in result) {
    const jarError = (row.reason as string | undefined)?.includes('jar') && (row.reason as string).includes('error');
    Object.assign(row, { status: 'error', weightedScore: null, diffCount: null, measuredAt: today, measuredAgainstCommit: sha,
      reason: jarError ? row.reason : `port throws: ${result.reason}` });
    errors++;
  } else {
    delete row.reason;
    Object.assign(row, { status: 'baseline', weightedScore: result.weightedScore, diffCount: result.diffCount, measuredAt: today, measuredAgainstCommit: sha });
    baseline++;
    if (result.diffCount === 0) zero++;
    if (result.diffCount === 0 && verdict.get(slug) === 'conformant' && routed.get(slug) === 'MINDMAP' && !pinned.has(slug)) {
      mkdirSync(join(goldens, slug), { recursive: true });
      copyFileSync(join(dir, 'in.puml'), join(goldens, slug, 'in.puml'));
      copyFileSync(join(dir, 'in.svg'), join(goldens, slug, 'golden.svg'));
      ratchet.fixtures.push({ slug, addedAt: today, source: 'dot-cache' });
      pinned.add(slug); pins++;
    }
  }
}
ratchet.fixtures.sort((a, b) => a.slug.localeCompare(b.slug));
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(ratchetPath, JSON.stringify(ratchet, null, 2) + '\n');
console.log({ baseline, errors, zero, pins, ratchet: ratchet.fixtures.length });
