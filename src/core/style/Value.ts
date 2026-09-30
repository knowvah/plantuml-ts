import type { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import type { FontFace } from '../klimt/shape/UText.js';

/**
 * HColor — the consumed slice of `klimt/color/HColor.java` the style value
 * layer calls: `withDark` (`ValueImpl.java:103-106`; `HColorSimple.java:
 * 226-228` pairs a light colour with its dark partner). The port has no
 * OOP `HColor` hierarchy (`abel/Colors.ts` keeps an opaque `object`
 * stand-in, `paint.ts` a `Paint` string); this interface is structurally
 * an `object`, so a value it returns is accepted wherever that opaque
 * stand-in is.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColor.java:125-127
 */
export interface HColor {
  withDark(dark: HColor): HColor;
  /** Read by `ValueColor#toString` (ValueColor.java:46-49). */
  toString(): string;
}

/**
 * HColorSet — the consumed slice of `klimt/color/HColorSet.java` the style
 * value layer calls: `getColorOrWhite` (`HColorSet.java:58-63`,
 * `parseColor(s)` or `HColors.WHITE`). The port's colour table is free
 * functions (`klimt/color/HColorSet.ts#parseSimpleColor`); an
 * implementation adapts them.
 *
 * `HColors.BLACK` and `HColors.transparent()` are reached through this
 * same method: upstream defines `BLACK = set.getColorOrWhite("#000000")`
 * on `HColorSet.instance()` (HColors.java:84-86), and `transparent()` is
 * `HColorSimple.create(new XColor(0, 0, 0, 0))` (HColors.java:123-127) --
 * exactly what `getColorOrWhite("#00000000")` builds
 * (HColorSet.java:148-155 `new XColor(r, g, b, a)`, then
 * `HColors.simple` = `HColorSimple.create`, HColors.java:178-180).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColorSet.java:58-63
 */
export interface HColorSet {
  getColorOrWhite(s: string): HColor;
}

/**
 * Value — one style property value. Nullability mirrors upstream:
 * `asString()` is `null` for a dark-only `ValueImpl` (its `value1`,
 * jar-probed: `BackGroundColor=null`), `asHorizontalAlignment()` is
 * `undefined` where `HorizontalAlignment.fromString` returns `null`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/Value.java:43-67
 */
export interface Value {
  /** `Object#toString`; `ValueImpl` prints its `DarkString` (ValueImpl.java:83-86), read by `Style#toString`. */
  toString(): string;
  /** @see Value.java:45 */
  asString(): string | null;
  /** @see Value.java:47 */
  asColor(set: HColorSet): HColor;
  /** @see Value.java:49 */
  asInt(): number;
  /** @see Value.java:51 */
  asIntButMinusOneIfError(): number;
  /** @see Value.java:53 */
  asDouble(): number;
  /** @see Value.java:55 */
  asDoubleDefaultTo(defaultValue: number): number;
  /** @see Value.java:57 */
  asBoolean(): boolean;
  /** The font face (weight + italic axis). @see Value.java:59-62 */
  asFontFace(): FontFace;
  /** @see Value.java:64 */
  asHorizontalAlignment(): HorizontalAlignment | undefined;
  /** @see Value.java:66 */
  getPriority(): number;
}
