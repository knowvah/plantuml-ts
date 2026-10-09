// isw: score every sequence diff-baseline row exactly as the ratchet does.
// Usage (repo root): npx jiti plans/large-group-mirror/measurements/seq-scores.mts <out.json>
// Writes { slug: { w, d } | { err } }. Never edits the baseline.
import { readFileSync, writeFileSync } from 'node:fs';
const root = process.cwd();
const { DeterministicMeasurer } = await import(`${root}/src/core/measurer-deterministic.ts`);
const { fixtureIncludeStore } = await import(`${root}/tests/helpers/fixture-include-store.ts`);
const { renderFixtureSequence } = await import(`${root}/tests/oracle/svg-conformance/render-fixture-sequence.ts`);
const { compareSvg, weightedScore } = await import(`${root}/tests/oracle/svg-conformance/compare.ts`);
const p = `${root}/oracle/goldens/svg-sequence/diff-baseline.json`;
const m = JSON.parse(readFileSync(p, 'utf8'));
const res: Record<string, unknown> = {};
for (const f of m.fixtures) {
  const dir = `${root}/test-results/dot-cache/sequence/${f.slug}`;
  try {
    const ours = renderFixtureSequence(readFileSync(`${dir}/in.puml`,'utf8'), new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
    const { diffs } = compareSvg(ours, readFileSync(`${dir}/in.svg`,'utf8'), 'deterministic');
    res[f.slug] = { w: weightedScore(diffs), d: diffs.length };
  } catch (e) { res[f.slug] = { err: String(e).slice(0, 200) }; }
}
writeFileSync(process.argv[2], JSON.stringify(res));
