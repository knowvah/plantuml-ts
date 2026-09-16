/**
 * Render every baseline activity fixture to `<dir>/<slug>.svg` (mission
 * `activity-loop-tile-port`, T0).
 *
 * `compareSvg` charges one unit per mismatching attribute whatever its
 * magnitude, so a placement change can leave every score unmoved
 * (`.agent-notes/awrl-T3.md`, memory `oracle-score-blind-to-magnitude`).
 * The instrument for "which fixtures moved, and did anything else" is a
 * byte-level diff: render all 268 at the previous commit and at the working
 * tree, then `cmp` per slug. This is the render half, through the SAME
 * seam the probe and the ratchet gate use.
 *
 * Tooling: not collected by `npm test` and guarded so importing this module
 * never runs the CLI.
 *
 * Usage:
 *   npx tsx scripts/activity-render-all.ts <dir> [--slugs a,b]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { DeterministicMeasurer } from '../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../tests/helpers/fixture-include-store.js';
import { renderFixtureActivity } from '../tests/oracle/svg-conformance/render-fixture-activity.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const CACHE_ROOT = join(REPO, 'test-results/dot-cache/activity');
const MANIFEST_PATH = join(REPO, 'oracle/goldens/svg-activity/diff-baseline.json');

interface BaselineFixture {
  readonly slug: string;
  readonly status: string;
}

/* v8 ignore start -- CLI-only tool; verified by the manual determinism run
 * recorded in the T0 journal entry (render twice, `cmp` per slug). */
function loadBaselineSlugs(only: ReadonlySet<string> | undefined): string[] {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as { fixtures: BaselineFixture[] };
  return manifest.fixtures
    .filter((f) => f.status === 'baseline')
    .map((f) => f.slug)
    .filter((slug) => only === undefined || only.has(slug));
}

function main(): void {
  const argv = process.argv.slice(2);
  const outDir = argv.find((a) => !a.startsWith('--') && argv[argv.indexOf(a) - 1] !== '--slugs');
  if (outDir === undefined) {
    console.error('usage: npx tsx scripts/activity-render-all.ts <dir> [--slugs a,b]');
    process.exitCode = 2;
    return;
  }
  const slugsIdx = argv.indexOf('--slugs');
  const only = slugsIdx === -1 ? undefined : new Set(argv[slugsIdx + 1]?.split(',') ?? []);
  mkdirSync(outDir, { recursive: true });
  const slugs = loadBaselineSlugs(only);
  for (const slug of slugs) {
    const markup = readFileSync(join(CACHE_ROOT, slug, 'in.puml'), 'utf8');
    const svg = renderFixtureActivity(markup, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
    writeFileSync(join(outDir, `${slug}.svg`), svg);
  }
  console.log(`rendered ${slugs.length} to ${outDir}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
/* v8 ignore stop */
