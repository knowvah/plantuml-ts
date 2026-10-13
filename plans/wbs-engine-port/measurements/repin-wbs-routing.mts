/**
 * `npx jiti plans/wbs-engine-port/measurements/repin-wbs-routing.mts [--write] [--label <text>]`
 *
 * The batch-4 close's routing/refusal re-pin for wbs (mindmap precedent:
 * mindmap-engine-port journal rows 27-28; salt-engine-port's twin). Two steps, both from the gates'
 * OWN measurement (`scripts/pin-corpus-tree-measure.ts#measureTree`, the
 * seams `routing-conformance.test.ts` / `refusal-coverage.test.ts` use):
 *
 * 1. Replaces every `tree: dot-cache, type: wbs` row of
 *    `oracle/goldens/svg-conformance/{routing,refusal}-baseline.json` IN
 *    PLACE from a fresh measurement. A row pinned `jar-error` stays exactly
 *    as pinned (the jar still errors; mindmap left its three untouched). A
 *    fixture that now routes `agree` / renders `ok` is re-pinned so; one
 *    that still misroutes or errors on our side is REFUSED (this tool has
 *    no ledger of excuses -- `scripts/pin-corpus-tree.ts` owns those).
 * 2. Clones, for every slug in `oracle/goldens/svg-wbs/ratchet.json`, its
 *    fresh dot-cache twin as `tree: goldens, type: svg-wbs` in both files
 *    (what `pin-goldens.mts` does for class; `pin-wbs.mts` deliberately
 *    does not), replacing any earlier `svg-wbs` goldens rows. Both gates
 *    walk every `oracle/goldens/svg-<family>/` dir and demand a row each.
 *
 * Without `--write` nothing is written. Orchestrator-only.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { measureTree, type MeasuredFixture } from '../../../scripts/pin-corpus-tree-measure.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '../../..');
const CACHE = join(REPO, 'test-results/dot-cache/wbs');
const RATCHET = join(REPO, 'oracle/goldens/svg-wbs/ratchet.json');
const ROUTING = join(REPO, 'oracle/goldens/svg-conformance/routing-baseline.json');
const REFUSAL = join(REPO, 'oracle/goldens/svg-conformance/refusal-baseline.json');
const MISSION = 'wbs-engine-port';

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

const isWbsCache = (r: Row): boolean => r.tree === 'dot-cache' && r.type === 'wbs';
const isWbsGoldens = (r: Row): boolean => r.tree === 'goldens' && r.type === 'svg-wbs';

function routingRow(m: MeasuredFixture, old: Row, stamp: Pick<Row, 'measuredAt' | 'measuredAgainstCommit'>): Row {
  if (old.status === 'jar-error') return old;
  if (m.jarType !== m.ourType) throw new Error(`routing: ${m.slug} still misroutes (${m.jarType} -> ${m.ourType}); no ledger excuse here`);
  return { tree: 'dot-cache', type: 'wbs', slug: m.slug, jarType: m.jarType, ourType: m.ourType, status: 'agree', ...stamp };
}

/** Stock-jar error record (`scripts/stock-jar-verify.sh`): keys `wbs/<slug>`. */
const STOCK_ERRORS = (
  JSON.parse(readFileSync(join(REPO, 'oracle/goldens/stock-error-pages.json'), 'utf8')) as {
    errors: Record<string, { line: number | null; message: string }>;
  }
).errors;

/** b4 close (journal row 29): the jar's error page for a <5-line source is
 *  prefixed by the Welcome tutorial (PSystemError.java:217-218), pushing its
 *  'PlantUML version' banner past the gates' 4096-byte HEAD_BYTES window, so
 *  the head read records `jarRendered: true` for a genuine jar error. Same
 *  ledger reason as `unknown/bupexo-79-sijo243`. */
function headWindowReason(slug: string): string {
  const e = STOCK_ERRORS[`wbs/${slug}`]!;
  return (
    `PSystemError#getTextBlock prepends the Welcome tutorial whenever source.getTotalLineCountLessThan5() ` +
    `(PSystemError.java:217-218), pushing the jar's 'PlantUML version ...' signature (PSystemError.java:148) ` +
    `past the 4096-byte HEAD_BYTES head-read window (refusal-coverage.test.ts, pin-corpus-tree-measure.ts), ` +
    `so isJarErrorPage misreads a genuine jar error page as jarRendered. The stock jar errors here ` +
    `(oracle/goldens/stock-error-pages.json wbs/${slug}: "${e.message}" line ${e.line}) and this port ` +
    `refuses with the same string (WBSDiagram.addIdeaDisplay, WBSDiagram.java:160-162) -- conformant under ` +
    `the 2026-10-10 error-page rule. Measurement-tool limitation, not an unported feature ` +
    `(wbs-engine-port b4 close, journal row 29).`
  );
}

function refusalRow(m: MeasuredFixture, old: Row, stamp: Pick<Row, 'measuredAt' | 'measuredAgainstCommit'>): Row {
  if (old.status === 'jar-error') return old;
  if (m.weErrored && m.jarRendered && STOCK_ERRORS[`wbs/${m.slug}`] !== undefined)
    return {
      tree: 'dot-cache',
      type: 'wbs',
      slug: m.slug,
      jarRendered: true,
      weErrored: true,
      engine: m.engine,
      status: 'known-gap',
      ...stamp,
      reason: headWindowReason(m.slug),
    };
  // We error where the jar errors too: agreement, not a defect (refusal-coverage.test.ts#isDefect,
  // #checkNoNewRefusal); re-pinned `ok` with the measured flags (b4 close, journal row 29).
  if (m.weErrored && m.jarRendered) throw new Error(`refusal: ${m.slug} errors on our side; a known-gap needs a ledger reason`);
  return { tree: 'dot-cache', type: 'wbs', slug: m.slug, jarRendered: m.jarRendered, weErrored: m.weErrored, engine: m.engine, status: 'ok', ...stamp };
}

function rebuild(
  b: Baseline,
  measured: readonly MeasuredFixture[],
  pinned: readonly string[],
  derive: typeof routingRow,
  stamp: Pick<Row, 'measuredAt' | 'measuredAgainstCommit'>,
): { fixtures: Row[]; replaced: number; cloned: number } {
  const bySlug = new Map(measured.map((m) => [m.slug, m]));
  let replaced = 0;
  const fixtures = b.fixtures
    .filter((r) => !isWbsGoldens(r))
    .map((r) => {
      if (!isWbsCache(r)) return r;
      const m = bySlug.get(r.slug);
      if (m === undefined) throw new Error(`${r.slug}: pinned dot-cache/wbs row has no fixture on disk`);
      const next = derive(m, r, stamp);
      if (next !== r) replaced++;
      return next;
    });
  const cacheRows = new Map(fixtures.filter(isWbsCache).map((r) => [r.slug, r]));
  for (const slug of pinned) {
    const twin = cacheRows.get(slug);
    if (twin === undefined) throw new Error(`${slug}: pinned in ratchet.json but has no dot-cache/wbs row`);
    const okStatus = derive === routingRow ? 'agree' : 'ok';
    if (twin.status !== okStatus) throw new Error(`${slug}: twin status ${twin.status}, cannot clone as a golden row`);
    fixtures.push({ ...twin, tree: 'goldens', type: 'svg-wbs', slug, ...stamp });
  }
  return { fixtures, replaced, cloned: pinned.length };
}

function main(): void {
  const argv = process.argv.slice(2);
  const write = argv.includes('--write');
  const li = argv.indexOf('--label');
  const label = li >= 0 ? (argv[li + 1] ?? 'close') : 'batch-4 close';
  const stamp = {
    measuredAt: new Date().toISOString().slice(0, 10),
    measuredAgainstCommit: execFileSync('git', ['rev-parse', '--short=8', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim(),
  };
  const pinned = (JSON.parse(readFileSync(RATCHET, 'utf8')) as { fixtures: { slug: string }[] }).fixtures.map((f) => f.slug);
  const measured = measureTree(CACHE);
  console.log(`measured ${measured.length} wbs fixtures; ${pinned.length} pinned in ratchet.json`);
  for (const [path, derive, name] of [
    [ROUTING, routingRow, 'routing'],
    [REFUSAL, refusalRow, 'refusal'],
  ] as const) {
    const b = JSON.parse(readFileSync(path, 'utf8')) as Baseline;
    const before = b.fixtures.length;
    const { fixtures, replaced, cloned } = rebuild(b, measured, pinned, derive, stamp);
    const statuses = new Map<string, number>();
    for (const r of fixtures.filter(isWbsCache)) statuses.set(r.status, (statuses.get(r.status) ?? 0) + 1);
    console.log(`${name}: rows ${before} -> ${fixtures.length}; dot-cache/wbs re-pinned ${replaced}, goldens clones ${cloned}; statuses ${JSON.stringify(Object.fromEntries(statuses))}`);
    if (!write) continue;
    const note = ` Re-pinned ${stamp.measuredAt} at ${stamp.measuredAgainstCommit} by ${MISSION} / ${label}: ${replaced} "wbs" dot-cache rows re-measured in place (the wbs plugin now registers), ${cloned} "svg-wbs" golden rows appended (clones of their byte-identical dot-cache twins).`;
    writeFileSync(path, `${JSON.stringify({ $comment: b.$comment + note, fixtures }, null, 2)}\n`);
    console.log(`wrote ${path}`);
  }
  if (!write) console.log('dry run -- pass --write to update both baselines');
}

main();
