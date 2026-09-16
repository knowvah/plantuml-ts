import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DeterministicMeasurer } from '/Users/scottseely/git/knowvah/plantuml-ts/src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '/Users/scottseely/git/knowvah/plantuml-ts/tests/helpers/fixture-include-store.js';
import { renderFixtureActivity } from '/Users/scottseely/git/knowvah/plantuml-ts/tests/oracle/svg-conformance/render-fixture-activity.js';
const REPO = '/Users/scottseely/git/knowvah/plantuml-ts';
const CACHE_ROOT = join(REPO, 'test-results/dot-cache/activity');
const MANIFEST = join(REPO, 'oracle/goldens/svg-activity/diff-baseline.json');
const outDir = process.argv[2]!;
mkdirSync(outDir, { recursive: true });
interface Fx { slug: string; status: string }
const fixtures = (JSON.parse(readFileSync(MANIFEST, 'utf8')) as { fixtures: Fx[] }).fixtures.filter((f) => f.status === 'baseline');
for (const f of fixtures) {
  const markup = readFileSync(join(CACHE_ROOT, f.slug, 'in.puml'), 'utf8');
  writeFileSync(join(outDir, `${f.slug}.svg`), renderFixtureActivity(markup, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() }));
}
console.log(`rendered ${fixtures.length} to ${outDir}`);
