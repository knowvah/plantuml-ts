/**
 * Diff-count BASELINE ratchet for the 22 `bodyenhanced-atom-seams` blast-
 * radius candidates (T1b, 2026-07-29).
 *
 * Sibling of `description.golden.ratchet.test.ts`, but for a population that
 * is NOT byte-exact yet. T1 measured all 22 fixtures ADR-1's `BodyFactory`
 * rewire is expected to change and found **0 of 22** conformant, so the
 * original ADR-5 byte-freeze gate (see `plans/bodyenhanced-atom-seams/
 * decisions.md`, ADR-5) could not be built -- see that file's "ADR-5
 * AMENDMENT". This ratchet replaces the freeze with a monotone-improvement
 * bar over `oracle/goldens/svg-description/diff-baseline.json`:
 *
 *   - **rise** (live diff count > recorded baseline) -> FAIL, naming the
 *     fixture, its baseline, and its new count.
 *   - **fall** (live < baseline) -> PASS, logged as `[IMPROVED]`.
 *   - **reaches 0** -> PASS, logged as `[PROMOTION READY]` -- the fixture is
 *     now a genuine promotion candidate for `ratchet.json` per this
 *     directory's README "Add rule" (which also requires `dotEqual: true` in
 *     `parity.json`). Promotion is NEVER automatic: this test only reports
 *     eligibility, it does not write `ratchet.json` or copy any files.
 *   - **error** (`bootstrap-0`, `ruziru-69-xixo434`, `fepuvo-06-rugi981`) ->
 *     recorded as `status: "error"` with a `reason`, never as a numeric
 *     baseline. A fixture that stops erroring is itself a reportable change
 *     (see the second describe block below) -- it must never be silently
 *     read as "reached 0 diffs".
 *
 * IMPORTANT divergence from the sibling golden ratchet: that ratchet is
 * fully offline (committed `in.puml` + `golden.svg` pairs under
 * `oracle/goldens/svg-description/<type>/<slug>/`). This ratchet is NOT --
 * per T1b's write-set, no fixture data is copied out of the gitignored,
 * regenerable `test-results/dot-cache/` oracle cache, so this suite reads
 * `test-results/dot-cache/<type>/<slug>/{in.puml,in.svg}` directly at test
 * time and skips gracefully (not a failure) when that tree, or an individual
 * fixture within it, is absent. Regenerate via `scripts/oracle-corpus.ts`
 * (see `CLAUDE.md`'s "oracle" section) if it is missing locally.
 *
 * Re-run this exact 22-fixture check to re-measure by hand:
 *   npx vitest run tests/oracle/svg-conformance/description.diff-baseline.ratchet.test.ts
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from './compare.js';
import { renderFixture } from './render-fixture.js';

// The sprite-heavy `usecase/bootstrap-*` fixtures in this file render in about
// 1.6s each in isolation -- comfortably inside vitest's 5s default -- but they
// are the slowest cases in the suite, and under full-suite worker contention
// they stretch past it. Observed twice (2026-08-12 and 2026-08-13), both times
// this same pair, both times a TIMEOUT rather than a diff, on commits that
// could not have affected rendering (a docs-only change once). Raised here
// rather than in vitest.config.ts so the rest of the suite keeps the tight
// default and a genuinely hung test still fails quickly.
vi.setConfig({ testTimeout: 30_000 });

interface BaselineFixture {
  readonly type: string;
  readonly slug: string;
  readonly group: number;
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
const MANIFEST_PATH = join(HERE, '../../../oracle/goldens/svg-description/diff-baseline.json');
const CACHE_ROOT = join(HERE, '../../../test-results/dot-cache');

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as BaselineManifest;

function fixtureDir(f: Pick<BaselineFixture, 'type' | 'slug'>): string {
  return join(CACHE_ROOT, f.type, f.slug);
}

function hasCachedFixture(f: Pick<BaselineFixture, 'type' | 'slug'>): boolean {
  const dir = fixtureDir(f);
  return existsSync(join(dir, 'in.puml')) && existsSync(join(dir, 'in.svg'));
}

type MeasureResult = { readonly errored: false; readonly diffCount: number } | { readonly errored: true; readonly message: string };

/** Renders a fixture through the same low-level pipeline + measurer as the
 * sibling golden ratchet and compares it against the cached jar oracle SVG.
 * Never throws -- render/compare failures are captured as `errored: true` so
 * callers can distinguish "measurable" from "erroring" without a try/catch
 * of their own. */
function measure(f: Pick<BaselineFixture, 'type' | 'slug'>): MeasureResult {
  const dir = fixtureDir(f);
  const markup = readFileSync(join(dir, 'in.puml'), 'utf8');
  const golden = readFileSync(join(dir, 'in.svg'), 'utf8');
  try {
    const ours = renderFixture(markup, new DeterministicMeasurer());
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
 * function (not inlined in the `it()` body) so the forced-rise describe
 * block below can exercise it directly with a fabricated baseline, without
 * ever touching `diff-baseline.json` on disk -- mirrors the sibling golden
 * ratchet's AC2 in-memory-mutation discipline. */
function checkNoRise(f: Pick<BaselineFixture, 'type' | 'slug'>, baseline: number, live: number): RiseCheckResult {
  if (live <= baseline) {
    return {
      ok: true,
      message: `${f.type}/${f.slug}: diff count is ${live} (baseline ${baseline}) -- no regression.`,
    };
  }
  return {
    ok: false,
    message:
      `${f.type}/${f.slug}: diff count REGRESSED -- baseline=${baseline}, now=${live}. ` +
      `A rise means this fixture's SVG emission got LESS faithful to the jar oracle. ` +
      `If this is an intended, verified change (e.g. a widened dependency shifted this ` +
      `fixture's numbers along with others), re-measure and update this slug's diffCount, ` +
      `measuredAt, and measuredAgainstCommit in oracle/goldens/svg-description/` +
      `diff-baseline.json deliberately -- do not paper over a real regression.`,
  };
}

const cacheAvailable = existsSync(CACHE_ROOT);
const baselineFixtures = manifest.fixtures.filter((f) => f.status === 'baseline');
const errorFixtures = manifest.fixtures.filter((f) => f.status === 'error');

// ---------------------------------------------------------------------------
// AC1 -- every baselined fixture's diff count never rises.
// ---------------------------------------------------------------------------

describe.skipIf(!cacheAvailable)('svg-description diff-count baseline ratchet (T1b)', () => {
  for (const f of baselineFixtures) {
    it.skipIf(!hasCachedFixture(f))(
      `${f.type}/${f.slug}: diff count never rises above its baseline (${String(f.diffCount)})`,
      () => {
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
        // construction (only "error" entries carry null) -- the `?? 0`
        // fallback is unreachable via this manifest, required only by the
        // `number | null` field type.
        /* v8 ignore next */
        const baseline = f.diffCount ?? 0;
        const live = result.diffCount;
        const { ok, message } = checkNoRise(f, baseline, live);
        expect(ok, message).toBe(true);

        if (live === 0) {
          console.log(
            `[PROMOTION READY] ${f.type}/${f.slug} reached ZERO-DIFF against the jar oracle. ` +
              `Per oracle/goldens/svg-description/README.md's "Add rule": confirm dotEqual=true in ` +
              `tests/oracle/svg-conformance/parity.json, then copy test-results/dot-cache/${f.type}/` +
              `${f.slug}/{in.puml,in.svg} into oracle/goldens/svg-description/${f.type}/${f.slug}/ ` +
              `(renaming in.svg -> golden.svg) and append the slug to ratchet.json. NOT automatic.`,
          );
        } else if (live < baseline) {
          console.log(`[IMPROVED] ${f.type}/${f.slug}: diff count fell from ${baseline} to ${live}.`);
        }
      },
    );
  }
});

if (baselineFixtures.length === 0) {
  it('has no pinned diff-count baselines yet (skip gracefully, not a failure)', () => {
    expect(baselineFixtures).toHaveLength(0);
  });
}

// ---------------------------------------------------------------------------
// AC2 -- forced-rise detection: the rise check must actually discriminate,
// and its failure message must name the fixture + baseline + new count.
// In-memory only (a fabricated baseline, never a diff-baseline.json edit).
// ---------------------------------------------------------------------------

describe.skipIf(!cacheAvailable)('svg-description diff-count baseline ratchet — forced-rise detection', () => {
  it('a fabricated baseline below the live count fails, naming fixture + baseline + new count', () => {
    const sample = baselineFixtures.find((f) => hasCachedFixture(f));
    expect(sample, 'expected at least one measurable baseline fixture to exercise rise detection').toBeDefined();
    const f = sample!;

    const liveResult = measure(f);
    expect(liveResult.errored, `${f.type}/${f.slug}: expected a measurable diff count for this check`).toBe(false);
    // Narrowed by the assertion above; TS cannot see through `expect(...).toBe(false)`.
    const live = (liveResult as { errored: false; diffCount: number }).diffCount;

    // Force a rise: a baseline of 0 is guaranteed lower than any of the 22
    // candidates' real measured counts today (none reach zero-diff yet --
    // see .agent-notes/T1-svg-goldens.md and T1b's own manifest).
    const forcedBaseline = 0;
    const { ok, message } = checkNoRise(f, forcedBaseline, live);

    expect(ok).toBe(false);
    expect(message).toContain(f.slug);
    expect(message).toContain(`baseline=${forcedBaseline}`);
    expect(message).toContain(`now=${live}`);
  });

  it('a baseline at or above the live count does not fail', () => {
    const sample = baselineFixtures.find((f) => hasCachedFixture(f));
    expect(sample, 'expected at least one measurable baseline fixture').toBeDefined();
    const f = sample!;
    const liveResult = measure(f);
    expect(liveResult.errored).toBe(false);
    const live = (liveResult as { errored: false; diffCount: number }).diffCount;

    const { ok } = checkNoRise(f, live, live);
    expect(ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC3 -- error-status fixtures: an error must never silently read as "0
// diffs". If a recorded error stops reproducing, that status change is
// itself reportable and must fail loudly, not pass through unnoticed.
// ---------------------------------------------------------------------------

describe.skipIf(!cacheAvailable)('svg-description diff-count baseline ratchet — recorded errors', () => {
  for (const f of errorFixtures) {
    it.skipIf(!hasCachedFixture(f))(`${f.type}/${f.slug}: still errors as recorded`, () => {
      expect(f.reason, `${f.type}/${f.slug}: an "error" entry must carry a reason`).toBeTruthy();
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
