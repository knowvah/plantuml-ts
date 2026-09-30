/**
 * cdd6 T3f: `HUSLColorConverter` against values computed by the upstream
 * class itself -- a throwaway `Probe.java` compiled against
 * `plantuml-1.2026.8beta1.jar` calling `HUSLColorConverter.rgbToHsluv`,
 * `hsluvToRgb`, `rgbToHpluv`, `hexToHsluv`, `hsluvToHex`, `hpluvToHex`,
 * `hexToHpluv`, `rgbToHex` (outputs quoted below, `Arrays.toString` form).
 * Transcendental calls may differ from the JVM in the last ulp, hence
 * `toBeCloseTo(.., 9)`.
 */
import { describe, it, expect } from 'vitest';
import {
  rgbToHsluv,
  hsluvToRgb,
  rgbToHpluv,
  hexToHsluv,
  hsluvToHex,
  hpluvToHex,
  hexToHpluv,
  rgbToHex,
  hexToRgb,
} from '../../../../../src/core/klimt/color/HUSLColorConverter.js';

function expectTuple(actual: readonly number[], expected: readonly number[]): void {
  expect(actual).toHaveLength(expected.length);
  expected.forEach((v, i) => expect(actual[i]).toBeCloseTo(v, 9));
}

describe('HUSLColorConverter (Java-computed references)', () => {
  it('rgbToHsluv / hsluvToRgb / rgbToHpluv on the tozizu palette', () => {
    // [0.9921875, 0.99609375, 0.86328125] hsluv=[87.18903113238878, 69.78017400535967, 98.80647438612372]
    //   hpluv=[87.18903113238878, 1014.2858122365361, 98.80647438612372]
    const feffdd = [0xfe / 256, 0xff / 256, 0xdd / 256];
    expectTuple(rgbToHsluv(feffdd), [87.18903113238878, 69.78017400535967, 98.80647438612372]);
    expectTuple(hsluvToRgb(rgbToHsluv(feffdd)), feffdd);
    expect(rgbToHpluv(feffdd)[1]).toBeCloseTo(1014.2858122365361, 7);
    // [0.09375 x3] hsluv=[0.0, 1.9154211688306335E-12, 8.20034743599357]
    expectTuple(rgbToHsluv([0.09375, 0.09375, 0.09375]), [0, 1.9154211688306335e-12, 8.20034743599357]);
    // [0.8, 0.8, 1.0] hsluv=[265.87432021818285, 99.99999999999525, 83.56996245820042]
    expectTuple(rgbToHsluv([0.8, 0.8, 1.0]), [265.87432021818285, 99.99999999999525, 83.56996245820042]);
    // [0.2, 0.5, 0.1] hpluv=[123.51487143368418, 170.0628751715398, 47.08429980440468]
    expectTuple(rgbToHpluv([0.2, 0.5, 0.1]), [123.51487143368418, 170.0628751715398, 47.08429980440468]);
  });

  it('takes the L > 99.9999999 / L < 1e-8 shortcuts for white and black', () => {
    // [1,1,1] hsluv=[0.0, 0.0, 100.0]; [0,0,0] hsluv=[0.0, 0.0, 0.0]
    expectTuple(rgbToHsluv([1, 1, 1]), [0, 0, 100]);
    expectTuple(rgbToHsluv([0, 0, 0]), [0, 0, 0]);
    expectTuple(hsluvToRgb([0, 0, 0]), [0, 0, 0]);
  });

  it('hex round trips', () => {
    // hexToHsluv=[257.68127843290245, 84.58180158212187, 45.03314922580453] hsluvToHex=#3d79bf
    // hpluvToHex=#657899 hexToHpluv=[257.68127843290245, 254.33048256836415, 45.03314922580453] hex=#33801a
    expectTuple(hexToHsluv('#3366cc'), [257.68127843290245, 84.58180158212187, 45.03314922580453]);
    expect(hsluvToHex([250, 80, 50])).toBe('#3d79bf');
    expect(hpluvToHex([250, 80, 50])).toBe('#657899');
    expectTuple(hexToHpluv('#3366cc'), [257.68127843290245, 254.33048256836415, 45.03314922580453]);
    expect(rgbToHex([0.2, 0.5, 0.1])).toBe('#33801a');
    expectTuple(hexToRgb('#33801a'), [0x33 / 255, 0x80 / 255, 0x1a / 255]);
  });

  it('rejects an out-of-gamut channel like rgbPrepare', () => {
    expect(() => rgbToHex([1.01, 0, 0])).toThrow('Illegal rgb value: 1.01');
  });
});
