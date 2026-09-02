/**
 * ScientificEquationSafe.test.ts — T10e: coverage for `math/
 * ScientificEquationSafe.java`'s ported value-object surface
 * (`fromLatex`, `getFormula`, `getSource`) and its `fromAsciiMath` entry
 * point, which routes through `AsciiMath`/`ASCIIMathTeXImg` and falls back
 * to an equation-less instance when the converter raises (java:71-79).
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

describe('ScientificEquationSafe.fromAsciiMath (java:71-79)', () => {
  // Expected LaTeX comes from running upstream's own
  // `new ASCIIMathTeXImg().getTeX(...)` out of plantuml-1.2026.7beta11.jar.
  it('getSource returns the converted LaTeX, not the ASCIIMath input', () => {
    const eq = ScientificEquationSafe.fromAsciiMath('x/y');
    expect(eq.getSource()).toBe('\\frac{{x}}{{y}}');
    expect(eq.getFormula()).toBe('x/y');
  });

  it('converts a full formula', () => {
    expect(ScientificEquationSafe.fromAsciiMath('ax^2+bx+c=0').getSource()).toBe(
      '{a}{x}^{{2}}+{b}{x}+{c}={0}',
    );
  });

  it('an empty formula converts to empty LaTeX rather than failing', () => {
    const eq = ScientificEquationSafe.fromAsciiMath('');
    expect(eq.getFormula()).toBe('');
    expect(eq.getSource()).toBe('');
  });

  it('falls back to an equation-less instance when the converter raises', () => {
    // A bare `text` runs java:687 `str.charAt(0)` off the end of an empty
    // remainder; upstream catches that and keeps the formula with a null
    // equation (java:75-78), so getFormula still answers and getSource NPEs.
    const eq = ScientificEquationSafe.fromAsciiMath('text');
    expect(eq.getFormula()).toBe('text');
    expect(() => eq.getSource()).toThrow(/NullPointerException/);
  });
});
