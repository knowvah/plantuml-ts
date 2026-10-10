import { describe, it, expect } from 'vitest';
import { driverTextPlacement } from '../../../src/core/svg-text-font.js';

/** `DriverTextSvg.java:114-126`: NBSP for whitespace-only, leading spaces
 *  become an x shift, then `trin`. */
describe('driverTextPlacement (DriverTextSvg#draw preamble)', () => {
  it('shifts x by one space width per leading space and trims both ends', () => {
    expect(driverTextPlacement('  a king ', 3.85)).toEqual({ text: 'a king', dx: 7.7 });
  });

  it('leaves a run without leading spaces unshifted, trimming the tail', () => {
    expect(driverTextPlacement('KO ', 3.575)).toEqual({ text: 'KO', dx: 0 });
  });

  it('turns a whitespace-only run into NBSPs before trimming (no shift)', () => {
    expect(driverTextPlacement('   ', 3.85)).toEqual({ text: '   ', dx: 0 });
  });

  it('accumulates the shift by repeated addition, as the Java loop does', () => {
    const w = Math.fround(3.575);
    expect(driverTextPlacement('   x', w).dx).toBe(w + w + w);
  });
});
