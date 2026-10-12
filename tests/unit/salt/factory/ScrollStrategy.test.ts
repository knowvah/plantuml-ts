/**
 * `salt/factory/ScrollStrategy.java` — the three scroll strategies and
 * `fromDesc`'s suffix test (java:40, 42-50).
 */
import { describe, expect, it } from 'vitest';
import { ScrollStrategy, fromDesc } from '../../../../src/diagrams/salt/factory/ScrollStrategy.js';

describe('ScrollStrategy (ScrollStrategy.java:40)', () => {
  it('declares the three upstream constants in upstream order', () => {
    expect(Object.values(ScrollStrategy)).toEqual(['BOTH', 'VERTICAL_ONLY', 'HORIZONTAL_ONLY']);
  });
});

describe('fromDesc (ScrollStrategy.java:42-50)', () => {
  it.each([
    ['{S-', ScrollStrategy.HORIZONTAL_ONLY],
    ['{SI', ScrollStrategy.VERTICAL_ONLY],
    ['{S', ScrollStrategy.BOTH],
    ['', ScrollStrategy.BOTH],
    // endsWith, not contains: only the LAST char decides.
    ['{S-I', ScrollStrategy.VERTICAL_ONLY],
    ['{SI-', ScrollStrategy.HORIZONTAL_ONLY],
    // case-sensitive: a lower-case i is not VERTICAL_ONLY.
    ['{Si', ScrollStrategy.BOTH],
  ])('maps %j to %s', (s, expected) => {
    expect(fromDesc(s)).toBe(expected);
  });
});
