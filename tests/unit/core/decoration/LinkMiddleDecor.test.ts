/**
 * LinkMiddleDecor.test.ts — SI1/T2: the 7-value `LinkMiddleDecor` enum
 * (decoration/LinkMiddleDecor.java:47) and `getInversed` (:71-78).
 */
import { describe, expect, it } from 'vitest';
import { LinkMiddleDecor, getInversed } from '../../../../src/core/decoration/LinkMiddleDecor.js';

describe('LinkMiddleDecor values (java:47)', () => {
  it('has the 7 upstream values in declaration order', () => {
    expect(Object.keys(LinkMiddleDecor)).toEqual([
      'NONE',
      'CIRCLE',
      'CIRCLE_CIRCLED',
      'CIRCLE_CIRCLED1',
      'CIRCLE_CIRCLED2',
      'SUBSET',
      'SUPERSET',
    ]);
  });
});

describe('getInversed (java:71-78)', () => {
  it('swaps CIRCLE_CIRCLED1 and CIRCLE_CIRCLED2; everything else is fixed', () => {
    expect(getInversed(LinkMiddleDecor.CIRCLE_CIRCLED1)).toBe(LinkMiddleDecor.CIRCLE_CIRCLED2);
    expect(getInversed(LinkMiddleDecor.CIRCLE_CIRCLED2)).toBe(LinkMiddleDecor.CIRCLE_CIRCLED1);
    expect(getInversed(LinkMiddleDecor.NONE)).toBe(LinkMiddleDecor.NONE);
    expect(getInversed(LinkMiddleDecor.CIRCLE_CIRCLED)).toBe(LinkMiddleDecor.CIRCLE_CIRCLED);
    expect(getInversed(LinkMiddleDecor.SUBSET)).toBe(LinkMiddleDecor.SUBSET);
    expect(getInversed(LinkMiddleDecor.SUPERSET)).toBe(LinkMiddleDecor.SUPERSET);
  });
});
