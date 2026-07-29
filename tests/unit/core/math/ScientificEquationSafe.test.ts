/**
 * ScientificEquationSafe.test.ts — T10e: coverage for `math/
 * ScientificEquationSafe.java`'s ported value-object surface
 * (`fromLatex`, `getFormula`, `getSource`) plus the `fromAsciiMath`
 * cited seam (see `ScientificEquationSafe.ts`'s own module doc comment).
 */
import { describe, expect, it } from 'vitest';
import { ScientificEquationSafe } from '../../../../src/core/math/ScientificEquationSafe.js';

describe('ScientificEquationSafe.fromLatex / getFormula / getSource (java:81-89, 163-169)', () => {
  it('getFormula returns the raw constructor argument unchanged', () => {
    const eq = ScientificEquationSafe.fromLatex('x^2 + y^2 = z^2');
    expect(eq.getFormula()).toBe('x^2 + y^2 = z^2');
  });

  it('getSource returns the same value as getFormula for a fromLatex instance', () => {
    const eq = ScientificEquationSafe.fromLatex('\\frac{a}{b}');
    expect(eq.getSource()).toBe('\\frac{a}{b}');
    expect(eq.getSource()).toBe(eq.getFormula());
  });

  it('handles an empty formula', () => {
    const eq = ScientificEquationSafe.fromLatex('');
    expect(eq.getFormula()).toBe('');
    expect(eq.getSource()).toBe('');
  });

  it('two instances from the same formula are independent objects with equal values', () => {
    const a = ScientificEquationSafe.fromLatex('x');
    const b = ScientificEquationSafe.fromLatex('x');
    expect(a).not.toBe(b);
    expect(a.getFormula()).toBe(b.getFormula());
  });
});

describe('ScientificEquationSafe.fromAsciiMath (java:71-79) — cited seam, not silently dropped', () => {
  it('throws naming the unported ASCIIMathTeXImg/AsciiMath blocker', () => {
    expect(() => ScientificEquationSafe.fromAsciiMath('x/y')).toThrow(/ASCIIMathTeXImg\.java/);
  });

  it('throws regardless of the input formula', () => {
    expect(() => ScientificEquationSafe.fromAsciiMath('')).toThrow(/AsciiMath\.java/);
  });
});
