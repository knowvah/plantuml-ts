import type { Paint } from '../../paint.js';
import type { HColor } from '../../style/Value.js';
import { toSvgHex, type ResolvedColor } from './HColorSet.js';

/** `String.format("%02X")` / `"%02x"` of one 8-bit channel. */
function hex2(n: number): string {
  return n.toString(16).padStart(2, '0');
}

/** `XColor#toString` (XColor.java:101-103). */
function xColorToString(c: ResolvedColor): string {
  return `[r=${String(c.r)},g=${String(c.g)},b=${String(c.b)},a=${String(c.a)}]`;
}

/**
 * HColorSimple — one solid colour (an `XColor`, here {@link ResolvedColor})
 * plus an optional `@media dark` partner. Immutable, as upstream.
 *
 * Ported slice (what the style engine and the klimt substrate reach):
 * `create`, `withDark`, `darkSchemeTheme`, `isTransparent`, `getAwtColor`,
 * `toString`, `asString`, `equals`, plus the port-only {@link asPaint}.
 * Not ported: `transparentFillBehavior` (set only by
 * `withTransparentFillBehavior`/`HColors.transparent(behavior)`, neither
 * reached; every instance here is upstream's default `WITH_FILL_NONE`, so
 * `toString`'s behaviour suffix, java:62-63, never prints), the
 * HSL/monochrome/`opposite`/`unlinear` arithmetic, `isDark`, `toColor`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColorSimple.java:43-242
 */
export class HColorSimple implements HColor {
  /** @see HColorSimple.java:145-149 */
  private constructor(
    /** @see HColorSimple.java:45 */
    private readonly color: ResolvedColor,
    /** @see HColorSimple.java:46 */
    private readonly dark: HColor | undefined,
  ) {}

  /** @see HColorSimple.java:141-143 */
  static create(c: ResolvedColor): HColorSimple {
    return new HColorSimple(c, undefined);
  }

  /** `[WITHDARK ]<XColor> α=<alpha>[ transparent]`. @see HColorSimple.java:49-65 */
  toString(): string {
    let sb = this.dark === undefined ? '' : 'WITHDARK ';
    sb += `${xColorToString(this.color)} α=${String(this.color.a)}`;
    if (this.isTransparent()) sb += ' transparent';
    return sb;
  }

  /** `transparent`, `#RRGGBB` when opaque, else `#aarrggbb` (lowercase). @see HColorSimple.java:68-82 */
  asString(): string {
    if (this.isTransparent()) return 'transparent';
    const { r, g, b, a } = this.color;
    if (a === 255) return `#${hex2(r)}${hex2(g)}${hex2(b)}`.toUpperCase();
    return `#${hex2(a)}${hex2(r)}${hex2(g)}${hex2(b)}`;
  }

  /** Same `XColor` (the dark partner is ignored). @see HColorSimple.java:84-90 */
  equals(other: unknown): boolean {
    if (!(other instanceof HColorSimple)) return false;
    const a = this.color;
    const b = other.color;
    return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a; // XColor.equals, XColor.java:91-98
  }

  /** @see HColorSimple.java:131-134 */
  isTransparent(): boolean {
    return this.color.a === 0;
  }

  /** @see HColorSimple.java:151-153 */
  getAwtColor(): ResolvedColor {
    return this.color;
  }

  /** @see HColorSimple.java:225-228 */
  withDark(dark: HColor): HColor {
    return new HColorSimple(this.color, dark);
  }

  /** The dark partner, else this. @see HColorSimple.java:235-240 */
  darkSchemeTheme(): HColor {
    return this.dark ?? this;
  }

  /**
   * PORT-ONLY adapter onto the klimt substrate's `Paint` (`UParam.getColor()`
   * is a `Paint`, `klimt/UParam.ts`): `HColor#toSvg(ColorMapper.IDENTITY)`
   * — `#00000000` when transparent, else `XColor#toSvg` of the light colour
   * (`ColorMapper.IDENTITY.fromColorSimple` = `getAwtColor()`,
   * ColorMapper.java:47-52). The dark partner is not consulted: the
   * port renders the light scheme only.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColor.java:74-80
   */
  asPaint(): Paint {
    if (this.isTransparent()) return '#00000000';
    return toSvgHex(this.color);
  }
}
