/**
 * Diff-count BASELINE ratchet for the committed activity oracle corpus
 * (activity-oracle-harness / T2, 2026-09-02).
 *
 * Sibling of `sequence.diff-baseline.ratchet.test.ts` -- read that file's
 * doc comment for the shape this mirrors. This is the same gate over a
 * different population: the 373 `plugin.type === 'activity'` fixtures T0
 * captured into `test-results/dot-cache/activity/` (D3,
 * `plans/activity-oracle-harness/decisions.md`).
 *
 * THE GATED QUANTITY IS `weightedScore`, NOT `diffCount` (D2, inherited from
 * `plans/sequence-root-chrome/decisions.md` D5). `compareNodes` short-
 * circuits on node-type, tag and child-count mismatch, charging exactly 1
 * for each however large the subtree it skipped, so `diffCount` is NOT
 * monotone in wrongness. `weightedScore` charges each short-circuit an
 * upper bound on what descending could have cost, so it IS monotone in
 * alignment -- a rise has no benign reading. `diffCount` stays in
 * `diff-baseline.json` as an INFORMATIONAL field: a RISEN `diffCount`
 * beside a FALLEN `weightedScore` after T5's chrome fix is the EXPECTED
 * artefact of that weighting (D2), not a failure.
 *
 *   - **rise** (live weightedScore > recorded baseline) -> FAIL, naming the
 *     fixture, its baseline, and its new score. No bypass; the gate must
 *     never acquire one.
 *   - **fall** (live < baseline) -> PASS, logged as `[IMPROVED]`.
 *   - **reaches 0** -> PASS, logged as `[PROMOTION READY]` -- reports
 *     eligibility ONLY. This test never writes `ratchet.json` and never
 *     copies a file; AC4 below pins that as an assertion, not a claim.
 *   - **error** (our own parser refuses the source) -> `status: "error"`
 *     with a `reason`, never a numeric baseline (D8).
 *   - **jar-error** (the GOLDEN is the jar's own graphical error page) ->
 *     `status: "jar-error"` with NO `weightedScore` and no numeric
 *     `diffCount` (D12, added mid-mission -- not in the original T2 spec).
 *     The jar failing is no evidence about us, mirroring the exact
 *     precedent `routing-conformance.test.ts` and `refusal-coverage.test.ts`
 *     already set for this same 23-fixture set, detected from the golden's
 *     own content via the same needle those two gates use
 *     (`PSystemError.java:148-155` / `ReportLog.java:103-108`), never from a
 *     slug list. A fixture whose OWN render also errors AND whose golden is
 *     a jar-error page is recorded as `jar-error`, not `error` -- D12: "the
 *     jar's failure makes our own outcome unevidential either way."
 *
 * TWO DELIBERATE DIVERGENCES from the sequence sibling:
 *
 *   1. A THIRD STATUS, `jar-error` (D12). Sequence's population has no jar
 *      error pages in its baselined set worth carving out this way; the
 *      activity corpus measured 23 of them (D12). `BaselineFixture.status`
 *      is `'baseline' | 'error' | 'jar-error'` here, not the two-way union
 *      the sequence file declares.
 *   2. NO per-golden-size timeout override. Sequence's `budgetFor` exists
 *      only because `zudize-61-vomi445`'s golden is 8.26 MB and measures
 *      ~650 ms/call under load (see that file's doc comment). Activity's
 *      largest golden is 38,735 bytes (`jupoxe-15-sugo110`) -- 213x smaller
 *      -- and every fixture renders well inside vitest's default 5,000 ms
 *      budget, so inventing a size-keyed override here with nothing to
 *      trigger it would be exactly the speculative harness abstraction
 *      CLAUDE.md's code-principles rule forbids ("no config knobs with one
 *      caller"). If a future capture grows a fixture past this file's
 *      current sizes, add the mechanism then.
 *
 * NO `describe.skipIf(!cacheAvailable)` (D4). `test-results/dot-cache/` is
 * committed (`.gitignore:25` re-includes it), so an absent tree means a
 * broken checkout, not an un-generated one -- AC0 asserts corpus presence
 * and completeness instead, exactly as the sequence sibling does.
 *
 * NO `parity-activity.json`, no AC3-style DOT-eligibility check (D9):
 * upstream `activitydiagram3` never uses dot (verified: zero `svek-*.dot`
 * across 28 jar-rendered activity fixtures), so there is no DOT oracle to
 * gate promotion on. Sequence, not class/state/object, is the template.
 *
 * FIELD NAMES mirror the sequence manifest (`type`, `slug`, `status`,
 * `weightedScore`, `diffCount`, `reason`, `measuredAt`,
 * `measuredAgainstCommit`), plus the `jar-error` status value D12 adds.
 *
 * Re-measure by hand:
 *   npx vitest run tests/oracle/svg-conformance/activity.diff-baseline.ratchet.test.ts
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { compareSvg, weightedScore } from './compare.js';
import { renderFixtureActivity } from './render-fixture-activity.js';

interface BaselineFixture {
  readonly type: string;
  readonly slug: string;
  readonly status: 'baseline' | 'error' | 'jar-error';
  /** The GATED quantity (D2). Present only on `status: "baseline"` entries;
   * an entry without one fails loudly rather than falling back to
   * `diffCount`, which is a different unit. */
  readonly weightedScore?: number;
  /** Informational only, per D2 -- never gated. `null` for `error` and
   * `jar-error` entries (D8, D12): neither carries a meaningful count. */
  readonly diffCount: number | null;
  readonly reason?: string;
  readonly measuredAt: string;
  readonly measuredAgainstCommit: string;
}

interface BaselineManifest {
  readonly $comment?: string;
  readonly fixtures: readonly BaselineFixture[];
}

const HERE = dirname(fileURLToPath(import.meta.url));
const GOLDENS_DIR = join(HERE, '../../../oracle/goldens/svg-activity');
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
  | {
      readonly errored: false;
      /** The gated quantity (D2). */
      readonly weightedScore: number;
      /** Informational only -- reported in messages, never gated. */
      readonly diffCount: number;
    }
  | { readonly errored: true; readonly message: string };

/** Renders a fixture through T1's activity helper and compares it against
 * the cached jar oracle SVG with the shared comparator. Never throws --
 * render/compare failures are captured as `errored: true` so callers can
 * distinguish "measurable" from "erroring" without a try/catch of their
 * own, and so an error can never be silently coerced into a diff count. */
function measure(f: FixtureRef): MeasureResult {
  const dir = fixtureDir(f);
  const markup = readFileSync(join(dir, 'in.puml'), 'utf8');
  const golden = readFileSync(join(dir, 'in.svg'), 'utf8');
  try {
    const ours = renderFixtureActivity(markup, new DeterministicMeasurer(), {
      includeStore: fixtureIncludeStore(),
    });
    const { diffs } = compareSvg(ours, golden, 'deterministic');
    return {
      errored: false,
      weightedScore: weightedScore(diffs),
      diffCount: diffs.length,
    };
  } catch (err) {
    return { errored: true, message: err instanceof Error ? err.message : String(err) };
  }
}

interface RiseCheckResult {
  readonly ok: boolean;
  readonly message: string;
}

/** Pure comparison: no rise above `baseline` is allowed. Extracted as a pure
 * function (not inlined in the `it()` body) so AC1's branch-discrimination
 * block can exercise rise detection directly with a fabricated baseline,
 * without ever touching `diff-baseline.json` on disk. `baseline` is
 * `undefined` for an entry that carries no `weightedScore` pin -- an
 * unpinned entry FAILS rather than falling back to `diffCount`, which
 * measures a different quantity. */
function checkNoRise(
  f: FixtureRef,
  baseline: number | undefined,
  live: number,
): RiseCheckResult {
  if (baseline === undefined) {
    return {
      ok: false,
      message:
        `${f.type}/${f.slug}: diff-baseline.json carries no weightedScore for this ` +
        `fixture, and weightedScore is the gated quantity (D2). An entry pinned only ` +
        `by diffCount pins a number that is NOT monotone in wrongness, and it cannot ` +
        `be compared against a live weighted score without comparing two different ` +
        `units. Re-pin this entry from a fresh measurement; never fall back to ` +
        `diffCount to make the gate evaluate. Live weighted score is ${live}.`,
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
      `This is a REGRESSION: this fixture's SVG got less faithful to the jar oracle. ` +
      `weightedScore has NO benign reading for a rise -- not even a mass one, and not ` +
      `on the 12-diff plateau. compareNodes short-circuits in THREE places (node-type, ` +
      `tag and child-count mismatch) and used to charge exactly 1 for each, however ` +
      `large the subtree it skipped -- so a tag SUBSTITUTION cost 1 while a tag MATCH ` +
      `cost one diff per differing attribute, and aligning a document could RAISE its ` +
      `count. compare.ts now charges each short-circuit an upper bound on what ` +
      `descending could have cost (one unit per node, one per attribute), and ` +
      `weightedScore sums those charges, so descending can never cost more than ` +
      `stopping. The score is therefore MONOTONE in alignment: it falls or holds when ` +
      `the document gets more structurally correct, and it rises only when the output ` +
      `genuinely got worse. Do not re-pin to silence this; find the mechanism first ` +
      `(D2, plans/activity-oracle-harness/decisions.md). WHAT IS FINE, and expected ` +
      `after T5's chrome fix: a RISEN diffCount beside a FALLEN weightedScore -- a ` +
      `subtree that used to cost 1 unexamined now gets compared and reports its real ` +
      `per-attribute diffs, so the RECORD COUNT goes up while the unexplained share of ` +
      `the document goes down. diffCount stays in diff-baseline.json for exactly that ` +
      `reading and is never gated. After a deliberate change that LOWERS the score, ` +
      `re-pin in one file: this slug's weightedScore, diffCount, measuredAt and ` +
      `measuredAgainstCommit in oracle/goldens/svg-activity/diff-baseline.json, from a ` +
      `fresh measurement and never by hand-editing to make it pass.`,
  };
}

/** Pure progress classification, separated from `checkNoRise` so the
 * `[PROMOTION READY]` branch is exercisable (AC2) even though NO activity
 * fixture reaches zero today -- a branch nobody has seen fire is not a
 * gate. Returns `undefined` when the count merely held steady. */
function progressLog(f: FixtureRef, baseline: number, live: number): string | undefined {
  if (live === 0) {
    return (
      `[PROMOTION READY] ${f.type}/${f.slug} reached ZERO-DIFF against the jar oracle. ` +
      `This is a REPORT of eligibility, not a promotion: promoting an activity fixture ` +
      `into oracle/goldens/svg-activity/ratchet.json is a rebuild-scale task that ` +
      `follows this mission, mirroring sequence's own stop 13 (D1). Nothing was ` +
      `written or copied.`
    );
  }
  if (live < baseline) {
    return `[IMPROVED] ${f.type}/${f.slug}: weighted score fell from ${baseline} to ${live}.`;
  }
  return undefined;
}

const baselineFixtures = manifest.fixtures.filter((f) => f.status === 'baseline');
const errorFixtures = manifest.fixtures.filter((f) => f.status === 'error');
const jarErrorFixtures = manifest.fixtures.filter((f) => f.status === 'jar-error');

// ---------------------------------------------------------------------------
// AC0 -- the committed corpus is present and complete. Absence means a
// broken checkout (D4) and must fail loudly rather than skip 373 assertions
// into silence.
// ---------------------------------------------------------------------------

describe('svg-activity weighted-score baseline ratchet — corpus presence', () => {
  it('every manifest fixture has its committed in.puml + in.svg', () => {
    const missing = manifest.fixtures.filter((f) => !hasCachedFixture(f)).map((f) => `${f.type}/${f.slug}`);
    expect(
      missing,
      `test-results/dot-cache/activity/ is COMMITTED (D4). Missing entries mean a broken ` +
        `or partial checkout, not a cache that needs regenerating -- restore the tree rather ` +
        `than pruning diff-baseline.json to match it. Missing: ${missing.slice(0, 10).join(', ')}`,
    ).toEqual([]);
    expect(manifest.fixtures.length).toBe(373);
  });
});

// ---------------------------------------------------------------------------
// AC1 -- every baselined fixture's weighted score never rises (D2: the
// gated quantity is weightedScore, not the non-monotone diffCount).
// ---------------------------------------------------------------------------

describe('svg-activity weighted-score baseline ratchet', () => {
  for (const f of baselineFixtures) {
    it(`activity/${f.slug}: weighted score never rises above its baseline (${String(f.weightedScore ?? 'unpinned')})`, () => {
      const result = measure(f);
      if (result.errored) {
        throw new Error(
          `${f.type}/${f.slug}: expected a measurable score (baseline ${String(f.weightedScore ?? 'unpinned')}) ` +
            `but rendering/comparison threw: ${result.message}. This fixture's status changed from ` +
            `"baseline" to erroring -- update diff-baseline.json deliberately (status: "error", with ` +
            `a reason); do not let this pass silently as if nothing changed.`,
        );
      }
      const baseline = f.weightedScore;
      const live = result.weightedScore;
      const { ok, message } = checkNoRise(f, baseline, live);
      expect(ok, message).toBe(true);

      // `checkNoRise` fails an unpinned entry outright, so reaching this line
      // guarantees `baseline` is a number; the `?? 0` is required only
      // because TS cannot narrow through `expect`.
      /* v8 ignore next */
      const note = progressLog(f, baseline ?? 0, live);
      if (note !== undefined) console.log(note);
    });
  }
});

// ---------------------------------------------------------------------------
// AC2 -- the rise / fall / zero branches must actually discriminate, and the
// rise message must name fixture + baseline + new count. In-memory only
// (fabricated baselines, never a diff-baseline.json edit).
// ---------------------------------------------------------------------------

describe('svg-activity weighted-score baseline ratchet — branch discrimination', () => {
  const sample: FixtureRef = { type: 'activity', slug: 'branch-probe' };

  it('a fabricated baseline below the live count fails, naming fixture + baseline + new count', () => {
    const { ok, message } = checkNoRise(sample, 3, 7);
    expect(ok).toBe(false);
    expect(message).toContain(sample.slug);
    expect(message).toContain('baseline=3');
    expect(message).toContain('now=7');
  });

  it('an entry with no weightedScore pin fails rather than falling back', () => {
    const { ok, message } = checkNoRise(sample, undefined, 450);
    expect(ok).toBe(false);
    expect(message).toContain('no weightedScore');
    expect(message).toContain('450');
  });

  it('a baseline at or above the live count does not fail', () => {
    expect(checkNoRise(sample, 7, 7).ok).toBe(true);
    expect(checkNoRise(sample, 9, 7).ok).toBe(true);
  });

  it('a fall below the baseline is reported as [IMPROVED]', () => {
    expect(progressLog(sample, 12, 5)).toContain('[IMPROVED]');
    expect(progressLog(sample, 12, 5)).toContain('fell from 12 to 5');
    expect(progressLog(sample, 12, 5)).toContain('weighted score');
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
    const live = (result as { errored: false; weightedScore: number }).weightedScore;
    expect(live).toBeGreaterThan(0);
    expect(checkNoRise(real!, live - 1, live).ok).toBe(false);
    expect(checkNoRise(real!, live, live).ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC3 -- error-status fixtures (our own parser refuses the source): an error
// must never silently read as "0 diffs". If a recorded error stops
// reproducing, that status change is itself reportable and must fail loudly.
// ---------------------------------------------------------------------------

describe('svg-activity weighted-score baseline ratchet — recorded parser-gap errors', () => {
  for (const f of errorFixtures) {
    it(`activity/${f.slug}: still errors as recorded`, () => {
      expect(f.reason, `${f.type}/${f.slug}: an "error" entry must carry a reason`).toBeTruthy();
      expect(f.diffCount, `${f.type}/${f.slug}: an "error" entry must carry NO numeric baseline`).toBeNull();
      expect(f.weightedScore, `${f.type}/${f.slug}: an "error" entry must carry NO weightedScore`).toBeUndefined();
      const result = measure(f);
      if (!result.errored) {
        throw new Error(
          `${f.type}/${f.slug}: recorded as status "error" (${String(f.reason)}) but rendering/` +
            `comparison SUCCEEDED this run with diffCount=${result.diffCount}. An error-to-measurable ` +
            `transition is a real change and must never be silently treated as "0 diffs" or skipped -- ` +
            `move this fixture to status "baseline" in diff-baseline.json with a freshly measured ` +
            `weightedScore, diffCount, measuredAt, and measuredAgainstCommit.`,
        );
      }
      expect(result.errored).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// AC3b -- jar-error fixtures (D12, added mid-mission): the GOLDEN is the
// jar's own graphical error page. Detected from the golden's own content on
// every run, never trusted as a static classification -- if the jar starts
// rendering a real diagram for one of these, that is itself reportable.
// ---------------------------------------------------------------------------

const JAR_ERROR_PAGE_RE = />(?:PlantUML version [^<]*\[[^<]*\]|An error has occurred[^<]*)<\/text>/;

describe('svg-activity weighted-score baseline ratchet — recorded jar-error goldens', () => {
  for (const f of jarErrorFixtures) {
    it(`activity/${f.slug}: golden is still a jar error page`, () => {
      expect(f.reason, `${f.type}/${f.slug}: a "jar-error" entry must carry a reason`).toBeTruthy();
      expect(f.diffCount, `${f.type}/${f.slug}: a "jar-error" entry must carry NO numeric baseline`).toBeNull();
      expect(f.weightedScore, `${f.type}/${f.slug}: a "jar-error" entry must carry NO weightedScore`).toBeUndefined();
      const golden = readFileSync(join(fixtureDir(f), 'in.svg'), 'utf8');
      expect(
        JAR_ERROR_PAGE_RE.test(golden),
        `${f.type}/${f.slug}: recorded as status "jar-error" but the committed golden no longer ` +
          `matches the jar-error-page needle (PSystemError.java:148-155 / ReportLog.java:103-108). ` +
          `The jar never exported a real diagram for this slug before; if it now does, re-classify ` +
          `this entry with a fresh measurement rather than leaving it "jar-error" -- the jar's own ` +
          `output changed, which is itself a reportable event.`,
      ).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// AC4 -- promotion is never automatic. Evaluating a fixture at zero diffs
// must report eligibility and write NOTHING. Asserted, not claimed.
// ---------------------------------------------------------------------------

describe('svg-activity weighted-score baseline ratchet — promotion is never automatic', () => {
  it('classifying a zero-diff fixture leaves ratchet.json untouched', () => {
    const before = existsSync(RATCHET_PATH) ? readFileSync(RATCHET_PATH, 'utf8') : null;

    const note = progressLog({ type: 'activity', slug: 'zero-probe' }, 40, 0);
    expect(note).toContain('[PROMOTION READY]');
    expect(note).toContain('Nothing was written or copied');

    const after = existsSync(RATCHET_PATH) ? readFileSync(RATCHET_PATH, 'utf8') : null;
    expect(after, 'reporting promotion eligibility must never create or mutate ratchet.json').toBe(before);
  });

  it('no fixture is recorded as already promoted', () => {
    const promoted = baselineFixtures.filter((f) => f.diffCount === 0);
    expect(promoted.map((f) => f.slug), 'a 0-diff entry in diff-baseline.json is a promotion candidate, not a promotion').toEqual([]);
  });

  it('ratchet.json ships empty -- the promotion path exists but starts empty', () => {
    const ratchet = JSON.parse(readFileSync(RATCHET_PATH, 'utf8')) as { fixtures: readonly unknown[] };
    expect(ratchet.fixtures).toEqual([]);
  });
});
