/**
 * `npx jiti plans/data-diagram-conformance/measurements/baseline-files-authored.mts [--write] [--label <text>]`
 *
 * The orchestrator's row writer for `oracle/goldens/svg-files/authored-baseline.json`
 * (ddc b1 close, D7): one row per `tests/fixtures/files/<slug>.puml` that has a
 * `<slug>.svg`, measured EXACTLY as `files.authored.ratchet.test.ts#measureAuthored`
 * measures (renderFixtureFiles with the authored include store, the default
 * Twemoji store, `compareSvg(..., 'deterministic')`, `weightedScore`).
 * A slug with no row is appended; an existing row is replaced only when its
 * `diffCount` FELL (shrink-only, like the ratchet); a rise is printed and
 * refused (stop 5). Dry-run by default; `--write` writes the file.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg, weightedScore } from '../../../tests/oracle/svg-conformance/compare.js';
import {
  AUTHORED_FILES_ROOT,
  authoredFilesIncludeStore,
  listAuthoredFilesSlugs,
  readAuthoredFilesFixture,
  renderFixtureFiles,
} from '../../../tests/oracle/svg-conformance/render-fixture-files.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const MANIFEST = join(REPO, 'oracle/goldens/svg-files/authored-baseline.json');
/** `ERROR_SENTINEL`'s fixed marker text (`src/core/dispatcher.ts:57`), as the ratchet reads it. */
const ERROR_SENTINEL_MARKER = 'Error: unknown diagram type';

interface Row {
  type: 'files';
  slug: string;
  topic: string;
  status: 'baseline' | 'error';
  diffCount: number | null;
  weightedScore: number | null;
  reason?: string;
  measuredAt: string;
  measuredAgainstCommit: string;
}

function measure(slug: string, stamp: Pick<Row, 'measuredAt' | 'measuredAgainstCommit'>): Row {
  const { markup, golden } = readAuthoredFilesFixture(slug);
  const base = { type: 'files' as const, slug, topic: slug, ...stamp };
  try {
    const ours = renderFixtureFiles(markup, { measurer: new DeterministicMeasurer(), includeStore: authoredFilesIncludeStore() });
    if (ours.includes(ERROR_SENTINEL_MARKER))
      return { ...base, status: 'error', diffCount: null, weightedScore: null, reason: 'renders ERROR_SENTINEL' };
    const { diffs } = compareSvg(ours, golden!, 'deterministic');
    return { ...base, status: 'baseline', diffCount: diffs.length, weightedScore: weightedScore(diffs) };
  } catch (err) {
    return { ...base, status: 'error', diffCount: null, weightedScore: null, reason: err instanceof Error ? err.message : String(err) };
  }
}

const write = process.argv.includes('--write');
const stamp = {
  measuredAt: new Date().toISOString().slice(0, 10),
  measuredAgainstCommit: execFileSync('git', ['rev-parse', '--short=8', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim(),
};
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as { fixtures: Row[] };
const slugs = listAuthoredFilesSlugs().filter((s) => existsSync(join(AUTHORED_FILES_ROOT, `${s}.svg`)));
let added = 0, fell = 0, same = 0, rose = 0;
const out: Row[] = manifest.fixtures.map((r) => {
  if (!slugs.includes(r.slug)) return r;
  const m = measure(r.slug, stamp);
  if (r.status === 'baseline' && m.status === 'baseline' && m.diffCount! < r.diffCount!) { fell++; console.log(`FELL ${r.slug}: ${r.diffCount} -> ${m.diffCount}`); return m; }
  if (r.status === 'baseline' && m.status === 'baseline' && m.diffCount! > r.diffCount!) { rose++; console.log(`ROSE ${r.slug}: ${r.diffCount} -> ${m.diffCount} (kept)`); }
  else same++;
  return r;
});
for (const slug of slugs) {
  if (manifest.fixtures.some((r) => r.slug === slug)) continue;
  const m = measure(slug, stamp);
  added++;
  console.log(`ADD ${slug}: ${m.status} diffCount=${String(m.diffCount)} weightedScore=${String(m.weightedScore)}${m.reason ? ` (${m.reason})` : ''}`);
  out.push(m);
}
console.log(`rows ${manifest.fixtures.length} -> ${out.length}; added ${added}, fell ${fell}, same ${same}, rose ${rose}`);
if (!write) console.log('dry run -- pass --write to update authored-baseline.json');
else if (rose > 0) { console.error('refusing to write: a row rose'); process.exitCode = 1; }
else { writeFileSync(MANIFEST, `${JSON.stringify({ fixtures: out }, null, 2)}\n`); console.log(`wrote ${MANIFEST}`); }
