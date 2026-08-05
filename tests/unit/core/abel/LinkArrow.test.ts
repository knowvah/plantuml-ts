/**
 * LinkArrow.test.ts — SI1/T2: the 3-value `LinkArrow` enum
 * (abel/LinkArrow.java:43) and `reverse` (:45-53).
 */
import { describe, expect, it } from 'vitest';
import { LinkArrow, reverse } from '../../../../src/core/abel/LinkArrow.js';

describe('LinkArrow values (java:43)', () => {
  it('has the 3 upstream values in declaration order', () => {
    expect(Object.keys(LinkArrow)).toEqual(['NONE_OR_SEVERAL', 'DIRECT_NORMAL', 'BACKWARD']);
  });
});

describe('reverse (java:45-53)', () => {
  it('swaps DIRECT_NORMAL and BACKWARD; NONE_OR_SEVERAL is fixed', () => {
    expect(reverse(LinkArrow.DIRECT_NORMAL)).toBe(LinkArrow.BACKWARD);
    expect(reverse(LinkArrow.BACKWARD)).toBe(LinkArrow.DIRECT_NORMAL);
    expect(reverse(LinkArrow.NONE_OR_SEVERAL)).toBe(LinkArrow.NONE_OR_SEVERAL);
  });
});
