/**
 * Diff-count BASELINE ratchet for the committed salt oracle corpus
 * (salt-engine-port / T0b, 2026-10-12).
 *
 * Mirrors `mindmap.diff-baseline.ratchet.test.ts` as it landed at
 * mindmap-engine-port/T0b (47164de73) -- read that file's doc comment for
 * the shared shape (weighted-score-never-rises gate over
 * `oracle/goldens/svg-salt/diff-baseline.json`, `diffCount` kept as an
 * informational field, `status: "error"` rows never silently read as
 * "0 diffs"). Same gate over a different population: the 51
 * `test-results/dot-cache/salt/` fixtures listed in
 * `plans/salt-engine-port/fixtures.md`.
 *
 * Every one of the 51 rows is `status: "error"` today, and NONE of them got
 * there by `renderFixtureSalt` throwing. No salt plugin is registered
 * (`src/index.ts:111-125` lists fifteen `registry.register(...)` calls; salt
 * is absent), so `DiagramRegistry.resolve` (`src/core/dispatcher.ts:431-441`)
 * finds zero attempts for every salt source and `resolveAllRefused`
 * (`:482-487`) falls through to `ERROR_SENTINEL` (`:361-375`): a FIXED 300x60
 * "Error: unknown diagram type" placeholder SVG, rendered successfully (no
 * throw) every time. Measured directly (`npx jiti` against all 51 cached
 * fixtures, 2026-10-12 against 0af285dcb): 0 of 51 throw, 51 of 51 render the
 * sentinel.
 *
 * Comparing that placeholder against a real jar salt render would pin a
 * `weightedScore` baseline that means nothing -- it measures the fixed
 * geometry of an unrelated 300x60 error box, not salt fidelity. So this
 * suite's `measure()` treats "renders `ERROR_SENTINEL`" as its OWN error
 * condition, detected by the fixed marker text the sentinel always emits
 * (`dispatcher.ts:369`, `text(10, 35, 'Error: unknown diagram type', ...)`),
 * in addition to (never instead of) a literal thrown exception. One of the
 * 51 rows is ADDITIONALLY a jar-side error: `lakari-33-mone874`
 * (`oracle/goldens/svg-conformance/routing-baseline.json`'s `jarErrored:
 * true`, `oracle/goldens/stock-error-pages.json`'s `salt/lakari-33-mone874`)
 * -- the cached `in.svg` is the jar's "PlantUML has crashed" page for a
 * `java.lang.IllegalArgumentException` thrown by `ElementMenuBar
 * #getElementMenuEntry` (`salt/element/ElementMenuBar.java:87`). It is
 * recorded with a distinguishing `reason` in the manifest but given no
 * special handling in `measure()`: the sentinel check already classifies it
 * as errored, and its `reason` string is purely informational.
 * (`nutesi-68-soxe380` / `tidube-04-sivu098` only LOOK like error pages --
 * `"java.lang.Object "` is textfield content -- and are ordinary rows.)
 *
 * `diffCount`/`weightedScore` are `null` (never a number) on every row
 * today: the manifest was seeded with EVERY row already in the error state.
 *
 * AUTHORED ROOT (sep T5-cov). `tests/fixtures/salt/` holds original fixtures
 * (`<slug>.puml` + the jar's `<slug>.svg` beside it, flat), tracked by a
 * SEPARATE manifest, `authored-baseline.json`, rather than a second array in
 * `diff-baseline.json`: the cached manifest's shape invariant ("rows + pins =
 * the 51 cached slugs") then stays byte-for-byte what it was, the pin tool
 * (`pin-salt.mts`, which copies from `test-results/dot-cache/`) never sees an
 * authored row, and the authored root gets its own invariant ("rows = the
 * `.puml` files on disk"). An authored row is `baseline` (gated by the same
 * never-rises rule; a 0 score is conformant and gated at 0) or `jar-flake`
 * (the jar's own output is run-dependent -- excluded from the gate, with the
 * observed variants in its `reason`). `jarError` records an error-page
 * oracle in `oracle/goldens/stock-error-pages.json`'s `{ line, message }`
 * shape (`line: null, message: ""` for a crash page).
 *
 * Re-measure by hand:
 *   npx vitest run tests/oracle/svg-conformance/salt.diff-baseline.ratchet.test.ts
 *   npx jiti plans/salt-engine-port/measurements/T5-cov/measure-authored.mts <out.json>
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { compareSvg, weightedScore } from './compare.js';
import type { IncludeStore } from '../../../src/core/tim/IncludeStore.js';
import {
  authoredSaltIncludeStore,
  listAuthoredSaltSlugs,
  readAuthoredSaltFixture,
  renderFixtureSalt,
} from './render-fixture-salt.js';

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
const GOLDENS_DIR = join(HERE, '../../../oracle/goldens/svg-salt');
const MANIFEST_PATH = join(GOLDENS_DIR, 'diff-baseline.json');
const AUTHORED_MANIFEST_PATH = join(GOLDENS_DIR, 'authored-baseline.json');
const RATCHET_PATH = join(GOLDENS_DIR, 'ratchet.json');
const CACHE_ROOT = join(HERE, '../../../test-results/dot-cache');
const SALT_CACHE_DIR = join(CACHE_ROOT, 'salt');

/** The cached salt population (`plans/salt-engine-port/fixtures.md`). */
const SALT_CACHED_SLUG_COUNT = 51;
/** The one jar-side crash page among them (see header doc comment). */
const JAR_CRASH_SLUG = 'lakari-33-mone874';

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as BaselineManifest;

/** An authored-root row (`authored-baseline.json`) -- see the header doc comment. */
interface AuthoredFixture {
  readonly type: string;
  readonly slug: string;
  readonly topic: string;
  readonly status: 'baseline' | 'jar-flake';
  readonly weightedScore: number | null;
  readonly diffCount: number | null;
  readonly reason?: string;
  /** `stock-error-pages.json`'s row shape, for an error-page oracle. */
  readonly jarError?: { readonly line: number | null; readonly message: string };
  readonly measuredAt: string;
  readonly measuredAgainstCommit: string;
}

const authoredManifest = JSON.parse(readFileSync(AUTHORED_MANIFEST_PATH, 'utf8')) as {
  readonly fixtures: readonly AuthoredFixture[];
};

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

/** Renders a fixture through T0b's salt helper and compares it against the
 * cached jar oracle SVG. Two DISTINCT error paths feed the same
 * `errored: true` result (see header doc comment): a literal thrown
 * exception, and a successful render that is `ERROR_SENTINEL`'s fixed
 * placeholder -- comparing the latter against a real oracle SVG would pin a
 * baseline over unrelated geometry. */
function measure(f: FixtureRef): MeasureResult {
  const dir = fixtureDir(f);
  return measureMarkup(
    readFileSync(join(dir, 'in.puml'), 'utf8'),
    readFileSync(join(dir, 'in.svg'), 'utf8'),
    fixtureIncludeStore(),
  );
}

/** Same as {@link measure}, for an authored-root fixture (its jar oracle sits beside it). */
function measureAuthored(slug: string): MeasureResult {
  const { markup, golden } = readAuthoredSaltFixture(slug);
  if (golden === undefined) return { errored: true, reason: `tests/fixtures/salt/${slug}.svg is missing` };
  return measureMarkup(markup, golden, authoredSaltIncludeStore());
}

function measureMarkup(markup: string, golden: string, includeStore: IncludeStore): MeasureResult {
  try {
    const ours = renderFixtureSalt(markup, new DeterministicMeasurer(), { includeStore });
    if (ours.includes(ERROR_SENTINEL_MARKER)) {
      return {
        errored: true,
        reason: 'renders ERROR_SENTINEL (dispatcher.ts:361-375) -- no salt plugin registered',
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

describe('svg-salt weighted-score baseline ratchet — corpus presence and manifest shape', () => {
  it('every manifest fixture has its committed in.puml + in.svg', () => {
    const missing = manifest.fixtures.filter((f) => !hasCachedFixture(f)).map((f) => `${f.type}/${f.slug}`);
    expect(
      missing,
      `test-results/dot-cache/salt/ is COMMITTED. Missing entries mean a broken or ` +
        `partial checkout -- restore the tree rather than pruning diff-baseline.json to match it. ` +
        `Missing: ${missing.slice(0, 10).join(', ')}`,
    ).toEqual([]);
  });

  // A fixture is EITHER a diff-baseline row (still diverging, or a jar-side
  // error page) OR a golden-ratchet pin (conformant, 0 diffs), never both --
  // so the two manifests together are one row per cached slug, disjoint.
  it(`diff-baseline rows and ratchet pins together are exactly one row per cached salt slug (${SALT_CACHED_SLUG_COUNT}), disjoint`, () => {
    const cachedSlugs = readdirSync(SALT_CACHE_DIR)
      .filter((f) => statSync(join(SALT_CACHE_DIR, f)).isDirectory())
      .sort();
    const ratchet = JSON.parse(readFileSync(RATCHET_PATH, 'utf8')) as { fixtures: { slug: string }[] };
    const pinned = ratchet.fixtures.map((f) => f.slug);
    const manifestSlugs = manifest.fixtures.map((f) => f.slug);
    expect(cachedSlugs).toHaveLength(SALT_CACHED_SLUG_COUNT);
    expect(
      manifestSlugs.filter((s) => pinned.includes(s)),
      'a pinned fixture must not also carry a diff-baseline row (the golden ratchet owns it)',
    ).toEqual([]);
    expect([...manifestSlugs, ...pinned].sort()).toEqual(cachedSlugs);
  });

  it(`the jar-crash row (${JAR_CRASH_SLUG}) carries a reason naming the crash; no other row does`, () => {
    const crashRows = manifest.fixtures.filter((f) => f.reason?.startsWith('jar-crash') === true);
    expect(crashRows.map((f) => f.slug)).toEqual([JAR_CRASH_SLUG]);
    expect(crashRows[0]!.reason).toContain('ElementMenuBar.java:87');
  });
});

// ---------------------------------------------------------------------------
// AC1 -- every baselined fixture's weighted score never rises. Empty today
// (0 baseline rows) -- the loop below produces zero `it()`s, which is
// correct: there is nothing to ratchet until a salt plugin renders real
// geometry.
// ---------------------------------------------------------------------------

describe('svg-salt weighted-score baseline ratchet', () => {
  for (const f of baselineFixtures) {
    it(`salt/${f.slug}: weighted score never rises above its baseline (${String(f.weightedScore)})`, () => {
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

  it('every manifest row is a numeric baseline (no "error" rows remain since the salt plugin landed, sep T4a)', () => {
    expect(baselineFixtures).toHaveLength(manifest.fixtures.length);
    expect(errorFixtures).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// AC2 -- the rise/fall branches must actually discriminate. In-memory only
// (fabricated baselines, never a diff-baseline.json edit).
// ---------------------------------------------------------------------------

describe('svg-salt weighted-score baseline ratchet — branch discrimination', () => {
  const sample: FixtureRef = { type: 'salt', slug: 'branch-probe' };

  it('a fabricated baseline below the live count fails, naming fixture + baseline + new count', () => {
    const { ok, message } = checkNoRise(sample, 3, 7);
    expect(ok).toBe(false);
    expect(message).toContain(sample.slug);
    expect(message).toContain('baseline=3');
    expect(message).toContain('now=7');
  });

  it('a forced regression in an in-memory baseline double fails checkNoRise', () => {
    const double: BaselineFixture = {
      type: 'salt',
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
      'salt/regression-double: weighted score ROSE -- baseline=120, now=121. ' +
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
  // salt row rendered the sentinel). The plugin now registers (sep T4a), so
  // the sentinel path is exercised on the marker text itself; a real render
  // must NOT trip it (mirrors mindmap.diff-baseline.ratchet.test.ts).
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
// diffs". If a recorded error stops reproducing (a salt plugin lands), that
// status change is itself reportable and must fail loudly.
// ---------------------------------------------------------------------------

describe('svg-salt weighted-score baseline ratchet — recorded errors', () => {
  for (const f of errorFixtures) {
    it(`salt/${f.slug}: still errors as recorded`, () => {
      expect(f.reason, `${f.type}/${f.slug}: an "error" entry must carry a reason`).toBeTruthy();
      expect(f.diffCount, `${f.type}/${f.slug}: an "error" entry must carry NO numeric baseline`).toBeNull();
      expect(f.weightedScore, `${f.type}/${f.slug}: an "error" entry must carry NO numeric weightedScore`).toBeNull();
      const result = measure(f);
      if (!result.errored) {
        throw new Error(
          `${f.type}/${f.slug}: recorded as status "error" (${String(f.reason)}) but rendering/comparison ` +
            `SUCCEEDED this run with a real (non-sentinel) SVG, diffCount=${String(result.diffCount)}. An ` +
            `error-to-measurable transition is a real change (a salt plugin now renders SOMETHING) and ` +
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

describe('svg-salt weighted-score baseline ratchet — promotion is never automatic', () => {
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

// ---------------------------------------------------------------------------
// AUTHORED ROOT (sep T5-cov) -- `tests/fixtures/salt/` + `authored-baseline
// .json`. Shape: one row per `.puml` on disk, each with its jar `.svg`
// beside it, disjoint from the cached slugs. Gate: the same never-rises rule
// over every `baseline` row; `jar-flake` rows are excluded and must say why.
// ---------------------------------------------------------------------------

const authoredBaseline = authoredManifest.fixtures.filter((f) => f.status === 'baseline');
const authoredFlakes = authoredManifest.fixtures.filter((f) => f.status === 'jar-flake');

describe('svg-salt authored fixtures — manifest shape', () => {
  it('authored rows are exactly one per tests/fixtures/salt/*.puml on disk, each with its jar .svg', () => {
    const onDisk = listAuthoredSaltSlugs();
    expect(authoredManifest.fixtures.map((f) => f.slug).sort()).toEqual(onDisk);
    expect(onDisk.filter((slug) => readAuthoredSaltFixture(slug).golden === undefined)).toEqual([]);
  });

  it('authored slugs are disjoint from the cached corpus slugs and the ratchet pins', () => {
    const ratchet = JSON.parse(readFileSync(RATCHET_PATH, 'utf8')) as { fixtures: { slug: string }[] };
    const taken = new Set([...readdirSync(SALT_CACHE_DIR), ...ratchet.fixtures.map((f) => f.slug)]);
    expect(authoredManifest.fixtures.filter((f) => taken.has(f.slug)).map((f) => f.slug)).toEqual([]);
  });

  it('every row is a numeric baseline or a reasoned jar-flake with no number', () => {
    expect(authoredBaseline.length + authoredFlakes.length).toBe(authoredManifest.fixtures.length);
    for (const f of authoredBaseline) expect(f.weightedScore, f.slug).toEqual(expect.any(Number));
    for (const f of authoredFlakes) {
      expect(f.weightedScore, f.slug).toBeNull();
      expect(f.reason, f.slug).toMatch(/^jar-flake: /);
    }
  });

  it("every jarError row has stock-error-pages.json's { line, message } shape", () => {
    const rows = authoredManifest.fixtures.filter((f) => f.jarError !== undefined);
    expect(rows.length).toBeGreaterThan(0);
    for (const f of rows) {
      expect(Object.keys(f.jarError!).sort(), f.slug).toEqual(['line', 'message']);
      expect(f.jarError!.line === null || Number.isInteger(f.jarError!.line), f.slug).toBe(true);
    }
  });
});

describe('svg-salt authored fixtures — weighted score never rises', () => {
  for (const f of authoredBaseline) {
    it(`authored/${f.slug}: weighted score never rises above its baseline (${String(f.weightedScore)})`, () => {
      const result = measureAuthored(f.slug);
      if (result.errored) throw new Error(`authored/${f.slug}: rendering/comparison errored: ${result.reason}`);
      const { ok, message } = checkNoRise(f, f.weightedScore, result.weightedScore);
      expect(ok, message).toBe(true);
    });
  }
});
