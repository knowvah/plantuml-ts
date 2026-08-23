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
 *   - **rise** (live weighted score > recorded baseline) -> FAIL, naming the
 *     fixture, its baseline, and its new score. Every rise is a regression;
 *     the gate has no bypass and must not acquire one.
 *
 * THE GATED QUANTITY IS `weightedScore`, NOT `diffCount` — amended 2026-08-23
 * (D5, `plans/sequence-root-chrome/decisions.md`). This block used to explain
 * when a mass RISE meant progress. It no longer can, because the quantity it
 * described was not monotone in wrongness: `compareNodes` short-circuits in
 * three places — node-type, tag and child-count mismatch — and charged
 * exactly ONE diff for each however large the subtree it skipped, so a change
 * that made a document MORE structurally aligned could RAISE its count. T3's
 * chrome fix did exactly that to 255 fixtures while making no body worse.
 * `compare.ts` now charges each short-circuit an upper bound on what
 * descending could have cost, and `weightedScore` sums those charges. It is
 * monotone in alignment, so a rise has no benign reading left.
 *
 * `diffCount` stays in `diff-baseline.json` as an INFORMATIONAL field, and a
 * risen `diffCount` beside a fallen `weightedScore` is the expected artefact
 * of that weighting, not a failure: a subtree that used to cost 1 as an
 * unexamined short-circuit now gets compared and reports its real diffs.
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
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { compareSvg, weightedScore } from './compare.js';
import { renderFixtureSequence } from './render-fixture-sequence.js';


interface BaselineFixture {
  readonly type: string;
  readonly slug: string;
  readonly status: 'baseline' | 'error';
  /** The GATED quantity (D5). Absent until T4 re-pins the manifest against
   * it; an entry without one fails loudly rather than falling back to
   * `diffCount`, which is a different unit. */
  readonly weightedScore?: number;
  /** Informational only, per D5 — never gated. */
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

/**
 * Per-fixture budget. Almost every case here needs none: the median golden is
 * 3,152 bytes and a typical fixture measures ~16 ms, so vitest's unconfigured
 * 5,000 ms default is a ~300x guard that usefully catches a hang.
 *
 * `sequence/zudize-61-vomi445` is not typical. Its golden is **8,256,409
 * bytes** -- 47x the second-largest fixture in the corpus (174,317) and 2,600x
 * the median, and the only one above 500 KB. It measures ~650 ms per call,
 * steady state, dominated by `compareSvg` over that golden
 * (`read~8 render~232 cmp~407`), against ~16 ms for the next-slowest real
 * fixture. That is 7.5x from the default rather than 300x, and unlike the
 * others it degrades super-linearly with concurrent worker count -- 682 ms at
 * 1 copy, 1,374 ms at 12, **3,711 ms at 22**, where CPU share alone predicts
 * 1.83x. Two full `npm test` suites put exactly 22 forks on 12 cores, and in
 * that condition it failed 3 of 8 processes. Full diagnosis, including what
 * was ruled out: `.agent-notes/ratchet-zudize-timeout.md`.
 *
 * Derivation of 30,000: base is the 3,711 ms measured at that 22-worker
 * condition. The real failing worker also runs the rest of the suite, so the
 * tail lies above the base rather than at it -- the margin is wide for that
 * reason, not because a smaller number went red. Matches the same reasoning
 * and value used for `tests/architecture/catalog.test.ts`. A hang still
 * surfaces in 30 s, well inside CI's 12-minute job cap.
 *
 * Keyed on golden SIZE, not on the slug: the 47x gap between this fixture and
 * the next makes the threshold unambiguous, a fixture would have to grow 5.7x
 * to newly qualify, and a future giant capture gets headroom automatically
 * instead of reproducing this bug. Keying on the name would rot silently the
 * first time the corpus is regenerated.
 */
const LARGE_GOLDEN_BYTES = 1_000_000;
const LARGE_GOLDEN_BUDGET_MS = 30_000;

/** `undefined` leaves vitest's default in place -- the 1,140 small fixtures
 * keep their tight guard; only an outlier golden buys headroom. */
function budgetFor(f: FixtureRef): number | undefined {
  return statSync(join(fixtureDir(f), 'in.svg')).size > LARGE_GOLDEN_BYTES
    ? LARGE_GOLDEN_BUDGET_MS
    : undefined;
}

type MeasureResult =
  | {
      readonly errored: false;
      /** The gated quantity (D5). */
      readonly weightedScore: number;
      /** Informational only — reported in messages, never gated. */
      readonly diffCount: number;
    }
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
 * function (not inlined in the `it()` body) so AC1 below can exercise rise
 * detection directly with a fabricated baseline, without ever touching
 * `diff-baseline.json` on disk. `baseline` is `undefined` for an entry that
 * carries no `weightedScore` pin yet — an unpinned entry FAILS rather than
 * falling back to `diffCount`, which measures a different quantity. */
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
        `fixture, and weightedScore is the gated quantity (D5). An entry pinned only ` +
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
      `Unlike the raw diff count this gate used to read, weightedScore has NO benign ` +
      `reading for a rise -- not even a mass one, and not on the 12-diff plateau. ` +
      `WHY: compareNodes short-circuits in THREE places (node-type, tag and ` +
      `child-count mismatch) and used to charge exactly 1 for each, however large the ` +
      `subtree it skipped -- so a tag SUBSTITUTION cost 1 while a tag MATCH cost one ` +
      `diff per differing attribute, and aligning a document could RAISE its count. ` +
      `compare.ts now charges each short-circuit an upper bound on what descending ` +
      `could have cost (one unit per node, one per attribute), and weightedScore sums ` +
      `those charges, so descending can never cost more than stopping. The score is ` +
      `therefore MONOTONE in alignment: it falls or holds when the document gets more ` +
      `structurally correct, and it rises only when the output genuinely got worse. ` +
      `Do not re-pin to silence this; find the mechanism first (D5, ` +
      `plans/sequence-root-chrome/decisions.md). WHAT IS FINE, and expected: a RISEN ` +
      `diffCount beside a FALLEN weightedScore. That is the artefact this weighting ` +
      `exists to explain -- a subtree that used to cost 1 unexamined now gets compared ` +
      `and reports its real per-attribute diffs, so the RECORD COUNT goes up while the ` +
      `unexplained share of the document goes down. diffCount stays in ` +
      `diff-baseline.json for exactly that reading and is never gated. After a ` +
      `deliberate change that LOWERS the score, re-pin in one file: this slug's ` +
      `weightedScore, diffCount, measuredAt and measuredAgainstCommit in ` +
      `oracle/goldens/svg-sequence/diff-baseline.json, from a fresh measurement and ` +
      `never by hand-editing to make it pass.`,
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
    return `[IMPROVED] ${f.type}/${f.slug}: weighted score fell from ${baseline} to ${live}.`;
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

describe('svg-sequence weighted-score baseline ratchet — corpus presence', () => {
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
// AC1 -- every baselined fixture's weighted score never rises (D5: the gated
// quantity is weightedScore, not the non-monotone diffCount).
// ---------------------------------------------------------------------------

describe('svg-sequence weighted-score baseline ratchet', () => {
  for (const f of baselineFixtures) {
    it(`sequence/${f.slug}: weighted score never rises above its baseline (${String(f.weightedScore ?? 'unpinned')})`, () => {
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
    }, budgetFor(f));
  }
});

// ---------------------------------------------------------------------------
// AC2 -- the rise / fall / zero branches must actually discriminate, and the
// rise message must name fixture + baseline + new count. In-memory only
// (fabricated baselines, never a diff-baseline.json edit).
// ---------------------------------------------------------------------------

describe('svg-sequence weighted-score baseline ratchet — branch discrimination', () => {
  const sample: FixtureRef = { type: 'sequence', slug: 'branch-probe' };

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
// AC3 -- error-status fixtures: an error must never silently read as "0
// diffs". If a recorded error stops reproducing, that status change is itself
// reportable and must fail loudly, not pass through unnoticed.
// ---------------------------------------------------------------------------

describe('svg-sequence weighted-score baseline ratchet — recorded errors', () => {
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

describe('svg-sequence weighted-score baseline ratchet — promotion is never automatic', () => {
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
