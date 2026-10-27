/**
 * Immutable reduced rational number.
 *
 * D5 (gep): upstream holds `long` numerator/denominator with NO `*Exact` calls,
 * so overflow wraps silently (`ngm/math/Fraction.java:66-67`). The port uses
 * `number`, exact to 2^53. Every long-math site is marked "LONG:" below. Gantt
 * values stay far below the bound (a 10-year span is ~3.2e8 s; see the bound test).
 * Java `long` division truncates toward zero, hence `Math.trunc`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:56
 */

/** Normalises -0 to 0 (Java `long` has no negative zero). */
function noNegZero(n: number): number {
  return n + 0;
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:56 */
export class Fraction {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:57 */
  public static PRODUCT: (a: Fraction, b: Fraction) => Fraction = (a, b) => a.multiply(b);
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:58 */
  public static SUM: (a: Fraction, b: Fraction) => Fraction = (a, b) => a.add(b);
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:59 */
  public static MIN: (a: Fraction, b: Fraction) => Fraction = (a, b) => (a.compareTo(b) <= 0 ? a : b);
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:60 */
  public static MAX: (a: Fraction, b: Fraction) => Fraction = (a, b) => (a.compareTo(b) >= 0 ? a : b);

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:63 */
  public static readonly ZERO: Fraction = new Fraction(0, 1);
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:64 */
  public static readonly ONE: Fraction = new Fraction(1, 1);

  readonly #num: number;
  readonly #den: number;

  /**
   * @throws Error "Denominator cannot be zero." (Java `IllegalArgumentException`)
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:77
   */
  public constructor(numerator: number, denominator: number) {
    if (denominator === 0) {
      throw new Error('Denominator cannot be zero.');
    }

    // Normalize sign: denominator positive
    if (denominator < 0) {
      numerator = -numerator;
      denominator = -denominator;
    }

    // Reduce to simplest form
    const g = Fraction.#gcd(Math.abs(numerator), denominator);
    // LONG: exact division (g divides both), so trunc only matters for -0
    this.#num = noNegZero(Math.trunc(numerator / g));
    this.#den = Math.trunc(denominator / g);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:99 */
  public static of(value: number): Fraction {
    return new Fraction(value, 1);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:108 */
  public getNumerator(): number {
    return this.#num;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:117 */
  public getDenominator(): number {
    return this.#den;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:126 */
  public reciprocal(): Fraction {
    return new Fraction(this.#den, this.#num);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:135 */
  public negate(): Fraction {
    return new Fraction(-this.#num, this.#den);
  }

  /**
   * LONG: `num*other.den + other.num*den` and `den*other.den` wrap in Java.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:146
   */
  public add(other: Fraction): Fraction {
    // a/b + c/d = (ad + bc) / bd
    const n = this.#num * other.#den + other.#num * this.#den;
    const d = this.#den * other.#den;
    return new Fraction(n, d);
  }

  /**
   * LONG: as {@link add}.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:160
   */
  public subtract(other: Fraction): Fraction {
    // a/b - c/d = (ad - bc) / bd
    const n = this.#num * other.#den - other.#num * this.#den;
    const d = this.#den * other.#den;
    return new Fraction(n, d);
  }

  /**
   * LONG: `num*other.num` and `den*other.den` wrap in Java.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:174
   */
  public multiply(other: Fraction): Fraction {
    // (a/b) * (c/d) = (ac) / (bd)
    const n = this.#num * other.#num;
    const d = this.#den * other.#den;
    return new Fraction(n, d);
  }

  /**
   * LONG: `num*scalar` wraps in Java.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:189
   */
  public multiplyByLong(scalar: number): Fraction {
    return new Fraction(this.#num * scalar, this.#den);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:200 */
  public divide(other: Fraction): Fraction {
    return this.multiply(other.reciprocal());
  }

  /**
   * LONG: `num / den`, truncating toward zero.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:209
   */
  public wholePart(): number {
    return noNegZero(Math.trunc(this.#num / this.#den));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:219 */
  public toString(): string {
    if (this.#den === 1) return `${this.#num}`;

    return `${this.#num}/${this.#den}`;
  }

  /**
   * LONG: cross-products `num*other.den`, `other.num*den` wrap in Java.
   * `Long.compare` yields -1, 0 or 1.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:236
   */
  public compareTo(other: Fraction): number {
    // Compare a/b and c/d by cross-products: ad ? bc
    const lhs = this.#num * other.#den;
    const rhs = other.#num * this.#den;
    return lhs < rhs ? -1 : lhs > rhs ? 1 : 0;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:249 */
  public equals(obj: unknown): boolean {
    if (this === obj) return true;
    if (!(obj instanceof Fraction)) return false;
    return this.#num === obj.#num && this.#den === obj.#den;
  }

  /**
   * `31 * Long.hashCode(num) + Long.hashCode(den)` in `int` arithmetic.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:259
   */
  public hashCode(): number {
    let result = Fraction.#longHashCode(this.#num);
    result = (Math.imul(31, result) + Fraction.#longHashCode(this.#den)) | 0;
    return result;
  }

  /** `Long.hashCode(v)` = `(int)(v ^ (v >>> 32))`. */
  static #longHashCode(value: number): number {
    const v = BigInt.asUintN(64, BigInt(value));
    return Number(BigInt.asIntN(32, v ^ (v >> 32n)));
  }

  /**
   * LONG: Euclid on `long`; JS `%` truncates like Java's.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:269
   */
  static #gcd(a: number, b: number): number {
    while (b !== 0) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Fraction.java:278 */
  public isZero(): boolean {
    return this.#num === 0;
  }
}
