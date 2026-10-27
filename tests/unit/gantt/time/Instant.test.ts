import { describe, expect, it } from 'vitest';
import type { Clock } from '../../../../src/core/clock.js';
import { Instant } from '../../../../src/diagrams/gantt/time/Instant.js';

describe('gantt Instant', () => {
  it('create/getMillis/toString (Instant.java:45,57,62)', () => {
    const i = Instant.create(1234);
    expect(i.getMillis()).toBe(1234);
    expect(i.toString()).toBe('1234');
  });

  it('today() reads the injected clock (Instant.java:49-51, D3a)', () => {
    const clock: Clock = { nowMillis: () => 86_400_000, zone: 'UTC' };
    expect(Instant.today(clock).getMillis()).toBe(86_400_000);
  });

  it('today() defaults to DEFAULT_CLOCK, instant 0', () => {
    expect(Instant.today().getMillis()).toBe(0);
  });

  it('equals compares ms (Instant.java:76-79)', () => {
    expect(Instant.create(3).equals(Instant.create(3))).toBe(true);
    expect(Instant.create(3).equals(Instant.create(4))).toBe(false);
  });

  it.each([
    [1, 2, -1],
    [2, 2, 0],
    [3, 2, 1],
  ])('compareTo(%i, %i) = %i (Long.compareTo, Instant.java:81)', (a, b, expected) => {
    expect(Instant.create(a).compareTo(Instant.create(b))).toBe(expected);
  });

  it.each([
    [0, 0],
    [1, 1],
    [-1, 0], // Long.hashCode(-1L) = (int)(v ^ v>>>32) = 0
    [4_294_967_296, 1], // 2^32 -> (int)(2^32 ^ 1) = 1
    [1_700_000_000_000, -807_048_821], // 395*2^32 + 3487918080 -> (int)(lo ^ hi)
  ])('hashCode(%i) = Long.hashCode (Instant.java:67)', (ms, expected) => {
    expect(Instant.create(ms).hashCode()).toBe(expected);
  });
});
