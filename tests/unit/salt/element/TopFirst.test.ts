/**
 * `TopFirst` (TopFirst.java:42-53): row span first, then the leading row;
 * the raw difference is returned, as upstream.
 */
import { describe, expect, it } from 'vitest';
import { Cell } from '../../../../src/diagrams/salt/Cell.js';
import { TopFirst } from '../../../../src/diagrams/salt/element/TopFirst.js';

/** A cell at (row, col) widened `merges` columns to the right. */
function cell(row: number, col: number, merges = 0): Cell {
  const c = new Cell(row, col);
  for (let i = 0; i < merges; i++) c.mergeLeft();
  return c;
}

/** `Cell` has no row merge (Cell.java:53-55 is `mergeLeft` only), so no real
 *  cell spans two rows; this stand-in exercises TopFirst.java:46-48. */
function tallCell(minRow: number, nbRows: number): Cell {
  return { getNbRows: () => nbRows, getMinRow: () => minRow } as unknown as Cell;
}

describe('TopFirst#compare', () => {
  const topFirst = new TopFirst();

  it('returns the row-count difference when the spans differ', () => {
    expect(topFirst.compare(tallCell(0, 3), cell(5, 0))).toBe(2);
    expect(topFirst.compare(cell(5, 0), tallCell(0, 3))).toBe(-2);
  });

  it('returns the min-row difference for equal (single-row) spans, ignoring columns', () => {
    expect(topFirst.compare(cell(4, 0), cell(1, 7))).toBe(3);
    expect(topFirst.compare(cell(1, 0, 3), cell(1, 9))).toBe(0);
  });

  it('every Positionner2 cell is one row tall, so the order is by top row only', () => {
    const r2 = cell(2, 0);
    const r0 = cell(0, 3);
    const r1 = cell(1, 0, 2);
    expect([r2, r0, r1].sort((x, y) => topFirst.compare(x, y))).toEqual([r0, r1, r2]);
  });
});
