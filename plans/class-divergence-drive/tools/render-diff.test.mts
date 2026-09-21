/**
 * Unit + integration tests for `render-diff.mts` (T0b). Run with the
 * mission-local vitest config (`tools/vitest.config.mts`) — see
 * `tools/README.md` — never `npm test`; the root `vitest.config.ts`'s
 * `include` is `tests/**\/*.test.ts` only, so these are out of the main
 * suite's scope. `.test.mts`, not `.test.ts` — see `vitest.config.mts`'s
 * own doc comment for why.
 */
import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Diff } from '../../../tests/oracle/svg-conformance/compare.js';
import { compareSvg } from '../../../tests/oracle/svg-conformance/compare.js';
import { buildSpriteAssetsStore } from '../../../scripts/sprite-assets-store.js';
import { resolveRepoRoot, splitDiffs, formatDiffLine, renderFixture } from './render-diff.mts';

describe('resolveRepoRoot', () => {
  test('resolves three directories above tools/ to the repo root', () => {
    const fileUrl = 'file:///work/repo/plans/class-divergence-drive/tools/render-diff.mts';
    expect(resolveRepoRoot(fileUrl)).toBe('/work/repo');
  });
});

describe('splitDiffs', () => {
  test('a diff with delta === undefined is structural, not numeric', () => {
    const structuralDiff: Diff = { path: 'a', expected: 'x', actual: 'y', tolerance: 0.01 };
    const numericDiff: Diff = { path: 'b', expected: '1', actual: '2', tolerance: 0.01, delta: 5 };
    const { structural, numeric } = splitDiffs([structuralDiff, numericDiff]);
    expect(structural).toEqual([structuralDiff]);
    expect(numeric).toEqual([numericDiff]);
  });

  test('empty input yields empty structural and numeric lists', () => {
    expect(splitDiffs([])).toEqual({ structural: [], numeric: [] });
  });
});

describe('formatDiffLine', () => {
  test('a structural diff prints with the S marker and no delta suffix', () => {
    const line = formatDiffLine({ path: 'svg/g[1]', expected: 'entries', actual: '-entries', tolerance: 0.01 });
    expect(line).toBe('  S svg/g[1]  exp=entries | act=-entries');
  });

  test('a numeric diff prints with the N marker and its delta', () => {
    const line = formatDiffLine({ path: 'svg/g[1]/@x', expected: '168.32', actual: '160.319', tolerance: 0.01, delta: 8.001 });
    expect(line).toBe('  N svg/g[1]/@x  exp=168.32 | act=160.319 (Δ8.001)');
  });
});

describe('renderFixture (integration, canuti-20-jotu614)', () => {
  test('matches the acceptance criterion: 9 structural / 3 numeric diffs against the cached oracle', () => {
    const repo = resolveRepoRoot(import.meta.url);
    const dir = join(repo, 'test-results', 'dot-cache', 'class', 'canuti-20-jotu614');
    const markup = readFileSync(join(dir, 'in.puml'), 'utf-8');
    const oracle = readFileSync(join(dir, 'in.svg'), 'utf-8');
    const store = buildSpriteAssetsStore();

    const svg = renderFixture(markup, store);
    const { diffs } = compareSvg(svg, oracle, 'deterministic');
    const { structural, numeric } = splitDiffs(diffs);

    expect(structural.length).toBe(9);
    expect(numeric.length).toBe(3);
    expect(structural[0]?.path).toBe('svg/g[1]/g[5]/text[1]/@textLength');
  });
});
