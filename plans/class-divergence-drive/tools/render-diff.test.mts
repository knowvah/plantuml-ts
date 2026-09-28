/**
 * Unit + integration tests for `render-diff.mts` (T0b, tree support T4). Run
 * with the mission-local vitest config (`tools/vitest.config.mts`) — see
 * `tools/README.md` — never `npm test`; the root `vitest.config.ts`'s
 * `include` is `tests/**\/*.test.ts` only, so these are out of the main
 * suite's scope. `.test.mts`, not `.test.ts` — see `vitest.config.mts`'s
 * own doc comment for why.
 */
import { describe, test, expect } from 'vitest';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { Diff } from '../../../tests/oracle/svg-conformance/compare.js';
import { compareSvg } from '../../../tests/oracle/svg-conformance/compare.js';
import { buildSpriteAssetsStore } from '../../../scripts/sprite-assets-store.js';
import {
  resolveRepoRoot,
  parseTreeSlug,
  fixtureDir,
  outputBaseName,
  readFixtureFiles,
  splitDiffs,
  formatDiffLine,
  renderFixture,
} from './render-diff.mts';

describe('resolveRepoRoot', () => {
  test('resolves three directories above tools/ to the repo root', () => {
    const fileUrl = 'file:///work/repo/plans/class-divergence-drive/tools/render-diff.mts';
    expect(resolveRepoRoot(fileUrl)).toBe('/work/repo');
  });
});

describe('parseTreeSlug (T4)', () => {
  test('a bare slug defaults to the class tree', () => {
    expect(parseTreeSlug('canuti-20-jotu614')).toEqual({ tree: 'class', slug: 'canuti-20-jotu614' });
  });

  test('a tree-qualified slug splits on the first slash', () => {
    expect(parseTreeSlug('unknown/baleco-37-lili752')).toEqual({ tree: 'unknown', slug: 'baleco-37-lili752' });
  });

  test('only the first slash is the separator', () => {
    expect(parseTreeSlug('unknown/a/b')).toEqual({ tree: 'unknown', slug: 'a/b' });
  });
});

describe('fixtureDir / outputBaseName (T4)', () => {
  test('fixtureDir joins repo/test-results/dot-cache/<tree>/<slug>', () => {
    expect(fixtureDir('/work/repo', 'unknown', 'baleco-37-lili752')).toBe('/work/repo/test-results/dot-cache/unknown/baleco-37-lili752');
  });

  test('outputBaseName is <tree>__<slug>', () => {
    expect(outputBaseName('unknown', 'baleco-37-lili752')).toBe('unknown__baleco-37-lili752');
  });

  test('a bare slug (default class tree) resolves the same directory render-diff used before T4', () => {
    const { tree, slug } = parseTreeSlug('canuti-20-jotu614');
    expect(fixtureDir('/work/repo', tree, slug)).toBe('/work/repo/test-results/dot-cache/class/canuti-20-jotu614');
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

/**
 * `readFixtureFiles`/`renderFixture` are exercised against a synthesized
 * fixture directory rather than a fixed corpus slug: a corpus fixture's
 * exact diff counts drift as the port progresses (T4 — the prior
 * canuti-20-jotu614 example moved from "diverged" (9/3) to "conformant"
 * mid-mission, cdd4 journal 23), so pinning an exact count here goes stale.
 * Comparing our own render against itself keeps the expected outcome a
 * structural guarantee, not a corpus snapshot.
 */
describe('readFixtureFiles + renderFixture (synthetic fixture, tree-qualified form)', () => {
  const markup = '@startuml\nclass Foo\n@enduml\n';

  /** Builds `<repo>/test-results/dot-cache/unknown/<slug>/{in.puml,in.svg}`,
   *  mirroring the real corpus layout `fixtureDir` addresses, under a fresh
   *  temp root. The oracle is our own render, so the comparison it enables
   *  is guaranteed to pass without depending on any real corpus fixture. */
  function synthesizeUnknownFixture(store: ReturnType<typeof buildSpriteAssetsStore>): { repo: string; tree: string; slug: string } {
    const repo = mkdtempSync(join(tmpdir(), 'cdd5-t4-render-diff-'));
    const tree = 'unknown';
    const slug = 'synthetic-class-foo';
    const dir = fixtureDir(repo, tree, slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'in.puml'), markup);
    writeFileSync(join(dir, 'in.svg'), renderFixture(markup, store));
    return { repo, tree, slug };
  }

  test('a tree-qualified fixture directory round-trips through readFixtureFiles and renderFixture', () => {
    const store = buildSpriteAssetsStore();
    const { repo, tree, slug } = synthesizeUnknownFixture(store);
    const dir = fixtureDir(repo, tree, slug);

    const { markup: readMarkup, oracle } = readFixtureFiles(dir);
    const svg = renderFixture(readMarkup, store);
    const { pass, diffs } = compareSvg(svg, oracle, 'deterministic');

    expect(readMarkup).toBe(markup);
    expect(pass).toBe(true);
    expect(diffs).toEqual([]);
  });
});
