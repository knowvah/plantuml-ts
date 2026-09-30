import { horizontalAlignmentFromString, type HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import { NORMAL_FONT_FACE, type FontFace } from '../klimt/shape/UText.js';
import { DarkString } from './DarkString.js';
import type { HColor, HColorSet, Value } from './Value.js';
import { ValueColor } from './ValueColor.js';

/** `Integer.MIN_VALUE`, ValueImpl's "not computed yet" int-cache sentinel (ValueImpl.java:116-117). */
const INTEGER_MIN_VALUE = -2147483648;
/** `Integer.MAX_VALUE`, the largest value `Integer.parseInt` accepts. */
const INTEGER_MAX_VALUE = 2147483647;
/** `Double.MIN_VALUE`, ValueImpl's double-cache sentinel (ValueImpl.java:118). */
const DOUBLE_MIN_VALUE = Number.MIN_VALUE;
/** `HColors.transparent()` = `getColorOrWhite("#00000000")` (see `Value.ts#HColorSet`). */
const TRANSPARENT_CODE = '#00000000';
/** A Java `Double.parseDouble` literal over the `[0-9.]` alphabet `asDouble` keeps. */
const JAVA_DOUBLE_OF_DIGITS_AND_DOTS = /^(\d+\.?\d*|\.\d+)$/;
/** `Integer.parseInt` over ASCII: optional sign, then digits. */
const JAVA_INT = /^[+-]?\d+$/;

/**
 * The consumed slice of `style/AutomaticCounter.java` (`getNextInt()`,
 * AutomaticCounter.java:40), structural until T2a ports that file.
 */
interface AutomaticCounterSlice {
  getNextInt(): number;
}

/** `Integer.parseInt(s)`; throws `NumberFormatException` past int range. */
function javaParseInt(s: string): number {
  const n = Number(s);
  if (!JAVA_INT.test(s) || n > INTEGER_MAX_VALUE || n < INTEGER_MIN_VALUE)
    throw new Error(`NumberFormatException: For input string: "${s}"`);
  return n;
}

/** `String#trim`: strips chars <= U+0020 from both ends (not JS Unicode whitespace). */
function javaTrim(s: string): string {
  let start = 0;
  let end = s.length;
  while (start < end && s.charCodeAt(start) <= 32) start++;
  while (end > start && s.charCodeAt(end - 1) <= 32) end--;
  return s.slice(start, end);
}

/** `UFontWeight.clamp` (UFontWeight.java:103-109): 100..900, rounded to the nearest 100. */
function clampCssWeight(value: number): number {
  if (value < 100) return 100;
  if (value > 900) return 900;
  return Math.trunc((value + 50) / 100) * 100;
}

/**
 * `UFontFace.fromCssWeight` (UFontFace.java:118-144) for the inputs
 * `asFontFace` still reaches (already trimmed + lowercased; `normal`/`bold`
 * returned earlier): `lighter` 300, `bolder` 800, else an int, clamped.
 */
function fontFaceFromCssWeight(s: string): FontFace | undefined {
  if (s === 'lighter') return { cssWeight: 300, italic: false };
  if (s === 'bolder') return { cssWeight: 800, italic: false };
  try {
    return { cssWeight: clampCssWeight(javaParseInt(s)), italic: false };
  } catch {
    return undefined; // upstream: catch (NumberFormatException e) { return null; }
  }
}

/** The ASCII digits of `s`, in order. @see ValueImpl.java:144-153 */
function extractDigits(s: string | null): string {
  if (s === null) throw new Error('NullPointerException');
  let sb = '';
  for (const c of s) if (c >= '0' && c <= '9') sb += c;
  return sb;
}

/**
 * ValueImpl — a parsed style value: a {@link DarkString} (regular and/or
 * dark string + priority) read through the typed accessors. Accessor
 * caches mirror upstream's sentinel-initialized fields.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/ValueImpl.java:46-209
 */
export class ValueImpl implements Value {
  private asIntCache = INTEGER_MIN_VALUE;
  private asIntButMinusOneIfErrorCache = INTEGER_MIN_VALUE;
  private asDoubleCache = DOUBLE_MIN_VALUE;

  /** @see ValueImpl.java:75-77 */
  private constructor(private readonly value: DarkString) {}

  /** A `@media dark` value: `value2`, priority from the counter. @see ValueImpl.java:50-52 */
  static dark(value: string, counter: AutomaticCounterSlice): ValueImpl {
    return new ValueImpl(new DarkString(null, value, counter.getNextInt()));
  }

  /** A regular value: `value1`, priority from the counter or given. @see ValueImpl.java:54-60 */
  static regular(value: string, counterOrPriority: AutomaticCounterSlice | number): ValueImpl {
    const priority = typeof counterOrPriority === 'number' ? counterOrPriority : counterOrPriority.getNextInt();
    return new ValueImpl(new DarkString(value, null, priority));
  }

  /**
   * Another `ValueImpl`: merged via {@link DarkString#mergeWith}. A
   * `ValueColor`: the strictly higher priority wins, else this. Anything
   * else throws. @see ValueImpl.java:62-73
   */
  mergeWith(other: Value | undefined): Value {
    if (other === undefined) return this;
    if (other instanceof ValueImpl) return new ValueImpl(this.value.mergeWith(other.value));
    if (other instanceof ValueColor) {
      if (other.getPriority() > this.getPriority()) return other;
      return this;
    }
    throw new Error('UnsupportedOperationException');
  }

  /** @see ValueImpl.java:79-81 */
  addPriority(delta: number): Value {
    return new ValueImpl(this.value.addPriority(delta));
  }

  /** @see ValueImpl.java:83-86 */
  toString(): string {
    return this.value.toString();
  }

  /** `value1`; `null` for a dark-only value. @see ValueImpl.java:88-90 */
  asString(): string | null {
    return this.value.getValue1();
  }

  /**
   * `none`/`transparent` (any case) -> `HColors.transparent()`; a null
   * `value1` throws `IllegalArgumentException(value.toString())`; else
   * `value1` through `getColorOrWhite`, paired `withDark` with `value2`
   * when present. @see ValueImpl.java:92-108
   */
  asColor(set: HColorSet): HColor {
    const value1 = this.value.getValue1();
    if (value1?.toLowerCase() === 'none') return set.getColorOrWhite(TRANSPARENT_CODE);
    if (value1?.toLowerCase() === 'transparent') return set.getColorOrWhite(TRANSPARENT_CODE);
    if (value1 === null) throw new Error(`IllegalArgumentException: ${this.value.toString()}`);

    const result = set.getColorOrWhite(value1);
    const value2 = this.value.getValue2();
    if (value2 !== null) return result.withDark(set.getColorOrWhite(value2));
    return result;
  }

  /** `"true".equalsIgnoreCase(value1)`. @see ValueImpl.java:111-114 */
  asBoolean(): boolean {
    return this.value.getValue1()?.toLowerCase() === 'true';
  }

  /** The digits of `value1` as an int; 0 when there are none. @see ValueImpl.java:120-131 */
  asInt(): number {
    if (this.asIntCache === INTEGER_MIN_VALUE) {
      const s = extractDigits(this.value.getValue1());
      this.asIntCache = s.length === 0 ? 0 : javaParseInt(s);
    }
    return this.asIntCache;
  }

  /** As {@link asInt}, but -1 when there are no digits. @see ValueImpl.java:132-142 */
  asIntButMinusOneIfError(): number {
    if (this.asIntButMinusOneIfErrorCache === INTEGER_MIN_VALUE) {
      const s = extractDigits(this.value.getValue1());
      this.asIntButMinusOneIfErrorCache = s.length === 0 ? -1 : javaParseInt(s);
    }
    return this.asIntButMinusOneIfErrorCache;
  }

  /** Digits and dots of `value1` through `Double.parseDouble`; NaN when none. @see ValueImpl.java:156-172 */
  asDouble(): number {
    if (this.asDoubleCache === DOUBLE_MIN_VALUE) {
      const s = this.value.getValue1();
      if (s === null) throw new Error('NullPointerException');
      let sb = '';
      for (const c of s) if ((c >= '0' && c <= '9') || c === '.') sb += c;
      if (sb.length === 0) this.asDoubleCache = Number.NaN;
      else if (!JAVA_DOUBLE_OF_DIGITS_AND_DOTS.test(sb)) throw new Error(`NumberFormatException: ${sb}`);
      else this.asDoubleCache = Number(sb);
    }
    return this.asDoubleCache;
  }

  /**
   * Upstream tests `s == Double.NaN`, which is always false in Java, so the
   * default is never substituted: this is `asDouble()`. Preserved as-is.
   * @see ValueImpl.java:174-179
   */
  asDoubleDefaultTo(_defaultValue: number): number {
    return this.asDouble();
  }

  /**
   * `bold`/`italic`/`plain`/`normal`, else a CSS weight (keyword or
   * 100-900 number), else normal. @see ValueImpl.java:181-200
   */
  asFontFace(): FontFace {
    const raw = this.value.getValue1();
    if (raw === null || raw.length === 0) return NORMAL_FONT_FACE;

    const s = javaTrim(raw).toLowerCase();
    if (s === 'bold') return { cssWeight: 700, italic: false }; // UFontFace.bold(), UFontFace.java:56,78-80
    if (s === 'italic') return { cssWeight: 400, italic: true }; // UFontFace.italic(), UFontFace.java:57,85-87
    if (s === 'plain' || s === 'normal') return NORMAL_FONT_FACE;

    return fontFaceFromCssWeight(s) ?? NORMAL_FONT_FACE;
  }

  /** @see ValueImpl.java:202-204 */
  asHorizontalAlignment(): HorizontalAlignment | undefined {
    return horizontalAlignmentFromString(this.asString());
  }

  /** @see ValueImpl.java:206-208 */
  getPriority(): number {
    return this.value.getPriority();
  }
}
