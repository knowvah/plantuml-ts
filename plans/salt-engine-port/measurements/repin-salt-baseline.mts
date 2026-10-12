/**
 * `npx jiti plans/salt-engine-port/measurements/repin-salt-baseline.mts [--write] [--accept-rises a,b]`
 *
 * Regenerates `oracle/goldens/svg-salt/diff-baseline.json` for every cached
 * salt slug NOT pinned in `ratchet.json` (the golden ratchet owns pinned
 * rows; the shape test requires the two sets to be disjoint and to cover
 * the cache exactly). Reuses the gate's own measurement — `renderFixtureSalt`
 * + `DeterministicMeasurer` + `compareSvg`/`weightedScore` — exactly as
 * `tests/oracle/svg-conformance/salt.diff-baseline.ratchet.test.ts#measure`
 * does, never a re-derivation.
 *
 * Rows: a render that throws or renders the dispatcher's ERROR_SENTINEL is
 * `status: "error"` with the reason; anything else is `status: "baseline"`
 * with the fresh `weightedScore`/`diffCount`. A jar-crash row (jar renders
 * its own crash page, we render ours — conformant under the 2026-10-10
 * error-page rule) is a NUMERIC baseline like mindmap's `femiba-70-duvi238`,
 * carrying a `reason` that starts with `jar-crash:` (the shape test pins
 * exactly one such row).
 *
 * Every weightedScore RISE against the committed manifest is printed and
 * refused unless `--accept-rises` names the slug (hazard from
 * `scripts/repin-activity-baselines.ts`). Without `--write` nothing is
 * written.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../../tests/helpers/fixture-include-store.js';
import { compareSvg, weightedScore } from '../../../tests/oracle/svg-conformance/compare.js';
import { renderFixtureSalt } from '../../../tests/oracle/svg-conformance/render-fixture-salt.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '../../..');
const GOLDENS = join(REPO, 'oracle/goldens/svg-salt');
const MANIFEST = join(GOLDENS, 'diff-baseline.json');
const RATCHET = join(GOLDENS, 'ratchet.json');
const CACHE = join(REPO, 'test-results/dot-cache/salt');
const ERROR_SENTINEL_MARKER = 'Error: unknown diagram type';

/** `ElementMenuBar.java:87` IAE via `ElementFactoryMenu.java:74` (.agent-notes/sep-T0b.md). */
const JAR_CRASH_REASONS: Record<string, string> = {
  'lakari-33-mone874':
    'jar-crash: the stock jar renders its IllegalArgumentException crash page ' +
    '(salt/element/ElementMenuBar.java:87 via ElementFactoryMenu.java:74; ' +
    'oracle/goldens/stock-error-pages.json salt/lakari-33-mone874) and the port renders its own ' +
    'error page from the same throw (ElementMenuBar.ts) -- conformant under the 2026-10-10 ' +
    'error-page rule; the numeric baseline measures our error page against the jar crash page.',
};

interface Row {
  readonly type: 'salt';
  readonly slug: string;
  readonly status: 'baseline' | 'error';
  readonly weightedScore: number | null;
  readonly diffCount: number | null;
  readonly reason?: string;
  readonly measuredAt: string;
  readonly measuredAgainstCommit: string;
}

function measure(slug: string): Omit<Row, 'measuredAt' | 'measuredAgainstCommit'> {
  const dir = join(CACHE, slug);
  const markup = readFileSync(join(dir, 'in.puml'), 'utf8');
  const golden = readFileSync(join(dir, 'in.svg'), 'utf8');
  const crash = JAR_CRASH_REASONS[slug];
  try {
    const ours = renderFixtureSalt(markup, new DeterministicMeasurer(), {
      includeStore: fixtureIncludeStore(),
    });
    if (ours.includes(ERROR_SENTINEL_MARKER)) {
      return {
        type: 'salt',
        slug,
        status: 'error',
        weightedScore: null,
        diffCount: null,
        reason: 'renders ERROR_SENTINEL (dispatcher.ts:361-375) -- no salt plugin registered',
      };
    }
    const { diffs } = compareSvg(ours, golden, 'deterministic');
    const row = { type: 'salt' as const, slug, status: 'baseline' as const, weightedScore: weightedScore(diffs), diffCount: diffs.length };
    return crash === undefined ? row : { ...row, reason: crash };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { type: 'salt', slug, status: 'error', weightedScore: null, diffCount: null, reason: crash === undefined ? reason : `${crash} (threw: ${reason})` };
  }
}

function main(): void {
  const argv = process.argv.slice(2);
  const write = argv.includes('--write');
  const ar = argv.indexOf('--accept-rises');
  const accepted = new Set(ar >= 0 ? (argv[ar + 1] ?? '').split(',').filter(Boolean) : []);
  const pinned = new Set((JSON.parse(readFileSync(RATCHET, 'utf8')) as { fixtures: { slug: string }[] }).fixtures.map((f) => f.slug));
  const old = JSON.parse(readFileSync(MANIFEST, 'utf8')) as { $comment?: string; fixtures: Row[] };
  const oldBySlug = new Map(old.fixtures.map((f) => [f.slug, f]));
  const slugs = readdirSync(CACHE)
    .filter((f) => statSync(join(CACHE, f)).isDirectory() && existsSync(join(CACHE, f, 'in.svg')))
    .filter((s) => !pinned.has(s))
    .sort();
  const measuredAt = new Date().toISOString().slice(0, 10);
  const measuredAgainstCommit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim();
  const rows: Row[] = [];
  const rises: string[] = [];
  for (const slug of slugs) {
    const m = measure(slug);
    const prev = oldBySlug.get(slug);
    const prevScore = prev?.weightedScore ?? null;
    const tag = prevScore === null ? `(was ${prev?.status ?? 'absent'})` : `(was ${prevScore})`;
    if (prevScore !== null && m.weightedScore !== null && m.weightedScore > prevScore && !accepted.has(slug)) rises.push(slug);
    console.log(`${slug.padEnd(20)} ${m.status.padEnd(8)} ws=${String(m.weightedScore).padEnd(5)} dc=${String(m.diffCount).padEnd(4)} ${tag}`);
    rows.push({ ...m, measuredAt, measuredAgainstCommit });
  }
  console.log(`\n${rows.length} unpinned row(s); ${pinned.size} pinned in ratchet.json; ${rows.filter((r) => r.status === 'error').length} error row(s)`);
  if (rises.length > 0) {
    console.error(`REFUSED: weightedScore ROSE for ${rises.join(', ')} -- pass --accept-rises with a journal row`);
    process.exitCode = 1;
    return;
  }
  if (!write) {
    console.log('dry run -- pass --write to update diff-baseline.json');
    return;
  }
  const out = old.$comment === undefined ? { fixtures: rows } : { $comment: old.$comment, fixtures: rows };
  writeFileSync(MANIFEST, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`wrote ${MANIFEST}`);
}

main();
