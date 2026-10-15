/**
 * codd (copied from dsw T6; T1a re-points eligibility per D4): pin survey-conformant description fixtures into the svg-description
 * ratchet, applying `oracle/goldens/svg-description/README.md`'s Add rule
 * (zero-diff through the ratchet's own `renderFixture` + DeterministicMeasurer
 * path, AND `dotEqual: true` in `tests/oracle/svg-conformance/parity.json`).
 * Shape copied from `plans/class-divergence-drive/tools/pin-goldens.mts`.
 *
 *   npx jiti plans/component-divergence-drive/measurements/pin-description.mts <survey-dir> <close-label> [--write]
 *
 * Without --write: prints candidates and why each other conformant row is
 * skipped. With --write, per pinned slug:
 *   1. copies dot-cache `<type>/<slug>/{in.puml,in.svg}` verbatim to
 *      `oracle/goldens/svg-description/<type>/<slug>/{in.puml,golden.svg}`;
 *   2. APPENDS `{ slug, type, addedAt, source: 'dot-cache' }` to ratchet.json
 *      (never re-sorted: the tamper test mutates fixtures[0]);
 *   3. appends `tree: goldens, type: svg-description, slug: <type>/<slug>`
 *      clones of the dot-cache twin rows to routing- and refusal-baseline.json
 *      and extends each `$comment`.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from '../../../tests/oracle/svg-conformance/compare.js';
import { renderFixture } from '../../../tests/oracle/svg-conformance/render-fixture.js';

const REPO = execFileSync('git', ['rev-parse', '--show-toplevel']).toString().trim();
const [surveyDir, label, flag] = process.argv.slice(2);
if (surveyDir === undefined || label === undefined) throw new Error('usage: <survey-dir> <close-label> [--write]');
const TYPES = ['component', 'usecase'] as const;
const GOLDENS = join(REPO, 'oracle/goldens/svg-description');
const CACHE = join(REPO, 'test-results/dot-cache');
const BASELINES = join(REPO, 'oracle/goldens/svg-conformance');
const today = new Date().toISOString().slice(0, 10);
const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD']).toString().trim();

interface Row {
  slug: string;
  type: string;
  verdict?: string;
  dotEqual?: boolean;
}
const readJson = <T,>(p: string): T => JSON.parse(readFileSync(p, 'utf8')) as T;
const manifest = readJson<{ fixtures: Row[] }>(join(GOLDENS, 'ratchet.json'));
const pinned = new Set(manifest.fixtures.map((f) => `${f.type}/${f.slug}`));
const legacy = readJson<{ fixtures: Row[] }>(join(REPO, 'tests/oracle/svg-conformance/parity.json')).fixtures;
const legacyDotEqual = new Map(legacy.map((r) => [`${r.type}/${r.slug}`, r.dotEqual]));

/** Diff count through the ratchet's path, or -1 when `renderFixture` throws
 *  (an error-page row: survey-conformant through renderSync's error page, but
 *  the low-level pipeline the ratchet uses refuses it, so it cannot be pinned). */
function zeroDiff(type: string, slug: string): number {
  const markup = readFileSync(join(CACHE, type, slug, 'in.puml'), 'utf8');
  const golden = readFileSync(join(CACHE, type, slug, 'in.svg'), 'utf8');
  try {
    return compareSvg(renderFixture(markup, new DeterministicMeasurer()), golden, 'deterministic').diffs.length;
  } catch {
    return -1;
  }
}

const pins: { type: string; slug: string }[] = [];
for (const type of TYPES) {
  for (const r of readJson<{ fixtures: Row[] }>(join(REPO, surveyDir, `parity-${type}.json`)).fixtures) {
    const key = `${type}/${r.slug}`;
    if (r.verdict !== 'conformant' || pinned.has(key)) continue;
    const diffs = zeroDiff(type, r.slug);
    const dot = legacyDotEqual.get(key);
    const ok = diffs === 0 && dot === true;
    console.log(`${ok ? 'PIN ' : 'skip'} ${key} ratchetDiffs=${diffs} legacyDotEqual=${dot}`);
    if (ok) pins.push({ type, slug: r.slug });
  }
}
console.log(`candidates: ${pins.length}`);

function appendTwins(file: string): void {
  const path = join(BASELINES, file);
  const base = readJson<{ $comment: string; fixtures: Record<string, unknown>[] }>(path);
  for (const p of pins) {
    const twin = base.fixtures.find((r) => r['tree'] === 'dot-cache' && r['type'] === p.type && r['slug'] === p.slug);
    if (twin === undefined) throw new Error(`${file}: no dot-cache twin for ${p.type}/${p.slug}`);
    base.fixtures.push({
      ...twin,
      tree: 'goldens',
      type: 'svg-description',
      slug: `${p.type}/${p.slug}`,
      measuredAt: today,
      measuredAgainstCommit: commit,
    });
  }
  base.$comment +=
    ` Re-pinned ${today} at ${commit} by component-divergence-drive / ${label}, ADDITIVE ONLY` +
    ` (${pins.length} "svg-description" golden rows appended, clones of their byte-identical dot-cache twins).`;
  writeFileSync(path, JSON.stringify(base, null, 2) + '\n');
}

if (flag === '--write' && pins.length > 0) {
  for (const p of pins) {
    const dir = join(GOLDENS, p.type, p.slug);
    mkdirSync(dir, { recursive: true });
    copyFileSync(join(CACHE, p.type, p.slug, 'in.puml'), join(dir, 'in.puml'));
    copyFileSync(join(CACHE, p.type, p.slug, 'in.svg'), join(dir, 'golden.svg'));
    manifest.fixtures.push({ slug: p.slug, type: p.type, addedAt: today, source: 'dot-cache' } as Row);
  }
  writeFileSync(join(GOLDENS, 'ratchet.json'), JSON.stringify(manifest, null, 2) + '\n');
  appendTwins('routing-baseline.json');
  appendTwins('refusal-baseline.json');
  console.log(`wrote ${pins.length} pins`);
}
