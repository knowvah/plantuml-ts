/**
 * Unit tests for `pin-goldens.mts` (T0b). Run with the mission-local vitest
 * config — see `README.md` in this directory.
 *
 * Every fixture is SYNTHETIC, rendered through the real `renderFixtureActivity`
 * seam against a temp root (`mkdtempSync`) — never the committed corpus
 * (boundary: never pin a real slug from this task). The "zero-diff" case
 * renders a tiny `.puml` once and uses that EXACT output as both "ours" and
 * the cached "golden" `in.svg`, guaranteeing `compareSvg(..., 'deterministic')
 * .pass === true` deterministically; the "non-zero-diff" case pairs the same
 * render against an unrelated `<svg/>` golden, guaranteeing a diff.
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../../tests/helpers/fixture-include-store.js';
import { renderFixtureActivity } from '../../../tests/oracle/svg-conformance/render-fixture-activity.js';
import { pinGoldens, findBaselineRow, renderIsZeroDiff } from './pin-goldens.mts';

const RATCHET = 'oracle/goldens/svg-activity/ratchet.json';
const DIFF_BASELINE = 'oracle/goldens/svg-activity/diff-baseline.json';
const ROUTING = 'oracle/goldens/svg-conformance/routing-baseline.json';
const REFUSAL = 'oracle/goldens/svg-conformance/refusal-baseline.json';
const MARKUP = '@startuml\n:Step one;\n:Step two;\n@enduml\n';

function renderMarkup(): string {
  return renderFixtureActivity(MARKUP, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
}

let root: string;
const put = (rel: string, body: string): void => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), body);
};
const json = (rel: string): any => JSON.parse(readFileSync(join(root, rel), 'utf8'));
const baselineRow = (slug: string, status = 'baseline') => ({
  type: 'activity',
  slug,
  status,
  weightedScore: 42,
  diffCount: 12,
  measuredAt: '2026-09-29',
  measuredAgainstCommit: 'abcd1234',
});

/** Seeds both corpus baselines with one `dot-cache`/`activity` twin row per
 *  slug (status overridable to exercise the twin guard). */
function seedCorpus(slugs: readonly string[], routingStatus = 'agree'): void {
  const row = (slug: string, status: string, extra: object) => ({
    tree: 'dot-cache', type: 'activity', slug, ...extra, status, measuredAt: '2026-09-02', measuredAgainstCommit: '0cf15e23',
  });
  put(ROUTING, JSON.stringify({ $comment: 'r.', fixtures: slugs.map((s) => row(s, routingStatus, { jarType: 'ACTIVITY', ourType: 'ACTIVITY' })) }));
  put(REFUSAL, JSON.stringify({ $comment: 'f.', fixtures: slugs.map((s) => row(s, 'ok', { jarRendered: true, weErrored: false, engine: 'none' })) }));
}

/** Seeds a slug whose cached render is zero-diff against its own cached
 *  golden — the pinnable case. */
function seedZeroDiff(slug: string, status = 'baseline'): void {
  const svg = renderMarkup();
  put(RATCHET, JSON.stringify({ fixtures: [{ slug: 'zzz-first', addedAt: '2026-07-18', source: 'dot-cache' }] }));
  put(DIFF_BASELINE, JSON.stringify({ fixtures: [baselineRow(slug, status)] }));
  put(`test-results/dot-cache/activity/${slug}/in.svg`, svg);
  put(`test-results/dot-cache/activity/${slug}/in.puml`, MARKUP);
  seedCorpus([slug]);
}

/** Seeds a slug whose cached golden deliberately does NOT match the live
 *  render — the refusal case. */
function seedNonZeroDiff(slug: string): void {
  put(RATCHET, JSON.stringify({ fixtures: [] }));
  put(DIFF_BASELINE, JSON.stringify({ fixtures: [baselineRow(slug)] }));
  put(`test-results/dot-cache/activity/${slug}/in.svg`, '<svg width="1" height="1"></svg>');
  put(`test-results/dot-cache/activity/${slug}/in.puml`, MARKUP);
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'activity-pin-goldens-'));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('pinGoldens', () => {
  test('copies byte-identical files, appends ratchet unsorted, flips diff-baseline status to "pinned"', () => {
    seedZeroDiff('aaa-slug');
    expect(pinGoldens({ root, sourceTag: 'add1-b0', slugs: ['aaa-slug'], date: '2026-09-30', commit: 'abc123456', closeLabel: 'close-test' })).toBe(1);

    const g = join(root, 'oracle/goldens/svg-activity/aaa-slug');
    const expectedSvg = renderMarkup();
    expect(readFileSync(join(g, 'golden.svg'), 'utf8')).toBe(expectedSvg);
    expect(readFileSync(join(g, 'in.puml'), 'utf8')).toBe(MARKUP);

    const r = json(RATCHET).fixtures;
    expect(r[0]).toEqual({ slug: 'zzz-first', addedAt: '2026-07-18', source: 'dot-cache' });
    expect(r[1]).toEqual({ slug: 'aaa-slug', addedAt: '2026-09-30', source: 'add1-b0' });
    expect(readFileSync(join(root, RATCHET), 'utf8').endsWith('}\n')).toBe(true);

    const row = json(DIFF_BASELINE).fixtures[0];
    expect(row.status).toBe('pinned');
    // weightedScore/diffCount are left exactly as last measured -- this
    // tool never re-derives them (D5; `repin-activity-baselines.ts` owns
    // that number).
    expect(row.weightedScore).toBe(42);
    expect(row.diffCount).toBe(12);

    // Step 5: clone rows in both corpus baselines, appended after the twin.
    for (const [file, status] of [[ROUTING, 'agree'], [REFUSAL, 'ok']] as const) {
      const data = json(file);
      expect(data.fixtures).toHaveLength(2);
      expect(data.fixtures[1]).toMatchObject({
        tree: 'goldens', type: 'svg-activity', slug: 'aaa-slug', status,
        measuredAt: '2026-09-30', measuredAgainstCommit: 'abc123456',
      });
      expect(data.$comment).toContain('activity-divergence-drive / close-test');
    }
  });

  test('a twin row that is absent or not ok is refused before any file is written', () => {
    seedZeroDiff('ddd-slug');
    seedCorpus(['ddd-slug'], 'known-misroute');
    expect(() => pinGoldens({ root, sourceTag: 'add1-b0', slugs: ['ddd-slug'], date: '2026-09-30', commit: 'abc123456', closeLabel: 'close-test' })).toThrow(
      'twin status known-misroute',
    );
    seedCorpus([]);
    expect(() => pinGoldens({ root, sourceTag: 'add1-b0', slugs: ['ddd-slug'], date: '2026-09-30', commit: 'abc123456', closeLabel: 'close-test' })).toThrow(
      'has 0 dot-cache twins',
    );
    expect(existsSync(join(root, 'oracle/goldens/svg-activity/ddd-slug'))).toBe(false);
    expect(json(DIFF_BASELINE).fixtures[0].status).toBe('baseline');
  });

  test('a non-zero-diff slug is refused before any file is written', () => {
    seedNonZeroDiff('bad-slug');
    expect(() => pinGoldens({ root, sourceTag: 'add1-b0', slugs: ['bad-slug'], date: '2026-09-30', commit: 'abc123456', closeLabel: 'close-test' })).toThrow(
      'not zero-diff',
    );
    expect(existsSync(join(root, 'oracle/goldens/svg-activity/bad-slug'))).toBe(false);
    expect(json(RATCHET).fixtures).toEqual([]);
    expect(json(DIFF_BASELINE).fixtures[0].status).toBe('baseline');
  });

  test('an already-ratcheted slug, a duplicate argument, or no slugs is refused', () => {
    seedZeroDiff('zzz-first');
    expect(() => pinGoldens({ root, sourceTag: 'add1-b0', slugs: ['zzz-first'], date: '2026-09-30', commit: 'abc123456', closeLabel: 'close-test' })).toThrow(
      'already in the ratchet',
    );
    expect(() => pinGoldens({ root, sourceTag: 'add1-b0', slugs: ['a', 'a'], date: '2026-09-30', commit: 'abc123456', closeLabel: 'close-test' })).toThrow(
      'duplicate slug',
    );
    expect(() => pinGoldens({ root, sourceTag: 'add1-b0', slugs: [], date: '2026-09-30', commit: 'abc123456', closeLabel: 'close-test' })).toThrow('no slugs');
  });

  test('a missing cache file is refused', () => {
    seedZeroDiff('ccc-slug');
    rmSync(join(root, 'test-results/dot-cache/activity/ccc-slug/in.puml'));
    expect(() => pinGoldens({ root, sourceTag: 'add1-b0', slugs: ['ccc-slug'], date: '2026-09-30', commit: 'abc123456', closeLabel: 'close-test' })).toThrow(
      'missing in.puml',
    );
  });

  test('a missing diff-baseline row is refused', () => {
    put(RATCHET, JSON.stringify({ fixtures: [] }));
    put(DIFF_BASELINE, JSON.stringify({ fixtures: [] }));
    put('test-results/dot-cache/activity/no-row-slug/in.svg', '<svg/>');
    put('test-results/dot-cache/activity/no-row-slug/in.puml', MARKUP);
    expect(() =>
      pinGoldens({ root, sourceTag: 'add1-b0', slugs: ['no-row-slug'], date: '2026-09-30', commit: 'abc123456', closeLabel: 'close-test' }),
    ).toThrow('no diff-baseline.json row');
  });

  test('a row already "pinned", "error", or "jar-error" is refused', () => {
    for (const status of ['pinned', 'error', 'jar-error']) {
      root = mkdtempSync(join(tmpdir(), 'activity-pin-goldens-'));
      seedZeroDiff(`status-${status}-slug`, status);
      expect(() =>
        pinGoldens({ root, sourceTag: 'add1-b0', slugs: [`status-${status}-slug`], date: '2026-09-30', commit: 'abc123456', closeLabel: 'close-test' }),
      ).toThrow(`expected "baseline"`);
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('findBaselineRow', () => {
  test('refuses a missing row and a non-"baseline" status', () => {
    const data = { fixtures: [{ slug: 's', status: 'error' }] };
    expect(() => findBaselineRow(data, 's')).toThrow('expected "baseline"');
    expect(() => findBaselineRow({ fixtures: [] }, 's')).toThrow('no diff-baseline.json row');
    expect(findBaselineRow({ fixtures: [{ slug: 's', status: 'baseline' }] }, 's')).toEqual({
      slug: 's',
      status: 'baseline',
    });
  });
});

describe('renderIsZeroDiff', () => {
  test('is true for identical output, false for a mismatched golden', () => {
    const svg = renderMarkup();
    expect(renderIsZeroDiff(MARKUP, svg)).toBe(true);
    expect(renderIsZeroDiff(MARKUP, '<svg width="1" height="1"></svg>')).toBe(false);
  });
});
