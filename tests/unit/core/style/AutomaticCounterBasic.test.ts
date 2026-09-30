import { describe, expect, it } from 'vitest';
import { AutomaticCounterBasic } from '../../../../src/core/style/AutomaticCounterBasic.js';
import type { AutomaticCounter } from '../../../../src/core/style/AutomaticCounter.js';

describe('AutomaticCounterBasic (AutomaticCounterBasic.java:38-47)', () => {
  it('getNextInt pre-increments from 0, per instance', () => {
    const a: AutomaticCounter = new AutomaticCounterBasic();
    const b = new AutomaticCounterBasic();
    expect([a.getNextInt(), a.getNextInt(), a.getNextInt()]).toEqual([1, 2, 3]);
    expect(b.getNextInt()).toBe(1);
  });
});
