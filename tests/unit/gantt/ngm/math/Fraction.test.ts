import { describe, expect, it } from 'vitest';
import { Fraction } from '../../../../../src/diagrams/gantt/ngm/math/Fraction.js';

const f = (n: number, d: number): Fraction => new Fraction(n, d);

describe('Fraction construction (Fraction.java:77-96)', () => {
  it('reduces and keeps the denominator positive', () => {
    const x = f(6, -8);
    expect([x.getNumerator(), x.getDenominator()]).toEqual([-3, 4]);
  });

  it('zero numerator reduces to 0/1 with no negative zero', () => {
    const x = f(0, -5);
    expect(Object.is(x.getNumerator(), 0)).toBe(true);
    expect(x.getDenominator()).toBe(1);
  });

  it('zero denominator throws (Fraction.java:78-80)', () => {
    expect(() => f(1, 0)).toThrow('Denominator cannot be zero.');
  });

  it('of(v) is v/1 (Fraction.java:99)', () => {
    expect(Fraction.of(7).toString()).toBe('7');
  });

  it('constants ZERO and ONE (Fraction.java:63-64)', () => {
    expect(Fraction.ZERO.toString()).toBe('0');
    expect(Fraction.ONE.toString()).toBe('1');
    expect(Fraction.ZERO.isZero()).toBe(true);
    expect(Fraction.ONE.isZero()).toBe(false);
  });
});

describe('Fraction arithmetic (Fraction.java:126-209)', () => {
  it('add 1/2 + 1/3 = 5/6 (:146)', () => expect(f(1, 2).add(f(1, 3)).toString()).toBe('5/6'));
  it('subtract 1/2 - 1/3 = 1/6 (:160)', () => expect(f(1, 2).subtract(f(1, 3)).toString()).toBe('1/6'));
  it('subtract to zero = 0 (:160)', () => expect(f(1, 2).subtract(f(2, 4)).toString()).toBe('0'));
  it('multiply 2/3 * 3/4 = 1/2 (:174)', () => expect(f(2, 3).multiply(f(3, 4)).toString()).toBe('1/2'));
  it('multiplyByLong 3/4 * 8 = 6 (:189)', () => expect(f(3, 4).multiplyByLong(8).toString()).toBe('6'));
  it('divide 1/2 / 3/4 = 2/3 (:200)', () => expect(f(1, 2).divide(f(3, 4)).toString()).toBe('2/3'));
  it('divide by negative moves the sign to the numerator (:126)', () =>
    expect(f(1, 2).divide(f(-1, 4)).toString()).toBe('-2'));
  it('divide by zero throws via reciprocal (:126)', () =>
    expect(() => f(1, 2).divide(Fraction.ZERO)).toThrow('Denominator cannot be zero.'));
  it('reciprocal 2/3 = 3/2 (:126)', () => expect(f(2, 3).reciprocal().toString()).toBe('3/2'));
  it('negate 2/3 = -2/3 (:135)', () => expect(f(2, 3).negate().toString()).toBe('-2/3'));
  it('wholePart truncates toward zero (:209)', () => {
    expect(f(7, 2).wholePart()).toBe(3);
    expect(f(-7, 2).wholePart()).toBe(-3);
    expect(Object.is(f(-1, 2).wholePart(), 0)).toBe(true);
  });
});

describe('Fraction comparison (Fraction.java:236-262)', () => {
  it('compareTo returns Long.compare -1/0/1', () => {
    expect(f(1, 3).compareTo(f(1, 2))).toBe(-1);
    expect(f(2, 4).compareTo(f(1, 2))).toBe(0);
    expect(f(3, 4).compareTo(f(1, 2))).toBe(1);
  });

  it('equals is structural and type-checked (:249)', () => {
    const a = f(1, 2);
    expect(a.equals(a)).toBe(true);
    expect(a.equals(f(2, 4))).toBe(true);
    expect(a.equals(f(1, 3))).toBe(false);
    expect(a.equals('1/2')).toBe(false);
  });

  it.each([
    [f(0, 1), 1], // 31*Long.hashCode(0) + Long.hashCode(1)
    [f(1, 2), 33], // 31*1 + 2
    [f(-1, 1), 1], // Long.hashCode(-1L) = 0
  ])('hashCode %s = 31*h(num)+h(den) (:259-263)', (x, expected) => {
    expect(x.hashCode()).toBe(expected);
  });
});

describe('Fraction BiFunction constants (Fraction.java:57-60)', () => {
  it('PRODUCT, SUM', () => {
    expect(Fraction.PRODUCT(f(1, 2), f(2, 3)).toString()).toBe('1/3');
    expect(Fraction.SUM(f(1, 2), f(1, 2)).toString()).toBe('1');
  });
  it('MIN/MAX pick by compareTo, ties take the first (<=, >=)', () => {
    const a = f(1, 2);
    const b = f(2, 4);
    expect(Fraction.MIN(f(1, 3), f(1, 2)).toString()).toBe('1/3');
    expect(Fraction.MIN(f(1, 2), f(1, 3)).toString()).toBe('1/3');
    expect(Fraction.MIN(a, b)).toBe(a);
    expect(Fraction.MAX(f(1, 3), f(1, 2)).toString()).toBe('1/2');
    expect(Fraction.MAX(f(1, 2), f(1, 3)).toString()).toBe('1/2');
    expect(Fraction.MAX(a, b)).toBe(a);
  });
});

describe('Fraction D5 bound: no overflow at realistic gantt magnitudes', () => {
  // Fraction.java:66-67 holds `long` with silent wrap; the port uses `number`.
  const TEN_YEARS_SECONDS = 10 * 365.25 * 86_400; // 315 576 000
  it('10-year span in seconds x a 1/7 allocation stays below MAX_SAFE_INTEGER, exactly', () => {
    const product = Fraction.of(TEN_YEARS_SECONDS).multiply(f(1, 7));
    expect(product.toString()).toBe('315576000/7');
    // the unreduced intermediate products are the largest values the class forms
    expect(TEN_YEARS_SECONDS * 7 * 7).toBeLessThan(Number.MAX_SAFE_INTEGER);
  });
  it('summing 1000 allocations of a 10-year span x 1/7 is exact', () => {
    let acc = Fraction.ZERO;
    for (let i = 0; i < 1000; i++) acc = acc.add(Fraction.of(TEN_YEARS_SECONDS).multiply(f(1, 7)));
    expect(acc.toString()).toBe('315576000000/7');
    expect(Number.isSafeInteger(acc.getNumerator())).toBe(true);
  });
});
