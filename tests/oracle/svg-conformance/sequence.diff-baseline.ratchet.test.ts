/**
 * Diff-count BASELINE ratchet for the committed sequence oracle corpus
 * (sequence-oracle-harness / T2, 2026-08-20).
 *
 * Sibling of `description.diff-baseline.ratchet.test.ts` -- read that file's
 * doc comment for the shape. This is the same gate over a different
 * population: the 1141 `data-diagram-type="SEQUENCE"` fixtures T0 captured
 * into `test-results/dot-cache/sequence/` (D3 amendment,
 * `plans/sequence-oracle-harness/decisions.md`). Zero of them are byte-exact
 * against the jar today -- the measured floor is 10 diffs -- so a byte-freeze
 * gate would gate nothing, and D2 specifies this monotone-improvement bar
 * over `oracle/goldens/svg-sequence/diff-baseline.json` instead:
 *
 *   - **rise** (live diff count > recorded baseline) -> FAIL, naming the
 *     fixture, its baseline, and its new count. A rise is USUALLY a
 *     regression, but see "the 12-diff plateau" below: it is NOT
 *     unconditionally one, and the failure message says so.
 *
 * THE 12-DIFF PLATEAU — why a mass rise can mean progress.
 * `compareNodes` short-circuits on structural mismatch: at `compare.ts:353`
 * an unequal child count pushes one `[childCount]` diff and RETURNS without
 * recursing into children. T4's census found **1010 of 1141** fixtures sit at
 * exactly 12 diffs sharing ONE identical path-set, and that set includes
 * `svg/g[1][childCount]`. So for **88.8%** of this corpus the diagram BODY is
 * never compared at all — those 12 measure how far the comparison gets before
 * the root chrome stops it, not body fidelity. The consequence for this gate:
 * when someone closes the root-chrome gap, ~1010 fixtures start comparing
 * their bodies for the first time and their counts rise sharply, all at once.
 * That is progress and must be re-pinned deliberately, not "fixed". An
 * isolated rise, or a rise on a fixture whose baseline is not 12, is still
 * the regression this gate is for. The gate FAILS on a rise either way — it
 * has no bypass, and must not acquire one; only the message distinguishes the
 * two readings so whoever hits it can tell them apart.
 *   - **fall** (live < baseline) -> PASS, logged as `[IMPROVED]`.
 *   - **reaches 0** -> PASS, logged as `[PROMOTION READY]` -- reports
 *     eligibility ONLY. Promotion is stop 13 of this mission and belongs to
 *     the rebuild: this test never writes `ratchet.json` and never copies a
 *     file. AC4 below pins that as an assertion rather than a claim.
 *   - **error** -> recorded as `status: "error"` with a `reason`, never as a
 *     numeric baseline. A fixture that stops erroring is itself a reportable
 *     change (AC3) and must never be silently read as "reached 0 diffs".
 *
 * D1: `compareSvg` (`compare.ts:385`) and, through it, `normalizeSvg`
 * (`normalize.ts:231`) are consumed UNCHANGED. There is no sequence-specific
 * comparator or normalizer -- writing one is stop 4.
 *
 * TWO DELIBERATE DIVERGENCES from the description sibling, both because the
 * populations differ in kind, not because the shape was improved on:
 *
 *   1. NO `describe.skipIf(!cacheAvailable)`. The sibling skips a missing
 *      cache because ITS oracle tree is gitignored and regenerable ("this
 *      ratchet is NOT [offline] ... skips gracefully (not a failure) when
 *      that tree ... is absent"). Sequence's cache is COMMITTED (D4:
 *      `.gitignore:25` re-includes `!test-results/dot-cache/`), so an absent
 *      tree means a broken checkout, not an un-generated one. Silently
 *      skipping 1141 gate assertions in that state is precisely the "gate
 *      that cannot detect its own stale input" failure D7 exists to prevent,
 *      so AC0 asserts the corpus is present and complete instead.
 *   2. NO per-fixture `type` variation. Every entry is `type: "sequence"`;
 *      the field is kept (not dropped) because it is what builds the cache
 *      path, and because T4 consumes this file's records.
 *
 * FIELD NAMES mirror the description manifest exactly (`status`,
 * `diffCount`, `reason`, `measuredAt`, `measuredAgainstCommit`) rather than
 * inventing sequence-local ones. `group` is omitted: it indexed
 * bodyenhanced-atom-seams' blast-radius groups and has no analogue here.
 *
 * Re-measure by hand:
 *   npx vitest run tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from './fixture-include-store.js';
import { compareSvg } from './compare.js';
import { renderFixtureSequence } from './render-fixture-sequence.js';


interface BaselineFixture {
  readonly type: string;
  readonly slug: string;
  readonly status: 'baseline' | 'error';
  readonly diffCount: number | null;
  readonly reason?: string;
  readonly measuredAt: string;
  readonly measuredAgainstCommit: string;
}

interface BaselineManifest {
  readonly fixtures: readonly BaselineFixture[];
}

const HERE = dirname(fileURLToPath(import.meta.url));
const GOLDENS_DIR = join(HERE, '../../../oracle/goldens/svg-sequence');
const MANIFEST_PATH = join(GOLDENS_DIR, 'diff-baseline.json');
const RATCHET_PATH = join(GOLDENS_DIR, 'ratchet.json');
const CACHE_ROOT = join(HERE, '../../../test-results/dot-cache');

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as BaselineManifest;

type FixtureRef = Pick<BaselineFixture, 'type' | 'slug'>;

function fixtureDir(f: FixtureRef): string {
  return join(CACHE_ROOT, f.type, f.slug);
}

function hasCachedFixture(f: FixtureRef): boolean {
  const dir = fixtureDir(f);
  return existsSync(join(dir, 'in.puml')) && existsSync(join(dir, 'in.svg'));
}

type MeasureResult =
  | { readonly errored: false; readonly diffCount: number }
  | { readonly errored: true; readonly message: string };

/** Renders a fixture through T1's sequence helper and compares it against the
 * cached jar oracle SVG with the shared comparator. Never throws --
 * render/compare failures are captured as `errored: true` so callers can
 * distinguish "measurable" from "erroring" without a try/catch of their own,
 * and so an error can never be silently coerced into a diff count. */
function measure(f: FixtureRef): MeasureResult {
  const dir = fixtureDir(f);
  const markup = readFileSync(join(dir, 'in.puml'), 'utf8');
  const golden = readFileSync(join(dir, 'in.svg'), 'utf8');
  try {
    const ours = renderFixtureSequence(markup, new DeterministicMeasurer(), {
      includeStore: fixtureIncludeStore(),
    });
    const { diffs } = compareSvg(ours, golden, 'deterministic');
    return { errored: false, diffCount: diffs.length };
  } catch (err) {
    return { errored: true, message: err instanceof Error ? err.message : String(err) };
  }
}

interface RiseCheckResult {
  readonly ok: boolean;
  readonly message: string;
}

/** Pure comparison: no rise above `baseline` is allowed. Extracted as a pure
 * function (not inlined in the `it()` body) so AC1 below can exercise rise
 * detection directly with a fabricated baseline, without ever touching
 * `diff-baseline.json` on disk. */
function checkNoRise(f: FixtureRef, baseline: number, live: number): RiseCheckResult {
  if (live <= baseline) {
    return {
      ok: true,
      message: `${f.type}/${f.slug}: diff count is ${live} (baseline ${baseline}) -- no regression.`,
    };
  }
  return {
    ok: false,
    message:
      `${f.type}/${f.slug}: diff count ROSE -- baseline=${baseline}, now=${live}. ` +
      `A rise is USUALLY a regression (this fixture's SVG got less faithful to the jar ` +
      `oracle) and that is what this gate is for. But read the shape of the failure before ` +
      `concluding that, because ONE case is the opposite. ` +
      `WHY: compareNodes short-circuits on structural mismatch -- at compare.ts:353 an ` +
      `unequal child count pushes a single \`[childCount]\` diff and RETURNS without ` +
      `recursing. T4's census found 1010 of 1141 fixtures sit at exactly 12 diffs sharing ` +
      `one identical path-set that includes \`svg/g[1][childCount]\`, so for 88.8% of this ` +
      `corpus the diagram BODY is never compared at all -- their 12 measures reaching the ` +
      `body and stopping, not body fidelity. When the root-chrome gap closes, those ~1010 ` +
      `fixtures begin comparing their bodies for the first time and their counts rise ` +
      `sharply and together. That signature -- a MASS rise concentrated on fixtures whose ` +
      `baseline is 12 -- is PROGRESS, not regression: re-measure and re-pin the baseline ` +
      `deliberately, recording why. An ISOLATED rise on one fixture, or a rise on a fixture ` +
      `whose baseline is not 12, is the regression this gate exists to catch -- do not ` +
      `paper over it. Either way the fix is the same file: update this slug's diffCount, ` +
      `measuredAt and measuredAgainstCommit in oracle/goldens/svg-sequence/` +
      `diff-baseline.json from a fresh measurement, never by hand-editing to make it pass.`,
  };
}

/** Pure progress classification, separated from `checkNoRise` so the
 * `[PROMOTION READY]` branch is exercisable (AC2) even though NO sequence
 * fixture reaches zero today -- a branch nobody has seen fire is not a gate.
 * Returns `undefined` when the count merely held steady. */
function progressLog(f: FixtureRef, baseline: number, live: number): string | undefined {
  if (live === 0) {
    return (
      `[PROMOTION READY] ${f.type}/${f.slug} reached ZERO-DIFF against the jar oracle. ` +
      `This is a REPORT of eligibility, not a promotion: promoting a sequence fixture into ` +
      `oracle/goldens/svg-sequence/ratchet.json is stop 13 of the sequence-oracle-harness ` +
      `mission and belongs to the rebuild that follows it. Nothing was written or copied.`
    );
  }
  if (live < baseline) {
    return `[IMPROVED] ${f.type}/${f.slug}: diff count fell from ${baseline} to ${live}.`;
  }
  return undefined;
}

const baselineFixtures = manifest.fixtures.filter((f) => f.status === 'baseline');
const errorFixtures = manifest.fixtures.filter((f) => f.status === 'error');

// ---------------------------------------------------------------------------
// AC0 -- the committed corpus is present and complete. See divergence (1) in
// the header: sequence's cache is committed, so absence is a broken checkout
// and must fail loudly rather than skip 1141 assertions into silence.
// ---------------------------------------------------------------------------

describe('svg-sequence diff-count baseline ratchet — corpus presence', () => {
  it('every manifest fixture has its committed in.puml + in.svg', () => {
    const missing = manifest.fixtures.filter((f) => !hasCachedFixture(f)).map((f) => `${f.type}/${f.slug}`);
    expect(
      missing,
      `test-results/dot-cache/sequence/ is COMMITTED (D4). Missing entries mean a broken or ` +
        `partial checkout, not a cache that needs regenerating -- restore the tree rather than ` +
        `pruning diff-baseline.json to match it. Missing: ${missing.slice(0, 10).join(', ')}`,
    ).toEqual([]);
    expect(manifest.fixtures.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// AC1 -- every baselined fixture's diff count never rises.
// ---------------------------------------------------------------------------

describe('svg-sequence diff-count baseline ratchet', () => {
  for (const f of baselineFixtures) {
    it(`sequence/${f.slug}: diff count never rises above its baseline (${String(f.diffCount)})`, () => {
      const result = measure(f);
      if (result.errored) {
        throw new Error(
          `${f.type}/${f.slug}: expected a measurable diff count (baseline ${String(f.diffCount)}) ` +
            `but rendering/comparison threw: ${result.message}. This fixture's status changed from ` +
            `"baseline" to erroring -- update diff-baseline.json deliberately (status: "error", with ` +
            `a reason); do not let this pass silently as if nothing changed.`,
        );
      }
      // Every "baseline" entry always carries a non-null diffCount by
      // construction (only "error" entries carry null); the `?? 0` fallback
      // is unreachable via this manifest and required only by the field type.
      /* v8 ignore next */
      const baseline = f.diffCount ?? 0;
      const live = result.diffCount;
      const { ok, message } = checkNoRise(f, baseline, live);
      expect(ok, message).toBe(true);

      const note = progressLog(f, baseline, live);
      if (note !== undefined) console.log(note);
    });
  }
});

// ---------------------------------------------------------------------------
// AC2 -- the rise / fall / zero branches must actually discriminate, and the
// rise message must name fixture + baseline + new count. In-memory only
// (fabricated baselines, never a diff-baseline.json edit).
// ---------------------------------------------------------------------------

describe('svg-sequence diff-count baseline ratchet — branch discrimination', () => {
  const sample: FixtureRef = { type: 'sequence', slug: 'branch-probe' };

  it('a fabricated baseline below the live count fails, naming fixture + baseline + new count', () => {
    const { ok, message } = checkNoRise(sample, 3, 7);
    expect(ok).toBe(false);
    expect(message).toContain(sample.slug);
    expect(message).toContain('baseline=3');
    expect(message).toContain('now=7');
  });

  it('a baseline at or above the live count does not fail', () => {
    expect(checkNoRise(sample, 7, 7).ok).toBe(true);
    expect(checkNoRise(sample, 9, 7).ok).toBe(true);
  });

  it('a fall below the baseline is reported as [IMPROVED]', () => {
    expect(progressLog(sample, 12, 5)).toContain('[IMPROVED]');
    expect(progressLog(sample, 12, 5)).toContain('fell from 12 to 5');
  });

  it('reaching zero is reported as [PROMOTION READY], not as an improvement', () => {
    const note = progressLog(sample, 12, 0);
    expect(note).toContain('[PROMOTION READY]');
    expect(note).not.toContain('[IMPROVED]');
  });

  it('a count that held steady is reported as neither', () => {
    expect(progressLog(sample, 12, 12)).toBeUndefined();
  });

  it('rise detection fires against a REAL fixture, not only fabricated numbers', () => {
    const real = baselineFixtures[0];
    expect(real, 'expected at least one baselined fixture').toBeDefined();
    const result = measure(real!);
    expect(result.errored).toBe(false);
    // Narrowed by the assertion above; TS cannot see through `expect(...).toBe(false)`.
    const live = (result as { errored: false; diffCount: number }).diffCount;
    expect(live).toBeGreaterThan(0);
    expect(checkNoRise(real!, live - 1, live).ok).toBe(false);
    expect(checkNoRise(real!, live, live).ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC3 -- error-status fixtures: an error must never silently read as "0
// diffs". If a recorded error stops reproducing, that status change is itself
// reportable and must fail loudly, not pass through unnoticed.
// ---------------------------------------------------------------------------

describe('svg-sequence diff-count baseline ratchet — recorded errors', () => {
  for (const f of errorFixtures) {
    it(`sequence/${f.slug}: still errors as recorded`, () => {
      expect(f.reason, `${f.type}/${f.slug}: an "error" entry must carry a reason`).toBeTruthy();
      expect(f.diffCount, `${f.type}/${f.slug}: an "error" entry must carry NO numeric baseline`).toBeNull();
      const result = measure(f);
      if (!result.errored) {
        throw new Error(
          `${f.type}/${f.slug}: recorded as status "error" (${String(f.reason)}) but rendering/` +
            `comparison SUCCEEDED this run with diffCount=${result.diffCount}. An error-to-measurable ` +
            `transition is a real change and must never be silently treated as "0 diffs" or skipped -- ` +
            `move this fixture to status "baseline" in diff-baseline.json with a freshly measured ` +
            `diffCount, measuredAt, and measuredAgainstCommit.`,
        );
      }
      expect(result.errored).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// AC4 -- promotion is a hard stop (stop 13). Evaluating a fixture at zero
// diffs must report eligibility and write NOTHING. Asserted, not claimed.
// ---------------------------------------------------------------------------

describe('svg-sequence diff-count baseline ratchet — promotion is never automatic', () => {
  it('classifying a zero-diff fixture leaves ratchet.json untouched', () => {
    const before = existsSync(RATCHET_PATH) ? readFileSync(RATCHET_PATH, 'utf8') : null;

    const note = progressLog({ type: 'sequence', slug: 'zero-probe' }, 40, 0);
    expect(note).toContain('[PROMOTION READY]');
    expect(note).toContain('Nothing was written or copied');

    const after = existsSync(RATCHET_PATH) ? readFileSync(RATCHET_PATH, 'utf8') : null;
    expect(after, 'reporting promotion eligibility must never create or mutate ratchet.json').toBe(before);
  });

  it('no fixture is recorded as already promoted', () => {
    const promoted = baselineFixtures.filter((f) => f.diffCount === 0);
    expect(promoted.map((f) => f.slug), 'a 0-diff entry in diff-baseline.json is a promotion candidate, not a promotion').toEqual([]);
  });
});
