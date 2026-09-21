/**
 * Unit tests for `pin-diff.mts` (T0b). Run with the mission-local vitest
 * config — see `tools/README.md`.
 */
import { describe, test, expect } from 'vitest';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { toUnifiedRows, diffRow, computeTransitions, loadPinFile } from './pin-diff.mts';

describe('toUnifiedRows', () => {
  test('a ParityReport (parity-class.json shape) keeps dotEqual, drops structural/numeric', () => {
    const rows = toUnifiedRows({
      generatedAt: '2026-09-21T00:00:00Z',
      fixtures: [{ slug: 'a', verdict: 'diverged', dotEqual: true }],
    });
    expect(rows.get('a')).toEqual({ slug: 'a', verdict: 'diverged', dotEqual: true });
  });

  test('a bare RenderAllRow[] keeps structural/numeric, has no dotEqual key', () => {
    const rows = toUnifiedRows([{ slug: 'b', verdict: 'conformant', structural: 0, numeric: 0 }]);
    expect(rows.get('b')).toEqual({ slug: 'b', verdict: 'conformant', structural: 0, numeric: 0 });
  });
});

describe('diffRow', () => {
  const base = { slug: 's', verdict: 'diverged', dotEqual: true, structural: 2, numeric: 1 };

  test('identical rows on both sides produce no transition', () => {
    expect(diffRow('s', base, { ...base })).toBeUndefined();
  });

  test('a verdict change is reported', () => {
    const line = diffRow('s', base, { ...base, verdict: 'conformant' });
    expect(line).toBe('s: verdict diverged -> conformant');
  });

  test('a dotEqual flip is reported only when both sides carry the field', () => {
    const line = diffRow('s', base, { ...base, dotEqual: false });
    expect(line).toBe('s: dotEqual true -> false');
  });

  test('a dotEqual flip is NOT reported when one side lacks the field', () => {
    const a = { slug: 's', verdict: 'diverged', structural: 2, numeric: 1 };
    const b = { slug: 's', verdict: 'diverged', dotEqual: false, structural: 2, numeric: 1 };
    expect(diffRow('s', a, b)).toBeUndefined();
  });

  test('a diff-count rise is reported', () => {
    const line = diffRow('s', base, { ...base, structural: 5 });
    expect(line).toBe('s: diff count rose 3 -> 6');
  });

  test('a diff-count DROP is not reported (only rises are)', () => {
    expect(diffRow('s', base, { ...base, structural: 0 })).toBeUndefined();
  });

  test('a slug only in A is reported with the "-" marker', () => {
    expect(diffRow('s', base, undefined)).toBe('- s: only in A (verdict=diverged)');
  });

  test('a slug only in B is reported with the "+" marker', () => {
    expect(diffRow('s', undefined, base)).toBe('+ s: only in B (verdict=diverged)');
  });

  test('a slug absent from both sides yields no transition', () => {
    expect(diffRow('s', undefined, undefined)).toBeUndefined();
  });
});

describe('computeTransitions', () => {
  test('reports zero transitions when both maps are identical', () => {
    const a = new Map([['x', { slug: 'x', verdict: 'diverged' }]]);
    const b = new Map([['x', { slug: 'x', verdict: 'diverged' }]]);
    expect(computeTransitions(a, b)).toEqual([]);
  });

  test('a slug present only in one map is not silently dropped', () => {
    const a = new Map([['x', { slug: 'x', verdict: 'diverged' }]]);
    const b = new Map([
      ['x', { slug: 'x', verdict: 'diverged' }],
      ['y', { slug: 'y', verdict: 'conformant' }],
    ]);
    expect(computeTransitions(a, b)).toEqual(['+ y: only in B (verdict=conformant)']);
  });

  test('output is sorted by slug', () => {
    const a = new Map<string, { slug: string; verdict: string }>();
    const b = new Map([
      ['zeta', { slug: 'zeta', verdict: 'conformant' }],
      ['alpha', { slug: 'alpha', verdict: 'conformant' }],
    ]);
    expect(computeTransitions(a, b)).toEqual(['+ alpha: only in B (verdict=conformant)', '+ zeta: only in B (verdict=conformant)']);
  });
});

describe('loadPinFile', () => {
  test('reads a ParityReport JSON file from disk', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pin-diff-test-'));
    try {
      const path = join(dir, 'parity.json');
      writeFileSync(path, JSON.stringify({ generatedAt: 'now', fixtures: [{ slug: 'a', verdict: 'conformant', dotEqual: true }] }));
      const rows = loadPinFile(path);
      expect(rows.get('a')).toEqual({ slug: 'a', verdict: 'conformant', dotEqual: true });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('reads a bare RenderAllRow[] JSON file from disk', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pin-diff-test-'));
    try {
      const path = join(dir, 'render-all.json');
      writeFileSync(path, JSON.stringify([{ slug: 'b', verdict: 'diverged', structural: 1, numeric: 0 }]));
      const rows = loadPinFile(path);
      expect(rows.get('b')).toEqual({ slug: 'b', verdict: 'diverged', structural: 1, numeric: 0 });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('the same file diffed against itself produces zero transitions', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pin-diff-test-'));
    try {
      const path = join(dir, 'same.json');
      writeFileSync(path, JSON.stringify([{ slug: 'a', verdict: 'conformant', structural: 0, numeric: 0 }]));
      expect(computeTransitions(loadPinFile(path), loadPinFile(path))).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
