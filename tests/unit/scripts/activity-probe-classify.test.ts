/**
 * Unit tests for `scripts/activity-probe-classify.ts`'s pure functions
 * (mission `activity-divergence-drive`, T0a). The corpus render/CLI path is
 * exercised by the b0 measurement run, not here -- mirrors
 * `activity-probe.test.ts`'s split.
 */
import { describe, it, expect } from 'vitest';
import { classifyDiffs, classifyPair, summarize } from '../../../scripts/activity-probe-classify.js';
import type { Diff } from '../../../tests/oracle/svg-conformance/compare.js';

const SVG_NS = 'xmlns="http://www.w3.org/2000/svg"';
const RECT = '<rect x="10" y="10" width="20" height="20"/>';
const TEXT = '<text x="12" y="25" textLength="10">a</text>';
const OURS = `<svg ${SVG_NS} width="100" height="50" viewBox="0 0 100 50"><g>${RECT}${TEXT}</g></svg>`;
/** The jar's drawing translated by (+4, +3), canvas grown to match. */
const SHIFTED =
  `<svg ${SVG_NS} width="104" height="53" viewBox="0 0 104 53"><g>` +
  '<rect x="14" y="13" width="20" height="20"/><text x="16" y="28" textLength="10">a</text></g></svg>';
/** Same drawing plus one extra child: a structural diff. */
const EXTRA_CHILD = `<svg ${SVG_NS} width="100" height="50" viewBox="0 0 100 50"><g>${RECT}${TEXT}<line x1="0" y1="0" x2="1" y2="1"/></g></svg>`;

describe('classifyPair', () => {
  it('classifies a pure translation as position-only with one shift per axis', () => {
    const row = classifyPair('shift', OURS, SHIFTED);
    expect(row.nonPos).toBe(0);
    expect(row.shifts).toEqual({ x: [4], y: [3] });
    expect(row.n).toBe(8);
    expect(row.families).toEqual({
      'svg/@height': 1,
      'svg/@viewBox[]': 2,
      'svg/@width': 1,
      'svg/g[]/rect[]/@x': 1,
      'svg/g[]/rect[]/@y': 1,
      'svg/g[]/text[]/@x': 1,
      'svg/g[]/text[]/@y': 1,
    });
  });

  it('counts a childCount diff as non-positional with no shifts', () => {
    const row = classifyPair('child', OURS, EXTRA_CHILD);
    expect(row.families).toEqual({ 'svg/g[][childCount]': 1 });
    expect(row.nonPos).toBe(1);
    expect(row.shifts).toEqual({ x: [], y: [] });
    expect(row.ws).toBe(5);
  });
});

describe('classifyDiffs', () => {
  const diff = (path: string, actual: string, expected: string, delta?: number): Diff => ({
    path,
    actual,
    expected,
    tolerance: 0.01,
    ...(delta === undefined ? {} : { delta }),
  });

  it('tolerates a missing textLength and counts polygon points under POLY', () => {
    const c = classifyDiffs([
      diff('svg/g[1]/text[2]/@textLength', '', '31'),
      diff('svg/g[1]/polygon[1]/@points', '1,2', '3,4'),
    ]);
    expect(c.nonPos).toBe(0);
    expect(c.families['POLY']).toBe(1);
    expect(c.families['svg/g[]/polygon[]/@points']).toBe(1);
  });

  it('records distinct shifts per axis, rounded to 1/1000 px', () => {
    const c = classifyDiffs([
      diff('svg/g[1]/ellipse[1]/@cx', '10', '14.00001', 4),
      diff('svg/g[1]/line[1]/@y2', '10', '16', 6),
      diff('svg/g[1]/line[1]/@y1', '10', '14', 4),
    ]);
    expect(c.shifts).toEqual({ x: [4], y: [6, 4] });
  });

  it('counts a non-positional attribute diff toward nonPos', () => {
    expect(classifyDiffs([diff('svg/g[1]/rect[1]/@fill', '#fff', '#000')]).nonPos).toBe(1);
  });
});

describe('summarize', () => {
  it('counts errors, position-only and uniform rows, and fixtures per family', () => {
    const shift = classifyPair('shift', OURS, SHIFTED);
    const child = classifyPair('child', OURS, EXTRA_CHILD);
    const s = summarize([shift, child, { slug: 'bad', error: 'Error: boom' }]);
    expect(s).toMatchObject({ rows: 3, errors: 1, positionOnly: 1, uniformShift: 2 });
    expect(s.familyFixtures['svg/g[][childCount]']).toBe(1);
    expect(s.familyFixtures['svg/@width']).toBe(1);
  });
});
