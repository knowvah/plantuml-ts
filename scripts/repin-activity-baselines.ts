/**
 * Activity baseline re-pin tool (mission `activity-lane-capture`, T0b / D4).
 *
 * Five committed files pin the activity oracle:
 * `oracle/goldens/svg-activity/diff-baseline.json` (the ratchet --
 * `weightedScore`/`diffCount`), `diff-census.json`, `style-baseline.json`,
 * `swimlane-baseline.json` and `text-baseline.json` (three EQUALITY pins).
 * `activity-klimt-compress` T6 re-pinned all five from a scratch
 * `repin-activity.ts` that no longer exists; this tool is committed once so
 * measurement survives compaction (D4, `plans/activity-lane-capture/
 * decisions.md`).
 *
 * THE HAZARD THIS PREVENTS. `scripts/repin-sequence-baselines.ts` compares
 * only against the pin, so a re-pin generator with that shape can silently
 * ADOPT a pre-existing regression -- it once proposed raising a row that was
 * already red before the mission. This tool makes every `weightedScore`
 * rise LOUD: printed, and refused unless `--accept-rises` names the slug.
 *
 * REUSES THE GATES' OWN MEASUREMENT FUNCTIONS, never re-derives them:
 * `renderFixtureActivity` + `DeterministicMeasurer` + `fixtureIncludeStore()`
 * + `compareSvg`/`weightedScore` (diff-baseline.json); `swimlane-census
 * .ts#censusOf`/`layoutFixtureActivity` (swimlane-baseline.json, the same
 * module the swimlane gate itself shares with its own re-pin generator);
 * `text-census.ts#censusOf` (text-baseline.json).
 *
 * STYLE IS THE ONE EXCEPTION: `censusOf`/`StyleCensus` live INSIDE
 * `activity.style-baseline.test.ts` itself, with no `style-census.ts`
 * sibling. Importing a `.test.ts` runs its top-level `describe(...)` outside
 * a vitest worker and throws (`Cannot read properties of undefined (reading
 * 'config')`, confirmed standalone) -- the exact reason `repin-sequence-
 * baselines.ts` duplicates `refusal-coverage.test.ts`'s `weErroredIn`
 * instead of importing it. `styleCensusOf` below is that same precedented
 * duplication, kept byte-identical to the test file's `censusOf`.
 *
 * `diff-census.json` IS NOT RE-DERIVED (see the `SKIP` line in `main`): no
 * gate exists for it anywhere in `tests/` (unlike sequence's own
 * `sequence-diff-census.ts`/`.test.ts` pair), and its `descent`/
 * `geometryResidual`/`namedFamilies`/etc. fields are a hand-authored
 * narrative from each past mission's own close-out, not a mechanical
 * census. Re-deriving it with no gate to anchor it would be exactly the
 * re-derivation D4 forbids. It stays a manual, mission-close-out edit.
 *
 * ORCHESTRATOR-ONLY: run once at T8/close-out, after every rise is fixed or
 * named in `--accept-rises` with a journal row -- never per task, which
 * would destroy the attribution D6 exists to buy.
 *
 * Usage:
 *   npx tsx scripts/repin-activity-baselines.ts [--write]
 *     [--accept-rises a,b] [--slugs-file <path>]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { DeterministicMeasurer } from '../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../tests/helpers/fixture-include-store.js';
import { compareSvg, weightedScore } from '../tests/oracle/svg-conformance/compare.js';
import { renderFixtureActivity } from '../tests/oracle/svg-conformance/render-fixture-activity.js';
import { styleCensusOf } from './repin-activity-style-census.js';
import { processPromotions } from './repin-activity-promote-run.js';
import {
  censusOf as swimlaneCensusOf,
  layoutFixtureActivity,
} from '../tests/oracle/svg-conformance/swimlane-census.js';
import { censusOf as textCensusOf } from '../tests/oracle/svg-conformance/text-census.js';
import { extractSlugs } from './activity-probe.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const CACHE_ROOT = join(REPO, 'test-results/dot-cache');
const GOLDENS_DIR = join(REPO, 'oracle/goldens/svg-activity');
const ACTIVITY_TYPE = 'activity';

// ---------------------------------------------------------------------------
// Types -- kept in ONE block, ahead of every function. lizard's TS grammar
// (verified against this project's `.venv` lizard 1.23.0) mis-locates a
// function's end when an `interface` with a generic property type
// (`Record<string, number>`, `Map<string, number>`) sits directly between
// two functions -- it silently folds the interface into the PRECEDING
// function's NLOC, sometimes cascading into the next. Grouping every type
// here (never between two functions) is the fix; see
// `.agent-notes/alc-T0b.md` for the isolated repro.
// ---------------------------------------------------------------------------

export type Classification = 'same' | 'fell' | 'rose';

export interface PlannedWrite {
  readonly slug: string;
  readonly classification: Classification;
  readonly oldValue: number;
  readonly newValue: number;
}

interface DiffBaselineFixture {
  slug: string;
  status: string;
  weightedScore?: number;
  diffCount: number | null;
  measuredAt: string;
  measuredAgainstCommit: string;
}
interface DiffBaselineFile {
  fixtures: DiffBaselineFixture[];
}
interface DiffBaselineMeasurements {
  readonly pinned: Record<string, number>;
  readonly measured: Record<string, number>;
  readonly diffCounts: Map<string, number>;
}

interface EqualityFixture {
  slug: string;
  status: string;
  ours?: unknown;
  jar?: unknown;
  measuredAt?: string;
  measuredAgainstCommit?: string;
}
interface EqualityManifest {
  measuredAt: string;
  measuredAgainstCommit: string;
  fixtures: EqualityFixture[];
}
interface EqualityFileSpec {
  readonly fileName: string;
  readonly label: string;
  /** Style and text pin `measuredAt`/`measuredAgainstCommit` per fixture;
   * swimlane pins them only at the file level (its own schema, verified
   * against the committed JSON). */
  readonly hasPerFixtureDates: boolean;
  readonly measureOurs: (markup: string) => unknown;
  readonly measureJar: (golden: string) => unknown;
}

interface SwimlaneFixture {
  slug: string;
  status: string;
  laneCount?: number;
  ours?: unknown;
  jar?: unknown;
}
interface SwimlaneManifestFile {
  measuredAt: string;
  measuredAgainstCommit: string;
  fixtures: SwimlaneFixture[];
}

interface CliArgs {
  write: boolean;
  acceptRises: ReadonlySet<string>;
  subset: ReadonlySet<string>;
}

/** Bundles the per-run knobs every `process*` function needs, so adding one
 * never pushes a call site over the 5-parameter cap. */
interface RepinContext {
  readonly write: boolean;
  readonly today: string;
  readonly commit: string;
  readonly subset: ReadonlySet<string>;
}

// ---------------------------------------------------------------------------
// Pure functions -- unit-tested without a filesystem or a render.
// ---------------------------------------------------------------------------

/** `weightedScore` never falls back to a tolerance band: any rise is a
 * regression, any fall is progress (D2, `activity.diff-baseline.ratchet
 * .test.ts`'s own `checkNoRise`). */
export function classifyChange(pinned: number, measured: number): Classification {
  if (measured > pinned) return 'rose';
  if (measured < pinned) return 'fell';
  return 'same';
}

/** Every slug whose pinned `weightedScore` moved, skipping a slug present on
 * only one side rather than treating it as a move from/to zero. */
export function plannedWrites(pinned: Record<string, number>, measured: Record<string, number>): PlannedWrite[] {
  const out: PlannedWrite[] = [];
  for (const slug of Object.keys(pinned)) {
    const oldValue = pinned[slug];
    const newValue = measured[slug];
    if (oldValue === undefined || newValue === undefined) continue;
    const classification = classifyChange(oldValue, newValue);
    if (classification !== 'same') out.push({ slug, classification, oldValue, newValue });
  }
  return out;
}

/** The rises this run refuses to write unless `--accept-rises` names the
 * slug -- the hazard guard, exercised as a pure function so AC2 never
 * touches `diff-baseline.json`. */
export function unacceptedRises(writes: readonly PlannedWrite[], accepted: ReadonlySet<string>): PlannedWrite[] {
  return writes.filter((w) => w.classification === 'rose' && !accepted.has(w.slug));
}

/** Exact interface-contract format: `ROSE diff-baseline <slug> <old>→<new>`. */
export function formatRiseLine(fileLabel: string, w: PlannedWrite): string {
  return `ROSE ${fileLabel} ${w.slug} ${String(w.oldValue)}→${String(w.newValue)}`;
}

/** Whether a census moved -- deliberately a plain deep-equality check
 * rather than a per-file bespoke comparator: a histogram/census equality
 * pin has no direction of "better", so all three equality-pinned files
 * (style/swimlane/text) share this ONE definition of "changed" instead of
 * three re-derived ones. */
export function censusChanged(pinned: unknown, live: unknown): boolean {
  return JSON.stringify(pinned) !== JSON.stringify(live);
}

/** `CHANGED <file> <slug>`, with ` in-subset` appended when the slug is in
 * the `--slugs-file` selection -- the exact interface contract. */
export function formatChangedLine(fileLabel: string, slug: string, inSubset: boolean): string {
  return `CHANGED ${fileLabel} ${slug}${inSubset ? ' in-subset' : ''}`;
}

// ---------------------------------------------------------------------------
// I/O -- fixture loading, rendering.
// ---------------------------------------------------------------------------

function fixtureDir(slug: string): string {
  return join(CACHE_ROOT, ACTIVITY_TYPE, slug);
}

function readFixture(slug: string): { markup: string; golden: string } {
  const dir = fixtureDir(slug);
  return {
    markup: readFileSync(join(dir, 'in.puml'), 'utf8'),
    golden: readFileSync(join(dir, 'in.svg'), 'utf8'),
  };
}

function renderOurs(markup: string): string {
  return renderFixtureActivity(markup, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
}

function getToday(): string {
  return execFileSync('date', ['+%Y-%m-%d'], { encoding: 'utf8' }).trim();
}

function getCommit(): string {
  return execFileSync('git', ['rev-parse', '--short=8', 'HEAD'], { encoding: 'utf8' }).trim();
}

// ---------------------------------------------------------------------------
// diff-baseline.json -- the ratchet (weightedScore/diffCount).
// ---------------------------------------------------------------------------

/** Re-measures every `status: "baseline"` entry through the ratchet gate's
 * own `renderFixtureActivity`/`compareSvg`/`weightedScore` seam. */
function measureDiffBaseline(fixtures: readonly DiffBaselineFixture[]): DiffBaselineMeasurements {
  const pinned: Record<string, number> = {};
  const measured: Record<string, number> = {};
  const diffCounts = new Map<string, number>();
  for (const f of fixtures) {
    if (f.status !== 'baseline' || f.weightedScore === undefined) continue;
    const { markup, golden } = readFixture(f.slug);
    const { diffs } = compareSvg(renderOurs(markup), golden, 'deterministic');
    pinned[f.slug] = f.weightedScore;
    measured[f.slug] = weightedScore(diffs);
    diffCounts.set(f.slug, diffs.length);
  }
  return { pinned, measured, diffCounts };
}

/** Rewrites the entries named in `writes` in place -- `weightedScore`,
 * `diffCount`, `measuredAt`, `measuredAgainstCommit` -- leaving every other
 * entry (and `$comment`) untouched. */
function applyDiffBaselineWrites(
  fixtures: readonly DiffBaselineFixture[],
  writes: readonly PlannedWrite[],
  diffCounts: ReadonlyMap<string, number>,
  today: string,
  commit: string,
): void {
  const bySlug = new Map(writes.map((w) => [w.slug, w]));
  for (const f of fixtures) {
    const w = bySlug.get(f.slug);
    if (w === undefined) continue;
    f.weightedScore = w.newValue;
    f.diffCount = diffCounts.get(f.slug) ?? f.diffCount;
    f.measuredAt = today;
    f.measuredAgainstCommit = commit;
  }
}

/** Re-measures `diff-baseline.json`, prints a `ROSE` line for every
 * regression, and writes only the entries whose score actually moved. */
function processDiffBaseline(ctx: RepinContext): PlannedWrite[] {
  const path = join(GOLDENS_DIR, 'diff-baseline.json');
  const data = JSON.parse(readFileSync(path, 'utf8')) as DiffBaselineFile;
  const { pinned, measured, diffCounts } = measureDiffBaseline(data.fixtures);

  const writes = plannedWrites(pinned, measured);
  for (const w of writes) {
    if (w.classification === 'rose') console.log(formatRiseLine('diff-baseline', w));
  }
  if (ctx.write && writes.length > 0) {
    applyDiffBaselineWrites(data.fixtures, writes, diffCounts, ctx.today, ctx.commit);
    writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
  }
  return writes;
}

// ---------------------------------------------------------------------------
// style-baseline.json / text-baseline.json -- shared equality-pin schema.
// swimlane-baseline.json carries its own extra `laneCount` field and
// file-level-only dates (both confirmed against the committed JSON), so it
// gets its own function below instead of a third caller of this one.
// ---------------------------------------------------------------------------

/** One fixture's worth of the equality-file loop: measure, compare, report,
 * and (if `ctx.write`) mutate `f` in place. Returns whether it changed. */
function processEqualityFixture(spec: EqualityFileSpec, f: EqualityFixture, ctx: RepinContext): boolean {
  const { markup, golden } = readFixture(f.slug);
  const liveOurs = spec.measureOurs(markup);
  const liveJar = spec.measureJar(golden);
  if (!censusChanged(f.ours, liveOurs) && !censusChanged(f.jar, liveJar)) return false;

  console.log(formatChangedLine(spec.label, f.slug, ctx.subset.has(f.slug)));
  if (ctx.write) {
    f.ours = liveOurs;
    f.jar = liveJar;
    if (spec.hasPerFixtureDates) {
      f.measuredAt = ctx.today;
      f.measuredAgainstCommit = ctx.commit;
    }
  }
  return true;
}

function processEqualityFile(spec: EqualityFileSpec, ctx: RepinContext): string[] {
  const path = join(GOLDENS_DIR, spec.fileName);
  const data = JSON.parse(readFileSync(path, 'utf8')) as EqualityManifest;
  const changedSlugs = data.fixtures
    .filter((f) => f.status === 'baseline')
    .filter((f) => processEqualityFixture(spec, f, ctx))
    .map((f) => f.slug);

  if (ctx.write && changedSlugs.length > 0) {
    data.measuredAt = ctx.today;
    data.measuredAgainstCommit = ctx.commit;
    writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
  }
  return changedSlugs;
}

const STYLE_SPEC: EqualityFileSpec = {
  fileName: 'style-baseline.json',
  label: 'style-baseline',
  hasPerFixtureDates: true,
  measureOurs: (markup) => styleCensusOf(renderOurs(markup)),
  measureJar: (golden) => styleCensusOf(golden),
};

const TEXT_SPEC: EqualityFileSpec = {
  fileName: 'text-baseline.json',
  label: 'text-baseline',
  hasPerFixtureDates: true,
  measureOurs: (markup) => textCensusOf(renderOurs(markup)),
  measureJar: (golden) => textCensusOf(golden),
};

/** One fixture's worth of the swimlane-file loop -- its own function (not a
 * third `processEqualityFixture` caller) because it also compares/writes
 * `laneCount`, which lives outside the `ours`/`jar` shape. */
function processSwimlaneFixture(f: SwimlaneFixture, ctx: RepinContext): boolean {
  const { markup, golden } = readFixture(f.slug);
  const geometry = layoutFixtureActivity(markup, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
  const liveOurs = swimlaneCensusOf(renderOurs(markup), geometry.lanes);
  const liveJar = swimlaneCensusOf(golden);
  const moved = censusChanged(f.ours, liveOurs) || censusChanged(f.jar, liveJar) || f.laneCount !== geometry.laneCount;
  if (!moved) return false;

  console.log(formatChangedLine('swimlane-baseline', f.slug, ctx.subset.has(f.slug)));
  if (ctx.write) {
    f.ours = liveOurs;
    f.jar = liveJar;
    f.laneCount = geometry.laneCount;
  }
  return true;
}

function processSwimlaneFile(ctx: RepinContext): string[] {
  const path = join(GOLDENS_DIR, 'swimlane-baseline.json');
  const data = JSON.parse(readFileSync(path, 'utf8')) as SwimlaneManifestFile;
  const changedSlugs = data.fixtures
    .filter((f) => f.status === 'baseline')
    .filter((f) => processSwimlaneFixture(f, ctx))
    .map((f) => f.slug);

  if (ctx.write && changedSlugs.length > 0) {
    data.measuredAt = ctx.today;
    data.measuredAgainstCommit = ctx.commit;
    writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
  }
  return changedSlugs;
}

// ---------------------------------------------------------------------------
// CLI entry point.
// ---------------------------------------------------------------------------

function commaList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseArgs(argv: readonly string[]): CliArgs {
  const acceptIdx = argv.indexOf('--accept-rises');
  const slugsFileIdx = argv.indexOf('--slugs-file');
  const acceptValue = acceptIdx === -1 ? undefined : argv[acceptIdx + 1];
  const slugsFilePath = slugsFileIdx === -1 ? undefined : argv[slugsFileIdx + 1];
  return {
    write: argv.includes('--write'),
    acceptRises: new Set(acceptValue === undefined ? [] : commaList(acceptValue)),
    subset: new Set(slugsFilePath === undefined ? [] : extractSlugs(readFileSync(slugsFilePath, 'utf8'))),
  };
}

/* v8 ignore start -- CLI entry point; pure functions above are exercised
 * directly by tests/unit/scripts/repin-activity-baselines.test.ts. */
function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const ctx: RepinContext = { write: args.write, today: getToday(), commit: getCommit(), subset: args.subset };

  const promoted = processPromotions(ctx, { goldensDir: GOLDENS_DIR, readFixture, renderOurs });
  const diffWrites = processDiffBaseline(ctx);
  const styleChanged = processEqualityFile(STYLE_SPEC, ctx);
  const textChanged = processEqualityFile(TEXT_SPEC, ctx);
  const swimlaneChanged = processSwimlaneFile(ctx);

  console.log(
    'SKIP diff-census.json (no gate exists for it; narrative report, never re-derived -- see file doc comment)',
  );

  const total = diffWrites.length + styleChanged.length + textChanged.length + swimlaneChanged.length;
  console.log(
    `${promoted} promotion(s) error -> baseline; ${total} change(s) across diff-baseline/style-baseline/text-baseline/swimlane-baseline`,
  );

  const rises = unacceptedRises(diffWrites, args.acceptRises);
  process.exitCode = rises.length > 0 ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
/* v8 ignore stop */
