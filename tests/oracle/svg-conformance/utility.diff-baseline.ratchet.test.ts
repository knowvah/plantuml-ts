/**
 * Diff-count BASELINE ratchet for the 17 utility-factory oracle rows
 * (utility-factories-port / T0b, D9).
 *
 * Mirrors `wbs.diff-baseline.ratchet.test.ts` (weighted-score-never-rises gate
 * over `oracle/goldens/svg-utility/diff-baseline.json`, `diffCount`
 * informational, `status: "error"` rows never silently read as "0 diffs")
 * over a different population: the FIXED `UTILITY_SLUGS` list
 * (`render-fixture-utility.ts`; `plans/utility-factories-port/fixtures.md`),
 * 17 rows of `test-results/dot-cache/unknown/`.
 *
 * AUTHORED ROOT (T3-cov, D10; wep T5-cov's shape). `tests/fixtures/utility/`
 * holds original fixtures (`<slug>.puml` + the jar's `<slug>.svg` beside it,
 * flat; the T1g/T1h probes folded in) tracked by a SEPARATE manifest,
 * `authored-baseline.json`, so the cached invariant ("rows + pins = the 17
 * UTILITY_SLUGS") is untouched and the pin tool never sees an authored row.
 * Invariant: authored rows = the `.puml` files on disk, each with its `.svg`,
 * disjoint from the cached slugs. A row is `baseline` (never-rises; 0 is
 * conformant and gated at 0; nonzero carries its mechanism) or `jar-flake`
 * (run-dependent jar output, excluded, variants in its `reason`). Rows render
 * with `surveyAssetStore()` (`measureAuthoredUtility`). `jarError` records an
 * error-page oracle in `stock-error-pages.json`'s `{ line, message }` shape;
 * the error-parity test holds the 2026-10-10 rule (we error exactly where the
 * jar errors) except a `parityGap` row, which must keep reproducing its named
 * gap until the gap is ported.
 *
 * SEEDED AT b0 (T0b): all 17 rows are `status: "error"`. No utility plugin
 * is registered (`src/index.ts`), so each source falls through the
 * dispatcher's refusal path and renders THIS PORT'S error banner page (the
 * `PSystemError` look-alike; `weErroredIn`, `scripts/pin-corpus-tree-measure.ts`),
 * not the bare `ERROR_SENTINEL` -- both are detected by
 * `measureUtilityMarkup` (`render-fixture-utility.ts`) and recorded `error`,
 * because comparing a placeholder against a real jar render would pin a
 * `weightedScore` over unrelated geometry. A row becomes a numeric `baseline`
 * the moment its factory renders; the re-measure tool is
 * `plans/utility-factories-port/measurements/repin-utility-baseline.mts`.
 *
 * Re-measure by hand:
 *   npx vitest run tests/oracle/svg-conformance/utility.diff-baseline.ratchet.test.ts
 *   npx jiti plans/utility-factories-port/measurements/repin-utility-baseline.mts
 *   npx jiti plans/utility-factories-port/measurements/T3-cov/build-authored-baseline.mts <commit>
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import {
  ERROR_SENTINEL_MARKER,
  UTILITY_CACHE_TYPE,
  UTILITY_SLUGS,
  isOurErrorPage,
  listAuthoredUtilitySlugs,
  measureAuthoredUtility,
  measureUtilitySlug,
  readAuthoredUtilityFixture,
  renderAuthoredUtility,
  renderFixtureUtility,
} from './render-fixture-utility.js';

interface BaselineFixture {
  readonly type: string;
  readonly slug: string;
  readonly status: 'baseline' | 'error';
  /** The GATED quantity. `null` on every `error` row. */
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
const GOLDENS_DIR = join(HERE, '../../../oracle/goldens/svg-utility');
const MANIFEST_PATH = join(GOLDENS_DIR, 'diff-baseline.json');
const RATCHET_PATH = join(GOLDENS_DIR, 'ratchet.json');
const CACHE_ROOT = join(HERE, '../../../test-results/dot-cache');

/** The in-scope population size (`plans/utility-factories-port/fixtures.md`). */
const UTILITY_SLUG_COUNT = 17;
const RENDERS_PER_ROW = 3;

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as BaselineManifest;

type FixtureRef = Pick<BaselineFixture, 'type' | 'slug'>;

function cacheDir(f: FixtureRef): string {
  return join(CACHE_ROOT, f.type, f.slug);
}

function hasCachedFixture(f: FixtureRef): boolean {
  return existsSync(join(cacheDir(f), 'in.puml')) && existsSync(join(cacheDir(f), 'in.svg'));
}

function ratchetSlugs(): string[] {
  return (JSON.parse(readFileSync(RATCHET_PATH, 'utf8')) as { fixtures: { slug: string }[] }).fixtures.map(
    (f) => f.slug,
  );
}

interface RiseCheckResult {
  readonly ok: boolean;
  readonly message: string;
}

/** Pure comparison: no rise above `baseline` is allowed (wbs's `checkNoRise`). */
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
// ratchet pins = the 17 UTILITY_SLUGS, exactly, disjoint.
// ---------------------------------------------------------------------------

describe('svg-utility weighted-score baseline ratchet — corpus presence and manifest shape', () => {
  it(`UTILITY_SLUGS lists ${UTILITY_SLUG_COUNT} distinct slugs, each with its committed in.puml + in.svg`, () => {
    expect(UTILITY_SLUGS).toHaveLength(UTILITY_SLUG_COUNT);
    expect(new Set(UTILITY_SLUGS).size).toBe(UTILITY_SLUG_COUNT);
    const missing = UTILITY_SLUGS.filter((slug) => !hasCachedFixture({ type: UTILITY_CACHE_TYPE, slug }));
    expect(
      missing,
      `test-results/dot-cache/unknown/ is COMMITTED. Missing entries mean a broken or partial checkout -- ` +
        `restore the tree rather than pruning the list. Missing: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  it('every manifest row is an unknown-bucket row with its committed in.puml + in.svg', () => {
    expect(manifest.fixtures.filter((f) => f.type !== UTILITY_CACHE_TYPE).map((f) => f.slug)).toEqual([]);
    expect(manifest.fixtures.filter((f) => !hasCachedFixture(f)).map((f) => f.slug)).toEqual([]);
  });

  // A fixture is EITHER a diff-baseline row (still diverging) OR a golden-ratchet
  // pin (conformant, 0 diffs), never both: together one row per utility slug.
  it(`diff-baseline rows and ratchet pins together are exactly the ${UTILITY_SLUG_COUNT} UTILITY_SLUGS, disjoint`, () => {
    const pinned = ratchetSlugs();
    const manifestSlugs = manifest.fixtures.map((f) => f.slug);
    expect(
      manifestSlugs.filter((s) => pinned.includes(s)),
      'a pinned fixture must not also carry a diff-baseline row (the golden ratchet owns it)',
    ).toEqual([]);
    expect([...manifestSlugs, ...pinned].sort()).toEqual([...UTILITY_SLUGS].sort());
  });
});

// ---------------------------------------------------------------------------
// AC1 -- every baselined fixture's weighted score never rises.
// ---------------------------------------------------------------------------

describe('svg-utility weighted-score baseline ratchet', () => {
  for (const f of baselineFixtures) {
    it(`unknown/${f.slug}: weighted score never rises above its baseline (${String(f.weightedScore)})`, () => {
      const result = measureUtilitySlug(CACHE_ROOT, f.slug);
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

  it('every row is a numeric baseline or a reasoned error, never both', () => {
    expect(baselineFixtures.length + errorFixtures.length).toBe(manifest.fixtures.length);
    for (const f of baselineFixtures) expect(f.weightedScore, f.slug).toEqual(expect.any(Number));
  });
});

// ---------------------------------------------------------------------------
// AC2 -- the rise/fall branches must actually discriminate (in-memory only).
// ---------------------------------------------------------------------------

describe('svg-utility weighted-score baseline ratchet — branch discrimination', () => {
  const sample: FixtureRef = { type: 'unknown', slug: 'branch-probe' };

  it('a fabricated baseline below the live count fails, naming fixture + baseline + new count', () => {
    const { ok, message } = checkNoRise(sample, 3, 7);
    expect(ok).toBe(false);
    expect(message).toContain(sample.slug);
    expect(message).toContain('baseline=3');
    expect(message).toContain('now=7');
  });

  it('a forced regression in an in-memory baseline double fails checkNoRise with the exact message', () => {
    const double: BaselineFixture = {
      type: 'unknown',
      slug: 'regression-double',
      status: 'baseline',
      weightedScore: 120,
      diffCount: 4,
      measuredAt: '2026-10-13',
      measuredAgainstCommit: '3e99b64fc',
    };
    const { ok, message } = checkNoRise(double, double.weightedScore, 121);
    expect(ok).toBe(false);
    expect(message).toBe(
      'unknown/regression-double: weighted score ROSE -- baseline=120, now=121. ' +
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

  it('the error-detection marker is the dispatcher sentinel text', () => {
    expect(ERROR_SENTINEL_MARKER).toBe('Error: unknown diagram type');
  });
});

// ---------------------------------------------------------------------------
// AC3 -- error-status fixtures: an error must never silently read as "0
// diffs". If a recorded error stops reproducing (a utility plugin lands), that
// status change is itself reportable and must fail loudly.
// ---------------------------------------------------------------------------

describe('svg-utility weighted-score baseline ratchet — recorded errors', () => {
  for (const f of errorFixtures) {
    it(`unknown/${f.slug}: still errors as recorded`, () => {
      expect(f.reason, `${f.type}/${f.slug}: an "error" entry must carry a reason`).toBeTruthy();
      expect(f.diffCount, `${f.type}/${f.slug}: an "error" entry must carry NO numeric baseline`).toBeNull();
      expect(f.weightedScore, `${f.type}/${f.slug}: an "error" entry must carry NO numeric weightedScore`).toBeNull();
      const result = measureUtilitySlug(CACHE_ROOT, f.slug);
      if (!result.errored) {
        throw new Error(
          `${f.type}/${f.slug}: recorded as status "error" (${String(f.reason)}) but rendering/comparison ` +
            `SUCCEEDED this run with a real SVG, diffCount=${String(result.diffCount)}. An ` +
            `error-to-measurable transition is a real change (a utility plugin now renders SOMETHING) and ` +
            `must never be silently treated as "0 diffs" or skipped -- move this fixture to status "baseline" ` +
            `in diff-baseline.json with a freshly measured weightedScore/diffCount, measuredAt, and ` +
            `measuredAgainstCommit (repin-utility-baseline.mts).`,
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

describe('svg-utility weighted-score baseline ratchet — promotion is never automatic', () => {
  it('running this suite leaves ratchet.json untouched', () => {
    const before = readFileSync(RATCHET_PATH, 'utf8');
    for (const f of manifest.fixtures.slice(0, 5)) measureUtilitySlug(CACHE_ROOT, f.slug);
    expect(readFileSync(RATCHET_PATH, 'utf8'), 'measuring fixtures must never mutate ratchet.json').toBe(before);
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
// Determinism (D-quality bar): each corpus row rendered three times is
// byte-identical. No Math.random / Date.now in rendering paths.
// ---------------------------------------------------------------------------

describe('svg-utility rows — deterministic rendering', () => {
  for (const slug of UTILITY_SLUGS) {
    it(`unknown/${slug}: ${RENDERS_PER_ROW} renders are byte-identical`, () => {
      const markup = readFileSync(join(CACHE_ROOT, UTILITY_CACHE_TYPE, slug, 'in.puml'), 'utf8');
      const renders = Array.from({ length: RENDERS_PER_ROW }, () =>
        renderFixtureUtility(markup, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() }),
      );
      expect(renders[0]!.length).toBeGreaterThan(0);
      expect(new Set(renders).size).toBe(1);
    });
  }
});

// ---------------------------------------------------------------------------
// AUTHORED ROOT (T3-cov) -- `tests/fixtures/utility/` + `authored-baseline.json`.
// ---------------------------------------------------------------------------

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
  /** A named gap where we error and the jar draws (never the 2026-10-10 rule). */
  readonly parityGap?: string;
  readonly measuredAt: string;
  readonly measuredAgainstCommit: string;
}

const AUTHORED_MANIFEST_PATH = join(GOLDENS_DIR, 'authored-baseline.json');
const authoredManifest = JSON.parse(readFileSync(AUTHORED_MANIFEST_PATH, 'utf8')) as {
  readonly fixtures: readonly AuthoredFixture[];
};
const authoredBaseline = authoredManifest.fixtures.filter((f) => f.status === 'baseline');
const authoredFlakes = authoredManifest.fixtures.filter((f) => f.status === 'jar-flake');

/** The jar error page's signature: a `[From <desc> (line N) ]` header (PSystemError.java:239). */
const JAR_ERROR_HEADER = /\[From [^<]*? \(line \d+\) \]/;

describe('svg-utility authored fixtures — manifest shape', () => {
  it('authored rows are exactly one per tests/fixtures/utility/*.puml on disk, each with its jar .svg', () => {
    const onDisk = listAuthoredUtilitySlugs();
    expect(onDisk.length).toBeGreaterThan(0);
    expect(authoredManifest.fixtures.map((f) => f.slug).sort()).toEqual(onDisk);
    expect(onDisk.filter((slug) => readAuthoredUtilityFixture(slug).golden === undefined)).toEqual([]);
  });

  it('authored slugs are disjoint from the cached unknown corpus, UTILITY_SLUGS and the ratchet pins', () => {
    const taken = new Set([...readdirSync(join(CACHE_ROOT, UTILITY_CACHE_TYPE)), ...UTILITY_SLUGS, ...ratchetSlugs()]);
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

  it('a nonzero baseline names its mechanism', () => {
    const unexplained = authoredBaseline.filter((f) => f.weightedScore !== 0 && f.reason === undefined);
    expect(unexplained.map((f) => f.slug)).toEqual([]);
  });

  it("jarError rows are exactly the jar error pages, in stock-error-pages.json's { line, message } shape", () => {
    const errorPages = authoredManifest.fixtures
      .filter((f) => JAR_ERROR_HEADER.test(readAuthoredUtilityFixture(f.slug).golden ?? ''))
      .map((f) => f.slug);
    expect(authoredManifest.fixtures.filter((f) => f.jarError !== undefined).map((f) => f.slug)).toEqual(errorPages);
    for (const f of authoredManifest.fixtures.filter((r) => r.jarError !== undefined)) {
      expect(Object.keys(f.jarError!).sort(), f.slug).toEqual(['line', 'message']);
      expect(f.jarError!.line === null || Number.isInteger(f.jarError!.line), f.slug).toBe(true);
      const golden = (readAuthoredUtilityFixture(f.slug).golden ?? '').replaceAll('&lt;', '<');
      expect(golden, f.slug).toContain(f.jarError!.message);
      expect(golden, f.slug).toContain(`(line ${String(f.jarError!.line)}) ]`);
    }
  });
});

describe('svg-utility authored fixtures — weighted score never rises', () => {
  for (const f of authoredBaseline) {
    it(`authored/${f.slug}: weighted score never rises above its baseline (${String(f.weightedScore)})`, () => {
      const result = measureAuthoredUtility(f.slug);
      if (result.errored) throw new Error(`authored/${f.slug}: rendering/comparison errored: ${result.reason}`);
      const { ok, message } = checkNoRise({ type: f.type, slug: f.slug }, f.weightedScore, result.weightedScore);
      expect(ok, message).toBe(true);
    });
  }
});

describe('svg-utility authored fixtures — error parity (2026-10-10 error-page rule)', () => {
  for (const f of authoredManifest.fixtures) {
    const title =
      f.parityGap !== undefined
        ? `jar draws, we error: ${f.parityGap}`
        : f.jarError === undefined
          ? 'jar draws and we draw'
          : 'jar errors and we error';
    it(`authored/${f.slug}: ${title}`, () => {
      const weErrored = isOurErrorPage(renderAuthoredUtility(readAuthoredUtilityFixture(f.slug).markup));
      if (f.parityGap !== undefined) {
        expect(f.jarError, `${f.slug}: a parityGap row is one the jar draws`).toBeUndefined();
        expect(weErrored, `${f.slug}: the gap closed -- drop parityGap and re-measure the row`).toBe(true);
        return;
      }
      expect(weErrored, f.slug).toBe(f.jarError !== undefined);
    });
  }
});

describe('svg-utility authored fixtures — deterministic rendering', () => {
  for (const slug of listAuthoredUtilitySlugs()) {
    it(`authored/${slug}: ${RENDERS_PER_ROW} renders are byte-identical`, () => {
      const { markup } = readAuthoredUtilityFixture(slug);
      const renders = Array.from({ length: RENDERS_PER_ROW }, () => renderAuthoredUtility(markup));
      expect(renders[0]!.length).toBeGreaterThan(0);
      expect(new Set(renders).size).toBe(1);
    });
  }
});
