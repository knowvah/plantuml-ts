/**
 * `Cell` against the Java (`salt/Cell.java:38-86`). Values are from a jshell
 * probe of the 1.2026.8beta1 oracle jar: `new Cell(2,3)` merged left twice
 * prints `(2,3)-(2,5)` with minRow 2, maxRow 2, minCol 3, maxCol 5, nbRows 1,
 * nbCols 3; a fresh `new Cell(0,0)` prints `(0,0)-(0,0)` and spans 1×1.
 */
import { describe, expect, it } from 'vitest';
import { Cell } from '../../../src/diagrams/salt/Cell.js';

describe('Cell', () => {
  it('starts as a 1x1 span at its row and column', () => {
    const c = new Cell(0, 0);
    expect(c.getNbRows()).toBe(1);
    expect(c.getNbCols()).toBe(1);
    expect(c.toString()).toBe('(0,0)-(0,0)');
  });

  it('grows only maxCol on mergeLeft (jar: (2,3)-(2,5) after two merges)', () => {
    const c = new Cell(2, 3);
    c.mergeLeft();
    c.mergeLeft();
    expect(c.getMinRow()).toBe(2);
    expect(c.getMaxRow()).toBe(2);
    expect(c.getMinCol()).toBe(3);
    expect(c.getMaxCol()).toBe(5);
    expect(c.getNbRows()).toBe(1);
    expect(c.getNbCols()).toBe(3);
    expect(c.toString()).toBe('(2,3)-(2,5)');
  });
});
