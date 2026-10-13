/**
 * `PSystemDonors#getCols` (PSystemDonors.java:146-154): the column split
 * `maxLine = (lines.size() + (nbCol - 1) + reserved) / nbCol` (Java `int`
 * division), then `subList(i, min(size, i + maxLine))` stepping by `maxLine`.
 */
import { describe, expect, it } from 'vitest';
import { getCols } from '../../../src/diagrams/donors/PSystemDonors.js';

/** `line0`, `line1`, ... — distinct values so a mis-sliced column shows. */
function linesOf(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `line${String(i)}`);
}

describe('PSystemDonors.getCols (PSystemDonors.java:146-154)', () => {
  it('0 lines, 7 cols: maxLine = (0 + 6 + 0) / 7 = 0 and the loop never runs', () => {
    expect(getCols([], 7, 0)).toEqual([]);
  });

  it('1 line, 7 cols: maxLine = (1 + 6) / 7 = 1, one column', () => {
    expect(getCols(linesOf(1), 7, 0)).toEqual([['line0']]);
  });

  it('7 lines, 7 cols: maxLine = 13 / 7 = 1 (truncating), seven one-line columns', () => {
    expect(getCols(linesOf(7), 7, 0)).toEqual([
      ['line0'],
      ['line1'],
      ['line2'],
      ['line3'],
      ['line4'],
      ['line5'],
      ['line6'],
    ]);
  });

  it('22 lines, 7 cols: maxLine = 28 / 7 = 4, five full columns and a short last one', () => {
    const cols = getCols(linesOf(22), 7, 0);
    expect(cols.map((c) => c.length)).toEqual([4, 4, 4, 4, 4, 2]);
    expect(cols[0]).toEqual(['line0', 'line1', 'line2', 'line3']);
    expect(cols[5]).toEqual(['line20', 'line21']);
  });

  it('reserved lines widen every column: 22 lines, COLS 6, FREE_LINES 6 (java:70-71) gives maxLine 33 / 6 = 5', () => {
    expect(getCols(linesOf(22), 6, 6).map((c) => c.length)).toEqual([5, 5, 5, 5, 2]);
  });

  it('1 col: maxLine = (3 + 0 + 0) / 1 = 3, the whole list in one column', () => {
    expect(getCols(linesOf(3), 1, 0)).toEqual([['line0', 'line1', 'line2']]);
  });
});
