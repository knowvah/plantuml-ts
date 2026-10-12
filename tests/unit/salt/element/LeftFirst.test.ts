/**
 * `LeftFirst` (LeftFirst.java:42-53): column span first, then the leading
 * column; the raw difference is returned, as upstream.
 */
import { describe, expect, it } from 'vitest';
import { Cell } from '../../../../src/diagrams/salt/Cell.js';
import { LeftFirst } from '../../../../src/diagrams/salt/element/LeftFirst.js';

/** A cell at (row, col) widened `merges` columns to the right. */
function cell(row: number, col: number, merges = 0): Cell {
  const c = new Cell(row, col);
  for (let i = 0; i < merges; i++) c.mergeLeft();
  return c;
}

describe('LeftFirst#compare', () => {
  const leftFirst = new LeftFirst();

  it('returns the column-count difference when the spans differ', () => {
    expect(leftFirst.compare(cell(0, 4, 2), cell(3, 0))).toBe(2);
    expect(leftFirst.compare(cell(3, 0), cell(0, 4, 2))).toBe(-2);
  });

  it('returns the min-column difference for equal spans, ignoring rows', () => {
    expect(leftFirst.compare(cell(9, 3), cell(0, 1))).toBe(2);
    expect(leftFirst.compare(cell(0, 1, 1), cell(5, 1, 1))).toBe(0);
  });

  it('sorts single columns left to right before any span (stable for ties)', () => {
    const wide = cell(1, 0, 1);
    const a = cell(0, 2);
    const b = cell(1, 2);
    const c = cell(0, 0);
    const sorted = [wide, a, b, c].sort((x, y) => leftFirst.compare(x, y));
    expect(sorted).toEqual([c, a, b, wide]);
    expect(sorted[1]).toBe(a);
    expect(sorted[2]).toBe(b);
  });
});
