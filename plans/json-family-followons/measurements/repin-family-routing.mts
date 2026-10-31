/**
 * `npx jiti plans/json-family-followons/measurements/repin-family-routing.mts --type <json|yaml|hcl|files> [--write] [--label <text>]`
 *
 * The jff close (copied from jfp)'s routing/refusal re-pin for files (T0a, D4), the
 * file-for-file twin of `plans/gantt-divergence-drive/measurements/
 * repin-gantt-routing.mts` MINUS the capture clock (files has none:
 * every render is a bare jar-compatible `renderSync`). Two steps, both from the gates' OWN measurement
 * (`scripts/pin-corpus-tree-measure.ts`' classifiers, the seams
 * `routing-conformance.test.ts:268-274` / `refusal-coverage.test.ts:297-304`
 * use). Files renders through `renderSync` with
 * `withJarCompatibleStyleInput` -- the survey's own style input
 * (`scripts/svg-parity-survey.ts:307`):
 *
 * 1. Replaces every `tree: dot-cache, type: files` row of
 *    `oracle/goldens/svg-conformance/{routing,refusal}-baseline.json` IN
 *    PLACE from a fresh measurement. A row pinned `jar-error` stays exactly
 *    as pinned (the jar still errors). A fixture that now routes `agree` /
 *    renders `ok` is re-pinned so; one that still misroutes or errors on our
 *    side is REFUSED (this tool has no ledger of excuses --
 *    `scripts/pin-corpus-tree.ts` owns those).
 * 2. Clones, for every slug in `oracle/goldens/svg-files/ratchet.json`, its
 *    fresh dot-cache twin as `tree: goldens, type: svg-files` in both files,
 *    replacing any earlier `svg-files` goldens rows. Both gates walk every
 *    `oracle/goldens/svg-<family>/` dir and demand a row each
 *    (`routing-conformance.test.ts:222`).
 *
 * As in the gantt twin, refusals are COLLECTED, not thrown. A dry run
 * (no `--write`) prints the plan plus every refusal -- on a branch without
 * the files port (before T1b) that is every misrouted row --
 * and exits 0; `--write` aborts, before writing either file, if any refusal
 * remains. Without `--write` nothing is written. Orchestrator-only.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSync } from '../../../src/index.js';
import { withJarCompatibleStyleInput } from '../../../src/core/internal-render-options.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import {
  diagramTypeOf,
  engineOf,
  isJarErrorPage,
  listFixtureSlugs,
  readHead,
  weErroredIn,
  type MeasuredFixture,
} from '../../../scripts/pin-corpus-tree-measure.js';

/** The gates' head-read budget (`routing-conformance.test.ts:116-119`, `pin-corpus-tree-measure.ts` HEAD_BYTES). */
const HEAD_BYTES = 4096;
/** `PSystemError#getTextBlock` prepends the tutorial for a source under this many lines (PSystemError.java:217-218). */
const TUTORIAL_LINE_LIMIT = 5;

/** `--type <json|yaml|hcl|files>` (REQUIRED; jff T0a dropped ddc's `files`
 *  default): the two steps for one family whose golden clones the gates demand
 *  (`svg-json/` etc.); json/yaml/hcl render through the same jar-compatible
 *  `renderSync` (no clock), and the stock-error head-window reason is keyed `<type>/`. */
const TYPE = ((): string => {
  const i = process.argv.indexOf('--type');
  const t = i >= 0 ? process.argv[i + 1] : undefined;
  if (t === undefined) throw new Error('--type <json|yaml|hcl|files> is required');
  return t;
})();
if (!['json', 'yaml', 'hcl', 'files'].includes(TYPE)) throw new Error(`--type must be json|yaml|hcl|files, got ${TYPE}`);
const GOLDEN_TYPE = `svg-${TYPE}`;

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '../../..');
const CACHE = join(REPO, `test-results/dot-cache/${TYPE}`);
const RATCHET = join(REPO, `oracle/goldens/${GOLDEN_TYPE}/ratchet.json`);
const ROUTING = join(REPO, 'oracle/goldens/svg-conformance/routing-baseline.json');
const REFUSAL = join(REPO, 'oracle/goldens/svg-conformance/refusal-baseline.json');
const MISSION = 'json-family-followons';

interface Row {
  tree?: string;
  type: string;
  slug: string;
  status: string;
  measuredAt: string;
  measuredAgainstCommit: string;
  [k: string]: unknown;
}
interface Baseline {
  $comment: string;
  fixtures: Row[];
}

const isFilesCache = (r: Row): boolean => r.tree === 'dot-cache' && r.type === TYPE;
const isFilesGoldens = (r: Row): boolean => r.tree === 'goldens' && r.type === GOLDEN_TYPE;

/** A row this tool will not pin: the fixture, and why. */
interface Refusal {
  readonly file: string;
  readonly slug: string;
  readonly why: string;
}
class RefusedRow extends Error {}

/** One fixture through the gates' seams (see the header), jar-compatible style input, no clock. */
function measureFiles(slug: string): MeasuredFixture {
  const dir = join(CACHE, slug);
  const markup = readFileSync(join(dir, 'in.puml'), 'utf8');
  const ours = renderSync(
    markup,
    withJarCompatibleStyleInput({ measurer: new DeterministicMeasurer() }),
  );
  const golden = readHead(join(dir, 'in.svg'));
  const jarErrored = isJarErrorPage(golden);
  const weErrored = weErroredIn(ours);
  return {
    slug,
    jarType: diagramTypeOf(golden),
    ourType: diagramTypeOf(ours.slice(0, HEAD_BYTES)),
    jarErrored,
    jarRendered: !jarErrored,
    weErrored,
    engine: engineOf(ours, weErrored),
  };
}

function routingRow(m: MeasuredFixture, old: Row, stamp: Pick<Row, 'measuredAt' | 'measuredAgainstCommit'>): Row {
  if (old.status === 'jar-error') return old;
  if (m.jarType !== m.ourType)
    throw new RefusedRow(`still misroutes (${m.jarType} -> ${m.ourType}); no ledger excuse here`);
  return {
    tree: 'dot-cache',
    type: TYPE,
    slug: m.slug,
    jarType: m.jarType,
    ourType: m.ourType,
    status: 'agree',
    ...stamp,
  };
}

/** Stock-jar error record (`scripts/stock-jar-verify.sh`): keys `files/<slug>`. */
const STOCK_ERRORS = (
  JSON.parse(readFileSync(join(REPO, 'oracle/goldens/stock-error-pages.json'), 'utf8')) as {
    errors: Record<string, { line: number | null; message: string }>;
  }
).errors;

/** Fewer than 5 source lines (the count `getTotalLineCountLessThan5` takes over the whole block, PSystemError.java:217-218). */
function underFiveLines(slug: string): boolean {
  return (
    readFileSync(join(CACHE, slug, 'in.puml'), 'utf8')
      .trimEnd()
      .split('\n').length < TUTORIAL_LINE_LIMIT
  );
}

/** The wbs b4 head-window ledger reason (journal row 29), restated for files: valid only for a <5-line source. */
function headWindowReason(slug: string): string {
  const e = STOCK_ERRORS[`${TYPE}/${slug}`]!;
  return (
    `PSystemError#getTextBlock prepends the Welcome tutorial whenever source.getTotalLineCountLessThan5() ` +
    `(PSystemError.java:217-218), pushing the jar's 'PlantUML version ...' signature (PSystemError.java:148) ` +
    `past the 4096-byte HEAD_BYTES head-read window (refusal-coverage.test.ts, pin-corpus-tree-measure.ts), ` +
    `so isJarErrorPage misreads a genuine jar error page as jarRendered. The stock jar errors here ` +
    `(oracle/goldens/stock-error-pages.json ${TYPE}/${slug}: "${e.message}" line ${e.line}) and this port ` +
    `refuses with the same string -- conformant under the 2026-10-10 error-page rule. ` +
    `Measurement-tool limitation, not an unported feature (json-family-followons close).`
  );
}

function refusalRow(m: MeasuredFixture, old: Row, stamp: Pick<Row, 'measuredAt' | 'measuredAgainstCommit'>): Row {
  if (old.status === 'jar-error') return old;
  if (m.weErrored && m.jarRendered && STOCK_ERRORS[`${TYPE}/${m.slug}`] !== undefined && underFiveLines(m.slug))
    return {
      tree: 'dot-cache',
      type: TYPE,
      slug: m.slug,
      jarRendered: true,
      weErrored: true,
      engine: m.engine,
      status: 'known-gap',
      ...stamp,
      reason: headWindowReason(m.slug),
    };
  // We error where the jar errors too: agreement, not a defect (refusal-coverage.test.ts#isDefect,
  // #checkNoNewRefusal) -- but only the head-window case above is a known-gap; any other is refused.
  if (m.weErrored && m.jarRendered) throw new RefusedRow('errors on our side; a known-gap needs a ledger reason');
  return {
    tree: 'dot-cache',
    type: TYPE,
    slug: m.slug,
    jarRendered: m.jarRendered,
    weErrored: m.weErrored,
    engine: m.engine,
    status: 'ok',
    ...stamp,
  };
}

function rebuild(
  b: Baseline,
  measured: readonly MeasuredFixture[],
  pinned: readonly string[],
  derive: typeof routingRow,
  stamp: Pick<Row, 'measuredAt' | 'measuredAgainstCommit'>,
  file: string,
): { fixtures: Row[]; replaced: number; cloned: number; refused: Refusal[] } {
  const bySlug = new Map(measured.map((m) => [m.slug, m]));
  const refused: Refusal[] = [];
  let replaced = 0;
  const fixtures = b.fixtures
    .filter((r) => !isFilesGoldens(r))
    .map((r) => {
      if (!isFilesCache(r)) return r;
      const m = bySlug.get(r.slug);
      if (m === undefined) throw new Error(`${r.slug}: pinned dot-cache/${TYPE} row has no fixture on disk`);
      try {
        const next = derive(m, r, stamp);
        if (next !== r) replaced++;
        return next;
      } catch (err) {
        if (!(err instanceof RefusedRow)) throw err;
        refused.push({ file, slug: r.slug, why: err.message });
        return r;
      }
    });
  const cacheRows = new Map(fixtures.filter(isFilesCache).map((r) => [r.slug, r]));
  let cloned = 0;
  for (const slug of pinned) {
    const twin = cacheRows.get(slug);
    if (twin === undefined) throw new Error(`${slug}: pinned in ratchet.json but has no dot-cache/${TYPE} row`);
    const okStatus = derive === routingRow ? 'agree' : 'ok';
    if (twin.status !== okStatus) {
      refused.push({ file, slug, why: `twin status ${twin.status}, cannot clone as a golden row` });
      continue;
    }
    fixtures.push({ ...twin, tree: 'goldens', type: GOLDEN_TYPE, slug, ...stamp });
    cloned++;
  }
  return { fixtures, replaced, cloned, refused };
}

const REFUSAL_PREVIEW = 10;

function main(): void {
  const argv = process.argv.slice(2);
  const write = argv.includes('--write');
  const li = argv.indexOf('--label');
  const label = li >= 0 ? (argv[li + 1] ?? 'close') : 'close';
  const stamp = {
    measuredAt: new Date().toISOString().slice(0, 10),
    measuredAgainstCommit: execFileSync('git', ['rev-parse', '--short=8', 'HEAD'], {
      cwd: REPO,
      encoding: 'utf8',
    }).trim(),
  };
  const pinned = (JSON.parse(readFileSync(RATCHET, 'utf8')) as { fixtures: { slug: string }[] }).fixtures.map(
    (f) => f.slug,
  );
  const measured = listFixtureSlugs(CACHE).map(measureFiles);
  console.log(`measured ${measured.length} ${TYPE} fixtures; ${pinned.length} pinned in ratchet.json`);
  const outputs: { path: string; text: string }[] = [];
  const refused: Refusal[] = [];
  for (const [path, derive, name] of [
    [ROUTING, routingRow, 'routing'],
    [REFUSAL, refusalRow, 'refusal'],
  ] as const) {
    const b = JSON.parse(readFileSync(path, 'utf8')) as Baseline;
    const before = b.fixtures.length;
    const r = rebuild(b, measured, pinned, derive, stamp, name);
    refused.push(...r.refused);
    const statuses = new Map<string, number>();
    for (const row of r.fixtures.filter(isFilesCache)) statuses.set(row.status, (statuses.get(row.status) ?? 0) + 1);
    console.log(
      `${name}: rows ${before} -> ${r.fixtures.length}; dot-cache/${TYPE} re-pinned ${r.replaced}, goldens clones ${r.cloned}; statuses ${JSON.stringify(Object.fromEntries(statuses))}`,
    );
    const note = ` Re-pinned ${stamp.measuredAt} at ${stamp.measuredAgainstCommit} by ${MISSION} / ${label}: ${r.replaced} "${TYPE}" dot-cache rows re-measured in place, ${r.cloned} "${GOLDEN_TYPE}" golden rows appended (clones of their byte-identical dot-cache twins).`;
    outputs.push({ path, text: `${JSON.stringify({ $comment: b.$comment + note, fixtures: r.fixtures }, null, 2)}\n` });
  }
  if (refused.length > 0) {
    console.log(
      `REFUSED ${refused.length} row(s) (kept as pinned); first ${Math.min(REFUSAL_PREVIEW, refused.length)}:`,
    );
    for (const f of refused.slice(0, REFUSAL_PREVIEW)) console.log(`  ${f.file} ${f.slug}: ${f.why}`);
  }
  if (!write) {
    console.log('dry run -- pass --write to update both baselines');
    return;
  }
  if (refused.length > 0) {
    console.error('refusing to write: resolve the refused rows first (nothing was written)');
    process.exitCode = 1;
    return;
  }
  for (const o of outputs) {
    writeFileSync(o.path, o.text);
    console.log(`wrote ${o.path}`);
  }
}

main();
