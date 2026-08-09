/**
 * `java.util.Random`, reproduced bit-for-bit.
 *
 * @see https://docs.oracle.com/javase/8/docs/api/java/util/Random.html
 *
 * Not a general-purpose RNG and not a convenience wrapper around
 * `Math.random`: the handwritten renderer seeds a single
 * `new Random(424242L)` (`UGraphicHandwritten.java:54`) and every jiggled
 * point consumes one `nextDouble()` from it, so the jar's output is a pure
 * function of this sequence. An approximation reproduces nothing.
 *
 * The state is a 48-bit integer, which exceeds what a JS `number` holds
 * exactly, so it is kept in a `BigInt`. That is a deliberate correctness
 * choice over speed — the alternative (splitting into 24-bit halves) is
 * faster and far easier to get subtly wrong.
 *
 * Java's specification, transcribed:
 *
 *   seed        = (seed ^ 0x5DEECE66D) & ((1 << 48) - 1)
 *   next(bits)  : seed = (seed * 0x5DEECE66D + 0xB) & ((1 << 48) - 1)
 *                 return (int)(seed >>> (48 - bits))
 *   nextDouble(): (((long) next(26) << 27) + next(27)) * 2^-53
 */

const MULTIPLIER = 0x5deece66dn;
const ADDEND = 0xbn;
const MASK = (1n << 48n) - 1n;

/** `1.0 / (1L << 53)`, the scale `nextDouble` applies. */
const DOUBLE_UNIT = 2 ** -53;

export class JavaRandom {
  private seed: bigint;

  constructor(seed: number | bigint) {
    this.seed = (BigInt(seed) ^ MULTIPLIER) & MASK;
  }

  /** `protected int next(int bits)` — the shared step every method builds on. */
  private next(bits: number): number {
    this.seed = (this.seed * MULTIPLIER + ADDEND) & MASK;
    // `>>> (48 - bits)` then narrowed to a SIGNED 32-bit int, which is what
    // `(int)` does in Java. `next(26)`/`next(27)` never set the sign bit, so
    // the narrowing is invisible here — done anyway so this stays a faithful
    // `next`, usable by a future `nextInt`.
    return Number(BigInt.asIntN(32, this.seed >> BigInt(48 - bits)));
  }

  /** `public double nextDouble()`. */
  nextDouble(): number {
    return (this.next(26) * 2 ** 27 + this.next(27)) * DOUBLE_UNIT;
  }
}
