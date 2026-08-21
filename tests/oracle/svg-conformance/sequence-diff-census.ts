/**
 * The sequence cause census (sequence-oracle-harness / T4).
 *
 * T2's `diff-baseline.json` records HOW WRONG each sequence fixture is. This
 * module records WHY, by sorting every `Diff` (`compare.ts:35`) the shared
 * comparator emits into exactly one of D5's six fixed buckets. The bucket set
 * is closed: `missing-element`, `extra-element`, `geometry`, `text-metrics`,
 * `format-units`, `other`. Adding a seventh is stop 9.
 *
 * D5's constraint is the point of the file: classification is **mechanical**,
 * derived only from a `Diff` record's own `path` / `actual` / `expected`, by
 * committed code with a unit test per rule. No number in
 * `oracle/goldens/svg-sequence/diff-census.json` comes from an agent looking
 * at an SVG, and every number is reproducible by re-running:
 *
 *   npx jiti tests/oracle/svg-conformance/sequence-diff-census.ts
 *
 * which rewrites that file in place. Nothing else is written; `src/` is
 * untouched (D6) and `diff-baseline.json` is read-only here.
 *
 * WHERE THE BUCKET BOUNDARIES WERE DRAWN, and why they were drawn strictly.
 * D5 fixes the names but not the predicates, so these are stated once, here,
 * and pinned individually in `sequence-diff-census.test.ts`:
 *
 *  1. `missing-element` / `extra-element` are about ELEMENTS, and the
 *     comparator reports a count of elements in exactly one place: the
 *     `[childCount]` diff it pushes when two nodes' child lists differ in
 *     length (`compare.ts` — "structural mismatch — stop recursing"). Fewer
 *     children on our side is `missing-element`, more is `extra-element`.
 *     An ABSENT ATTRIBUTE is deliberately NOT counted here. `svg/@version`
 *     with `actual: ""` is a missing attribute, not a missing element, and
 *     folding it in would inflate two well-named buckets with something they
 *     are not. It lands in `other` instead, and T4's report names it. The
 *     same strictness applies to a TAG SUBSTITUTION (`rect` where the jar
 *     has `text`): the positional comparator cannot say whether that slot
 *     holds an element we invented or one we skipped, so it is `other`
 *     rather than a guess. D5: "a large `other` is a legitimate result to
 *     report, not a reason to invent a bucket".
 *  2. `format-units` is a statement about the two VALUES, so it is tested
 *     before any attribute-name rule: the values are equal once a CSS unit
 *     suffix and letter case are discounted (`14` vs `14px`, `1.0` vs `1`,
 *     `#FFFFFF` vs `#ffffff`). It cannot fire when a side is absent —
 *     absence is not a formatting difference.
 *  3. `geometry` is the attribute-name set the comparator itself treats as
 *     numeric or coordinate-bearing: `NUMERIC_ATTRS` (`compare.ts:47`) plus
 *     the four it gives dedicated numeric handling — `d`, `points`,
 *     `viewBox`, `transform`. Restated rather than imported because D1
 *     consumes `compare.ts` unchanged and that constant is module-private.
 *  4. `text-metrics` is the set of attributes whose value is produced by
 *     text measurement or text layout: `textLength`/`lengthAdjust`, the
 *     `font-*` family, inter-character spacing, and the anchor/baseline
 *     attributes that decide where a measured string is placed.
 *  5. Everything else is `other`. That includes text-node CONTENT
 *     differences: "Bob" against "hello1" is a content or ordering
 *     divergence, not a metric, and calling it `text-metrics` would be the
 *     kind of flattering mislabel D5 exists to prevent.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { compareSvg } from './compare.js';
import type { Diff } from './compare.js';
import { renderFixtureSequence } from './render-fixture-sequence.js';

// ---------------------------------------------------------------------------
// Buckets
// ---------------------------------------------------------------------------

export const BUCKETS = [
  'missing-element',
  'extra-element',
  'geometry',
  'text-metrics',
  'format-units',
  'other',
] as const;

export type Bucket = (typeof BUCKETS)[number];
export type BucketCounts = Record<Bucket, number>;

export function emptyBucketCounts(): BucketCounts {
  return {
    'missing-element': 0,
    'extra-element': 0,
    geometry: 0,
    'text-metrics': 0,
    'format-units': 0,
    other: 0,
  };
}

/** `NUMERIC_ATTRS` (`compare.ts:47`) plus the four attributes the comparator
 * gives its own numeric handling to. See boundary note 3 in the header. */
const GEOMETRY_ATTRS: ReadonlySet<string> = new Set([
  'x', 'y', 'cx', 'cy', 'rx', 'ry',
  'width', 'height',
  'x1', 'y1', 'x2', 'y2',
  'dx', 'dy', 'r',
  'd', 'points', 'viewBox', 'transform',
]);

/** Attributes whose value is produced by text measurement or text layout.
 * See boundary note 4 in the header. */
const TEXT_ATTRS: ReadonlySet<string> = new Set([
  'textLength', 'lengthAdjust',
  'font-size', 'font-family', 'font-weight', 'font-style', 'font-variant',
  'letter-spacing', 'word-spacing',
  'text-anchor', 'dominant-baseline', 'alignment-baseline', 'baseline-shift',
]);

// ---------------------------------------------------------------------------
// Path anatomy
// ---------------------------------------------------------------------------

const CHILD_COUNT_SUFFIX = '[childCount]';
const ATTR_MARKER = '/@';

/** The attribute name a diff path addresses, or `undefined` when the path
 * addresses a node rather than one of its attributes. Index and sub-selector
 * suffixes the comparator appends (`[2]`, `[0].param[1]`, `[0].type`) are
 * stripped; a namespaced name (`xmlns:xlink`) is kept whole. */
export function attributeNameOf(path: string): string | undefined {
  if (path.endsWith(CHILD_COUNT_SUFFIX)) return undefined;
  const marker = path.lastIndexOf(ATTR_MARKER);
  if (marker < 0) return undefined;
  const rest = path.slice(marker + ATTR_MARKER.length);
  const cut = rest.search(/[[.]/);
  return cut < 0 ? rest : rest.slice(0, cut);
}

// ---------------------------------------------------------------------------
// Rule 1 — element presence
// ---------------------------------------------------------------------------

function classifyChildCount(actual: string, expected: string): Bucket {
  const ours = Number(actual);
  const theirs = Number(expected);
  if (!Number.isFinite(ours) || !Number.isFinite(theirs)) return 'other';
  if (ours < theirs) return 'missing-element';
  if (ours > theirs) return 'extra-element';
  return 'other';
}

// ---------------------------------------------------------------------------
// Rule 2 — format / unit equivalence
// ---------------------------------------------------------------------------

const UNIT_NUMBER = /^\s*([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)\s*(?:px|pt|pc|em|ex|mm|cm|in|%)?\s*$/;

function numericValueOf(text: string): number | undefined {
  const match = UNIT_NUMBER.exec(text);
  if (match === null) return undefined;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : undefined;
}

/** True when the two sides say the same thing in different notation. An
 * absent side is never a formatting difference. */
function isFormatOnlyDifference(actual: string, expected: string): boolean {
  if (actual === '' || expected === '') return false;
  const ours = numericValueOf(actual);
  const theirs = numericValueOf(expected);
  if (ours !== undefined && theirs !== undefined) return ours === theirs;
  return actual.toLowerCase() === expected.toLowerCase();
}

// ---------------------------------------------------------------------------
// The classifier
// ---------------------------------------------------------------------------

/** Sorts one `Diff` into exactly one bucket, using only that record's own
 * fields. `delta` and `tolerance` carry no classification signal here: every
 * diff in this harness is measured at the single `deterministic` tolerance
 * (`compare.ts` `TOLERANCES`), and `delta` is present on precisely the
 * numeric comparisons whose attribute names rule 3 already recognises. */
export function classifyDiff(diff: Diff): Bucket {
  if (diff.path.endsWith(CHILD_COUNT_SUFFIX)) {
    return classifyChildCount(diff.actual, diff.expected);
  }
  if (isFormatOnlyDifference(diff.actual, diff.expected)) return 'format-units';

  const attr = attributeNameOf(diff.path);
  if (attr === undefined) return 'other';
  if (GEOMETRY_ATTRS.has(attr)) return 'geometry';
  if (TEXT_ATTRS.has(attr)) return 'text-metrics';
  return 'other';
}

export function tallyDiffs(diffs: readonly Diff[]): BucketCounts {
  const counts = emptyBucketCounts();
  for (const diff of diffs) counts[classifyDiff(diff)] += 1;
  return counts;
}

// ---------------------------------------------------------------------------
// Census over the committed corpus
// ---------------------------------------------------------------------------


export interface FixtureRef {
  readonly type: string;
  readonly slug: string;
}

export interface CensusFixture {
  readonly slug: string;
  readonly diffCount: number;
  readonly buckets: BucketCounts;
}

export interface CensusError {
  readonly slug: string;
  readonly reason: string;
}

export interface Census {
  readonly totals: BucketCounts;
  readonly fixtures: readonly CensusFixture[];
  readonly errors: readonly CensusError[];
}

type FixtureOutcome =
  | { readonly ok: true; readonly fixture: CensusFixture }
  | { readonly ok: false; readonly error: CensusError };

/** Renders one fixture through T1's helper, compares it with the shared
 * comparator (D1, unchanged) and tallies the result. Never throws: a render
 * or compare failure becomes an error outcome, so it can never be coerced
 * into a fixture sitting at zero diffs. */
function censusForFixture(ref: FixtureRef, cacheRoot: string): FixtureOutcome {
  const dir = join(cacheRoot, ref.type, ref.slug);
  try {
    const markup = readFileSync(join(dir, 'in.puml'), 'utf8');
    const golden = readFileSync(join(dir, 'in.svg'), 'utf8');
    const ours = renderFixtureSequence(markup, new DeterministicMeasurer(), {
      includeStore: fixtureIncludeStore(),
    });
    const { diffs } = compareSvg(ours, golden, 'deterministic');
    return {
      ok: true,
      fixture: { slug: ref.slug, diffCount: diffs.length, buckets: tallyDiffs(diffs) },
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { ok: false, error: { slug: ref.slug, reason } };
  }
}

/**
 * Censuses `refs`, plus any fixture already recorded as failing upstream
 * (`knownErrors`, i.e. T2's `status: "error"` entries). Errors are held apart
 * from `fixtures` and contribute nothing to `totals` — a fixture that cannot
 * render has no bucket counts, and recording zeros for it would read as
 * "conformant".
 *
 * Fixture order is by slug so the artifact is stable and diffable regardless
 * of the order the manifest happens to list.
 */
export function buildCensus(
  refs: readonly FixtureRef[],
  cacheRoot: string,
  knownErrors: readonly CensusError[] = [],
): Census {
  const fixtures: CensusFixture[] = [];
  const errors: CensusError[] = [...knownErrors];
  const totals = emptyBucketCounts();

  for (const ref of refs) {
    const outcome = censusForFixture(ref, cacheRoot);
    if (!outcome.ok) {
      errors.push(outcome.error);
      continue;
    }
    fixtures.push(outcome.fixture);
    for (const bucket of BUCKETS) totals[bucket] += outcome.fixture.buckets[bucket];
  }

  fixtures.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  errors.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  return { totals, fixtures, errors };
}

// ---------------------------------------------------------------------------
// Paths and the baseline reader
// ---------------------------------------------------------------------------

const HERE = dirname(fileURLToPath(import.meta.url));
export const CACHE_ROOT = join(HERE, '../../../test-results/dot-cache');
export const GOLDENS_DIR = join(HERE, '../../../oracle/goldens/svg-sequence');
export const MANIFEST_PATH = join(GOLDENS_DIR, 'diff-baseline.json');
export const CENSUS_PATH = join(GOLDENS_DIR, 'diff-census.json');

interface BaselineEntry {
  readonly type: string;
  readonly slug: string;
  readonly status: 'baseline' | 'error';
  readonly reason?: string;
}

export interface BaselineSplit {
  readonly measurable: readonly FixtureRef[];
  readonly errored: readonly CensusError[];
}

/** Splits T2's baseline into the fixtures this census measures and the ones
 * it must carry through as errors. Read-only: T4 never writes that file. */
export function readBaseline(manifestPath: string): BaselineSplit {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    readonly fixtures: readonly BaselineEntry[];
  };
  const measurable = manifest.fixtures
    .filter((f) => f.status === 'baseline')
    .map((f) => ({ type: f.type, slug: f.slug }));
  const errored = manifest.fixtures
    .filter((f) => f.status === 'error')
    .map((f) => ({ slug: f.slug, reason: f.reason ?? 'recorded as an error by the diff baseline' }));
  return { measurable, errored };
}

// ---------------------------------------------------------------------------
// Serialisation
// ---------------------------------------------------------------------------

const CENSUS_COMMENT =
  'Cause census for the committed SEQUENCE oracle corpus. Every count is produced ' +
  'MECHANICALLY by tests/oracle/svg-conformance/sequence-diff-census.ts from the ' +
  'path/actual/expected fields of the Diff records compare.ts emits -- never by ' +
  'reading an SVG (D5, plans/sequence-oracle-harness/decisions.md). The bucket set ' +
  'is closed at six; adding a seventh is stop 9. Fixtures come from ' +
  'diff-baseline.json: status "baseline" entries are censused, status "error" ' +
  'entries are carried in "errors" and contribute NOTHING to "totals" -- an ' +
  'unrenderable fixture has no bucket counts and must never read as zero diffs. ' +
  'Regenerate with: npx jiti tests/oracle/svg-conformance/sequence-diff-census.ts ' +
  '-- the output is a pure function of the committed corpus and carries no ' +
  'timestamp, so re-running is byte-identical.';

/** Deterministic JSON: no timestamp, fixed bucket key order, slug-sorted
 * fixtures. Re-running the census must produce the same bytes. */
export function renderCensusJson(census: Census): string {
  return `${JSON.stringify({ $comment: CENSUS_COMMENT, ...census }, null, 2)}\n`;
}

// ---------------------------------------------------------------------------
// CLI entry point — regenerates diff-census.json over the whole corpus.
//
// Not exercised by the unit suite (same profile as `compare.ts`'s own CLI
// block): reaching it requires running this module as a script. Excluded from
// coverage rather than left as a silent gap.
// ---------------------------------------------------------------------------

/* v8 ignore start */
function runCli(): void {
  if (!existsSync(MANIFEST_PATH)) {
    process.stderr.write(`missing ${MANIFEST_PATH}\n`);
    process.exit(2);
  }
  const { measurable, errored } = readBaseline(MANIFEST_PATH);
  const census = buildCensus(measurable, CACHE_ROOT, errored);
  writeFileSync(CENSUS_PATH, renderCensusJson(census), 'utf8');
  process.stdout.write(
    `censused ${census.fixtures.length} fixtures, ${census.errors.length} errors -> ${CENSUS_PATH}\n`,
  );
  for (const bucket of BUCKETS) {
    process.stdout.write(`  ${bucket}: ${census.totals[bucket]}\n`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) runCli();
/* v8 ignore stop */
