/**
 * Diff-count BASELINE ratchet for the committed mindmap oracle corpus
 * (mindmap-engine-port / T0b, 2026-09-29).
 *
 * Sibling of `sequence.diff-baseline.ratchet.test.ts` -- read that file's
 * doc comment for the shared shape (weighted-score-never-rises gate over
 * `oracle/goldens/svg-mindmap/diff-baseline.json`, `diffCount` kept as an
 * informational field, `status: "error"` rows never silently read as
 * "0 diffs"). This is the same gate over a different, much smaller
 * population: the 142 `test-results/dot-cache/mindmap/` fixtures T0a
 * captured into the ledger (`plans/mindmap-engine-port/fixtures.md`).
 *
 * ONE STRUCTURAL DIVERGENCE from the sequence sibling, because mindmap's
 * population differs in KIND, not because the sibling's shape was improved
 * on: every one of the 142 rows is `status: "error"` today, and NONE of
 * them got there by `renderFixtureMindmap` throwing.
 *
 * No mindmap plugin is registered (`src/index.ts:108-121` lists eleven
 * `registry.register(...)` calls; mindmap is absent), so `DiagramRegistry
 * .resolve` (`src/core/dispatcher.ts:316-326`) finds zero attempts for
 * every mindmap source and `resolveAllRefused` (`:341-345`) falls through
 * to `ERROR_SENTINEL` (`:252-267`): a FIXED 300x60 "Error: unknown diagram
 * type" placeholder SVG, rendered successfully (no throw) every time.
 * Measured directly (`npx jiti` against all 142 cached fixtures, 2026-09-29
 * against 70ae18dcc): 0 of 142 throw, 142 of 142 render the sentinel.
 *
 * Comparing that placeholder against a real jar mindmap render would pin a
 * `weightedScore` baseline that means nothing -- it measures the fixed
 * geometry of an unrelated 300x60 error box, not mindmap fidelity, and a
 * future change that finally draws a real mindmap would (correctly) look
 * like an enormous "regression" against it. So this suite's `measure()`
 * treats "renders `ERROR_SENTINEL`" as its OWN error condition, detected by
 * the fixed marker text the sentinel always emits
 * (`dispatcher.ts:258`, `text(10, 35, 'Error: unknown diagram type', ...)`),
 * in addition to (never instead of) a literal thrown exception. Three of
 * the 142 rows are ADDITIONALLY jar-side errors (`oracle/goldens/
 * svg-conformance/routing-baseline.json`'s `jarErrored: true` for
 * `femiba-70-duvi238`, `fogari-75-febu345`, `susipa-95-tedu015` -- the
 * cached `in.svg` is itself a jar fallback/crash page, not a mindmap
 * render), recorded with a distinguishing `reason` in the manifest but
 * given no special handling in `measure()`: the sentinel check already
 * classifies them as errored, and their `reason` string is purely
 * informational, exactly like every other row's.
 *
 * `diffCount`/`weightedScore` are `null` (never a number) on every row
 * today -- unlike the sequence manifest's optional-field convention for
 * error rows, this manifest was seeded with EVERY row already in the error
 * state, so there is no historical baseline-then-regressed-to-error case to
 * accommodate yet.
 *
 * Re-measure by hand:
 *   npx vitest run tests/oracle/svg-conformance/mindmap.diff-baseline.ratchet.test.ts
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { compareSvg, weightedScore } from './compare.js';
import { renderFixtureMindmap } from './render-fixture-mindmap.js';

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
const GOLDENS_DIR = join(HERE, '../../../oracle/goldens/svg-mindmap');
const MANIFEST_PATH = join(GOLDENS_DIR, 'diff-baseline.json');
const RATCHET_PATH = join(GOLDENS_DIR, 'ratchet.json');
const CACHE_ROOT = join(HERE, '../../../test-results/dot-cache');
const MINDMAP_CACHE_DIR = join(CACHE_ROOT, 'mindmap');

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as BaselineManifest;

type FixtureRef = Pick<BaselineFixture, 'type' | 'slug'>;

function fixtureDir(f: FixtureRef): string {
  return join(CACHE_ROOT, f.type, f.slug);
}

function hasCachedFixture(f: FixtureRef): boolean {
  const dir = fixtureDir(f);
  return existsSync(join(dir, 'in.puml')) && existsSync(join(dir, 'in.svg'));
}

/** `ERROR_SENTINEL`'s fixed marker text (`src/core/dispatcher.ts:258`) --
 * the ONLY thing distinguishing "rendered the unknown-diagram-type
 * placeholder" from a real render, since the sentinel never throws. */
const ERROR_SENTINEL_MARKER = 'Error: unknown diagram type';

type MeasureResult =
  | { readonly errored: false; readonly weightedScore: number; readonly diffCount: number }
  | { readonly errored: true; readonly reason: string };

/** Renders a fixture through T0b's mindmap helper and compares it against
 * the cached jar oracle SVG. Two DISTINCT error paths feed the same
 * `errored: true` result (see header doc comment): a literal thrown
 * exception, and a successful render that is `ERROR_SENTINEL`'s fixed
 * placeholder -- comparing the latter against a real oracle SVG would pin a
 * baseline over unrelated geometry. */
function measure(f: FixtureRef): MeasureResult {
  const dir = fixtureDir(f);
  const markup = readFileSync(join(dir, 'in.puml'), 'utf8');
  const golden = readFileSync(join(dir, 'in.svg'), 'utf8');
  try {
    const ours = renderFixtureMindmap(markup, new DeterministicMeasurer(), {
      includeStore: fixtureIncludeStore(),
    });
    if (ours.includes(ERROR_SENTINEL_MARKER)) {
      return {
        errored: true,
        reason: 'renders ERROR_SENTINEL (dispatcher.ts:252-267) -- no mindmap plugin registered',
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
 * contract to the sequence sibling's `checkNoRise`, extracted as a pure
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
// AC0 -- corpus presence AND manifest shape: rows = the 142 committed
// cached slugs, exactly (a stronger check than sequence's own AC0, which
// only checks each manifest row has a cache dir -- mindmap's population is
// small and fully enumerable, so a missing OR an extra row is detectable).
// ---------------------------------------------------------------------------

describe('svg-mindmap weighted-score baseline ratchet — corpus presence and manifest shape', () => {
  it('every manifest fixture has its committed in.puml + in.svg', () => {
    const missing = manifest.fixtures.filter((f) => !hasCachedFixture(f)).map((f) => `${f.type}/${f.slug}`);
    expect(
      missing,
      `test-results/dot-cache/mindmap/ is COMMITTED. Missing entries mean a broken or ` +
        `partial checkout -- restore the tree rather than pruning diff-baseline.json to match it. ` +
        `Missing: ${missing.slice(0, 10).join(', ')}`,
    ).toEqual([]);
  });

  // Since mindmap-engine-port/close-b5 (2026-09-30) the population is split
  // exactly the way description's is: a fixture is EITHER a diff-baseline row
  // (still diverging, or a jar-side error page) OR a golden-ratchet pin
  // (conformant, 0 diffs), never both -- so the two manifests together are
  // one row per cached slug, disjoint.
  it('diff-baseline rows and ratchet pins together are exactly one row per cached mindmap slug (142), disjoint', () => {
    const cachedSlugs = readdirSync(MINDMAP_CACHE_DIR)
      .filter((f) => statSync(join(MINDMAP_CACHE_DIR, f)).isDirectory())
      .sort();
    const ratchet = JSON.parse(readFileSync(RATCHET_PATH, 'utf8')) as { fixtures: { slug: string }[] };
    const pinned = ratchet.fixtures.map((f) => f.slug);
    const manifestSlugs = manifest.fixtures.map((f) => f.slug);
    expect(cachedSlugs).toHaveLength(142);
    expect(
      manifestSlugs.filter((s) => pinned.includes(s)),
      'a pinned fixture must not also carry a diff-baseline row (the golden ratchet owns it)',
    ).toEqual([]);
    expect([...manifestSlugs, ...pinned].sort()).toEqual(cachedSlugs);
  });
});

// ---------------------------------------------------------------------------
// AC1 -- every baselined fixture's weighted score never rises. Empty today
// (0 baseline rows) -- the loop below produces zero `it()`s, which is
// correct: there is nothing to ratchet until a mindmap plugin renders real
// geometry (D6/D7).
// ---------------------------------------------------------------------------

describe('svg-mindmap weighted-score baseline ratchet', () => {
  for (const f of baselineFixtures) {
    it(`mindmap/${f.slug}: weighted score never rises above its baseline (${String(f.weightedScore)})`, () => {
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

  // 0 -> 15 at mindmap-engine-port/close-b5 (2026-09-30): the plugin
  // registered (T5a) and the first measurement pinned 127 conformant
  // fixtures into ratchet.json; the 12 still-diverging rows and the 3 rows
  // whose ORACLE is a jar error page (femiba, fogari, susipa -- the port
  // renders them, so `measure()` is measurable and their scores are pinned
  // against the error page: a fall there would mean the port started to
  // error like the jar, which AC3 then records deliberately) stay here.
  it('every row is a measured baseline (no status "error" rows remain after close-b5)', () => {
    expect(baselineFixtures).toHaveLength(manifest.fixtures.length);
    expect(errorFixtures).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// AC2 -- the rise/fall branches must actually discriminate. In-memory only
// (fabricated baselines, never a diff-baseline.json edit).
// ---------------------------------------------------------------------------

describe('svg-mindmap weighted-score baseline ratchet — branch discrimination', () => {
  const sample: FixtureRef = { type: 'mindmap', slug: 'branch-probe' };

  it('a fabricated baseline below the live count fails, naming fixture + baseline + new count', () => {
    const { ok, message } = checkNoRise(sample, 3, 7);
    expect(ok).toBe(false);
    expect(message).toContain(sample.slug);
    expect(message).toContain('baseline=3');
    expect(message).toContain('now=7');
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

  // Until close-b5 this case fired against a REAL fixture (every mindmap
  // rendered the sentinel). The plugin now registers, so the sentinel path is
  // exercised on the marker text itself; a real render must NOT trip it.
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
// diffs". If a recorded error stops reproducing (a mindmap plugin lands),
// that status change is itself reportable and must fail loudly.
// ---------------------------------------------------------------------------

describe('svg-mindmap weighted-score baseline ratchet — recorded errors', () => {
  for (const f of errorFixtures) {
    it(`mindmap/${f.slug}: still errors as recorded`, () => {
      expect(f.reason, `${f.type}/${f.slug}: an "error" entry must carry a reason`).toBeTruthy();
      expect(f.diffCount, `${f.type}/${f.slug}: an "error" entry must carry NO numeric baseline`).toBeNull();
      expect(f.weightedScore, `${f.type}/${f.slug}: an "error" entry must carry NO numeric weightedScore`).toBeNull();
      const result = measure(f);
      if (!result.errored) {
        throw new Error(
          `${f.type}/${f.slug}: recorded as status "error" (${String(f.reason)}) but rendering/comparison ` +
            `SUCCEEDED this run with a real (non-sentinel) SVG, diffCount=${String(result.diffCount)}. An ` +
            `error-to-measurable transition is a real change (a mindmap plugin now renders SOMETHING) and ` +
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
// to ratchet.json -- pinning is orchestrator-only (D7).
// ---------------------------------------------------------------------------

describe('svg-mindmap weighted-score baseline ratchet — promotion is never automatic', () => {
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
