/**
 * `EggUtils` — hex, xor and the base-26 key the easter-egg sentences are
 * encrypted with.
 *
 * `byte[]` is `Uint8Array` (unsigned): `(byte) Integer.parseInt(..., 16)` and
 * `b & 0xFF` agree with it bit for bit, and xor is sign-blind. `BigInteger`
 * is `bigint`; `fromSecretSentence` is never negative, so `toByteArray` only
 * needs `BigInteger#toByteArray`'s non-negative arm.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/EggUtils.java
 */

/** `BigInteger.valueOf(26)`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/EggUtils.java:67 */
const TWENTY_SIX = 26n;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/EggUtils.java:60 */
const HEX_RADIX = 16;

/** `Integer.toHexString(b & 0xFF)` padded to two digits.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/EggUtils.java:48-50 */
const HEX_BYTE_DIGITS = 2;

/** `StringUtils.goLowerCase(char)` = `goLowerCase("" + c).charAt(0)`, which is
 *  `toLowerCase(Locale.ENGLISH)` (no Turkish dotless-i rule; JS's locale-free
 *  `toLowerCase` matches it).
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/StringUtils.java:59-61,241-243 */
function goLowerCase(c: string): string {
  return c.toLowerCase().charAt(0);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/EggUtils.java:81-86 */
function convertChar(c: string): number {
  const lower = goLowerCase(c);
  if (lower >= 'a' && lower <= 'z') return lower.charCodeAt(0) - 'a'.charCodeAt(0);
  return -1;
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/EggUtils.java:42 */
export const EggUtils = {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/EggUtils.java:45-55 */
  fromByteArrays(data: Uint8Array): string {
    let sb = '';
    for (const b of data) sb += b.toString(HEX_RADIX).padStart(HEX_BYTE_DIGITS, '0');
    return sb;
  },

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/EggUtils.java:57-63 */
  toByteArrays(s: string): Uint8Array {
    const result = new Uint8Array(Math.trunc(s.length / HEX_BYTE_DIGITS));
    for (let i = 0; i < result.length; i++)
      result[i] = Number.parseInt(s.substring(i * HEX_BYTE_DIGITS, i * HEX_BYTE_DIGITS + HEX_BYTE_DIGITS), HEX_RADIX);
    return result;
  },

  /** Iterates UTF-16 code units, as `s.toCharArray()` does.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/EggUtils.java:65-79 */
  fromSecretSentence(sentence: string): bigint {
    let result = 0n;
    const s = sentence.replaceAll('é', 'e').replaceAll('ê', 'e');
    for (let i = 0; i < s.length; i++) {
      const num = convertChar(s.charAt(i));
      if (num !== -1) result = result * TWENTY_SIX + BigInt(num);
    }
    return result;
  },

  /**
   * `BigInteger#toByteArray` for a non-negative value: big-endian two's
   * complement in the fewest bytes, so a leading `0x00` when the top bit of
   * the first byte is set, and `[0]` for zero.
   */
  toByteArray(value: bigint): Uint8Array {
    let hex = value.toString(HEX_RADIX);
    if (hex.length % HEX_BYTE_DIGITS !== 0) hex = `0${hex}`;
    if (Number.parseInt(hex.charAt(0), HEX_RADIX) >= 8) hex = `00${hex}`;
    return EggUtils.toByteArrays(hex);
  },

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/EggUtils.java:88-97 */
  xor(data: Uint8Array, key: Uint8Array): Uint8Array {
    const result = new Uint8Array(data.length);
    let pos = 0;
    for (let i = 0; i < result.length; i++) {
      result[i] = data[i]! ^ key[pos++]!;
      if (pos === key.length) pos = 0;
    }
    return result;
  },
};
