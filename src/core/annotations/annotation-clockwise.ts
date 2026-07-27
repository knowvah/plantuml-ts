/**
 * Padding / Margin shorthand — ClockwiseTopRightBottomLeft.read.
 */

import type { BoxSides } from './annotation-style-types.js';

export const ZERO_SIDES: BoxSides = { top: 0, right: 0, bottom: 0, left: 0 };
const CLOCKWISE_NUMBERS_ONLY = /^[0-9 ]+$/;

/**
 * Parse a Padding/Margin declaration using upstream's 1/2/3/4-number
 * shorthand. Non-numeric or malformed input (including a value containing
 * a decimal point or a sign) yields `{0,0,0,0}` — upstream's `none()`
 * fallback, since `NUMBERS_ONLY` (`[0-9 ]+`) rejects both.
 *
 * @see ClockwiseTopRightBottomLeft.java#read
 */
export function parseClockwise(value: string): BoxSides {
  const trimmed = value.trim();
  if (!CLOCKWISE_NUMBERS_ONLY.test(trimmed)) return ZERO_SIDES;
  const parts = trimmed.split(/\s+/).map((p) => Number.parseInt(p, 10));
  if (parts.some((n) => !Number.isFinite(n))) return ZERO_SIDES;
  const [a, b, c, d] = parts;
  switch (parts.length) {
    case 1:
      return { top: a as number, right: a as number, bottom: a as number, left: a as number };
    case 2:
      return { top: a as number, right: b as number, bottom: a as number, left: b as number };
    case 3:
      return { top: a as number, right: b as number, bottom: c as number, left: b as number };
    case 4:
      return { top: a as number, right: b as number, bottom: c as number, left: d as number };
    default:
      return ZERO_SIDES;
  }
}
