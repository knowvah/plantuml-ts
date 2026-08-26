/**
 * Sequence ratchet RISE ADJUDICATOR — the D5 instrument
 * (`plans/sequence-command-coverage/decisions.md`, T4).
 *
 * WHY THIS EXISTS. `tests/oracle/svg-conformance/sequence.diff-baseline.
 * ratchet.test.ts` fails any fixture whose `weightedScore` rises above its
 * pin, and its header states that "a rise has no benign reading left". That
 * claim is true WITHIN ONE COMPARISON and FALSE ACROSS A CHANGE THAT GROWS
 * OUR OUTPUT. `compareNodes` short-circuits in three places — node type, tag,
 * child count (`compare.ts:198,229,404`) — and charges each
 * `units(actual) + units(expected)`. The charge therefore scales with the
 * size of OUR document, so the same "still mismatched" verdict costs strictly
 * more once our side grows, even when our side moved CLOSER to the golden.
 *
 * Worked example, `sequence/bexoce-95-vibe195` (measured, T13): baseline 622,
 * live 950, the ENTIRE delta one diff — `svg/g[1][childCount]` went from
 * `actual=14 expected=59` to `actual=60 expected=59`. Off by one instead of
 * by 45; score up 328. Across all 242 risers in that mission 162 moved closer
 * (98.6% of the total rise), 35 moved further, 22 held, and 23 had no
 * top-level childCount short-circuit at all.
 *
 * WHAT THIS DECIDES. For every fixture in `test-results/dot-cache/sequence/`
 * it measures, at two refs, (a) `weightedScore` against the committed golden
 * and (b) the TOP-LEVEL CHILD-COUNT DISTANCE `|actual - expected|` taken from
 * the `svg/g[1][childCount]` diff record. A rise whose distance FELL is an
 * `artefact` (re-pinning is correct); a rise whose distance ROSE or HELD is a
 * `regression` (diagnose per `rules/diagnosis.md`); a rise with no top-level
 * childCount record at either ref is `inconclusive` and is NEVER guessed.
 *
 * Absence of that record is genuinely ambiguous — it means either the two
 * child counts matched (distance 0) or the comparison short-circuited higher
 * up and never reached them — which is exactly why it yields `inconclusive`
 * rather than an assumed 0.
 *
 * THREE MEASUREMENT HAZARDS, all measured, all load-bearing
 * (`plans/sequence-command-coverage/prior-observations.md`):
 *
 *   1. `renderSync` returns `errorSvg` when `options.includeStore` is absent
 *      (`src/index.ts:213`), and `resolveMeasurer` defaults to
 *      `CanvasMeasurer`, unimplemented under jsdom. Either turns a resolution
 *      or layout failure into a FALSE measurement. This script never calls
 *      `renderSync`: it goes through `renderFixtureSequence` and passes
 *      `DeterministicMeasurer` and `fixtureIncludeStore()` EXPLICITLY, and
 *      `measureFixture` takes the store as a REQUIRED parameter so no caller
 *      can structurally omit it.
 *   2. `diffCount` is not monotone in wrongness and is informational only. It
 *      is reported nowhere here and adjudicated on never.
 *   3. vitest hides `console.log` from passing tests. If any part of this is
 *      ever driven from a test, run it with `--reporter=verbose`; a silent
 *      run is NOT evidence that a branch did not fire.
 *
 * USAGE
 *
 *   npx jiti scripts/sequence-ratchet-adjudicate.ts --base <git-ref>
 *
 * measures `<git-ref>` in a throwaway detached worktree, measures the working
 * tree in place, and prints the JSON report followed by a human-readable
 * table. Redirect stdout to capture the report; the JSON block is delimited
 * by `JSON_BEGIN`/`JSON_END` because rendering itself writes to stdout (see
 * those constants).
 *
 *   npx jiti scripts/sequence-ratchet-adjudicate.ts --snapshot <path>
 *
 * measures the working tree only and writes the raw snapshot to `<path>`.
 * This is how the worktree child is driven; it is also useful by hand.
 *
 * This is an INSTRUMENT, not a gate — the ratchet test is the gate. It exits
 * 0 on any successful adjudication however many regressions it names, so that
 * a report is always produced rather than a run being cut short.
 */
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { DeterministicMeasurer } from '../src/core/measurer-deterministic.js';
import type { IncludeStore } from '../src/core/tim/IncludeStore.js';
import { fixtureIncludeStore } from '../tests/helpers/fixture-include-store.js';
import { compareSvg, weightedScore, type Diff } from '../tests/oracle/svg-conformance/compare.js';
import { renderFixtureSequence } from '../tests/oracle/svg-conformance/render-fixture-sequence.js';

const SELF = fileURLToPath(import.meta.url);
const REPO = join(dirname(SELF), '..');

/**
 * The one comparison this classifier reads. `compareSvg` roots its paths at
 * the `<svg>` tag (`compare.ts:457`), and the sequence corpus' top-level
 * content group is its second child, so the child-count short-circuit for the
 * diagram body lands on exactly this path — verified against
 * `sequence/bexoce-95-vibe195`, whose sole record is
 * `{"path":"svg/g[1][childCount]","actual":"58","expected":"59"}`.
 */
export const TOP_LEVEL_CHILD_COUNT_PATH = 'svg/g[1][childCount]';

/** Committed corpus root, relative to a repo root. */
export const SEQUENCE_CACHE_REL = join('test-results', 'dot-cache', 'sequence');

// ---------------------------------------------------------------------------
// Contract (consumed by T18 and by every batch close)
// ---------------------------------------------------------------------------

export type Verdict = 'artefact' | 'regression' | 'inconclusive' | 'unchanged' | 'improved';

/** One fixture at one ref. `score` and `childDistance` are `null` when the
 *  fixture errored or when the record was absent — NEVER coerced to 0. */
export interface FixtureMeasurement {
  readonly slug: string;
  readonly score: number | null;
  readonly childDistance: number | null;
  /** Present iff the fixture errored at this ref. */
  readonly error?: string;
}

export interface Adjudication {
  readonly slug: string;
  readonly baseScore: number | null;
  readonly liveScore: number | null;
  readonly baseChildDistance: number | null;
  readonly liveChildDistance: number | null;
  readonly verdict: Verdict;
}

export type VerdictCounts = Record<Verdict, number>;

// ---------------------------------------------------------------------------
// Pure classification — unit-tested in isolation
// ---------------------------------------------------------------------------

/**
 * Distance from the golden's top-level child count, read off the diff list.
 * `null` when no `svg/g[1][childCount]` record is present (see the header:
 * that is ambiguous, not zero) or when either side is not a finite number.
 */
export function childDistanceFrom(diffs: readonly Diff[]): number | null {
  const record = diffs.find((d) => d.path === TOP_LEVEL_CHILD_COUNT_PATH);
  if (record === undefined) return null;
  const actual = Number(record.actual);
  const expected = Number(record.expected);
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) return null;
  return Math.abs(actual - expected);
}

/** What `classify` needs of a measurement — nothing else. */
export type Classifiable = Pick<FixtureMeasurement, 'score' | 'childDistance'>;

/**
 * D5, in code. A rise is adjudicated by child-count distance and by nothing
 * else; `diffCount` is never consulted. A `null` score at either ref is an
 * ERROR at that ref, not a zero, so no rise can be computed and the verdict
 * is `inconclusive`.
 */
export function classify(base: Classifiable, live: Classifiable): Verdict {
  if (base.score === null || live.score === null) return 'inconclusive';
  if (live.score < base.score) return 'improved';
  if (live.score === base.score) return 'unchanged';
  // Rose. Only the top-level child-count distance may resolve it.
  if (base.childDistance === null || live.childDistance === null) return 'inconclusive';
  if (live.childDistance < base.childDistance) return 'artefact';
  return 'regression';
}

/** A slug present at one ref and absent at the other: unmeasured there, so
 *  `null` at that ref rather than a fabricated score. */
const ABSENT: FixtureMeasurement = { slug: '', score: null, childDistance: null };

function measurementFor(
  index: ReadonlyMap<string, FixtureMeasurement>,
  slug: string,
): FixtureMeasurement {
  return index.get(slug) ?? { ...ABSENT, slug };
}

function indexBySlug(
  measurements: readonly FixtureMeasurement[],
): Map<string, FixtureMeasurement> {
  const index = new Map<string, FixtureMeasurement>();
  for (const m of measurements) index.set(m.slug, m);
  return index;
}

/**
 * Joins two snapshots on slug and classifies every fixture. The union of
 * slugs is walked, sorted, so a fixture that exists at only one ref is
 * reported (as `inconclusive`) rather than dropped.
 */
export function adjudicate(
  base: readonly FixtureMeasurement[],
  live: readonly FixtureMeasurement[],
): Adjudication[] {
  const baseIndex = indexBySlug(base);
  const liveIndex = indexBySlug(live);
  const slugs = [...new Set([...baseIndex.keys(), ...liveIndex.keys()])].sort((a, b) =>
    a.localeCompare(b),
  );
  return slugs.map((slug) => {
    const b = measurementFor(baseIndex, slug);
    const l = measurementFor(liveIndex, slug);
    return {
      slug,
      baseScore: b.score,
      liveScore: l.score,
      baseChildDistance: b.childDistance,
      liveChildDistance: l.childDistance,
      verdict: classify(b, l),
    };
  });
}

export function summarize(rows: readonly Adjudication[]): VerdictCounts {
  const counts: VerdictCounts = {
    artefact: 0,
    regression: 0,
    inconclusive: 0,
    unchanged: 0,
    improved: 0,
  };
  for (const row of rows) counts[row.verdict] += 1;
  return counts;
}

// ---------------------------------------------------------------------------
// Human-readable table — pure
// ---------------------------------------------------------------------------

const COLUMNS = ['slug', 'base', 'live', 'baseDist', 'liveDist', 'verdict'] as const;

function cells(row: Adjudication): readonly string[] {
  const show = (v: number | null): string => (v === null ? '-' : String(v));
  return [
    row.slug,
    show(row.baseScore),
    show(row.liveScore),
    show(row.baseChildDistance),
    show(row.liveChildDistance),
    row.verdict,
  ];
}

/**
 * Renders the rows worth a human's attention. `unchanged` rows are omitted
 * from the TABLE (the sequence corpus is 1141 fixtures and an unchanged score
 * carries no adjudication) — they remain in the JSON report and in the
 * counts, so nothing is lost, only unprinted.
 */
export function formatTable(rows: readonly Adjudication[]): string {
  const interesting = rows.filter((r) => r.verdict !== 'unchanged');
  if (interesting.length === 0) return 'no fixture changed score.';
  const grid = [[...COLUMNS], ...interesting.map((r) => [...cells(r)])];
  const widths = COLUMNS.map((_, i) =>
    grid.reduce((max, r) => Math.max(max, (r[i] ?? '').length), 0),
  );
  return grid
    .map((r) => r.map((c, i) => c.padEnd(widths[i] ?? 0)).join('  ').trimEnd())
    .join('\n');
}

// ---------------------------------------------------------------------------
// Measurement — impure, and deliberately store-and-measurer explicit
// ---------------------------------------------------------------------------

/**
 * Hazard 1, enforced. A run without an include store must fail loudly rather
 * than measure: with no store, `!include` resolution fails and the fixture
 * records a rendering error that is really a harness defect.
 *
 * The store is LAZY by design (`fixture-include-store.ts` defers an ~888 ms
 * `assets/stdlib/` walk to the first lookup, and two of 1141 sequence
 * fixtures ever trigger it), so this checks that the store is CONSTRUCTIBLE
 * and present, and does not force the walk to prove it resolves.
 */
export function requireIncludeStore(build: () => IncludeStore | undefined): IncludeStore {
  let store: IncludeStore | undefined;
  try {
    store = build();
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(
      `cannot build the fixture include store, so no measurement here is trustworthy: ${reason}`,
      { cause: err },
    );
  }
  if (store === undefined) {
    throw new Error(
      'the fixture include store is missing. It is NOT optional: without it every ' +
        '!include fixture renders an error page, and this script would record a ' +
        'harness failure as a fidelity measurement.',
    );
  }
  return store;
}

/**
 * Measures one fixture directory. Never throws: a render or compare failure
 * is captured as `score: null` with the reason, so an error can never be
 * silently coerced into a number.
 */
export function measureFixture(
  dir: string,
  slug: string,
  store: IncludeStore,
): FixtureMeasurement {
  try {
    const markup = readFileSync(join(dir, 'in.puml'), 'utf8');
    const golden = readFileSync(join(dir, 'in.svg'), 'utf8');
    const ours = renderFixtureSequence(markup, new DeterministicMeasurer(), {
      includeStore: store,
    });
    const { diffs } = compareSvg(ours, golden, 'deterministic');
    return {
      slug,
      score: weightedScore(diffs),
      childDistance: childDistanceFrom(diffs),
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { slug, score: null, childDistance: null, error };
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

/* v8 ignore start -- corpus-scale I/O and subprocess orchestration; the pure
 * classification above is what the unit suite exercises, and the end-to-end
 * behaviour is exercised by running the script. */

/** Measures every fixture of one repo root, in place. */
function measureTree(repo: string): FixtureMeasurement[] {
  const store = requireIncludeStore(fixtureIncludeStore);
  const cacheRoot = join(repo, SEQUENCE_CACHE_REL);
  return listFixtureSlugs(cacheRoot).map((slug) =>
    measureFixture(join(cacheRoot, slug), slug, store),
  );
}

// ---------------------------------------------------------------------------
// Base-ref measurement
// ---------------------------------------------------------------------------
//
// The base ref is measured by ITS OWN `src/`, which means a real checkout: a
// detached worktree, with this script copied in so the MEASUREMENT code is
// held fixed while the code UNDER measurement varies. `node_modules` is
// symlinked rather than installed — node resolves the link by realpath, so
// the child loads the same dependency tree the parent did.

function runChildMeasurement(tree: string, out: string): void {
  const script = join(tree, 'scripts', basename(SELF));
  copyFileSync(SELF, script);
  symlinkSync(join(REPO, 'node_modules'), join(tree, 'node_modules'));
  execFileSync(join(REPO, 'node_modules', '.bin', 'jiti'), [script, '--snapshot', out], {
    cwd: tree,
    stdio: ['ignore', 'inherit', 'inherit'],
  });
}

function measureAtRef(ref: string): FixtureMeasurement[] {
  const scratch = mkdtempSync(join(tmpdir(), 'seq-ratchet-'));
  const tree = join(scratch, 'tree');
  execFileSync('git', ['worktree', 'add', '--detach', tree, ref], { cwd: REPO, stdio: 'pipe' });
  try {
    const out = join(scratch, 'base.json');
    runChildMeasurement(tree, out);
    return JSON.parse(readFileSync(out, 'utf8')) as FixtureMeasurement[];
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', tree], { cwd: REPO, stdio: 'pipe' });
    rmSync(scratch, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const USAGE =
  'Usage:\n' +
  '  npx jiti scripts/sequence-ratchet-adjudicate.ts --base <git-ref>\n' +
  '  npx jiti scripts/sequence-ratchet-adjudicate.ts --snapshot <path>\n';

function argValue(argv: readonly string[], flag: string): string | undefined {
  const at = argv.indexOf(flag);
  return at === -1 ? undefined : argv[at + 1];
}

/**
 * Sentinels around the JSON block. They are not decoration: measurement
 * itself writes to stdout — `!log` in a fixture reaches `console.info`
 * (`src/core/tim/EaterLog.ts:35`), and the sequence corpus contains fixtures
 * that use it — so a consumer cannot simply `JSON.parse` the captured
 * stdout. Slice between these two lines instead.
 */
export const JSON_BEGIN = '--- BEGIN ADJUDICATION JSON ---';
export const JSON_END = '--- END ADJUDICATION JSON ---';

function report(baseRef: string, rows: readonly Adjudication[]): void {
  const counts = summarize(rows);
  console.log(JSON_BEGIN);
  console.log(
    JSON.stringify({ baseRef, liveRef: 'working-tree', counts, fixtures: rows }, null, 2),
  );
  console.log(JSON_END);
  console.log('');
  console.log(`base=${baseRef}  live=working-tree  fixtures=${String(rows.length)}`);
  console.log(formatTable(rows));
  console.log(
    `artefact=${String(counts.artefact)} regression=${String(counts.regression)} ` +
      `inconclusive=${String(counts.inconclusive)} improved=${String(counts.improved)} ` +
      `unchanged=${String(counts.unchanged)} (unchanged rows omitted from the table)`,
  );
}

function main(argv: readonly string[]): number {
  const snapshotOut = argValue(argv, '--snapshot');
  if (snapshotOut !== undefined) {
    writeFileSync(snapshotOut, JSON.stringify(measureTree(REPO)), 'utf8');
    return 0;
  }
  const baseRef = argValue(argv, '--base');
  if (baseRef === undefined) {
    console.error(USAGE);
    return 2;
  }
  const base = measureAtRef(baseRef);
  const live = measureTree(REPO);
  report(baseRef, adjudicate(base, live));
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = main(process.argv.slice(2));
}
/* v8 ignore stop */
