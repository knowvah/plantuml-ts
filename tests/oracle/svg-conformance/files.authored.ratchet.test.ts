/**
 * Authored-root diff-count ratchet for `@startfiles`
 * (data-diagram-conformance / T0b, D4).
 *
 * `tests/fixtures/files/` holds original fixtures (`<slug>.puml` + the jar's
 * `<slug>.svg` beside it, flat), tracked by
 * `oracle/goldens/svg-files/authored-baseline.json`. Mirrors the authored
 * half of `wbs.diff-baseline.ratchet.test.ts`:
 *
 *   - every `.puml` with a `.svg` has EXACTLY one row (a new fixture with no
 *     row FAILS naming the slug; the orchestrator baselines it at the close);
 *   - every row names a `.puml` + `.svg` on disk;
 *   - a row's `diffCount` may only shrink (files has no layout engine, D1: the
 *     jar's bytes are the target, so the raw `compareSvg` count is gated);
 *   - a `status: "error"` row must still error (throw or render the
 *     `ERROR_SENTINEL`).
 *
 * Starts empty; the root may be absent until T1f.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { withJarCompatibleStyleInput } from '../../../src/core/internal-render-options.js';
import { renderSync } from '../../../src/index.js';
import { compareSvg, weightedScore } from './compare.js';
import {
  AUTHORED_FILES_ROOT,
  authoredFilesIncludeStore,
  filesFixtureAssetStore,
  listAuthoredFilesSlugs,
  readAuthoredFilesFixture,
  renderFixtureFiles,
} from './render-fixture-files.js';

type RowStatus = 'baseline' | 'error';

interface AuthoredRow {
  readonly type: 'files';
  readonly slug: string;
  readonly topic: string;
  readonly status: RowStatus;
  readonly diffCount: number | null;
  readonly weightedScore: number | null;
  readonly reason?: string;
  readonly measuredAt: string;
  readonly measuredAgainstCommit: string;
}

interface AuthoredManifest {
  readonly fixtures: readonly AuthoredRow[];
}

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = join(HERE, '../../../oracle/goldens/svg-files/authored-baseline.json');

/** `ERROR_SENTINEL`'s fixed marker text (`src/core/dispatcher.ts`). */
const ERROR_SENTINEL_MARKER = 'Error: unknown diagram type';

type Measure =
  | { readonly errored: false; readonly diffCount: number; readonly weightedScore: number }
  | { readonly errored: true; readonly reason: string };

function measureAuthored(slug: string): Measure {
  const { markup, golden } = readAuthoredFilesFixture(slug);
  if (golden === undefined) return { errored: true, reason: `tests/fixtures/files/${slug}.svg is missing` };
  try {
    const ours = renderFixtureFiles(markup, {
      measurer: new DeterministicMeasurer(),
      includeStore: authoredFilesIncludeStore(),
    });
    if (ours.includes(ERROR_SENTINEL_MARKER)) return { errored: true, reason: 'renders ERROR_SENTINEL' };
    const { diffs } = compareSvg(ours, golden, 'deterministic');
    return { errored: false, diffCount: diffs.length, weightedScore: weightedScore(diffs) };
  } catch (err) {
    return { errored: true, reason: err instanceof Error ? err.message : String(err) };
  }
}

/** Pure: a live diff count may not exceed its baseline. */
export function checkNoRise(slug: string, baseline: number | null, live: number): { ok: boolean; message: string } {
  if (baseline === null) {
    return { ok: false, message: `files/${slug}: baseline row carries no diffCount; live is ${live}.` };
  }
  return live <= baseline
    ? { ok: true, message: `files/${slug}: diffCount ${live} (baseline ${baseline}) -- no regression.` }
    : {
        ok: false,
        message: `files/${slug}: diffCount ROSE -- baseline=${baseline}, now=${live}. Re-pin only from a fresh measurement after a deliberate change.`,
      };
}

/** Pure: slugs on disk (puml + svg) with no row, and rows naming no fixture on disk. */
export function auditRows(
  onDisk: readonly string[],
  rows: readonly { slug: string }[],
): { unbaselined: string[]; orphaned: string[]; duplicated: string[] } {
  const slugs = rows.map((r) => r.slug);
  return {
    unbaselined: onDisk.filter((s) => !slugs.includes(s)),
    orphaned: slugs.filter((s) => !onDisk.includes(s)),
    duplicated: slugs.filter((s, i) => slugs.indexOf(s) !== i),
  };
}

const manifest: AuthoredManifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as AuthoredManifest;

const fixtureSlugs = listAuthoredFilesSlugs().filter((s) => existsSync(join(AUTHORED_FILES_ROOT, `${s}.svg`)));

describe('svg-files authored ratchet -- manifest shape', () => {
  it('every .puml with a .svg has exactly one row, and every row names a fixture on disk', () => {
    const { unbaselined, orphaned, duplicated } = auditRows(fixtureSlugs, manifest.fixtures);
    expect(
      unbaselined,
      `tests/fixtures/files has fixtures with no authored-baseline.json row: ${unbaselined.join(', ')}`,
    ).toEqual([]);
    expect(orphaned, `authored-baseline.json rows with no .puml+.svg on disk: ${orphaned.join(', ')}`).toEqual([]);
    expect(duplicated).toEqual([]);
  });

  it('auditRows names a fixture that has no row, an orphan row and a duplicate', () => {
    expect(auditRows(['a', 'b'], [{ slug: 'a' }, { slug: 'c' }, { slug: 'c' }])).toEqual({
      unbaselined: ['b'],
      orphaned: ['c', 'c'],
      duplicated: ['c'],
    });
  });
});

describe('svg-files authored ratchet -- diffCount never rises', () => {
  for (const row of manifest.fixtures.filter((r) => r.status === 'baseline')) {
    it(`files/${row.slug}: diffCount never rises above ${String(row.diffCount)}`, () => {
      const m = measureAuthored(row.slug);
      if (m.errored) throw new Error(`files/${row.slug}: baseline row now errors: ${m.reason}`);
      const { ok, message } = checkNoRise(row.slug, row.diffCount, m.diffCount);
      expect(ok, message).toBe(true);
    });
  }

  for (const row of manifest.fixtures.filter((r) => r.status === 'error')) {
    it(`files/${row.slug}: an "error" row still errors`, () => {
      const m = measureAuthored(row.slug);
      expect(m.errored, `files/${row.slug}: no longer errors -- re-baseline it deliberately`).toBe(true);
    });
  }

  it('checkNoRise passes at or below the baseline and fails above it or without one', () => {
    expect(checkNoRise('x', 3, 3).ok).toBe(true);
    expect(checkNoRise('x', 3, 1).ok).toBe(true);
    const rise = checkNoRise('x', 3, 4);
    expect(rise.ok).toBe(false);
    expect(rise.message).toContain('files/x: diffCount ROSE -- baseline=3, now=4');
    expect(checkNoRise('x', null, 0).ok).toBe(false);
  });
});

describe('svg-files harness helper', () => {
  it('listAuthoredFilesSlugs returns [] for an absent root', () => {
    expect(listAuthoredFilesSlugs(join(HERE, 'no-such-root'))).toEqual([]);
  });
});

describe('renderFixtureFiles', () => {
  it('equals renderSync with withJarCompatibleStyleInput and the Twemoji store, byte for byte', () => {
    const markup = readFileSync(join(HERE, '../../fixtures/lengthadjust/files-default.puml'), 'utf8');
    const expected = renderSync(
      markup,
      withJarCompatibleStyleInput({ measurer: new DeterministicMeasurer(), assetStore: filesFixtureAssetStore() }),
    );
    const ours = renderFixtureFiles(markup, { measurer: new DeterministicMeasurer() });
    expect(ours.startsWith('<svg')).toBe(true);
    expect(ours).toBe(expected);
  });
});
