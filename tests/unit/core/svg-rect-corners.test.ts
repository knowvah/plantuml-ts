/**
 * `roundedCornerAttrs` — per-axis `rx`/`ry` attribute derivation, dropping
 * only an axis that is present and non-positive (NOT upstream's joint
 * `rx > 0 && ry > 0` guard — see the module's own doc comment for why).
 *
 * @see src/core/svg-rect-corners.ts
 */
import { describe, it, expect } from 'vitest';
import { roundedCornerAttrs } from '../../../src/core/svg-rect-corners.js';

describe('roundedCornerAttrs', () => {
  it('returns both axes when both are present and positive', () => {
    expect(roundedCornerAttrs(5, 3)).toEqual([
      ['rx', 5],
      ['ry', 3],
    ]);
  });

  it('returns only rx when ry is absent (per-axis, not upstream\'s joint guard)', () => {
    expect(roundedCornerAttrs(5, undefined)).toEqual([['rx', 5]]);
  });

  it('returns only ry when rx is absent', () => {
    expect(roundedCornerAttrs(undefined, 3)).toEqual([['ry', 3]]);
  });

  it('returns an empty array when both axes are absent', () => {
    expect(roundedCornerAttrs(undefined, undefined)).toEqual([]);
  });

  it('drops rx when it is exactly zero', () => {
    expect(roundedCornerAttrs(0, 3)).toEqual([['ry', 3]]);
  });

  it('drops ry when it is exactly zero', () => {
    expect(roundedCornerAttrs(5, 0)).toEqual([['rx', 5]]);
  });

  it('drops both when both are exactly zero', () => {
    expect(roundedCornerAttrs(0, 0)).toEqual([]);
  });

  it('drops rx when it is negative', () => {
    expect(roundedCornerAttrs(-2, 3)).toEqual([['ry', 3]]);
  });

  it('drops ry when it is negative', () => {
    expect(roundedCornerAttrs(5, -2)).toEqual([['rx', 5]]);
  });
});
