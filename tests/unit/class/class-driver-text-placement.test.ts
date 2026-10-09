/** isw-T2-cls F2b/F2f: DriverTextSvg.java:113-126 for plain class runs. */
import { describe, expect, it } from 'vitest';
import { placeDriverRun, plainRowRender } from '../../../src/diagrams/class/class-driver-text-placement.js';

const SPACE = 3.85; // 14pt, oracle seam #4
const measure = (s: string): number => s.length * SPACE;

describe('placeDriverRun', () => {
  it('shifts x per leading space and measures the trimmed text', () => {
    expect(placeDriverRun(10, ' XY ', measure)).toEqual({ x: 10 + SPACE, text: 'XY', textLength: 2 * SPACE });
  });
  it('leaves text with no edge spaces alone', () => {
    expect(placeDriverRun(10, 'XY', measure)).toEqual({ x: 10, text: 'XY', textLength: 2 * SPACE });
  });
});

describe('plainRowRender', () => {
  it('returns dx and trimmed width for a leading-space run', () => {
    expect(plainRowRender(' : type', measure)).toEqual({ renderDx: SPACE, renderWidth: 6 * SPACE });
  });
  it('returns nothing when the text draws as written', () => {
    expect(plainRowRender('name', measure)).toEqual({});
  });
});
