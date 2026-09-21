/**
 * Unit + integration tests for `render-all.mts` (T0b). Run with the
 * mission-local vitest config — see `tools/README.md`.
 */
import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildSpriteAssetsStore } from '../../../scripts/sprite-assets-store.js';
import type { Verdict } from '../../../scripts/svg-parity-survey.js';
import { resolveRepoRoot, listClassFixtureDirs, countDiffs, renderRow, toRowVerdict } from './render-all.mts';

describe('resolveRepoRoot', () => {
  test('resolves three directories above tools/ to the repo root', () => {
    const fileUrl = 'file:///work/repo/plans/class-divergence-drive/tools/render-all.mts';
    expect(resolveRepoRoot(fileUrl)).toBe('/work/repo');
  });
});

describe('toRowVerdict', () => {
  test('passes conformant, structural-match and diverged through unchanged', () => {
    expect(toRowVerdict('conformant')).toBe('conformant');
    expect(toRowVerdict('structural-match')).toBe('structural-match');
    expect(toRowVerdict('diverged')).toBe('diverged');
  });

  test('maps the unreachable oracle-error case to diverged rather than widening the row type', () => {
    expect(toRowVerdict('oracle-error')).toBe('diverged');
  });
});

describe('listClassFixtureDirs', () => {
  const repo = resolveRepoRoot(import.meta.url);
  const classDir = join(repo, 'test-results', 'dot-cache', 'class');

  test('finds exactly 723 cached class fixtures, matching parity-class.json', () => {
    const fixtures = listClassFixtureDirs(classDir);
    expect(fixtures.length).toBe(723);
  });

  test('is sorted by slug via localeCompare', () => {
    const fixtures = listClassFixtureDirs(classDir);
    const slugs = fixtures.map((f) => f.slug);
    const sorted = [...slugs].sort((a, b) => a.localeCompare(b));
    expect(slugs).toEqual(sorted);
  });

  test('a directory missing .done is excluded', () => {
    // canuti-20-jotu614 is a known-present fixture; a nonexistent directory
    // proves the "no such dir" branch without mutating the real cache.
    const fixtures = listClassFixtureDirs(join(repo, 'test-results', 'dot-cache', 'does-not-exist'));
    expect(fixtures).toEqual([]);
  });
});

describe('countDiffs', () => {
  test('an identical SVG has zero structural and zero numeric diffs', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><g><ellipse cx="5" cy="5" rx="1" ry="1"/></g></svg>';
    expect(countDiffs(svg, svg)).toEqual({ structural: 0, numeric: 0 });
  });
});

describe('renderRow (integration, canuti-20-jotu614)', () => {
  test('produces the same verdict, structural and numeric counts render-diff.mts prints', () => {
    const repo = resolveRepoRoot(import.meta.url);
    const dir = join(repo, 'test-results', 'dot-cache', 'class', 'canuti-20-jotu614');
    // Sanity: the fixture files this test depends on actually exist.
    readFileSync(join(dir, 'in.puml'), 'utf-8');
    const store = buildSpriteAssetsStore();

    const row = renderRow({ slug: 'canuti-20-jotu614', dir }, store);

    expect(row.slug).toBe('canuti-20-jotu614');
    expect(row.verdict).toBe('diverged' satisfies Verdict);
    expect(row.structural).toBe(9);
    expect(row.numeric).toBe(3);
    expect(row.firstDiff).toBe('svg/g[1]/g[5]/text[1]/@textLength');
  });

  test('a render that throws is reported as errored with zero counts', () => {
    const row = renderRow({ slug: 'bad-slug', dir: '/does/not/exist' }, buildSpriteAssetsStore());
    expect(row.verdict).toBe('errored');
    expect(row.structural).toBe(0);
    expect(row.numeric).toBe(0);
    expect(row.firstDiff).toBeDefined();
  });
});
