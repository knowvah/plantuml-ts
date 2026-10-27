import { describe, expect, it } from 'vitest';
import { RealDeltaLive } from '../../../../src/core/real/RealDeltaLive.js';
import { RealUtils } from '../../../../src/core/real/RealUtils.js';

describe('RealDeltaLive', () => {
  it('re-reads the offset on every resolution (java:61-64)', () => {
    const origin = RealUtils.createOrigin();
    let offset = 5;
    const live = RealUtils.withLiveOffset(origin.addAtLeast(10), () => offset);
    expect(live).toBeInstanceOf(RealDeltaLive);
    expect(live.getName()).toBe('[DelegatedLive]');
    expect(live.getCurrentValue()).toBe(15);
    offset = 7;
    expect(live.getCurrentValue()).toBe(17);
  });

  it('addAtLeast keeps the live supplier (java:66-68)', () => {
    const origin = RealUtils.createOrigin();
    let offset = 1;
    const next = RealUtils.withLiveOffset(origin, () => offset).addAtLeast(10);
    offset = 2;
    expect(next.getCurrentValue()).toBe(12);
  });

  it('ensureBiggerThan applies the negated live offset (java:70-72)', () => {
    const origin = RealUtils.createOrigin();
    let offset = 5;
    const base = origin.addAtLeast(10);
    const live = RealUtils.withLiveOffset(base, () => offset);
    offset = 7;
    live.ensureBiggerThan(origin.addFixed(100));
    origin.compileNow();
    // force(RealDeltaLive(RealDelta(O,100), -7), base, 0): base >= 93.
    expect(base.getCurrentValue()).toBe(93);
    expect(live.getCurrentValue()).toBe(100);
  });

  it('move delegates (java:74-76)', () => {
    const origin = RealUtils.createOrigin();
    const base = origin.addAtLeast(10);
    (RealUtils.withLiveOffset(base, () => 1) as RealDeltaLive).move(3);
    expect(base.getCurrentValue()).toBe(13);
  });
});
