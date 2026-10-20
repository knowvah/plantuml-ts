import { describe, expect, it } from 'vitest';
import type { Diff } from '../../../tests/oracle/svg-conformance/compare.js';
import { buildRow, cohortOf, isPaint, isStructural, keysOf, shape } from './classify.mjs';

const diff = (path: string): Diff => ({ path, actual: '1', expected: '2', tolerance: 0 });

describe('shape', () => {
  it('strips every [n] index', () => {
    expect(shape('svg/g[2]/line[10]/@x1')).toBe('svg/g/line/@x1');
  });
});

describe('isPaint / isStructural', () => {
  it('flags paint suffixes only after index stripping', () => {
    expect(isPaint(diff('/svg/g/line[2]@stroke-width'))).toBe(true);
    expect(isPaint(diff('/svg/g/line[2]@x1'))).toBe(false);
  });
  it('flags childCount paths', () => {
    expect(isStructural(diff('svg/g[2]/childCount'))).toBe(true);
  });
  it('flags tag-substitution paths ending in /tag', () => {
    expect(isStructural(diff('svg/g[2]/rect[3]'))).toBe(true);
    expect(isStructural(diff('svg/g[2]/rect/@x'))).toBe(false);
  });
});

describe('cohortOf', () => {
  it('zero for no diffs', () => {
    expect(cohortOf([])).toBe('zero');
  });
  it('paint-only when every diff is paint', () => {
    expect(cohortOf([diff('/svg/g/line[2]@stroke-width'), diff('/svg/g/rect@fill')])).toBe('paint-only');
  });
  it('geometry when a non-paint, non-structural diff exists', () => {
    expect(cohortOf([diff('/svg/g/line[2]@fill'), diff('/svg/g/line[2]@x1')])).toBe('geometry');
  });
  it('structural on a childCount path', () => {
    expect(cohortOf([diff('svg/g[2]/childCount')])).toBe('structural');
  });
  it('structural on a tag-substitution path', () => {
    expect(cohortOf([diff('svg/g[2]/@x'), diff('svg/g[2]/rect[3]')])).toBe('structural');
  });
});

describe('keysOf', () => {
  it('counts occurrences with [n] stripped', () => {
    expect(keysOf([diff('svg/g[1]/line[2]/@x1'), diff('svg/g[2]/line[7]/@x1'), diff('svg/g/rect/@y')])).toEqual({
      'svg/g/line/@x1': 2,
      'svg/g/rect/@y': 1,
    });
  });
});

describe('buildRow', () => {
  it('turns a render failure into an error row with its message', () => {
    const row = buildRow({ slug: 'abc', status: 'baseline' }, () => {
      throw new Error('boom');
    });
    expect(row).toEqual({ slug: 'abc', cohort: 'error', error: 'boom' });
  });
  it('slices the error message to 200 chars', () => {
    const row = buildRow({ slug: 'abc', status: 'baseline' }, () => {
      throw new Error('x'.repeat(500));
    });
    expect(row.error).toBe('x'.repeat(200));
  });
  it('stringifies non-Error throws', () => {
    const row = buildRow({ slug: 'abc', status: 'baseline' }, () => {
      throw 'plain';
    });
    expect(row.error).toBe('plain');
  });
  it('maps other statuses to a bare error row without rendering', () => {
    let called = false;
    const row = buildRow({ slug: 'abc', status: 'error' }, () => {
      called = true;
      return { svg: '', golden: '' };
    });
    expect(row).toEqual({ slug: 'abc', cohort: 'error' });
    expect(called).toBe(false);
  });
  it('classifies identical SVGs as zero for baseline and pinned', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><g><rect x="1" y="2"/></g></svg>';
    for (const status of ['baseline', 'pinned']) {
      expect(buildRow({ slug: 's', status }, () => ({ svg, golden: svg }))).toEqual({
        slug: 's',
        ws: 0,
        n: 0,
        cohort: 'zero',
        nonPaint: 0,
        keys: {},
      });
    }
  });
  it('classifies a differing x as geometry with keys', () => {
    const mk = (x: string) => `<svg xmlns="http://www.w3.org/2000/svg"><g><rect x="${x}" y="2"/></g></svg>`;
    const row = buildRow({ slug: 's', status: 'baseline' }, () => ({ svg: mk('1'), golden: mk('50') }));
    expect(row.cohort).toBe('geometry');
    expect(row.n).toBe(1);
    expect(Object.values(row.keys ?? {})).toEqual([1]);
  });
});
