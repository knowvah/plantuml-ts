import { describe, expect, it } from 'vitest';
import { Capture } from '../../../../src/core/ubrex/Capture.js';
import { umatcherFindFirstValueByKey, type UMatcher } from '../../../../src/core/ubrex/UMatcher.js';

const matcher = (values: Record<string, string[]>): UMatcher => ({
  startMatch: () => true,
  exactMatch: () => false,
  getAcceptedMatch: () => 'acc',
  findValuesByKey: (k) => values[k] ?? [],
  findFirstValuesByKeyPrefix: () => undefined,
  extractByPrefix: () => Capture.EMPTY,
  findFirstValueByKey(k) {
    return umatcherFindFirstValueByKey(this, k);
  },
});

describe('UMatcher (UMatcher.java)', () => {
  it('default findFirstValueByKey returns the first value or undefined (:54-59)', () => {
    const m = matcher({ a: ['x', 'y'] });
    expect(m.findFirstValueByKey('a')).toBe('x');
    expect(m.findFirstValueByKey('b')).toBeUndefined();
    expect(m.startMatch()).toBe(true);
    expect(m.exactMatch()).toBe(false);
    expect(m.getAcceptedMatch()).toBe('acc');
    expect(m.extractByPrefix('p')).toBe(Capture.EMPTY);
    expect(m.findFirstValuesByKeyPrefix('p')).toBeUndefined();
  });
});
