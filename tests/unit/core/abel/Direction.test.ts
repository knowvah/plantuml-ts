/**
 * Direction.test.ts — `Direction.getWBSDirection` (utils/Direction.java:75-86).
 */
import { describe, expect, it } from 'vitest';
import { Direction, getWBSDirection } from '../../../../src/core/abel/Direction.js';

describe('getWBSDirection (Direction.java:75-86)', () => {
  it('defaults to LEFT when TYPE contains "-" and no direction is given', () => {
    expect(getWBSDirection('--', undefined, undefined)).toBe(Direction.LEFT);
    expect(getWBSDirection('  --', undefined, undefined)).toBe(Direction.LEFT);
  });

  it('defaults to RIGHT for "*" and "+" types and no direction', () => {
    expect(getWBSDirection('**', undefined, undefined)).toBe(Direction.RIGHT);
    expect(getWBSDirection(' ++', undefined, undefined)).toBe(Direction.RIGHT);
  });

  it('">" overrides a "-" type to RIGHT, in either group', () => {
    expect(getWBSDirection('--', '>', undefined)).toBe(Direction.RIGHT);
    expect(getWBSDirection('--', undefined, '>')).toBe(Direction.RIGHT);
  });

  it('"<" overrides a "*" type to LEFT, in either group', () => {
    expect(getWBSDirection('**', '<', undefined)).toBe(Direction.LEFT);
    expect(getWBSDirection('**', undefined, '<')).toBe(Direction.LEFT);
  });

  it('first non-undefined group wins (getLazzy; unreachable from the commands)', () => {
    // DIRECTION_1/_2 sit in the two arms of one RegexOr, so a real match
    // never has both set; pinned only to document getLazzy's order.
    expect(getWBSDirection('*', '>', '<')).toBe(Direction.RIGHT);
    expect(getWBSDirection('*', '<', '>')).toBe(Direction.LEFT);
  });
});
