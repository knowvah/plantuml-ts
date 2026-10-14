import { describe, expect, it } from 'vitest';
import { distance } from '../../../../../src/core/klimt/color/ColorUtils.js';

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
