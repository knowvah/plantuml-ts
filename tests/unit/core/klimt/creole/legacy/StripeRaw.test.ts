/**
 * StripeRaw.test.ts — T10a: structural coverage for `StripeRaw`
 * (klimt/creole/legacy/StripeRaw.java): a marker interface (`Stripe` +
 * `Atom` + two continuation methods) with no concrete implementor in
 * this port yet (`StripeCode`/`StripeLatex` are T10c/T10e). Coverage
 * here exercises a minimal conforming implementation to pin the exact
 * shape `legacy/CreoleParser.ts`'s future `lastStripe instanceof
 * StripeRaw` duck-type check (T10g) will rely on.
 */
import { describe, expect, it } from 'vitest';
import type { StripeRaw } from '../../../../../../src/core/klimt/creole/legacy/StripeRaw.js';
import { XDimension2D } from '../../../../../../src/core/klimt/geom/XDimension2D.js';
import type { CreoleAtom } from '../../../../../../src/core/klimt/creole/atom/Atom.js';
import type { StringBounder } from '../../../../../../src/core/klimt/font/StringBounder.js';
import type { FontConfiguration } from '../../../../../../src/core/klimt/shape/UText.js';

const FONT: FontConfiguration = { family: 'sans-serif', size: 12, color: '#000000', styles: new Set() };

/** A minimal, self-contained `StripeRaw`: accumulates raw lines until it
 *  sees a line equal to "END", faithfully exercising every member the
 *  interface declares (own + inherited from `Stripe`/`Atom`). */
function makeStripeRaw(): StripeRaw {
  const lines: string[] = [];
  let terminated = false;
  return {
    getLHeader: (): CreoleAtom | null => null,
    getAtoms: (): readonly CreoleAtom[] => lines.map((text) => ({ kind: 'text', text, font: FONT })),
    addAndCheckTermination: (line: string): boolean => {
      if (terminated) return false;
      if (line === 'END') {
        terminated = true;
        return true;
      }
      lines.push(line);
      return true;
    },
    isTerminated: (): boolean => terminated,
    calculateDimension: (_stringBounder: StringBounder): XDimension2D => new XDimension2D(lines.length * 10, 12),
    getStartingAltitude: (_stringBounder: StringBounder): number => 0,
    getNeutrons: (): never => {
      throw new Error('UnsupportedOperationException');
    },
    drawU: (): void => undefined,
  };
}

const sb = {} as StringBounder;

describe('StripeRaw — structural shape', () => {
  it('accumulates lines via addAndCheckTermination until the terminator is seen', () => {
    const raw = makeStripeRaw();
    expect(raw.addAndCheckTermination('one')).toBe(true);
    expect(raw.addAndCheckTermination('two')).toBe(true);
    expect(raw.isTerminated()).toBe(false);
    expect(raw.addAndCheckTermination('END')).toBe(true);
    expect(raw.isTerminated()).toBe(true);
  });

  it('reflects accumulated lines through the inherited Stripe surface', () => {
    const raw = makeStripeRaw();
    raw.addAndCheckTermination('alpha');
    raw.addAndCheckTermination('beta');
    expect(raw.getAtoms()).toHaveLength(2);
    expect(raw.getLHeader()).toBeNull();
  });

  it('exposes the inherited Atom surface (calculateDimension/getStartingAltitude/getNeutrons)', () => {
    const raw = makeStripeRaw();
    raw.addAndCheckTermination('x');
    expect(raw.calculateDimension(sb)).toEqual(new XDimension2D(10, 12));
    expect(raw.getStartingAltitude(sb)).toBe(0);
    expect(() => raw.getNeutrons()).toThrow('UnsupportedOperationException');
  });

  it('addAndCheckTermination after termination is a no-op (false)', () => {
    const raw = makeStripeRaw();
    raw.addAndCheckTermination('END');
    expect(raw.addAndCheckTermination('more')).toBe(false);
  });
});
