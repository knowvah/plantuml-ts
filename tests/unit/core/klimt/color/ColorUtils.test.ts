import { describe, expect, it } from 'vitest';
import { distance, to255 } from '../../../../../src/core/klimt/color/ColorUtils.js';

const rgb = (r: number, g: number, b: number) => ({ r, g, b, a: 255 });

// ColorUtils.java:77-82 returns getGrayScaleInternal(|dR|, |dG|, |dB|) — the private
// java:55-58 overload `red * 299 + green * 587 + blue * 114`, with NO `/ 1000`
// (only getGrayScaleInternalFromRGB divides, java:48-52).
describe('ColorUtils.distance', () => {
  it('black to white is 255*(299+587+114) = 255000', () => {
    expect(distance(rgb(0, 0, 0), rgb(255, 255, 255))).toBe(255000);
  });
  it('red channel only: 100*299 = 29900', () => {
    expect(distance(rgb(100, 0, 0), rgb(200, 0, 0))).toBe(29900);
  });
  it('is symmetric and mixes channels: 10*299+20*587+30*114 = 18150', () => {
    expect(distance(rgb(10, 40, 90), rgb(20, 20, 60))).toBe(18150);
    expect(distance(rgb(20, 20, 60), rgb(10, 40, 90))).toBe(18150);
  });
  it('identical colours are 0', () => {
    expect(distance(rgb(7, 8, 9), rgb(7, 8, 9))).toBe(0);
  });
});

// ColorUtils.java:169-177: `(int) (255 * value)` truncates toward zero, then
// clamps to [0, 255]. A fraction >= .5 must NOT round up.
describe('ColorUtils.to255', () => {
  it('truncates instead of rounding: 255 * 0.999 = 254.745 -> 254', () => {
    expect(to255(0.999)).toBe(254);
  });
  it('truncates a just-below-integer product: 255 * (134.9 / 255) -> 134', () => {
    expect(to255(134.9 / 255)).toBe(134);
  });
  it('clamps above 1 to 255 and below 0 to 0', () => {
    expect(to255(1.01)).toBe(255);
    expect(to255(-0.01)).toBe(0);
  });
  it('returns +0, never -0, for a small negative input', () => {
    expect(Object.is(to255(-0.001), 0)).toBe(true);
  });
});
