/**
 * Unit + integration tests for `render-all.mts` (T0b, tree support T4). Run
 * with the mission-local vitest config — see `tools/README.md`.
 */
import { describe, test, expect } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildSpriteAssetsStore } from '../../../scripts/sprite-assets-store.js';
import type { Verdict } from '../../../scripts/svg-parity-survey.js';
import { renderFixture } from './render-diff.mts';
import {
  resolveRepoRoot,
  listClassFixtureDirs,
  listUnknownClassFixtureDirs,
  loadUnknownClassSlugs,
  collectFixtures,
  countDiffs,
  renderRow,
  toRowVerdict,
  parseArgs,
} from './render-all.mts';

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

describe('loadUnknownClassSlugs / listUnknownClassFixtureDirs (routing filter, T4)', () => {
  const repo = resolveRepoRoot(import.meta.url);
  const routingPath = join(repo, 'oracle', 'goldens', 'svg-conformance', 'routing-baseline.json');

  test('row count equals the routing-baseline count of type=unknown, ourType=CLASS rows', () => {
    const data = JSON.parse(readFileSync(routingPath, 'utf-8')) as { fixtures: Array<{ type: string; ourType: string }> };
    const expected = data.fixtures.filter((r) => r.type === 'unknown' && r.ourType === 'CLASS').length;

    const slugs = loadUnknownClassSlugs(routingPath);
    const dirs = listUnknownClassFixtureDirs(repo);

    expect(slugs.size).toBe(expected);
    expect(dirs.length).toBe(expected);
    // Sanity pin at time of writing (T4-tools-tree.md: "currently 288").
    expect(expected).toBe(288);
  });

  test('excludes unknown-tree rows whose jar type is not CLASS', () => {
    const slugs = loadUnknownClassSlugs(routingPath);
    const data = JSON.parse(readFileSync(routingPath, 'utf-8')) as { fixtures: Array<{ type: string; ourType: string; slug: string }> };
    const nonClassUnknown = data.fixtures.find((r) => r.type === 'unknown' && r.ourType !== 'CLASS');
    expect(nonClassUnknown).toBeDefined();
    expect(slugs.has(nonClassUnknown!.slug)).toBe(false);
  });
});

describe('collectFixtures (T4)', () => {
  const repo = resolveRepoRoot(import.meta.url);

  test('class tree matches listClassFixtureDirs, each tagged tree=class', () => {
    const classDir = join(repo, 'test-results', 'dot-cache', 'class');
    const expected = listClassFixtureDirs(classDir);
    const fixtures = collectFixtures(repo, 'class');
    expect(fixtures.map((f) => f.slug)).toEqual(expected.map((f) => f.slug));
    expect(fixtures.every((f) => f.tree === 'class')).toBe(true);
  });

  test('unknown tree matches listUnknownClassFixtureDirs, each tagged tree=unknown', () => {
    const expected = listUnknownClassFixtureDirs(repo);
    const fixtures = collectFixtures(repo, 'unknown');
    expect(fixtures.map((f) => f.slug)).toEqual(expected.map((f) => f.slug));
    expect(fixtures.every((f) => f.tree === 'unknown')).toBe(true);
  });

  test('all tree is the union of both, sorted by slug', () => {
    const classCount = collectFixtures(repo, 'class').length;
    const unknownCount = collectFixtures(repo, 'unknown').length;

    const all = collectFixtures(repo, 'all');

    expect(all.length).toBe(classCount + unknownCount);
    const slugs = all.map((f) => f.slug);
    expect(slugs).toEqual([...slugs].sort((a, b) => a.localeCompare(b)));
  });
});

describe('parseArgs (T4)', () => {
  test('defaults --tree to class when omitted', () => {
    expect(parseArgs(['out.json'])).toEqual({ out: 'out.json', tree: 'class' });
  });

  test('accepts an explicit --tree unknown', () => {
    expect(parseArgs(['out.json', '--tree', 'unknown'])).toEqual({ out: 'out.json', tree: 'unknown' });
  });

  test('accepts an explicit --tree all', () => {
    expect(parseArgs(['out.json', '--tree', 'all'])).toEqual({ out: 'out.json', tree: 'all' });
  });

  test('reports an error for a missing out.json argument', () => {
    expect(parseArgs([])).toEqual({ error: expect.stringContaining('usage:') });
  });

  test('reports an error for an unrecognized --tree value', () => {
    const result = parseArgs(['out.json', '--tree', 'bogus']);
    expect('error' in result).toBe(true);
    expect((result as { error: string }).error).toContain('bogus');
  });
});

describe('countDiffs', () => {
  test('an identical SVG has zero structural and zero numeric diffs', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><g><ellipse cx="5" cy="5" rx="1" ry="1"/></g></svg>';
    expect(countDiffs(svg, svg)).toEqual({ structural: 0, numeric: 0 });
  });
});

/**
 * These fixtures are synthesized at run time rather than pointing at a fixed
 * corpus slug: the corpus's own verdicts shift as the port progresses (T4 —
 * the prior canuti-20-jotu614 example moved from "diverged" to "conformant"
 * mid-mission, cdd4 journal 23), so a hardcoded slug/verdict pair goes stale.
 * Comparing our own render against itself (or a deliberately wrong oracle)
 * keeps the expected verdict a structural guarantee, not a corpus snapshot.
 */
describe('renderRow (synthetic fixture, tree tagging)', () => {
  const markup = '@startuml\nclass Foo\n@enduml\n';

  function synthesizeFixture(oracleSvg: string): { slug: string; dir: string } {
    const dir = mkdtempSync(join(tmpdir(), 'cdd5-t4-render-all-'));
    writeFileSync(join(dir, 'in.puml'), markup);
    writeFileSync(join(dir, 'in.svg'), oracleSvg);
    return { slug: 'synthetic-class-foo', dir };
  }

  test('tags the row with the given tree and reports conformant when the oracle matches our own render', () => {
    const store = buildSpriteAssetsStore();
    const ourSvg = renderFixture(markup, store);
    const f = synthesizeFixture(ourSvg);

    const row = renderRow(f, store, 'unknown');

    expect(row.tree).toBe('unknown');
    expect(row.verdict).toBe('conformant' satisfies Verdict);
    expect(row.structural).toBe(0);
    expect(row.numeric).toBe(0);
  });

  test('reports a genuine divergence and a positive diff count against a deliberately wrong oracle', () => {
    const store = buildSpriteAssetsStore();
    const wrongOracle = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>';
    const f = synthesizeFixture(wrongOracle);

    const row = renderRow(f, store, 'class');

    expect(row.tree).toBe('class');
    expect(row.verdict).not.toBe('conformant');
    expect(row.structural + row.numeric).toBeGreaterThan(0);
  });

  test('a render that throws is reported as errored, tagged with the given tree, zero counts', () => {
    const row = renderRow({ slug: 'bad-slug', dir: '/does/not/exist' }, buildSpriteAssetsStore(), 'unknown');
    expect(row.tree).toBe('unknown');
    expect(row.verdict).toBe('errored');
    expect(row.structural).toBe(0);
    expect(row.numeric).toBe(0);
    expect(row.firstDiff).toBeDefined();
  });
});
