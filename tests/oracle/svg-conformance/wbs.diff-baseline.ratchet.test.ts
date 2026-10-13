/**
 * Diff-count BASELINE ratchet for the committed wbs oracle corpus
 * (wbs-engine-port / T0b, 2026-10-12).
 *
 * Mirrors `salt.diff-baseline.ratchet.test.ts` as it landed at
 * salt-engine-port/T0b (60d3b37d7) -- read that file's doc comment for the
 * shared shape (weighted-score-never-rises gate over
 * `oracle/goldens/svg-wbs/diff-baseline.json`, `diffCount` kept as an
 * informational field, `status: "error"` rows never silently read as
 * "0 diffs"). Same gate over a different population: the 204
 * `test-results/dot-cache/wbs/` fixtures listed in
 * `plans/wbs-engine-port/fixtures.md`.
 *
 * Every one of the 204 rows is `status: "error"` today, and NONE of them got
 * there by `renderFixtureWbs` throwing. No wbs plugin is registered
 * (`src/index.ts`'s `registry.register(...)` calls list no wbs plugin), so
 * `DiagramRegistry.resolve` finds zero attempts for every wbs source and
 * `resolveAllRefused` falls through to `ERROR_SENTINEL`
 * (`src/core/dispatcher.ts:361-375`): a FIXED 300x60 "Error: unknown diagram
 * type" placeholder SVG, rendered successfully (no throw) every time.
 *
 * Comparing that placeholder against a real jar wbs render would pin a
 * `weightedScore` baseline that means nothing. So this suite's `measure()`
 * treats "renders `ERROR_SENTINEL`" as its OWN error condition, detected by
 * the fixed marker text the sentinel always emits (`dispatcher.ts:369`,
 * `text(10, 35, 'Error: unknown diagram type', ...)`), in addition to (never
 * instead of) a literal thrown exception.
 *
 * JAR-ERROR ROWS (T0a classification, 2026-10-12). 28 of the 204 rows are
 * ADDITIONALLY jar-side error pages: `oracle/goldens/stock-error-pages.json`
 * lists 28 `wbs/*` keys (2026-10-10 error-page rule: jar errors + we error =
 * conformant). Each carries a `reason` that starts `jar-crash:` (2 rows: the
 * record's message is empty and the jar renders its crash page,
 * `java.lang.IllegalArgumentException: character to be escaped is missing`)
 * or `jar-error:` (26 rows: the record's `message` is quoted), plus the
 * stock-record key. `measure()` gives them no special handling: the sentinel
 * check already classifies them as errored, and the `reason` is purely
 * informational. The shape test below derives the expected set from the
 * stock record itself, so it survives pins.
 *
 * `diffCount`/`weightedScore` are `null` (never a number) on every row
 * today: the manifest was seeded with EVERY row already in the error state.
 *
 * Re-measure by hand:
 *   npx vitest run tests/oracle/svg-conformance/wbs.diff-baseline.ratchet.test.ts
 *   npx jiti plans/wbs-engine-port/measurements/repin-wbs-baseline.mts
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { compareSvg, weightedScore } from './compare.js';
import { renderFixtureWbs } from './render-fixture-wbs.js';

interface BaselineFixture {
  readonly type: string;
  readonly slug: string;
  readonly status: 'baseline' | 'error';
  /** The GATED quantity (mirrors sequence's D5). `null` on every row today
   * -- see this file's header doc comment. */
  readonly weightedScore: number | null;
  /** Informational only -- never gated. */
  readonly diffCount: number | null;
  readonly reason?: string;
  readonly measuredAt: string;
  readonly measuredAgainstCommit: string;
}

interface BaselineManifest {
  readonly fixtures: readonly BaselineFixture[];
}

const HERE = dirname(fileURLToPath(import.meta.url));
const GOLDENS_DIR = join(HERE, '../../../oracle/goldens/svg-wbs');
const MANIFEST_PATH = join(GOLDENS_DIR, 'diff-baseline.json');
const RATCHET_PATH = join(GOLDENS_DIR, 'ratchet.json');
const CACHE_ROOT = join(HERE, '../../../test-results/dot-cache');
const WBS_CACHE_DIR = join(CACHE_ROOT, 'wbs');

/** The cached wbs population (`plans/wbs-engine-port/fixtures.md`). */
const WBS_CACHED_SLUG_COUNT = 204;
/** `oracle/goldens/stock-error-pages.json`: `{ errors: { "<type>/<slug>": { line, message } } }`. */
const STOCK_ERRORS_PATH = join(HERE, '../../../oracle/goldens/stock-error-pages.json');
/** The T0a classification: 28 `wbs/*` stock-error rows, 2 crashes (empty message) + 26 errors. */
const WBS_JAR_ERROR_COUNT = 28;
const WBS_JAR_CRASH_COUNT = 2;
const JAR_CRASH_PREFIX = 'jar-crash:';
const JAR_ERROR_PREFIX = 'jar-error:';

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as BaselineManifest;

type FixtureRef = Pick<BaselineFixture, 'type' | 'slug'>;

function fixtureDir(f: FixtureRef): string {
  return join(CACHE_ROOT, f.type, f.slug);
}

function hasCachedFixture(f: FixtureRef): boolean {
  const dir = fixtureDir(f);
  return existsSync(join(dir, 'in.puml')) && existsSync(join(dir, 'in.svg'));
}

/** `ERROR_SENTINEL`'s fixed marker text (`src/core/dispatcher.ts:369`) --
 * the ONLY thing distinguishing "rendered the unknown-diagram-type
 * placeholder" from a real render, since the sentinel never throws. */
const ERROR_SENTINEL_MARKER = 'Error: unknown diagram type';

type MeasureResult =
  | { readonly errored: false; readonly weightedScore: number; readonly diffCount: number }
  | { readonly errored: true; readonly reason: string };

/** Renders a fixture through T0b's wbs helper and compares it against the
 * cached jar oracle SVG. Two DISTINCT error paths feed the same
 * `errored: true` result (see header doc comment): a literal thrown
 * exception, and a successful render that is `ERROR_SENTINEL`'s fixed
 * placeholder -- comparing the latter against a real oracle SVG would pin a
 * baseline over unrelated geometry. */
function measure(f: FixtureRef): MeasureResult {
  const dir = fixtureDir(f);
  const markup = readFileSync(join(dir, 'in.puml'), 'utf8');
  const golden = readFileSync(join(dir, 'in.svg'), 'utf8');
  try {
    const ours = renderFixtureWbs(markup, new DeterministicMeasurer(), {
      includeStore: fixtureIncludeStore(),
    });
    if (ours.includes(ERROR_SENTINEL_MARKER)) {
      return {
        errored: true,
        reason: 'renders ERROR_SENTINEL (dispatcher.ts:361-375) -- no wbs plugin registered',
      };
    }
    const { diffs } = compareSvg(ours, golden, 'deterministic');
    return { errored: false, weightedScore: weightedScore(diffs), diffCount: diffs.length };
  } catch (err) {
    return { errored: true, reason: err instanceof Error ? err.message : String(err) };
  }
}

interface RiseCheckResult {
  readonly ok: boolean;
  readonly message: string;
}

/** Pure comparison: no rise above `baseline` is allowed -- identical
 * contract to the mindmap sibling's `checkNoRise`, extracted as a pure
 * function so AC-branch-discrimination below can exercise it directly. */
function checkNoRise(f: FixtureRef, baseline: number | null, live: number): RiseCheckResult {
  if (baseline === null) {
    return {
      ok: false,
      message:
        `${f.type}/${f.slug}: diff-baseline.json carries no weightedScore for this ` +
        `fixture. An entry with no numeric baseline cannot be compared against a live ` +
        `weighted score. Live weighted score is ${live}.`,
    };
  }
  if (live <= baseline) {
    return {
      ok: true,
      message: `${f.type}/${f.slug}: weighted score is ${live} (baseline ${baseline}) -- no regression.`,
    };
  }
  return {
    ok: false,
    message:
      `${f.type}/${f.slug}: weighted score ROSE -- baseline=${baseline}, now=${live}. ` +
      `This is a REGRESSION. Re-pin only after a deliberate change that lowers the score, ` +
      `from a fresh measurement, never by hand-editing to make it pass.`,
  };
}

const baselineFixtures = manifest.fixtures.filter((f) => f.status === 'baseline');
const errorFixtures = manifest.fixtures.filter((f) => f.status === 'error');

// ---------------------------------------------------------------------------
// AC0 -- corpus presence AND manifest shape: diff-baseline rows plus golden
// ratchet pins = the 51 committed cached slugs, exactly, disjoint (mindmap's
// AC0 second test, in its post-close-b5 form, so no close has to rewrite it).
// ---------------------------------------------------------------------------

describe('svg-wbs weighted-score baseline ratchet — corpus presence and manifest shape', () => {
  it('every manifest fixture has its committed in.puml + in.svg', () => {
    const missing = manifest.fixtures.filter((f) => !hasCachedFixture(f)).map((f) => `${f.type}/${f.slug}`);
    expect(
      missing,
      `test-results/dot-cache/wbs/ is COMMITTED. Missing entries mean a broken or ` +
        `partial checkout -- restore the tree rather than pruning diff-baseline.json to match it. ` +
        `Missing: ${missing.slice(0, 10).join(', ')}`,
    ).toEqual([]);
  });

  // A fixture is EITHER a diff-baseline row (still diverging, or a jar-side
  // error page) OR a golden-ratchet pin (conformant, 0 diffs), never both --
  // so the two manifests together are one row per cached slug, disjoint.
  it(`diff-baseline rows and ratchet pins together are exactly one row per cached wbs slug (${WBS_CACHED_SLUG_COUNT}), disjoint`, () => {
    const cachedSlugs = readdirSync(WBS_CACHE_DIR)
      .filter((f) => statSync(join(WBS_CACHE_DIR, f)).isDirectory())
      .sort();
    const ratchet = JSON.parse(readFileSync(RATCHET_PATH, 'utf8')) as { fixtures: { slug: string }[] };
    const pinned = ratchet.fixtures.map((f) => f.slug);
    const manifestSlugs = manifest.fixtures.map((f) => f.slug);
    expect(cachedSlugs).toHaveLength(WBS_CACHED_SLUG_COUNT);
    expect(
      manifestSlugs.filter((s) => pinned.includes(s)),
      'a pinned fixture must not also carry a diff-baseline row (the golden ratchet owns it)',
    ).toEqual([]);
    expect([...manifestSlugs, ...pinned].sort()).toEqual(cachedSlugs);
  });

  // The expected jar-error set is DERIVED from the stock record (not
  // hard-coded), so a pin that removes a row from the manifest keeps this green.
  it('jar-error rows are exactly the unpinned stock-error wbs/* keys, each reason naming its record', () => {
    const stock = (
      JSON.parse(readFileSync(STOCK_ERRORS_PATH, 'utf8')) as {
        errors: Record<string, { line: number | null; message: string }>;
      }
    ).errors;
    const wbsStock = Object.entries(stock).filter(([k]) => k.startsWith('wbs/'));
    expect(wbsStock).toHaveLength(WBS_JAR_ERROR_COUNT);
    expect(wbsStock.filter(([, v]) => v.message === '')).toHaveLength(WBS_JAR_CRASH_COUNT);
    const ratchet = JSON.parse(readFileSync(RATCHET_PATH, 'utf8')) as { fixtures: { slug: string }[] };
    const pinned = new Set(ratchet.fixtures.map((f) => f.slug));
    const bySlug = new Map(manifest.fixtures.map((f) => [f.slug, f]));
    const reasoned = manifest.fixtures
      .filter((f) => f.reason?.startsWith(JAR_CRASH_PREFIX) === true || f.reason?.startsWith(JAR_ERROR_PREFIX) === true)
      .map((f) => f.slug)
      .sort();
    const expected = wbsStock
      .map(([k]) => k.slice('wbs/'.length))
      .filter((s) => !pinned.has(s))
      .sort();
    expect(reasoned).toEqual(expected);
    for (const [key, rec] of wbsStock) {
      const row = bySlug.get(key.slice('wbs/'.length));
      if (row === undefined) continue;
      expect(row.reason, key).toContain(key);
      expect(row.reason!.startsWith(rec.message === '' ? JAR_CRASH_PREFIX : JAR_ERROR_PREFIX), key).toBe(true);
      if (rec.message !== '') expect(row.reason, key).toContain(rec.message);
    }
  });
});

// ---------------------------------------------------------------------------
// AC1 -- every baselined fixture's weighted score never rises. Empty today
// (0 baseline rows) -- the loop below produces zero `it()`s, which is
// correct: there is nothing to ratchet until a wbs plugin renders real
// geometry.
// ---------------------------------------------------------------------------

describe('svg-wbs weighted-score baseline ratchet', () => {
  for (const f of baselineFixtures) {
    it(`wbs/${f.slug}: weighted score never rises above its baseline (${String(f.weightedScore)})`, () => {
      const result = measure(f);
      if (result.errored) {
        throw new Error(
          `${f.type}/${f.slug}: expected a measurable score (baseline ${String(f.weightedScore)}) but ` +
            `rendering/comparison errored: ${result.reason}. This fixture's status changed from "baseline" ` +
            `to erroring -- update diff-baseline.json deliberately (status: "error", with a reason); do not ` +
            `let this pass silently as if nothing changed.`,
        );
      }
      const { ok, message } = checkNoRise(f, f.weightedScore, result.weightedScore);
      expect(ok, message).toBe(true);
    });
  }

  it('every manifest row is a numeric baseline (no "error" rows remain since the wbs plugin landed, wep T4a)', () => {
    expect(baselineFixtures).toHaveLength(manifest.fixtures.length);
    expect(errorFixtures).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// AC2 -- the rise/fall branches must actually discriminate. In-memory only
// (fabricated baselines, never a diff-baseline.json edit).
// ---------------------------------------------------------------------------

describe('svg-wbs weighted-score baseline ratchet — branch discrimination', () => {
  const sample: FixtureRef = { type: 'wbs', slug: 'branch-probe' };

  it('a fabricated baseline below the live count fails, naming fixture + baseline + new count', () => {
    const { ok, message } = checkNoRise(sample, 3, 7);
    expect(ok).toBe(false);
    expect(message).toContain(sample.slug);
    expect(message).toContain('baseline=3');
    expect(message).toContain('now=7');
  });

  it('a forced regression in an in-memory baseline double fails checkNoRise', () => {
    const double: BaselineFixture = {
      type: 'wbs',
      slug: 'regression-double',
      status: 'baseline',
      weightedScore: 120,
      diffCount: 4,
      measuredAt: '2026-10-12',
      measuredAgainstCommit: '0af285dcb',
    };
    const { ok, message } = checkNoRise(double, double.weightedScore, 121);
    expect(ok).toBe(false);
    expect(message).toBe(
      'wbs/regression-double: weighted score ROSE -- baseline=120, now=121. ' +
        'This is a REGRESSION. Re-pin only after a deliberate change that lowers the score, ' +
        'from a fresh measurement, never by hand-editing to make it pass.',
    );
  });

  it('an entry with no weightedScore pin fails rather than falling back', () => {
    const { ok, message } = checkNoRise(sample, null, 450);
    expect(ok).toBe(false);
    expect(message).toContain('no weightedScore');
    expect(message).toContain('450');
  });

  it('a baseline at or above the live count does not fail', () => {
    expect(checkNoRise(sample, 7, 7).ok).toBe(true);
    expect(checkNoRise(sample, 9, 7).ok).toBe(true);
  });

  // Until the batch-4 close this case fired against a REAL fixture (every
  // wbs row rendered the sentinel). The plugin now registers (wep T4a), so
  // the sentinel path is exercised on the marker text itself; a real render
  // must NOT trip it (mirrors salt.diff-baseline.ratchet.test.ts).
  it('the ERROR_SENTINEL marker check no longer fires against a real fixture once the plugin renders', () => {
    const real = manifest.fixtures[0];
    expect(real, 'expected at least one manifest fixture').toBeDefined();
    const result = measure(real!);
    expect(result.errored).toBe(false);
    expect(ERROR_SENTINEL_MARKER).toBe('Error: unknown diagram type');
  });
});

// ---------------------------------------------------------------------------
// AC3 -- error-status fixtures: an error must never silently read as "0
// diffs". If a recorded error stops reproducing (a wbs plugin lands), that
// status change is itself reportable and must fail loudly.
// ---------------------------------------------------------------------------

describe('svg-wbs weighted-score baseline ratchet — recorded errors', () => {
  for (const f of errorFixtures) {
    it(`wbs/${f.slug}: still errors as recorded`, () => {
      expect(f.reason, `${f.type}/${f.slug}: an "error" entry must carry a reason`).toBeTruthy();
      expect(f.diffCount, `${f.type}/${f.slug}: an "error" entry must carry NO numeric baseline`).toBeNull();
      expect(f.weightedScore, `${f.type}/${f.slug}: an "error" entry must carry NO numeric weightedScore`).toBeNull();
      const result = measure(f);
      if (!result.errored) {
        throw new Error(
          `${f.type}/${f.slug}: recorded as status "error" (${String(f.reason)}) but rendering/comparison ` +
            `SUCCEEDED this run with a real (non-sentinel) SVG, diffCount=${String(result.diffCount)}. An ` +
            `error-to-measurable transition is a real change (a wbs plugin now renders SOMETHING) and ` +
            `must never be silently treated as "0 diffs" or skipped -- move this fixture to status "baseline" ` +
            `in diff-baseline.json with a freshly measured weightedScore/diffCount, measuredAt, and ` +
            `measuredAgainstCommit.`,
        );
      }
      expect(result.errored).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// AC4 -- promotion is a hard stop. Evaluating any fixture must never write
// to ratchet.json -- pinning is orchestrator-only, at closes.
// ---------------------------------------------------------------------------

describe('svg-wbs weighted-score baseline ratchet — promotion is never automatic', () => {
  it('running this suite leaves ratchet.json untouched', () => {
    const before = existsSync(RATCHET_PATH) ? readFileSync(RATCHET_PATH, 'utf8') : null;
    for (const f of manifest.fixtures.slice(0, 5)) measure(f);
    const after = existsSync(RATCHET_PATH) ? readFileSync(RATCHET_PATH, 'utf8') : null;
    expect(after, 'measuring fixtures must never create or mutate ratchet.json').toBe(before);
  });

  it('no fixture is recorded as already promoted', () => {
    const promoted = baselineFixtures.filter((f) => f.diffCount === 0);
    expect(
      promoted.map((f) => f.slug),
      'a 0-diff entry in diff-baseline.json is a promotion candidate, not a promotion',
    ).toEqual([]);
  });
});
