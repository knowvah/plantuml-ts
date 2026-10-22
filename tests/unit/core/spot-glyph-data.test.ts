/**
 * `core/spot-glyph-data.ts` -- the circled-character spot outline
 * (`CircledCharacter.java:63-70` -> `DriverCenteredCharacterSvg.java:56-81`).
 * Expected strings are the jar's own `<path d>` from sequence goldens
 * (`test-results/dot-cache/sequence/<slug>/in.svg`), compared per coordinate
 * within `compare.ts`'s 0.01 tolerance (the lifted size-17 table keeps four
 * decimals, the jar three).
 */
import { describe, it, expect } from 'vitest';
import { spotGlyphPath, DEFAULT_SPOT_FONT_SIZE } from '../../../src/core/spot-glyph-data.js';

const TOLERANCE = 0.011;

/** xakuro-97-tado489, `<< (C,#ADD1B2) Testable >>`, 2nd badge: ellipse cx=133.637 cy=89 rx=11. */
const XAKURO_C =
  'M136.111,95.143 Q135.53,95.442 134.89,95.591 Q134.251,95.741 133.546,95.741 Q131.039,95.741 129.719,94.089 Q128.399,92.437 128.399,89.316 Q128.399,86.187 129.719,84.535 Q131.039,82.883 133.546,82.883 Q134.251,82.883 134.899,83.032 Q135.546,83.182 136.111,83.48 L136.111,86.203 Q135.48,85.622 134.886,85.352 Q134.293,85.083 133.662,85.083 Q132.317,85.083 131.632,86.149 Q130.948,87.216 130.948,89.316 Q130.948,91.408 131.632,92.474 Q132.317,93.541 133.662,93.541 Q134.293,93.541 134.886,93.271 Q135.48,93.001 136.111,92.42 Z';
/** nimoxu-60-xale291, `<< (U,#ADD1B2) >>`, 2nd badge: ellipse cx=104.45 cy=137 rx=11. */
const NIMOXU_U =
  'M100.33,139.176 L100.33,131.357 L102.779,131.357 L102.779,139.791 Q102.779,140.72 103.252,141.247 Q103.725,141.774 104.563,141.774 Q105.402,141.774 105.875,141.247 Q106.348,140.72 106.348,139.791 L106.348,131.357 L108.797,131.357 L108.797,139.176 Q108.797,141.7 107.792,142.845 Q106.788,143.991 104.563,143.991 Q102.347,143.991 101.338,142.845 Q100.33,141.7 100.33,139.176 Z';
/** fakova-98-suze610, `CircledCharacterFontSize 10`, 2nd badge: ellipse cx=227.938 cy=36 rx=9. */
const FAKOVA_C10 =
  'M229.216,39.79 Q228.874,39.966 228.498,40.054 Q228.122,40.142 227.707,40.142 Q226.232,40.142 225.456,39.17 Q224.68,38.198 224.68,36.362 Q224.68,34.521 225.456,33.55 Q226.232,32.578 227.707,32.578 Q228.122,32.578 228.503,32.666 Q228.884,32.754 229.216,32.93 L229.216,34.531 Q228.845,34.189 228.496,34.031 Q228.146,33.872 227.775,33.872 Q226.984,33.872 226.582,34.5 Q226.179,35.127 226.179,36.362 Q226.179,37.593 226.582,38.22 Q226.984,38.848 227.775,38.848 Q228.146,38.848 228.496,38.689 Q228.845,38.53 229.216,38.188 Z';

function numbers(d: string): number[] {
  return (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
}

function commands(d: string): string {
  return d.replace(/[-\d.,\s]+/g, ' ').trim();
}

function expectSameOutline(actual: string | undefined, golden: string): void {
  expect(actual).toBeDefined();
  expect(commands(actual!)).toBe(commands(golden));
  const got = numbers(actual!);
  const want = numbers(golden);
  expect(got).toHaveLength(want.length);
  got.forEach((v, i) => expect(Math.abs(v - want[i]!)).toBeLessThan(TOLERANCE));
}

describe('spotGlyphPath', () => {
  it('translates the size-17 C to a badge centre (xakuro golden)', () => {
    expectSameOutline(spotGlyphPath('C', DEFAULT_SPOT_FONT_SIZE, 133.637, 89), XAKURO_C);
  });

  it('places the size-17 U captured at its own centre onto another centre (nimoxu golden)', () => {
    expectSameOutline(spotGlyphPath('U', DEFAULT_SPOT_FONT_SIZE, 104.45, 137), NIMOXU_U);
  });

  it('uses the size-10 capture, not the size-17 shape, for fontSize 10 (fakova golden)', () => {
    expectSameOutline(spotGlyphPath('C', 10, 227.938, 36), FAKOVA_C10);
  });

  it('scales every coordinate about the captured centre by k', () => {
    const unit = numbers(spotGlyphPath('C', 10, 26, 26)!);
    const doubled = numbers(spotGlyphPath('C', 10, 52, 52, 2)!);
    unit.forEach((v, i) => expect(doubled[i]).toBeCloseTo(v * 2, 2));
  });

  it('answers undefined for an uncaptured size or letter, never a stand-in shape', () => {
    expect(spotGlyphPath('C', 11, 0, 0)).toBeUndefined();
    expect(spotGlyphPath('Z', DEFAULT_SPOT_FONT_SIZE, 0, 0)).toBeUndefined();
    expect(spotGlyphPath('c', DEFAULT_SPOT_FONT_SIZE, 0, 0)).toBeUndefined();
    expect(spotGlyphPath('toString', DEFAULT_SPOT_FONT_SIZE, 0, 0)).toBeUndefined();
    expect(spotGlyphPath('U', 10, 0, 0)).toBeUndefined();
  });
});
