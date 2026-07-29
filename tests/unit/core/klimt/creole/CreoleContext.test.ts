/**
 * CreoleContext.test.ts — T7: unit coverage for `CreoleContext`
 * (klimt/creole/CreoleContext.java), the per-order ordered-list counter.
 */
import { describe, expect, it } from 'vitest';
import { CreoleContext } from '../../../../../src/core/klimt/creole/CreoleContext.js';

describe('CreoleContext', () => {
  it('getLocalNumber(order) returns 0, 1, 2, ... for repeated calls at the same order', () => {
    const ctx = new CreoleContext();
    expect(ctx.getLocalNumber(0)).toBe(0);
    expect(ctx.getLocalNumber(0)).toBe(1);
    expect(ctx.getLocalNumber(0)).toBe(2);
  });

  it('visiting a DEEPER order does not disturb a shallower order already in progress', () => {
    const ctx = new CreoleContext();
    expect(ctx.getLocalNumber(0)).toBe(0);
    expect(ctx.getLocalNumber(1)).toBe(0);
    expect(ctx.getLocalNumber(1)).toBe(1);
    // order 0's own counter is untouched by the order-1 activity above.
    expect(ctx.getLocalNumber(0)).toBe(1);
  });

  it('requesting a higher order than seen before grows the stack with 0s', () => {
    const ctx = new CreoleContext();
    expect(ctx.getLocalNumber(3)).toBe(0);
    expect(ctx.getLocalNumber(1)).toBe(0);
  });

  it('re-descending to a shallower order resets deeper counters (ensureStackOk truncation)', () => {
    const ctx = new CreoleContext();
    // Build depth 0,1,2 up: order 2 gets bumped to 1, 2.
    expect(ctx.getLocalNumber(0)).toBe(0);
    expect(ctx.getLocalNumber(1)).toBe(0);
    expect(ctx.getLocalNumber(2)).toBe(0);
    expect(ctx.getLocalNumber(2)).toBe(1);
    // Returning to order 1 truncates the stack past index 1 (drops order 2's
    // counter); re-entering order 2 afterward restarts from 0.
    expect(ctx.getLocalNumber(1)).toBe(1);
    expect(ctx.getLocalNumber(2)).toBe(0);
  });
});
