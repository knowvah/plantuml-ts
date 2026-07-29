/**
 * StripeRaw.test.ts — T10a/T10g: structural coverage for `StripeRaw`
 * (klimt/creole/legacy/StripeRaw.java): a marker interface (`Stripe<Atom>` +
 * `Atom` + two continuation methods). `StripeCode`/`StripeLatex` (T10d/T10e)
 * are its real implementors (batch-3a/T10g: both now declare `implements
 * StripeRaw`) — coverage here exercises a minimal, independently-built
 * conforming implementation to pin the exact shape `legacy/CreoleParser.ts`'s
 * `isStripeRaw` duck-type check relies on.
 */
import { describe, expect, it } from 'vitest';
import type { StripeRaw } from '../../../../../../src/core/klimt/creole/legacy/StripeRaw.js';
import { XDimension2D } from '../../../../../../src/core/klimt/geom/XDimension2D.js';
import type { Atom } from '../../../../../../src/core/klimt/creole/SheetBlock1.js';
import type { StringBounder } from '../../../../../../src/core/klimt/font/StringBounder.js';

/** A minimal `Atom` stub — one per accumulated raw line, each measuring a
 *  fixed 10x12 (this file only asserts on COUNT/shape, not real geometry). */
function makeAtom(): Atom {
  return {
    calculateDimension: (): XDimension2D => new XDimension2D(10, 12),
    getStartingAltitude: (): number => 0,
    getNeutrons: (): never => {
      throw new Error('UnsupportedOperationException');
    },
    drawU: (): void => undefined,
  };
}

/** A minimal, self-contained `StripeRaw`: accumulates raw lines until it
 *  sees a line equal to "END", faithfully exercising every member the
 *  interface declares (own + inherited from `Stripe<Atom>`/`Atom`). */
function makeStripeRaw(): StripeRaw {
  const lines: string[] = [];
  let terminated = false;
  return {
    getLHeader: (): Atom | null => null,
    getAtoms: (): readonly Atom[] => lines.map(() => makeAtom()),
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
