/**
 * Sequence GEOMETRY DISTANCE instrument — the Batch 1 deliverable of
 * `plans/sequence-coordinate-convergence` (T1.1), and the quantity every
 * later batch of that mission is gated on (D1).
 *
 * WHY THIS EXISTS. `weightedScore` counts diff RECORDS. An `@x` that is wrong
 * by 40 and becomes wrong by 35 costs exactly 1 either way, so a coordinate
 * that moves CLOSER to the jar is invisible to it. Three consecutive
 * jar-verified geometry fixes (`bbcc90ae`, `5dfa0982`, `ebbd1f41`) each
 * adjudicated `unchanged=1124` for precisely that reason. This instrument
 * measures the thing those commits actually changed: the sum of `|delta|`
 * over the numeric diffs `compare.ts` already computes.
 *
 * `Diff.delta` is set at exactly four sites in `compare.ts`, all numeric — a
 * plain numeric attribute (`:274`), a `d` path argument (`:361`), a
 * `points`/`viewBox` number (`:326`), a `transform` parameter (`:371`).
 * Everything else (a colour, a tag mismatch, a child count) carries no
 * `delta` and is not distance. This script sums those four and nothing else.
 *
 * THE COHORT HAZARD, and why `descended` is reported alongside distance.
 * `compareSvg` short-circuits at node type, tag and child count
 * (`compare.ts:198,229,404`), and a short-circuited subtree is never
 * descended into, so it contributes NO numeric diffs. A fixture that stops
 * descending therefore reports distance 0 — indistinguishable, by the number
 * alone, from a fixture whose geometry became exact. 410 of 1124 sequence
 * fixtures already short-circuit at the top-level child count, and D5 expects
 * more to cross that line mid-mission. So distance is NEVER read corpus-wide
 * without its cohort: every measurement carries `numericCount` and
 * `descended`, and `--compare` sums only fixtures whose descent status is the
 * same at both refs, reporting the rest separately rather than folding them in.
 *
 * THE MEASUREMENT HAZARDS are the ones `sequence-ratchet-adjudicate.ts`
 * documents at length, and the precautions are the same: `renderSync` is
 * never called (it returns `errorSvg` when `options.includeStore` is absent,
 * `src/index.ts:213`), the measurer is `DeterministicMeasurer` explicitly, and
 * the include store is a REQUIRED parameter of `measureFixture`.
 *
 * USAGE
 *
 *   npx jiti scripts/sequence-geometry-distance.ts --snapshot <path>
 *
 * measures the working tree and writes the snapshot JSON to `<path>`.
 *
 *   npx jiti scripts/sequence-geometry-distance.ts --compare <baseline.json>
 *
 * measures the working tree and prints the per-attribute and per-fixture
 * movement against that baseline snapshot.
 *
 * With neither flag it measures and prints the totals alone. Rendering itself writes to stdout (`!log` reaches `console.info`,
 * `src/core/tim/EaterLog.ts:35`), so machine-readable output is delimited by
 * `JSON_BEGIN`/`JSON_END` exactly as the adjudicator's is.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../src/core/measurer-deterministic.js';
import type { IncludeStore } from '../src/core/tim/IncludeStore.js';
import { fixtureIncludeStore } from '../tests/helpers/fixture-include-store.js';
import { compareSvg, type Diff } from '../tests/oracle/svg-conformance/compare.js';
import { renderFixtureSequence } from '../tests/oracle/svg-conformance/render-fixture-sequence.js';
import { formatConcentration } from './sequence-distance-concentration.js';

const SELF = fileURLToPath(import.meta.url);
const REPO = join(dirname(SELF), '..');

/** Committed corpus root, relative to a repo root. Same tree the adjudicator
 *  walks, deliberately: the two instruments must not disagree on membership. */
export const SEQUENCE_CACHE_REL = join('test-results', 'dot-cache', 'sequence');

/** Sentinels around the JSON block — see the header on why stdout is dirty. */
export const JSON_BEGIN = '--- BEGIN DISTANCE JSON ---';
export const JSON_END = '--- END DISTANCE JSON ---';

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

/** Distance and count for one attribute name, or for the whole corpus. */
export interface DistanceTotals {
  /** Sum of `|delta|` over the numeric diffs in scope. */
  readonly distance: number;
  /** How many numeric diffs contributed to it. */
  readonly count: number;
}

/**
 * One fixture at one ref. `distance` is `null` when the fixture ERRORED —
 * never coerced to 0, for the same reason the adjudicator refuses to coerce a
 * null score: an error is an absence of measurement, not a perfect one.
 */
export interface FixtureDistance {
  readonly slug: string;
  readonly distance: number | null;
  readonly numericCount: number | null;
  /**
   * Whether the comparison descended past the TOP-LEVEL child count. `false`
   * means `compareSvg` short-circuited at `svg/g[1]` and never compared a
   * single coordinate below it, so this fixture's `distance` says nothing
   * about its geometry. See the cohort hazard in the header.
   */
  readonly descended: boolean;
  /** Per-attribute breakdown, keyed by bare attribute name (`x`, `width`, …). */
  readonly byAttribute: Readonly<Record<string, DistanceTotals>>;
  /** Present iff the fixture errored at this ref. */
  readonly error?: string;
}

export interface DistanceSnapshot {
  readonly fixtures: readonly FixtureDistance[];
  readonly total: DistanceTotals;
  readonly byAttribute: Readonly<Record<string, DistanceTotals>>;
  /** Fixtures that errored, that descended, and that did not. */
  readonly cohort: {
    readonly measured: number;
    readonly errored: number;
    readonly descended: number;
    readonly shortCircuited: number;
  };
}

// ---------------------------------------------------------------------------
// Pure accounting
// ---------------------------------------------------------------------------

/**
 * The bare attribute name a numeric diff path names.
 *
 * `compare.ts` builds attribute paths as `${nodePath}/@${name}` (`:245`) and
 * then suffixes the multi-valued forms: `[i]` for a `d`/`points`/`viewBox`
 * element (`:302,326,361`) and `[i].param[j]` for a transform parameter
 * (`:371`). Everything after the attribute name is therefore an index, and is
 * stripped so that all of a `d` attribute's numbers aggregate under `d`.
 *
 * `null` for a path with no `/@` segment — a `[childCount]` record, say —
 * which is exactly the set of diffs that carry no `delta` either.
 */
export function attributeOf(path: string): string | null {
  const at = path.lastIndexOf('/@');
  if (at === -1) return null;
  const tail = path.slice(at + 2);
  const cut = tail.search(/[[.]/);
  const name = cut === -1 ? tail : tail.slice(0, cut);
  return name === '' ? null : name;
}

/**
 * The one short-circuit that decides cohort membership, named exactly as
 * `sequence-ratchet-adjudicate.ts` names it. `compareSvg` roots its paths at
 * the `<svg>` tag (`compare.ts:457`) and the sequence corpus' content group is
 * its second child, so a child-count mismatch on the diagram body lands here.
 */
export const TOP_LEVEL_CHILD_COUNT_PATH = 'svg/g[1][childCount]';

/**
 * Did the comparison get below the root content group?
 *
 * A `[childCount]` record at that path means `compare.ts:396-406` charged the
 * whole subtree and returned WITHOUT comparing any child (`:404`), so nothing
 * underneath was measured. Its absence means the walk continued — either the
 * counts matched, or the comparison never reached the group at all, and the
 * latter shows up as a distance of 0 with `numericCount` 0, which is why the
 * two are always reported together rather than either alone.
 */
export function descendedFrom(diffs: readonly Diff[]): boolean {
  return !diffs.some((d) => d.path === TOP_LEVEL_CHILD_COUNT_PATH);
}

/** Empty totals — the identity this module accumulates onto. */
const ZERO: DistanceTotals = { distance: 0, count: 0 };

function add(totals: DistanceTotals, delta: number): DistanceTotals {
  return { distance: totals.distance + delta, count: totals.count + 1 };
}

/**
 * Sums `|delta|` over the diffs that carry one, grouped by attribute.
 *
 * A diff without `delta` is not a coordinate error and is skipped entirely —
 * see the header: `delta` is set at exactly four numeric sites in
 * `compare.ts`, and its absence is what marks every other diff class.
 * `Math.abs` is applied defensively even though those four sites all
 * construct it with `Math.abs` already; a signed delta would otherwise let
 * two errors cancel, which is the one arithmetic this instrument must not do.
 */
export function distanceOf(diffs: readonly Diff[]): {
  total: DistanceTotals;
  byAttribute: Record<string, DistanceTotals>;
} {
  let total = ZERO;
  const byAttribute: Record<string, DistanceTotals> = {};
  for (const diff of diffs) {
    if (diff.delta === undefined || !Number.isFinite(diff.delta)) continue;
    const magnitude = Math.abs(diff.delta);
    const name = attributeOf(diff.path) ?? 'unattributed';
    total = add(total, magnitude);
    byAttribute[name] = add(byAttribute[name] ?? ZERO, magnitude);
  }
  return { total, byAttribute };
}

/** Merges a fixture's per-attribute totals into a corpus-wide accumulator. */
export function mergeByAttribute(
  into: Record<string, DistanceTotals>,
  from: Readonly<Record<string, DistanceTotals>>,
): void {
  for (const [name, totals] of Object.entries(from)) {
    const prior = into[name] ?? ZERO;
    into[name] = {
      distance: prior.distance + totals.distance,
      count: prior.count + totals.count,
    };
  }
}

/** Rolls a per-fixture list up into the snapshot the CLI writes. */
export function summarize(fixtures: readonly FixtureDistance[]): DistanceSnapshot {
  const byAttribute: Record<string, DistanceTotals> = {};
  let distance = 0;
  let count = 0;
  let errored = 0;
  let descended = 0;
  for (const fixture of fixtures) {
    if (fixture.distance === null) {
      errored += 1;
      continue;
    }
    distance += fixture.distance;
    count += fixture.numericCount ?? 0;
    if (fixture.descended) descended += 1;
    mergeByAttribute(byAttribute, fixture.byAttribute);
  }
  const measured = fixtures.length - errored;
  return {
    fixtures,
    total: { distance, count },
    byAttribute,
    cohort: { measured, errored, descended, shortCircuited: measured - descended },
  };
}

// ---------------------------------------------------------------------------
// Comparison against a baseline snapshot — pure
// ---------------------------------------------------------------------------

/** One fixture's movement between two snapshots. */
export interface DistanceMovement {
  readonly slug: string;
  readonly baseDistance: number | null;
  readonly liveDistance: number | null;
  /**
   * `live - base`, so NEGATIVE is progress. `null` whenever either side is
   * null, or whenever the fixture changed descent status — in the latter case
   * the two numbers are not commensurable and subtracting them would
   * manufacture progress out of a short-circuit.
   */
  readonly delta: number | null;
  readonly baseDescended: boolean;
  readonly liveDescended: boolean;
}

/** True when both refs measured the same cohort, so a delta is meaningful. */
export function isCommensurable(base: FixtureDistance, live: FixtureDistance): boolean {
  if (base.distance === null || live.distance === null) return false;
  return base.descended === live.descended;
}

function movementFor(base: FixtureDistance, live: FixtureDistance): DistanceMovement {
  const commensurable = isCommensurable(base, live);
  return {
    slug: live.slug,
    baseDistance: base.distance,
    liveDistance: live.distance,
    delta:
      commensurable && base.distance !== null && live.distance !== null
        ? live.distance - base.distance
        : null,
    baseDescended: base.descended,
    liveDescended: live.descended,
  };
}

/** A slug measured at only one ref: absent there, never a fabricated zero. */
const ABSENT: FixtureDistance = {
  slug: '',
  distance: null,
  numericCount: null,
  descended: false,
  byAttribute: {},
};

function indexBySlug(fixtures: readonly FixtureDistance[]): Map<string, FixtureDistance> {
  return new Map(fixtures.map((f) => [f.slug, f]));
}

/**
 * Joins two snapshots on slug. The union is walked so a fixture present at
 * only one ref is reported rather than dropped, and sorted so two runs of the
 * same pair are byte-identical.
 */
export function compareSnapshots(
  base: DistanceSnapshot,
  live: DistanceSnapshot,
): DistanceMovement[] {
  const baseIndex = indexBySlug(base.fixtures);
  const liveIndex = indexBySlug(live.fixtures);
  const slugs = [...new Set([...baseIndex.keys(), ...liveIndex.keys()])].sort((a, b) =>
    a.localeCompare(b),
  );
  return slugs.map((slug) =>
    movementFor(baseIndex.get(slug) ?? { ...ABSENT, slug }, liveIndex.get(slug) ?? { ...ABSENT, slug }),
  );
}

/** The gate quantity: total movement over the commensurable cohort only. */
export function commensurableTotal(movements: readonly DistanceMovement[]): DistanceTotals {
  let distance = 0;
  let count = 0;
  for (const m of movements) {
    if (m.delta === null) continue;
    distance += m.delta;
    count += 1;
  }
  return { distance, count };
}

// ---------------------------------------------------------------------------
// Reporting — pure
// ---------------------------------------------------------------------------

function round(value: number): string {
  return value.toFixed(3);
}

/** Attribute rows, heaviest first — the breakdown Batch 2's gate reads. */
export function formatAttributeTable(byAttribute: Readonly<Record<string, DistanceTotals>>): string {
  const rows = Object.entries(byAttribute).sort((a, b) => b[1].distance - a[1].distance);
  if (rows.length === 0) return 'no numeric diffs.';
  const header = ['attr', 'distance', 'diffs'];
  const grid = [header, ...rows.map(([name, t]) => [name, round(t.distance), String(t.count)])];
  const widths = header.map((_, i) =>
    grid.reduce((max, r) => Math.max(max, (r[i] ?? '').length), 0),
  );
  return grid.map((r) => r.map((c, i) => c.padEnd(widths[i] ?? 0)).join('  ').trimEnd()).join('\n');
}

/** The cohort line every report carries, so a total is never read bare. */
export function formatCohort(snapshot: DistanceSnapshot): string {
  const c = snapshot.cohort;
  return (
    `fixtures=${String(snapshot.fixtures.length)} measured=${String(c.measured)} ` +
    `errored=${String(c.errored)} descended=${String(c.descended)} ` +
    `shortCircuited=${String(c.shortCircuited)}  ` +
    `distance=${round(snapshot.total.distance)} numericDiffs=${String(snapshot.total.count)}`
  );
}

/** The `--compare` summary: the gate quantity, plus what it excluded and why. */
export function formatMovement(movements: readonly DistanceMovement[]): string {
  const total = commensurableTotal(movements);
  const crossed = movements.filter((m) => m.delta === null && m.baseDistance !== null && m.liveDistance !== null);
  const unmeasured = movements.filter((m) => m.baseDistance === null || m.liveDistance === null);
  const direction = total.distance < 0 ? 'FELL' : total.distance > 0 ? 'ROSE' : 'held';
  return [
    `commensurable fixtures: ${String(total.count)}`,
    `total distance ${direction} by ${round(Math.abs(total.distance))}`,
    `descent status changed (excluded, not summed): ${String(crossed.length)}`,
    `unmeasured at one ref (excluded): ${String(unmeasured.length)}`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Measurement — impure, and deliberately store-and-measurer explicit
// ---------------------------------------------------------------------------

/**
 * Hazard 1 of the adjudicator's header, enforced identically here. Without an
 * include store every `!include` fixture renders an error page, and this
 * script would record a harness failure as a geometry measurement.
 */
export function requireIncludeStore(build: () => IncludeStore | undefined): IncludeStore {
  const store = build();
  if (store === undefined) {
    throw new Error(
      'the fixture include store is missing. It is NOT optional: without it every ' +
        '!include fixture renders an error page, and this script would record a ' +
        'harness failure as a geometry measurement.',
    );
  }
  return store;
}

/**
 * Measures one fixture directory. Never throws: a render or compare failure is
 * captured as `distance: null` with the reason, so an error can never be
 * silently coerced into a distance of zero.
 */
export function measureFixture(dir: string, slug: string, store: IncludeStore): FixtureDistance {
  try {
    const markup = readFileSync(join(dir, 'in.puml'), 'utf8');
    const golden = readFileSync(join(dir, 'in.svg'), 'utf8');
    const ours = renderFixtureSequence(markup, new DeterministicMeasurer(), {
      includeStore: store,
    });
    const { diffs } = compareSvg(ours, golden, 'deterministic');
    const { total, byAttribute } = distanceOf(diffs);
    return {
      slug,
      distance: total.distance,
      numericCount: total.count,
      descended: descendedFrom(diffs),
      byAttribute,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { slug, distance: null, numericCount: null, descended: false, byAttribute: {}, error };
  }
}

/** Fixture slugs with both halves of the committed pair, sorted. */
export function listFixtureSlugs(cacheRoot: string): string[] {
  if (!existsSync(cacheRoot)) {
    throw new Error(
      `${cacheRoot} is absent. The sequence dot-cache is COMMITTED, so this is a ` +
        `broken checkout rather than a cache awaiting generation.`,
    );
  }
  return readdirSync(cacheRoot)
    .filter((slug) => {
      const dir = join(cacheRoot, slug);
      return (
        statSync(dir).isDirectory() &&
        existsSync(join(dir, 'in.puml')) &&
        existsSync(join(dir, 'in.svg'))
      );
    })
    .sort((a, b) => a.localeCompare(b));
}

/* v8 ignore start -- corpus-scale I/O and CLI wiring; the pure accounting
 * above is what the unit suite exercises, and the end-to-end behaviour is
 * exercised by running the script. */

/** Measures every fixture of one repo root, in place. */
export function measureTree(repo: string): DistanceSnapshot {
  const store = requireIncludeStore(fixtureIncludeStore);
  const cacheRoot = join(repo, SEQUENCE_CACHE_REL);
  return summarize(
    listFixtureSlugs(cacheRoot).map((slug) => measureFixture(join(cacheRoot, slug), slug, store)),
  );
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const USAGE =
  'Usage:\n' +
  '  npx jiti scripts/sequence-geometry-distance.ts [--snapshot <path>] [--compare <baseline.json>]\n';

function argValue(argv: readonly string[], flag: string): string | undefined {
  const at = argv.indexOf(flag);
  return at === -1 ? undefined : argv[at + 1];
}

function emit(snapshot: DistanceSnapshot): void {
  console.log(JSON_BEGIN);
  console.log(JSON.stringify(snapshot));
  console.log(JSON_END);
  console.log('');
  console.log(formatCohort(snapshot));
  console.log(formatConcentration(snapshot));
  console.log('');
  console.log(formatAttributeTable(snapshot.byAttribute));
}

function main(argv: readonly string[]): number {
  if (argv.includes('--help')) {
    console.log(USAGE);
    return 0;
  }
  const snapshot = measureTree(REPO);
  const out = argValue(argv, '--snapshot');
  if (out !== undefined) writeFileSync(out, JSON.stringify(snapshot), 'utf8');
  emit(snapshot);
  const baselinePath = argValue(argv, '--compare');
  if (baselinePath !== undefined) {
    const base = JSON.parse(readFileSync(baselinePath, 'utf8')) as DistanceSnapshot;
    console.log('');
    console.log(`--- against ${baselinePath} ---`);
    console.log(formatMovement(compareSnapshots(base, snapshot)));
  }
  return 0;
}

if (process.argv[1] !== undefined && process.argv[1].endsWith('sequence-geometry-distance.ts')) {
  process.exitCode = main(process.argv.slice(2));
}
/* v8 ignore stop */
