import { describe, expect, it } from 'vitest';
import { distance } from '../../../../../src/core/klimt/color/ColorUtils.js';

const rgb = (r: number, g: number, b: number) => ({ r, g, b, a: 255 });

// ColorUtils.java:77-82: luma (299/587/114)/1000 of |dR|,|dG|,|dB|, int-truncated.
describe('ColorUtils.distance', () => {
  it('black to white is 255*(299+587+114)/1000 = 255', () => {
    expect(distance(rgb(0, 0, 0), rgb(255, 255, 255))).toBe(255);
  });
  it('red channel only: 100*299/1000 truncates to 29', () => {
    expect(distance(rgb(100, 0, 0), rgb(200, 0, 0))).toBe(29);
  });
  it('is symmetric and mixes channels: (10*299+20*587+30*114)/1000 = 18', () => {
    expect(distance(rgb(10, 40, 90), rgb(20, 20, 60))).toBe(18);
    expect(distance(rgb(20, 20, 60), rgb(10, 40, 90))).toBe(18);
  });
  it('identical colours are 0', () => {
    expect(distance(rgb(7, 8, 9), rgb(7, 8, 9))).toBe(0);
  });
});
