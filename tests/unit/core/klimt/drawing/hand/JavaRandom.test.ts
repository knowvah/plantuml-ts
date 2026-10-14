/**
 * `java.util.Random` values pinned from a JDK run (jshell, ufp journal):
 * `new Random(1234).nextLong()` twice, and `new Random(49360).nextLong()`
 * (49360 = `Long.parseLong("1234", 36)`, the `sudoku 1234` seed).
 */
import { describe, expect, it } from 'vitest';
import { JavaRandom } from '../../../../../../src/core/klimt/drawing/hand/JavaRandom.js';

describe('JavaRandom.nextLong (Random.java: ((long) next(32) << 32) + next(32))', () => {
  it('matches the JDK sequence for seed 1234, signed 64-bit', () => {
    const r = new JavaRandom(1234);
    expect(r.nextLong()).toBe(-6519408338692630574n);
    expect(r.nextLong()).toBe(-897291810407650440n);
  });

  it('matches the JDK for the sudoku 1234 seed', () => {
    expect(new JavaRandom(49360).nextLong()).toBe(6180259845519288173n);
  });
});
