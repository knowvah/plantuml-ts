import { describe, it, expect } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

/**
 * Seam #4 (oracle/patches/0004-oracle-space-width.patch): U+0020 measures 44
 * tenths of a 16 pt em instead of the table's 0
 * (UnicodeFontWidthSansSerif.java block 0, index 0x20). U+0021 and U+00A0 are
 * 44 in the same table; Helvetica and Arial agree. Every width is then
 * rounded to float like the stock SVG bounder (isw D2/D3-AMEND).
 */
const m = new DeterministicMeasurer();
const font = (size: number) => ({ family: 'sans-serif', size });
const width = (text: string, size: number): number => m.measure(text, font(size)).width;

describe('DeterministicMeasurer — space width (D1)', () => {
  it('"a b" at 12 pt is 16.65 (jar textLength)', () => {
    expect(width('a b', 12)).toBe(Math.fround(16.65));
  });

  it('a lone space at 12 pt is 3.3', () => {
    expect(width(' ', 12)).toBe(Math.fround(3.3));
  });

  it('a space at 16 pt is 4.4 and equals "!" and NO-BREAK SPACE (the same advance)', () => {
    expect(width(' ', 16)).toBe(Math.fround(4.4));
    expect(width('!', 16)).toBe(Math.fround(4.4));
    expect(width(' ', 16)).toBe(Math.fround(4.4));
  });

  it('counts every space and keeps the height', () => {
    expect(width('  ', 12)).toBe(Math.fround(6.6));
    expect(m.measure('a b', font(12)).height).toBe(12);
  });

  it('text without a space is the table width rounded to float', () => {
    expect(width('Component', 14)).toBe(Math.fround(72.3625));
  });
});

/** D2: block 0's other zeros stay 0, each for a reason. */
const REMAINING_ZEROS: readonly (readonly [number, string])[] = [
  [0x09, 'TAB: control/whitespace, never drawn as a glyph'],
  [0x0a, 'LF: control/whitespace, never drawn as a glyph'],
  [0x0b, 'VT: control/whitespace, never drawn as a glyph'],
  [0x0c, 'FF: control/whitespace, never drawn as a glyph'],
  [0x0d, 'CR: control/whitespace, never drawn as a glyph'],
  [0x1d, 'GS: control character'],
  [0xad, 'SOFT HYPHEN: invisible unless a line breaks there'],
];

describe('DeterministicMeasurer — block 0 zeros other than U+0020 stay 0 (D2)', () => {
  it.each(REMAINING_ZEROS)('U+%s (%s) is 0', (cp, _reason) => {
    expect(width(String.fromCodePoint(cp), 16)).toBe(0);
  });

  it('block 0 has no other zero-width code point than those enumerated', () => {
    const zeros: number[] = [];
    for (let cp = 0; cp < 0x100; cp++) {
      if (width(String.fromCodePoint(cp), 16) === 0) zeros.push(cp);
    }
    expect(zeros).toEqual(REMAINING_ZEROS.map(([cp]) => cp));
  });
});
