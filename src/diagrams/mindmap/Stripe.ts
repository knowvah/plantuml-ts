/**
 * A single stripe of a `StripeFrontier`: a horizontal x-range `[x1, x2]`
 * (inclusive both ends, per `contains`) holding the highest y the packed
 * `Tetris` frontier has reached across that range.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/Stripe.java
 */
export class Stripe {
  private readonly x1: number;
  private readonly x2: number;
  private readonly value: number;

  /** `Stripe.java:49-58` — `x2 <= x1` is a caller bug, not a recoverable
   *  input; every `Stripe` mints from `StripeFrontier`'s own segment math,
   *  which always builds a non-degenerate range. */
  constructor(x1: number, x2: number, value: number) {
    if (x2 <= x1) {
      throw new Error(`Stripe: x2 (${x2}) must be greater than x1 (${x1})`);
    }
    this.x1 = x1;
    this.x2 = x2;
    this.value = value;
  }

  /** `Stripe.java:60-62`. */
  contains(x: number): boolean {
    return x >= this.x1 && x <= this.x2;
  }

  /** `Stripe.java:64-66` — ordered by start x only; two stripes never share
   *  a start x within one `StripeFrontier` (its segments partition the
   *  x-axis), so this alone gives `StripeFrontier`'s sorted-set ordering. */
  compareTo(other: Stripe): number {
    return Math.sign(this.x1 - other.x1);
  }

  /** `Stripe.java:68-70`. */
  getValue(): number {
    return this.value;
  }

  /** `Stripe.java:72-74`. */
  getStart(): number {
    return this.x1;
  }

  /** `Stripe.java:76-78`. */
  getEnd(): number {
    return this.x2;
  }
}
