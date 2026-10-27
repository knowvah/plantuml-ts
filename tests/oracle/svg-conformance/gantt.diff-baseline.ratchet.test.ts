/**
 * Diff-count BASELINE ratchet for the gantt oracle corpus
 * (gantt-engine-port / T0c, 2026-10-24).
 *
 * Copies the gate of `wbs.diff-baseline.ratchet.test.ts`: the weighted score
 * of a baselined fixture never rises; an `error` row never silently reads as
 * "0 diffs"; a conformant fixture lives in `ratchet.json`, never in this
 * manifest; running the suite never writes a pin.
 *
 * DORMANT (T0c): `oracle/goldens/svg-gantt/diff-baseline.json` and
 * `authored-baseline.json` are `{ "fixtures": [] }` and gantt still refuses.
 * Unlike wbs there is no "rows + pins = every cached slug" census yet: the
 * 265 cached gantt slugs are seeded by the orchestrator at the D7 turn-on,
 * which is also when that census assertion is added. Until then the shape
 * checks are: every row / pin names a cached slug, and rows and pins are
 * disjoint.
 *
 * `measure()` treats "renders the dispatcher's ERROR_SENTINEL"
 * (`src/core/dispatcher.ts:369`) as its own error condition, as wbs does.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import type { IncludeStore } from '../../../src/core/tim/IncludeStore.js';
import { compareSvg, weightedScore } from './compare.js';
import {
  authoredGanttIncludeStore,
  ganttRenderOptions,
  listAuthoredGanttSlugs,
  readAuthoredGanttFixture,
  renderFixtureGantt,
} from './render-fixture-gantt.js';

interface BaselineFixture {
  readonly type: string;
  readonly slug: string;
  readonly status: 'baseline' | 'error';
  readonly weightedScore: number | null;
  readonly diffCount: number | null;
  readonly reason?: string;
  readonly measuredAt: string;
  readonly measuredAgainstCommit: string;
}

interface AuthoredFixture extends BaselineFixture {
  readonly topic: string;
}

interface Manifest<T> {
  readonly fixtures: readonly T[];
}

const HERE = dirname(fileURLToPath(import.meta.url));
const GOLDENS_DIR = join(HERE, '../../../oracle/goldens/svg-gantt');
const CACHE_ROOT = join(HERE, '../../../test-results/dot-cache');
const GANTT_TYPE = 'gantt';
const RATCHET_PATH = join(GOLDENS_DIR, 'ratchet.json');

const readManifest = <T>(file: string): Manifest<T> =>
  JSON.parse(readFileSync(join(GOLDENS_DIR, file), 'utf8')) as Manifest<T>;

const manifest = readManifest<BaselineFixture>('diff-baseline.json');
const authoredManifest = readManifest<AuthoredFixture>('authored-baseline.json');
const ratchet = readManifest<{ slug: string }>('ratchet.json');

type FixtureRef = Pick<BaselineFixture, 'type' | 'slug'>;

/** The dispatcher's fixed placeholder text (`src/core/dispatcher.ts:369`). */
const ERROR_SENTINEL_MARKER = 'Error: unknown diagram type';

type MeasureResult =
  | { readonly errored: false; readonly weightedScore: number; readonly diffCount: number }
  | { readonly errored: true; readonly reason: string };

function measureMarkup(slug: string, markup: string, golden: string, includeStore?: IncludeStore): MeasureResult {
  try {
    const ours = renderFixtureGantt(markup, new DeterministicMeasurer(), ganttRenderOptions(slug, includeStore));
    if (ours.includes(ERROR_SENTINEL_MARKER)) {
      return { errored: true, reason: 'renders ERROR_SENTINEL (dispatcher.ts:361-375) -- no gantt plugin registered' };
    }
    const { diffs } = compareSvg(ours, golden, 'deterministic');
    return { errored: false, weightedScore: weightedScore(diffs), diffCount: diffs.length };
  } catch (err) {
    return { errored: true, reason: err instanceof Error ? err.message : String(err) };
  }
}

function measure(f: FixtureRef): MeasureResult {
  const dir = join(CACHE_ROOT, f.type, f.slug);
  return measureMarkup(f.slug, readFileSync(join(dir, 'in.puml'), 'utf8'), readFileSync(join(dir, 'in.svg'), 'utf8'));
}

function measureAuthored(slug: string): MeasureResult {
  const { markup, golden } = readAuthoredGanttFixture(slug);
  if (golden === undefined) return { errored: true, reason: `tests/fixtures/gantt/${slug}.svg is missing` };
  return measureMarkup(slug, markup, golden, authoredGanttIncludeStore());
}

interface RiseCheckResult {
  readonly ok: boolean;
  readonly message: string;
}

/** Pure comparison: no rise above `baseline` is allowed. */
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
const authoredBaseline = authoredManifest.fixtures.filter((f) => f.status === 'baseline');

describe('svg-gantt weighted-score baseline ratchet -- manifest shape', () => {
  it('every manifest row and ratchet pin names a cached gantt slug with in.puml + in.svg', () => {
    const slugs = [...manifest.fixtures.map((f) => f.slug), ...ratchet.fixtures.map((f) => f.slug)];
    const missing = slugs.filter(
      (s) =>
        !existsSync(join(CACHE_ROOT, GANTT_TYPE, s, 'in.puml')) ||
        !existsSync(join(CACHE_ROOT, GANTT_TYPE, s, 'in.svg')),
    );
    expect(missing).toEqual([]);
  });

  it('a slug is a diff-baseline row OR a ratchet pin, never both', () => {
    const pinned = new Set(ratchet.fixtures.map((f) => f.slug));
    expect(manifest.fixtures.filter((f) => pinned.has(f.slug)).map((f) => f.slug)).toEqual([]);
  });

  it('every row carries type "gantt"', () => {
    expect(manifest.fixtures.filter((f) => f.type !== GANTT_TYPE).map((f) => f.slug)).toEqual([]);
  });

  it('authored rows are exactly one per tests/fixtures/gantt/*.puml pinned so far, each with its .svg', () => {
    const onDisk = listAuthoredGanttSlugs();
    const rows = authoredManifest.fixtures.map((f) => f.slug).sort();
    // Dormant: fixtures T0b adds are pinned by the orchestrator at the batch close.
    expect(rows.filter((s) => !onDisk.includes(s))).toEqual([]);
    expect(rows.filter((s) => readAuthoredGanttFixture(s).golden === undefined)).toEqual([]);
  });
});

describe('svg-gantt weighted-score baseline ratchet', () => {
  for (const f of baselineFixtures) {
    it(`gantt/${f.slug}: weighted score never rises above its baseline (${String(f.weightedScore)})`, () => {
      const result = measure(f);
      if (result.errored)
        throw new Error(`${f.type}/${f.slug}: expected a measurable score but errored: ${result.reason}`);
      const { ok, message } = checkNoRise(f, f.weightedScore, result.weightedScore);
      expect(ok, message).toBe(true);
    });
  }

  for (const f of authoredBaseline) {
    it(`authored/${f.slug}: weighted score never rises above its baseline (${String(f.weightedScore)})`, () => {
      const result = measureAuthored(f.slug);
      if (result.errored) throw new Error(`authored/${f.slug}: errored: ${result.reason}`);
      const { ok, message } = checkNoRise(f, f.weightedScore, result.weightedScore);
      expect(ok, message).toBe(true);
    });
  }

  it('no row is recorded as already promoted (0 diffs belongs in ratchet.json)', () => {
    expect(baselineFixtures.filter((f) => f.diffCount === 0).map((f) => f.slug)).toEqual([]);
  });
});

describe('svg-gantt weighted-score baseline ratchet -- branch discrimination', () => {
  const sample: FixtureRef = { type: 'gantt', slug: 'branch-probe' };

  it('a baseline below the live count fails, naming fixture + baseline + new count', () => {
    const { ok, message } = checkNoRise(sample, 3, 7);
    expect(ok).toBe(false);
    expect(message).toContain('gantt/branch-probe');
    expect(message).toContain('baseline=3');
    expect(message).toContain('now=7');
  });

  it('an entry with no weightedScore fails rather than falling back', () => {
    const { ok, message } = checkNoRise(sample, null, 450);
    expect(ok).toBe(false);
    expect(message).toContain('no weightedScore');
    expect(message).toContain('450');
  });

  it('a baseline at or above the live count passes', () => {
    expect(checkNoRise(sample, 7, 7).ok).toBe(true);
    expect(checkNoRise(sample, 9, 7).ok).toBe(true);
  });

  it('a gantt source renders the ERROR_SENTINEL today, and measureMarkup reports it as errored', () => {
    const result = measureMarkup('probe', '@startgantt\n[A] lasts 2 days\n@endgantt\n', '<svg/>');
    expect(result).toEqual({
      errored: true,
      reason: 'renders ERROR_SENTINEL (dispatcher.ts:361-375) -- no gantt plugin registered',
    });
  });
});

describe('svg-gantt weighted-score baseline ratchet -- recorded errors', () => {
  for (const f of errorFixtures) {
    it(`gantt/${f.slug}: still errors as recorded`, () => {
      expect(f.reason, `${f.type}/${f.slug}: an "error" entry must carry a reason`).toBeTruthy();
      expect(f.diffCount).toBeNull();
      expect(f.weightedScore).toBeNull();
      expect(
        measure(f).errored,
        `${f.type}/${f.slug}: error-to-measurable is a real change; move it to "baseline"`,
      ).toBe(true);
    });
  }
});

describe('svg-gantt weighted-score baseline ratchet -- promotion is never automatic', () => {
  it('running this suite leaves ratchet.json untouched', () => {
    const before = readFileSync(RATCHET_PATH, 'utf8');
    for (const f of manifest.fixtures.slice(0, 5)) measure(f);
    expect(readFileSync(RATCHET_PATH, 'utf8')).toBe(before);
  });
});
