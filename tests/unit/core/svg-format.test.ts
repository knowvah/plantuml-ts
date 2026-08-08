/**
 * T1 — shared SVG format rules (`src/core/svg-format.ts`).
 *
 * Cases 1-3 and the opacity/percent zero/one short-circuits are taken
 * verbatim from `plans/svg-output-size-reduction/batch-1/T1-svg-format-
 * rules.md`'s acceptance criteria. Case 4's `28.4805` value differs from
 * the doc's stated `'28.48'` — verified against real `java.util.Formatter`
 * (openjdk 21.0.1, `String.format(Locale.US, "%.3f", 28.4805)`) to produce
 * `'28.481'`, not `'28.48'`. The HALF_UP-on-shortest-round-trip-decimal
 * algorithm (`javaFixedN`, generalizing `number-format.ts#javaFixed4`) is
 * confirmed correct against five other jar-observed values in this same
 * family (`1.005@2->1.01`, `2.675@2->2.68`, `0.125@2->0.13`,
 * `0.375@2->0.38`, plus the doc's own `8.69375@4->8.6938`), so `'28.481'`
 * is what this module must produce. The task file's criterion has been
 * corrected in place; the verification trail is in
 * `plans/svg-output-size-reduction/decision-journal.md`.
 */
import { describe, it, expect } from 'vitest';

import {
  DEFAULT_SVG_DECIMALS,
  trimZeros,
  formatDecimal,
  shortenColor,
  formatOpacity,
  formatPercent,
} from '../../../src/core/svg-format.js';

describe('svg-format', () => {
  it('DEFAULT_SVG_DECIMALS is 3', () => {
    expect(DEFAULT_SVG_DECIMALS).toBe(3);
  });

  describe('shortenColor', () => {
    it('shortens #RRGGBB to #RGB when each pair repeats', () => {
      expect(shortenColor('#FF0000')).toBe('#F00');
      expect(shortenColor('#FFFF00')).toBe('#FF0');
      expect(shortenColor('#000000')).toBe('#000');
    });

    it('returns non-shortenable 7-char colors unchanged', () => {
      expect(shortenColor('#181818')).toBe('#181818');
      expect(shortenColor('#ADD1B2')).toBe('#ADD1B2');
    });

    it('passes through #RRGGBBAA, named colors, and url() unchanged', () => {
      expect(shortenColor('#FF0000AA')).toBe('#FF0000AA');
      expect(shortenColor('red')).toBe('red');
      expect(shortenColor('url(#g1)')).toBe('url(#g1)');
    });

    it('is null/undefined-safe', () => {
      expect(shortenColor(null as unknown as string)).toBe(null);
      expect(shortenColor(undefined as unknown as string)).toBe(undefined);
      expect(shortenColor('')).toBe('');
    });
  });

  describe('formatDecimal', () => {
    it('short-circuits zero to "0"', () => {
      expect(formatDecimal(0, 3)).toBe('0');
    });

    it('reproduces the HALF_UP-on-shortest-decimal case from number-format.ts', () => {
      // toFixed(4) would give '8.6937' -- proves the generalization from
      // javaFixed4 (fixed at 4 places) to an arbitrary decimals count did
      // not lose the shortest-round-trip-decimal rounding behavior.
      expect((8.69375).toFixed(4)).toBe('8.6937');
      expect(formatDecimal(8.69375, 4)).toBe('8.6938');
    });

    it('formats and trims trailing zeros', () => {
      expect(formatDecimal(77.8125, 3)).toBe('77.813');
      expect(formatDecimal(28.4805, 3)).toBe('28.481');
    });

    it('handles negative values', () => {
      expect(formatDecimal(-77.8125, 3)).toBe('-77.813');
      expect(formatDecimal(-0.5, 3)).toBe('-0.5');
    });

    it('does not apply any scale factor', () => {
      // formatDecimal(x, decimals) formats x as-is; scaling is the
      // emitter's job (upstream's format() multiplies by option.getScale()
      // itself, before calling the shared trimZeros tail).
      expect(formatDecimal(10, 3)).toBe('10');
    });

    it('supports zero decimals, including a HALF_UP rounding boundary', () => {
      expect(formatDecimal(4.2, 0)).toBe('4');
      expect(formatDecimal(4.5, 0)).toBe('5');
      expect(formatDecimal(-4.5, 0)).toBe('-5');
    });
  });

  describe('formatOpacity', () => {
    it('short-circuits <= 0 and >= 1', () => {
      expect(formatOpacity(0, 3)).toBe('0');
      expect(formatOpacity(-0.5, 3)).toBe('0');
      expect(formatOpacity(1, 3)).toBe('1');
      expect(formatOpacity(1.5, 3)).toBe('1');
    });

    it('formats mid-range values at max(decimals, 2) places', () => {
      expect(formatOpacity(0.5, 3)).toBe('0.5');
      expect(formatOpacity(0.125, 4)).toBe('0.125');
    });

    it('floors decimals at 2 even when a smaller value is passed', () => {
      // decimals=0 -> max(0,2)=2 places before trimming.
      expect(formatOpacity(0.125, 0)).toBe('0.13');
    });
  });

  describe('formatPercent', () => {
    it('formats a fraction as a percentage', () => {
      expect(formatPercent(0.5, 3)).toBe('50%');
      expect(formatPercent(1, 3)).toBe('100%');
    });

    it('reduces exact zero to "0%" via trimZeros (no explicit short-circuit needed)', () => {
      expect(formatPercent(0, 3)).toBe('0%');
    });

    it('formats and trims trailing zeros at max(decimals, 2) places', () => {
      expect(formatPercent(0.12345, 3)).toBe('12.345%');
      expect(formatPercent(0.125, 0)).toBe('12.5%');
    });

    it('handles negative fractions', () => {
      expect(formatPercent(-0.5, 3)).toBe('-50%');
    });
  });

  describe('trimZeros', () => {
    it('drops trailing zeros', () => {
      expect(trimZeros('1.500')).toBe('1.5');
      expect(trimZeros('1.000')).toBe('1');
    });

    it('leaves values without a decimal point unchanged', () => {
      expect(trimZeros('42')).toBe('42');
    });

    it('leaves values with no trailing zeros unchanged', () => {
      expect(trimZeros('1.23')).toBe('1.23');
    });
  });
});
