/**
 * `salt/element/TableStrategy.java` — the six table-line strategies and
 * `fromChar`'s char -> constant table (java:39-40, 48-55).
 */
import { describe, expect, it } from 'vitest';
import { TableStrategy, fromChar } from '../../../../src/diagrams/salt/element/TableStrategy.js';

describe('TableStrategy (TableStrategy.java:39-40)', () => {
  it('declares the six upstream constants in upstream order', () => {
    expect(Object.values(TableStrategy)).toEqual([
      'DRAW_NONE',
      'DRAW_OUTSIDE',
      'DRAW_OUTSIDE_WITH_TITLE',
      'DRAW_HORIZONTAL',
      'DRAW_VERTICAL',
      'DRAW_ALL',
    ]);
  });
});

describe('fromChar (TableStrategy.java:48-55)', () => {
  it.each([
    [' ', TableStrategy.DRAW_NONE],
    ['+', TableStrategy.DRAW_OUTSIDE],
    ['^', TableStrategy.DRAW_OUTSIDE_WITH_TITLE],
    ['-', TableStrategy.DRAW_HORIZONTAL],
    ['!', TableStrategy.DRAW_VERTICAL],
    ['#', TableStrategy.DRAW_ALL],
  ])('maps %j to %s', (c, expected) => {
    expect(fromChar(c)).toBe(expected);
  });

  it.each(['.', 'T', '*', ''])('returns undefined (upstream null) for %j', (c) => {
    expect(fromChar(c)).toBeUndefined();
  });
});
