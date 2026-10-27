/**
 * `CharSet` -- a 128-bit ASCII bitmap (two Java `long`s, offsets from char 32).
 * Java 64-bit arithmetic is mirrored with BigInt truncated to 64 bits; shift
 * counts are masked to 6 bits exactly as the JVM does (`1L << n` uses
 * `n & 63`), which matters for `contains` of chars outside 32..128.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CharSet.java
 */
import { CaseMode, ensureLowercase } from './CaseMode.js';

const MASK64 = 64;
const ALL_ONES = -1n;

/** `1L << n`-style shift on a 64-bit value (JLS 15.19: count is `n & 0x3f`). */
function shl(value: bigint, count: number): bigint {
  return BigInt.asUintN(MASK64, value << BigInt(count & 63));
}

/** `(1L << length) - 1`, 64-bit wrap. */
function lowBits(length: number): bigint {
  return BigInt.asUintN(MASK64, shl(1n, length) - 1n);
}

export class CharSet {
  readonly #mode: CaseMode = CaseMode.CASE_INSENSITIVE;
  #mask1 = 0n;
  #mask2 = 0n;

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CharSet.java */
  public addChar(chIn: string): void {
    let ch = chIn;
    if (this.#mode === CaseMode.CASE_INSENSITIVE) ch = ensureLowercase(ch);
    const code = ch.charCodeAt(0);
    const offset = code - 32;
    if (code < 32 || code > 128) throw new Error('Bad char : ' + ch);
    if (offset < 64) this.#mask1 |= shl(1n, offset);
    else this.#mask2 |= shl(1n, offset - 64);
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CharSet.java */
  public addRange(startIn: string, endIn: string): void {
    let start = startIn;
    let end = endIn;
    if (start.charCodeAt(0) > end.charCodeAt(0)) {
      throw new Error("Invalid range: '" + start + "' is greater than '" + end + "'.");
    }
    if (start.charCodeAt(0) < 32 || end.charCodeAt(0) > 128) {
      throw new Error('Characters must be in the range 32 to 128.');
    }
    if (this.#mode === CaseMode.CASE_INSENSITIVE) {
      start = ensureLowercase(start);
      end = ensureLowercase(end);
    }
    const startOffset = start.charCodeAt(0) - 32;
    const endOffset = end.charCodeAt(0) - 32;

    if (endOffset < 64) {
      // Case 1: entire range in mask1
      const length = endOffset - startOffset + 1;
      const rangeMask = shl(length === 64 ? ALL_ONES : lowBits(length), startOffset);
      this.#mask1 |= rangeMask;
    } else if (startOffset >= 64) {
      // Case 2: entire range in mask2
      const adjustedStart = startOffset - 64;
      const adjustedEnd = endOffset - 64;
      const length = adjustedEnd - adjustedStart + 1;
      this.#mask2 |= shl(lowBits(length), adjustedStart);
    } else {
      // Case 3: range spans both masks
      const length1 = 64 - startOffset;
      this.#mask1 |= shl(length1 === 64 ? ALL_ONES : lowBits(length1), startOffset);
      const adjustedEnd = endOffset - 64;
      const length2 = adjustedEnd + 1;
      this.#mask2 |= lowBits(length2);
    }
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CharSet.java */
  public contains(chIn: string): boolean {
    let ch = chIn;
    if (this.#mode === CaseMode.CASE_INSENSITIVE) ch = ensureLowercase(ch);
    const offset = ch.charCodeAt(0) - 32;
    if (offset > 128) return false;
    if (offset < 64) return (this.#mask1 & shl(1n, offset)) !== 0n;
    return (this.#mask2 & shl(1n, offset - 64)) !== 0n;
  }
}
