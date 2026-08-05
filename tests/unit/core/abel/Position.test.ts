import { describe, expect, it } from 'vitest';

import { Position, fromString, reverseDirection } from '../../../../src/core/abel/Position.js';
import { Direction, getInv, getShortCode, fromChar } from '../../../../src/core/abel/Direction.js';

/** Behavior tests from utils/Position.java and utils/Direction.java. */
describe('Position', () => {
  it('fromString resolves case-insensitively', () => {
    expect(fromString('top')).toBe(Position.TOP);
    expect(fromString('Bottom')).toBe(Position.BOTTOM);
    expect(fromString('LEFT')).toBe(Position.LEFT);
    expect(fromString('right')).toBe(Position.RIGHT);
  });

  it('fromString throws on an unknown name', () => {
    expect(() => fromString('middle')).toThrow('IllegalArgumentException');
  });

  it('reverseDirection maps LEFT/RIGHT and rejects TOP/BOTTOM', () => {
    expect(reverseDirection(Position.LEFT)).toBe(Direction.RIGHT);
    expect(reverseDirection(Position.RIGHT)).toBe(Direction.LEFT);
    expect(() => reverseDirection(Position.TOP)).toThrow('UnsupportedOperationException');
    expect(() => reverseDirection(Position.BOTTOM)).toThrow('UnsupportedOperationException');
  });
});

describe('Direction', () => {
  it('getInv returns the opposite direction', () => {
    expect(getInv(Direction.RIGHT)).toBe(Direction.LEFT);
    expect(getInv(Direction.LEFT)).toBe(Direction.RIGHT);
    expect(getInv(Direction.DOWN)).toBe(Direction.UP);
    expect(getInv(Direction.UP)).toBe(Direction.DOWN);
  });

  it('getShortCode is the first letter', () => {
    expect(getShortCode(Direction.RIGHT)).toBe('R');
    expect(getShortCode(Direction.UP)).toBe('U');
  });

  it('fromChar maps < > ^ and defaults to DOWN', () => {
    expect(fromChar('<')).toBe(Direction.LEFT);
    expect(fromChar('>')).toBe(Direction.RIGHT);
    expect(fromChar('^')).toBe(Direction.UP);
    expect(fromChar('v')).toBe(Direction.DOWN);
    expect(fromChar('x')).toBe(Direction.DOWN);
  });
});
