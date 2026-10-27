/**
 * `npx jiti plans/gantt-engine-port/measurements/repin-gantt-baseline.mts [--authored] [--write] [--accept-rises a,b]`
 *
 * The file-for-file twin of `plans/wbs-engine-port/measurements/
 * repin-wbs-baseline.mts` (gantt-engine-port T7p, D7). Regenerates
 * `oracle/goldens/svg-gantt/diff-baseline.json` for every cached gantt slug
 * NOT pinned in `ratchet.json` (the golden ratchet owns pinned rows;
 * `gantt.diff-baseline.ratchet.test.ts:148-151` requires the two sets to be
 * disjoint). Reuses the gate's own measurement -- `renderFixtureGantt` +
 * `DeterministicMeasurer` + `compareSvg`/`weightedScore` -- exactly as
 * `gantt.diff-baseline.ratchet.test.ts#measureMarkup` (`:78-90`) does, every
 * render taking the slug's recorded capture clock from `ganttRenderOptions`
 * (`render-fixture-gantt.ts:47-56`), never a re-derivation.
 *
 * Rows (`BaselineFixture`, `gantt.diff-baseline.ratchet.test.ts:30-39`): a
 * render that throws or renders the dispatcher's ERROR_SENTINEL is
 * `status: "error"` with the reason; anything else is `status: "baseline"`
 * with the fresh `weightedScore`/`diffCount`. A jar-error row (the stock jar
 * renders its own error page, we render ours -- conformant under the
 * 2026-10-10 error-page rule) is a NUMERIC baseline carrying a `reason` that
 * starts `jar-crash:` / `jar-error:`, derived from
 * `oracle/goldens/stock-error-pages.json` `gantt/<slug>`.
 *
 * DIFFERENCES FROM THE WBS TWIN:
 * - `--authored` regenerates `authored-baseline.json` instead (the wbs twin
 *   left that to a one-off `T5-cov/measure-authored.mts`): one row per
 *   `tests/fixtures/gantt/<slug>.puml` with its `.svg` oracle, measured with
 *   `authoredGanttIncludeStore()` (`gantt.diff-baseline.ratchet.test.ts:111-114`),
 *   `AuthoredFixture` = `BaselineFixture` + `topic` (`:48-50`). The `topic`
 *   is carried over from the committed row; a new slug gets its slug as a
 *   placeholder topic for the orchestrator to edit. A 0-diff authored row is
 *   legitimate (gated at 0); a missing `.svg` is an `error` row.
 * - On the corpus manifest a row at 0 diffs is refused under `--write`: the
 *   gate rejects it ("0 diffs belongs in ratchet.json", `:186-188`), so pin it
 *   with `pin-gantt.mts` first.
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
import type { IncludeStore } from '../../../src/core/tim/IncludeStore.js';
import { compareSvg, weightedScore } from '../../../tests/oracle/svg-conformance/compare.js';
import {
  authoredGanttIncludeStore,
  ganttRenderOptions,
  listAuthoredGanttSlugs,
  readAuthoredGanttFixture,
  renderFixtureGantt,
} from '../../../tests/oracle/svg-conformance/render-fixture-gantt.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '../../..');
const GOLDENS = join(REPO, 'oracle/goldens/svg-gantt');
const MANIFEST = join(GOLDENS, 'diff-baseline.json');
const AUTHORED_MANIFEST = join(GOLDENS, 'authored-baseline.json');
const RATCHET = join(GOLDENS, 'ratchet.json');
const CACHE = join(REPO, 'test-results/dot-cache/gantt');
const ERROR_SENTINEL_MARKER = 'Error: unknown diagram type';

const STOCK_ERRORS = join(REPO, 'oracle/goldens/stock-error-pages.json');
const JAR_CRASH_MESSAGE = 'java.lang.IllegalArgumentException: character to be escaped is missing';
const SENTINEL_REASON = 'renders ERROR_SENTINEL (dispatcher.ts:361-375) -- no gantt plugin registered';

interface StockRecord {
  readonly line: number | null;
  readonly message: string;
}
const stockErrors = (JSON.parse(readFileSync(STOCK_ERRORS, 'utf8')) as { errors: Record<string, StockRecord> }).errors;

/**
 * A jar-side error row's reason (T0a classification, 2026-10-12), built from
 * the stock record `oracle/goldens/stock-error-pages.json` `gantt/<slug>`:
 * an empty message is a `jar-crash:` (the jar renders its crash page), anything
 * else a `jar-error:` quoting the jar's message. `undefined` for an ordinary row.
 */
function jarReason(slug: string): string | undefined {
  const rec = stockErrors[`gantt/${slug}`];
  if (rec === undefined) return undefined;
  const key = `oracle/goldens/stock-error-pages.json gantt/${slug}`;
  const rule = 'conformant under the 2026-10-10 error-page rule once the port errors too';
  if (rec.message === '') {
    return `jar-crash: the stock jar renders its crash page (${JAR_CRASH_MESSAGE}; ${key}, empty message) -- ${rule}.`;
  }
  return `jar-error: the stock jar reports "${rec.message}" at line ${String(rec.line)} (${key}) -- ${rule}.`;
}

interface Row {
  readonly type: 'gantt';
  readonly slug: string;
  readonly topic?: string;
  readonly status: 'baseline' | 'error';
  readonly weightedScore: number | null;
  readonly diffCount: number | null;
  readonly reason?: string;
  readonly measuredAt: string;
  readonly measuredAgainstCommit: string;
}
type Measured = Omit<Row, 'measuredAt' | 'measuredAgainstCommit' | 'topic'>;

/** One markup against one oracle: `gantt.diff-baseline.ratchet.test.ts#measureMarkup` (`:78-90`). */
function measureMarkup(
  slug: string,
  markup: string,
  golden: string,
  crash: string | undefined,
  includeStore?: IncludeStore,
): Measured {
  try {
    const ours = renderFixtureGantt(markup, new DeterministicMeasurer(), ganttRenderOptions(slug, includeStore));
    if (ours.includes(ERROR_SENTINEL_MARKER)) {
      return {
        type: 'gantt',
        slug,
        status: 'error',
        weightedScore: null,
        diffCount: null,
        reason: crash === undefined ? SENTINEL_REASON : `${crash} Port side: ${SENTINEL_REASON}`,
      };
    }
    const { diffs } = compareSvg(ours, golden, 'deterministic');
    const row = {
      type: 'gantt' as const,
      slug,
      status: 'baseline' as const,
      weightedScore: weightedScore(diffs),
      diffCount: diffs.length,
    };
    return crash === undefined ? row : { ...row, reason: crash };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return {
      type: 'gantt',
      slug,
      status: 'error',
      weightedScore: null,
      diffCount: null,
      reason: crash === undefined ? reason : `${crash} (threw: ${reason})`,
    };
  }
}

function measure(slug: string): Measured {
  const dir = join(CACHE, slug);
  return measureMarkup(
    slug,
    readFileSync(join(dir, 'in.puml'), 'utf8'),
    readFileSync(join(dir, 'in.svg'), 'utf8'),
    jarReason(slug),
  );
}

function measureAuthored(slug: string): Measured {
  const { markup, golden } = readAuthoredGanttFixture(slug);
  if (golden === undefined) {
    return {
      type: 'gantt',
      slug,
      status: 'error',
      weightedScore: null,
      diffCount: null,
      reason: `tests/fixtures/gantt/${slug}.svg is missing`,
    };
  }
  return measureMarkup(slug, markup, golden, undefined, authoredGanttIncludeStore());
}

function cachedSlugs(pinned: ReadonlySet<string>): string[] {
  return readdirSync(CACHE)
    .filter((f) => statSync(join(CACHE, f)).isDirectory() && existsSync(join(CACHE, f, 'in.svg')))
    .filter((s) => !pinned.has(s))
    .sort();
}

function main(): void {
  const argv = process.argv.slice(2);
  const write = argv.includes('--write');
  const authored = argv.includes('--authored');
  const ar = argv.indexOf('--accept-rises');
  const accepted = new Set(ar >= 0 ? (argv[ar + 1] ?? '').split(',').filter(Boolean) : []);
  const pinned = new Set(
    (JSON.parse(readFileSync(RATCHET, 'utf8')) as { fixtures: { slug: string }[] }).fixtures.map((f) => f.slug),
  );
  const manifestPath = authored ? AUTHORED_MANIFEST : MANIFEST;
  const old = JSON.parse(readFileSync(manifestPath, 'utf8')) as { $comment?: string; fixtures: Row[] };
  const oldBySlug = new Map(old.fixtures.map((f) => [f.slug, f]));
  const slugs = authored ? listAuthoredGanttSlugs() : cachedSlugs(pinned);
  const measuredAt = new Date().toISOString().slice(0, 10);
  const measuredAgainstCommit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
    cwd: REPO,
    encoding: 'utf8',
  }).trim();
  const rows: Row[] = [];
  const rises: string[] = [];
  for (const slug of slugs) {
    const m = authored ? measureAuthored(slug) : measure(slug);
    const prev = oldBySlug.get(slug);
    const prevScore = prev?.weightedScore ?? null;
    const tag = prevScore === null ? `(was ${prev?.status ?? 'absent'})` : `(was ${prevScore})`;
    if (prevScore !== null && m.weightedScore !== null && m.weightedScore > prevScore && !accepted.has(slug))
      rises.push(slug);
    console.log(
      `${slug.padEnd(20)} ${m.status.padEnd(8)} ws=${String(m.weightedScore).padEnd(5)} dc=${String(m.diffCount).padEnd(4)} ${tag}`,
    );
    const { type, status, weightedScore: ws, diffCount: dc, reason } = m;
    const topic = authored ? { topic: prev?.topic ?? slug } : {};
    rows.push({
      type,
      slug,
      ...topic,
      status,
      weightedScore: ws,
      diffCount: dc,
      ...(reason === undefined ? {} : { reason }),
      measuredAt,
      measuredAgainstCommit,
    });
  }
  const noun = authored ? 'authored' : 'unpinned';
  console.log(
    `\n${rows.length} ${noun} row(s); ${pinned.size} pinned in ratchet.json; ${rows.filter((r) => r.status === 'error').length} error row(s)`,
  );
  if (rises.length > 0) {
    console.error(`REFUSED: weightedScore ROSE for ${rises.join(', ')} -- pass --accept-rises with a journal row`);
    process.exitCode = 1;
    return;
  }
  const promotable = authored ? [] : rows.filter((r) => r.diffCount === 0).map((r) => r.slug);
  if (promotable.length > 0) {
    console.error(
      `REFUSED: ${promotable.length} row(s) at 0 diffs belong in ratchet.json -- pin-gantt.mts them first: ${promotable.join(' ')}`,
    );
    process.exitCode = 1;
    if (write) return;
  }
  if (!write) {
    console.log(`dry run -- pass --write to update ${authored ? 'authored-baseline.json' : 'diff-baseline.json'}`);
    return;
  }
  const out = old.$comment === undefined ? { fixtures: rows } : { $comment: old.$comment, fixtures: rows };
  writeFileSync(manifestPath, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`wrote ${manifestPath}`);
}

main();
