/**
 * Test-only `HColorSet` over the port's existing colour table
 * (`klimt/color/HColorSet.ts#parseSimpleColor`), shaped like
 * `HColorSet#getColorOrWhite` (HColorSet.java:58-63) and the keyword
 * front of `#parseColor` (java:78-83). The port has no OOP `HColor`
 * hierarchy yet; `TestHColor` carries the resolved colour plus the
 * `HColorSimple#withDark` partner (HColorSimple.java:226-228) so tests
 * can assert both halves.
 */
import { parseSimpleColor, type ResolvedColor } from '../../../../../src/core/klimt/color/HColorSet.js';
import type { HColor, HColorSet } from '../../../../../src/core/style/Value.js';

export class TestHColor implements HColor {
  constructor(
    readonly color: ResolvedColor | 'none',
    readonly dark: HColor | undefined = undefined,
  ) {}

  withDark(dark: HColor): HColor {
    return new TestHColor(this.color, dark);
  }
}

/** `HColors.WHITE` (HColors.java:87). */
export const WHITE: ResolvedColor = { r: 255, g: 255, b: 255, a: 255 };

export class TestHColorSet implements HColorSet {
  readonly requested: string[] = [];

  getColorOrWhite(sIn: string): HColor {
    this.requested.push(sIn);
    const s = sIn.startsWith('#') ? sIn.slice(1) : sIn;
    if (s.toLowerCase() === 'transparent' || s.toLowerCase() === 'background') return new TestHColor('none');
    return new TestHColor(parseSimpleColor(s) ?? WHITE);
  }
}

/** A counter whose `getNextInt` returns 1, 2, 3, ... (the shape of AutomaticCounterBasic). */
export function counterFrom(start: number): { getNextInt(): number } {
  let next = start;
  return { getNextInt: () => next++ };
}
