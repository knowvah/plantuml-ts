/**
 * Unit tests for `scripts/activity-probe.ts`'s pure functions (mission
 * `activity-lane-capture`, T0a). The render/measure/CLI path is exercised by
 * the manual acceptance runs documented in the task's own return report, not
 * by a fixture-corpus- or subprocess-dependent test here -- mirrors
 * `rebaseline-svg-goldens.test.ts`'s own split between pure-function unit
 * tests and a manual full-corpus run.
 */
import { describe, it, expect } from 'vitest';
import {
  familyOf,
  familyWeights,
  risersAndFallers,
  laneIndexOf,
  extractSlugs,
  centerXOf,
  categoryOf,
  type CompoundCategory,
} from '../../../scripts/activity-probe.js';
import type { Diff } from '../../../tests/oracle/svg-conformance/compare.js';
import type { NormalizedNode } from '../../../tests/oracle/svg-conformance/normalize.js';
import type { LaneExtent } from '../../../tests/oracle/svg-conformance/swimlane-census.js';

function el(tag: string, attrs: Record<string, string>): NormalizedNode {
  return { type: 'element', tag, attrs };
}

describe('familyOf', () => {
  it('replaces a single positional index with []', () => {
    expect(familyOf('svg/g[2]/rect[3]/@x')).toBe('svg/g[]/rect[]/@x');
  });

  it('collapses two paths that differ only by index into one family', () => {
    expect(familyOf('svg/g[1]/rect[3]/@x')).toBe(familyOf('svg/g[1]/rect[7]/@x'));
  });

  it('leaves a path with no positional index unchanged', () => {
    expect(familyOf('svg/@width')).toBe('svg/@width');
  });
});

describe('familyWeights', () => {
  it('sums weight per family, defaulting an absent weight to 1', () => {
    const diffs: Diff[] = [
      { path: 'svg/g[1]/rect[1]/@x', actual: '1', expected: '2', tolerance: 0.01, weight: 3 },
      { path: 'svg/g[2]/rect[5]/@x', actual: '1', expected: '2', tolerance: 0.01, weight: 2 },
      { path: 'svg/g[1]/text[1]/@y', actual: '1', expected: '2', tolerance: 0.01 },
    ];
    expect(familyWeights(diffs)).toEqual({
      'svg/g[]/rect[]/@x': 5,
      'svg/g[]/text[]/@y': 1,
    });
  });

  it('is empty for an empty diff list', () => {
    expect(familyWeights([])).toEqual({});
  });
});

describe('risersAndFallers', () => {
  it('classifies a rise and a fall by the exact arrays the contract pins', () => {
    expect(risersAndFallers({ a: 5, b: 5 }, { a: 7, b: 3 })).toEqual({
      risers: ['a'],
      fallers: ['b'],
    });
  });

  it('reports neither for a slug that held steady', () => {
    expect(risersAndFallers({ a: 5 }, { a: 5 })).toEqual({ risers: [], fallers: [] });
  });

  it('skips a slug missing from either side rather than treating it as a move', () => {
    expect(risersAndFallers({ a: 5, b: 5 }, { a: 5 })).toEqual({ risers: [], fallers: [] });
  });
});

describe('laneIndexOf', () => {
  const lanes: LaneExtent[] = [
    { x: 0, width: 100 },
    { x: 100, width: 50 },
  ];

  it('finds the first lane for a coordinate at its left edge', () => {
    expect(laneIndexOf(0, lanes)).toBe(0);
  });

  it('finds the second lane for a coordinate inside its span', () => {
    expect(laneIndexOf(120, lanes)).toBe(1);
  });

  it('is null before the first lane', () => {
    expect(laneIndexOf(-5, lanes)).toBeNull();
  });

  it("is null at or past the last lane's right edge", () => {
    expect(laneIndexOf(150, lanes)).toBeNull();
  });

  it('is null for an empty lane list', () => {
    expect(laneIndexOf(10, [])).toBeNull();
  });
});

describe('extractSlugs', () => {
  it('extracts every slug-shaped token from free text', () => {
    expect(extractSlugs('| `becanu-19-diti597` | repeat* | 209 |\n| `bideta-97-cezo697` | if | 187 |')).toEqual([
      'becanu-19-diti597',
      'bideta-97-cezo697',
    ]);
  });

  it('de-duplicates a repeated slug', () => {
    expect(extractSlugs('bixefi-77-moki051 ... bixefi-77-moki051')).toEqual(['bixefi-77-moki051']);
  });

  it('is empty when nothing matches', () => {
    expect(extractSlugs('no slugs here')).toEqual([]);
  });
});

describe('centerXOf', () => {
  it('centres a rect on x + width/2', () => {
    expect(centerXOf(el('rect', { x: '10', width: '20' }))).toBe(20);
  });

  it('reads a text element at its x', () => {
    expect(centerXOf(el('text', { x: '15' }))).toBe(15);
  });

  it('reads an ellipse at its cx', () => {
    expect(centerXOf(el('ellipse', { cx: '42' }))).toBe(42);
  });

  it("averages a line's two x endpoints", () => {
    expect(centerXOf(el('line', { x1: '10', x2: '30' }))).toBe(20);
  });

  it("averages a polygon's point x-coordinates", () => {
    expect(centerXOf(el('polygon', { points: '0,0 10,5 20,0 10,-5' }))).toBe(10);
  });

  it('is undefined for a tag this probe does not position', () => {
    expect(centerXOf(el('g', {}))).toBeUndefined();
  });

  it('is undefined when the required attribute is missing', () => {
    expect(centerXOf(el('ellipse', {}))).toBeUndefined();
  });
});

describe('categoryOf', () => {
  it('identifies a fork/join bar by its rx=2.5 corner radius', () => {
    const category: CompoundCategory | undefined = categoryOf(el('rect', { rx: '2.5', fill: '#555' }));
    expect(category).toBe('fork/join bar');
  });

  it('does not classify an ordinary action-box rect (rx=12.5) as a bar', () => {
    expect(categoryOf(el('rect', { rx: '12.5' }))).toBeUndefined();
  });

  it('identifies a HORIZONTAL 1.5 stroke-width line as a split/join line', () => {
    expect(categoryOf(el('line', { 'stroke-width': '1.5', y1: '10', y2: '10' }))).toBe('split/join line');
  });

  it('does not classify a VERTICAL 1.5 stroke-width line -- a swimlane divider shares the same thickness', () => {
    expect(categoryOf(el('line', { 'stroke-width': '1.5', y1: '0', y2: '100' }))).toBeUndefined();
  });

  it('does not classify an ordinary line as a split/join line', () => {
    expect(categoryOf(el('line', { 'stroke-width': '1', y1: '10', y2: '10' }))).toBeUndefined();
  });

  it('identifies a polygon whose fill differs from its stroke as diamond/hexagon', () => {
    expect(categoryOf(el('polygon', { points: '0,0 1,1 2,0', fill: '#F1F1F1', stroke: '#181818' }))).toBe(
      'diamond/hexagon',
    );
  });

  it('does not classify an arrowhead polygon (fill equals stroke) as diamond/hexagon', () => {
    expect(categoryOf(el('polygon', { points: '0,0 1,1 2,0', fill: '#181818', stroke: '#181818' }))).toBeUndefined();
  });

  it('is undefined for a tag with no compound-shape role', () => {
    expect(categoryOf(el('ellipse', {}))).toBeUndefined();
  });
});
