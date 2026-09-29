/**
 * cdd6 T3f: `ColorOrder` (`klimt/color/ColorOrder.java:40-79`). GBR reverse
 * references from the same Java probe as `HUSLColorConverter.test.ts`
 * (`ColorOrder.GBR.getReverse(new XColor(r, g, b))`).
 */
import { describe, it, expect } from 'vitest';
import { ColorOrder, getColor, getReverse, fromString } from '../../../../../src/core/klimt/color/ColorOrder.js';

describe('ColorOrder', () => {
  it('permutes channels per order', () => {
    const c = { r: 1, g: 2, b: 3 };
    expect(getColor(ColorOrder.RGB, c)).toEqual({ r: 1, g: 2, b: 3 });
    expect(getColor(ColorOrder.RBG, c)).toEqual({ r: 1, g: 3, b: 2 });
    expect(getColor(ColorOrder.GRB, c)).toEqual({ r: 2, g: 1, b: 3 });
    expect(getColor(ColorOrder.GBR, c)).toEqual({ r: 2, g: 3, b: 1 });
    expect(getColor(ColorOrder.BRG, c)).toEqual({ r: 3, g: 1, b: 2 });
    expect(getColor(ColorOrder.BGR, c)).toEqual({ r: 3, g: 2, b: 1 });
  });

  it('getReverse complements the permuted channels (Java: [254,255,221] GBRrev=0,34,1)', () => {
    expect(getReverse(ColorOrder.GBR, { r: 254, g: 255, b: 221 })).toEqual({ r: 0, g: 34, b: 1 });
    expect(getReverse(ColorOrder.GBR, { r: 204, g: 204, b: 255 })).toEqual({ r: 51, g: 0, b: 51 });
    expect(getReverse(ColorOrder.GBR, { r: 255, g: 0, b: 0 })).toEqual({ r: 255, g: 255, b: 0 });
  });

  it('fromString is case-insensitive and null on anything else', () => {
    expect(fromString('bgr')).toBe(ColorOrder.BGR);
    expect(fromString('Rgb')).toBe(ColorOrder.RGB);
    expect(fromString('dark')).toBeUndefined();
    expect(fromString('')).toBeUndefined();
  });
});
