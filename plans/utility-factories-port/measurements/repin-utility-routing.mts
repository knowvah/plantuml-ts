/**
 * `npx jiti plans/utility-factories-port/measurements/repin-utility-routing.mts [--write] [--label <text>] [--fix-records] [--repo <root>]`
 *
 * Routing/refusal re-pin for the 17 `UTILITY_SLUGS` rows (utility-factories-
 * port T0b, D9; port of `plans/wbs-engine-port/measurements/repin-wbs-routing.mts`).
 * Orchestrator-only. Default mode, two steps, both from the gates' OWN
 * measurement (`scripts/pin-corpus-tree-measure.ts#measureFixture`):
 *
 * 1. Replaces every `tree: dot-cache, type: unknown` row of
 *    `oracle/goldens/svg-conformance/{routing,refusal}-baseline.json` whose
 *    slug is in `UTILITY_SLUGS` IN PLACE from a fresh measurement. No other
 *    `unknown` row is read or touched. A row pinned `jar-error` stays as
 *    pinned. A fixture that now routes `agree` / renders `ok` is re-pinned so
 *    and its `reason` is dropped (the fresh row carries none -- the factory
 *    that the old reason called unported is now ported); one that still
 *    misroutes or errors on our side is REFUSED (no ledger of excuses here),
 *    except the two sudoku rows D13 rules out ({@link MIT_EDITION_SLUGS}),
 *    which stay `known-gap` with the ruling as their reason, and the
 *    {@link ASSET_SEAM_SLUGS} row, which errors here only for want of an
 *    asset store (its goldens twin is cloned `known-gap` too).
 * 2. Clones, for every slug in `oracle/goldens/svg-utility/ratchet.json`, its
 *    fresh dot-cache twin as `tree: goldens, type: svg-utility` in both files,
 *    replacing any earlier `svg-utility` goldens rows.
 *
 * `--fix-records` is a SEPARATE mode (no measurement, nothing is refused): it
 * rewrites only the two wrong record reasons the T0a ledger found --
 *   (a) the HELP rows' claim that `HelpFactory` is "never added" to
 *       `PSystemBuilder` (it is: `PSystemBuilder.java:188`), replaced in place
 *       by the clause naming the real gap (this port ports no help engine);
 *   (b) `kubuju-35-neji041`'s refusal reason, a copy-paste of a state-seam
 *       landing note, replaced by the `listfonts` mechanism
 *       (`font/PSystemListFontsFactory.java:47-52`).
 * Without `--write` nothing is written. `--repo` (default: this checkout)
 * redirects every path, for a dry run against a temp repo.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { measureFixture, type MeasuredFixture } from '../../../scripts/pin-corpus-tree-measure.js';
import { fixtureIncludeStore } from '../../../tests/helpers/fixture-include-store.js';
import { UTILITY_CACHE_TYPE, UTILITY_SLUGS } from '../../../tests/oracle/svg-conformance/render-fixture-utility.js';

const MISSION = 'utility-factories-port';
const GOLDENS_TYPE = 'svg-utility';

export interface Row {
  tree?: string;
  type: string;
  slug: string;
  status: string;
  measuredAt: string;
  measuredAgainstCommit: string;
  reason?: string;
  [k: string]: unknown;
}
export interface Baseline {
  $comment: string;
  fixtures: Row[];
}
export type Stamp = Pick<Row, 'measuredAt' | 'measuredAgainstCommit'>;

const isUtilityCache = (r: Row): boolean =>
  r.tree === 'dot-cache' && r.type === UTILITY_CACHE_TYPE && UTILITY_SLUGS.includes(r.slug);
const isUtilityGoldens = (r: Row): boolean => r.tree === 'goldens' && r.type === GOLDENS_TYPE;

export function routingRow(m: MeasuredFixture, old: Row, stamp: Stamp): Row {
  if (old.status === 'jar-error') return old;
  if (m.jarType !== m.ourType) {
    throw new Error(`routing: ${m.slug} still misroutes (${m.jarType} -> ${m.ourType}); no ledger excuse here`);
  }
  return { tree: 'dot-cache', type: UTILITY_CACHE_TYPE, slug: m.slug, jarType: m.jarType, ourType: m.ourType, status: 'agree', ...stamp };
}

/** The two sudoku rows D13 rules out: upstream strips `sudoku/` from the MIT edition. */
export const MIT_EDITION_SLUGS: readonly string[] = ['lazama-75-loli189', 'gazale-13-tadu312'];
export const MIT_EDITION_REASON =
  'Out of scope by maintainer ruling (utility-factories-port D13, 2026-10-13): this port mirrors upstream\'s MIT ' +
  "edition, which strips the sudoku/ package ('// ::remove folder when __MIT__' in sudoku/GraphicsSudoku.java) and " +
  'comments out the PSystemSudokuFactory registration (PSystemBuilder.java:163), so a `sudoku` line is a syntax ' +
  'error there as here. The GPL oracle jar draws the puzzle; README.md "Mirrors upstream\'s MIT edition".';

/** Rows the refusal gate sees error only because it renders with no `options.assetStore`. */
export const ASSET_SEAM_SLUGS: readonly string[] = ['kavama-92-noro949'];
export const ASSET_SEAM_REASON =
  'The dedication image reaches the port only through options.assetStore (ADR-2): DedicationSimple.getImage returns ' +
  'undefined when the store cannot serve its bytes (src/diagrams/dedication/DedicationSimple.ts:43-44, upstream\'s ' +
  'failed decode, DedicationSimple.java:65-68), so Dedications.get matches nothing and no factory claims the line. ' +
  'This gate renders with no asset store, as a library consumer does by default; with the utility asset store ' +
  '(surveyAssetStore) the page renders conformant and is pinned in svg-utility. Closes when the eggs/dedication ' +
  'assets ship to library consumers (utility-factories-port follow-on).';

const ruledKnownGap = (m: MeasuredFixture, stamp: Stamp, reason: string): Row => {
  const { slug, jarRendered, weErrored, engine } = m;
  return { tree: 'dot-cache', type: UTILITY_CACHE_TYPE, slug, jarRendered, weErrored, engine, status: 'known-gap', ...stamp, reason };
};

export function refusalRow(m: MeasuredFixture, old: Row, stamp: Stamp): Row {
  if (old.status === 'jar-error') return old;
  if (ASSET_SEAM_SLUGS.includes(m.slug)) {
    if (!m.weErrored) throw new Error(`refusal: ${m.slug} renders without an asset store; retire its asset-seam known-gap`);
    return ruledKnownGap(m, stamp, ASSET_SEAM_REASON);
  }
  if (MIT_EDITION_SLUGS.includes(m.slug)) {
    if (!m.weErrored) throw new Error(`refusal: ${m.slug} renders on our side, but D13 rules sudoku out (MIT edition)`);
    return ruledKnownGap(m, stamp, MIT_EDITION_REASON);
  }
  if (m.weErrored && m.jarRendered) {
    throw new Error(`refusal: ${m.slug} errors on our side where the jar renders; no ledger excuse here`);
  }
  return { tree: 'dot-cache', type: UTILITY_CACHE_TYPE, slug: m.slug, jarRendered: m.jarRendered, weErrored: m.weErrored, engine: m.engine, status: 'ok', ...stamp };
}

export type Derive = typeof routingRow;

export function rebuild(
  b: Baseline,
  measured: readonly MeasuredFixture[],
  pinned: readonly string[],
  derive: Derive,
  stamp: Stamp,
): { fixtures: Row[]; replaced: number; cloned: number } {
  const bySlug = new Map(measured.map((m) => [m.slug, m]));
  let replaced = 0;
  const fixtures = b.fixtures
    .filter((r) => !isUtilityGoldens(r))
    .map((r) => {
      if (!isUtilityCache(r)) return r;
      const m = bySlug.get(r.slug);
      if (m === undefined) throw new Error(`${r.slug}: utility dot-cache/unknown row has no measurement`);
      const next = derive(m, r, stamp);
      if (next !== r) replaced++;
      return next;
    });
  const cacheRows = new Map(fixtures.filter(isUtilityCache).map((r) => [r.slug, r]));
  for (const slug of pinned) {
    const twin = cacheRows.get(slug);
    if (twin === undefined) throw new Error(`${slug}: pinned in ratchet.json but has no dot-cache/unknown utility row`);
    const okStatus = derive === routingRow ? 'agree' : 'ok';
    const assetSeamTwin = derive === refusalRow && twin.status === 'known-gap' && ASSET_SEAM_SLUGS.includes(slug);
    if (twin.status !== okStatus && !assetSeamTwin) throw new Error(`${slug}: twin status ${twin.status}, cannot clone as a golden row`);
    fixtures.push({ ...twin, tree: 'goldens', type: GOLDENS_TYPE, slug, ...stamp });
  }
  return { fixtures, replaced, cloned: pinned.length };
}

/** The false clause in the HELP rows (T0a record check): `PSystemBuilder.java:188` adds `HelpFactory`. */
export const HELP_WRONG_CLAUSE = "HelpFactory is never added to PSystemBuilder's factory list (PSystemBuilder.java:188)";
export const HELP_RIGHT_CLAUSE =
  "upstream adds HelpFactory to PSystemBuilder's factory list (PSystemBuilder.java:188; help/HelpFactory.java:51-66, " +
  'DiagramType.HELP with five CommandHelp* commands) and this port has no help engine (src/index.ts registers none)';

export const KUBUJU_SLUG = 'kubuju-35-neji041';
/** `kubuju-35-neji041` (`listfonts <text>`), replacing a copy-pasted state-seam landing note. */
export const KUBUJU_REASON =
  "PSystemListFontsFactory (PSystemBuilder.java:148) matches 'listfont' / 'listfonts' or a line starting 'listfont ' / " +
  "'listfonts ' (font/PSystemListFontsFactory.java:49-50) and returns PSystemListFonts (font/PSystemListFonts.java:47-58), a " +
  "PlainStringsDiagram whose strings are '<b><size:16>Fonts available:' followed by one '<family> : <font:<family>><text>' " +
  'line per GraphicsEnvironment#getAvailableFontFamilyNames() entry; this fixture is `listfonts` plus a text argument. This ' +
  'port registers no listfonts plugin, so every engine refuses the line ("Syntax Error?") while the jar draws the listing. ' +
  'The listing depends on the host font set; whether it is ported with an injected family list or accepted as a ' +
  'library-forced divergence is a maintainer ruling not yet made.';

/** Applies the two record fixes to one baseline; returns the rewritten rows and how many changed. */
export function fixRecords(b: Baseline): { fixtures: Row[]; fixed: number } {
  let fixed = 0;
  const fixtures = b.fixtures.map((r) => {
    if (r.tree !== 'dot-cache' || r.type !== UTILITY_CACHE_TYPE) return r;
    if (typeof r.reason === 'string' && r.reason.includes(HELP_WRONG_CLAUSE)) {
      fixed++;
      return { ...r, reason: r.reason.replace(HELP_WRONG_CLAUSE, HELP_RIGHT_CLAUSE) };
    }
    if (r.slug === KUBUJU_SLUG && r.status === 'known-gap' && typeof r.reason === 'string') {
      fixed++;
      return { ...r, reason: KUBUJU_REASON };
    }
    return r;
  });
  return { fixtures, fixed };
}

function stampNow(repo: string): Stamp {
  return {
    measuredAt: new Date().toISOString().slice(0, 10),
    measuredAgainstCommit: execFileSync('git', ['rev-parse', '--short=8', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(),
  };
}

function runFixRecords(paths: readonly string[], write: boolean): void {
  for (const path of paths) {
    const b = JSON.parse(readFileSync(path, 'utf8')) as Baseline;
    const { fixtures, fixed } = fixRecords(b);
    console.log(`${path}: ${fixed} record reason(s) rewritten`);
    if (write) writeFileSync(path, `${JSON.stringify({ $comment: b.$comment, fixtures }, null, 2)}\n`);
  }
  if (!write) console.log('dry run -- pass --write to update both baselines');
}

function runRepin(repo: string, paths: readonly [string, string], write: boolean, label: string): void {
  const stamp = stampNow(repo);
  const ratchet = join(repo, 'oracle/goldens/svg-utility/ratchet.json');
  const pinned = (JSON.parse(readFileSync(ratchet, 'utf8')) as { fixtures: { slug: string }[] }).fixtures.map((f) => f.slug);
  const store = fixtureIncludeStore();
  const treeDir = join(repo, 'test-results/dot-cache', UTILITY_CACHE_TYPE);
  const measured = UTILITY_SLUGS.map((slug) => measureFixture(treeDir, slug, store));
  console.log(`measured ${measured.length} utility fixtures; ${pinned.length} pinned in ratchet.json`);
  const jobs: readonly [string, Derive, string][] = [
    [paths[0], routingRow, 'routing'],
    [paths[1], refusalRow, 'refusal'],
  ];
  for (const [path, derive, name] of jobs) {
    const b = JSON.parse(readFileSync(path, 'utf8')) as Baseline;
    const { fixtures, replaced, cloned } = rebuild(b, measured, pinned, derive, stamp);
    console.log(`${name}: rows ${b.fixtures.length} -> ${fixtures.length}; utility dot-cache/unknown re-pinned ${replaced}, goldens clones ${cloned}`);
    if (!write) continue;
    const note = ` Re-pinned ${stamp.measuredAt} at ${stamp.measuredAgainstCommit} by ${MISSION} / ${label}: ${replaced} utility "unknown" dot-cache rows re-measured in place, ${cloned} "${GOLDENS_TYPE}" golden rows appended (clones of their byte-identical dot-cache twins).`;
    writeFileSync(path, `${JSON.stringify({ $comment: b.$comment + note, fixtures }, null, 2)}\n`);
    console.log(`wrote ${path}`);
  }
  if (!write) console.log('dry run -- pass --write to update both baselines');
}

/* v8 ignore start -- CLI entry point; exercised via the acceptance run. */
function main(): void {
  const argv = process.argv.slice(2);
  const arg = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const here = dirname(fileURLToPath(import.meta.url));
  const repo = arg('--repo') ?? join(here, '../../..');
  const paths = [
    join(repo, 'oracle/goldens/svg-conformance/routing-baseline.json'),
    join(repo, 'oracle/goldens/svg-conformance/refusal-baseline.json'),
  ] as const;
  const write = argv.includes('--write');
  if (argv.includes('--fix-records')) runFixRecords(paths, write);
  else runRepin(repo, paths, write, arg('--label') ?? 'close');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    main();
  } catch (err) {
    console.error(`repin-utility-routing: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
/* v8 ignore stop */
