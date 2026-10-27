import type { Paint } from '../../paint.js';
import type { HColor } from '../../style/Value.js';
import type { ColorMapper } from './ColorMapper.js';
import { distance, getGrayScaleColor } from './ColorUtils.js';
import { toSvgHex, type ResolvedColor } from './HColorSet.js';
import { hslToRgb, rgbToHsl, type Hsl } from '../../tim/builtin/color-utils.js';
import { TransparentFillBehavior } from '../drawing/svg/svg-option.js';

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
 * `toString`, `asString`, `equals`, `toColor`, the inherited `HColor#toSvg`,
 * `transparentFillBehavior`/`withTransparentFillBehavior` (sdd3-T8p: the
 * `ComponentRoseLine` hover rect's `HColors.transparent(WITH_FILL_OPACITY)`;
 * `create` stays upstream's default `WITH_FILL_NONE`, so `toString`'s
 * behaviour suffix, java:62-63, prints only for an instance that asked),
 * plus the port-only {@link asPaint}.
 * `unlinear` (with its private `linear` helpers) reuses the float32 HSL
 * ports in `tim/builtin/color-utils.ts` (`rgbToHsl` = `HSLColor#fromRGB`,
 * `hslToRgb` = `HSLColor#toRGB`; `core/` -> `core/` is layering-legal).
 * Not ported: the monochrome arithmetic, `isDark`.
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
    /** @see HColorSimple.java:47 */
    private readonly fillBehavior: TransparentFillBehavior,
  ) {}

  /** @see HColorSimple.java:217-219 */
  distanceTo(other: HColorSimple): number {
    return distance(this.color, other.color);
  }

  /** White on a dark colour, black on a light one: `255 - grey > 127`.
   *  @see HColorSimple.java:211-215 */
  opposite(): HColorSimple {
    const mono = getGrayScaleColor(this.color);
    const grayScale = 255 - mono.g > 127 ? 255 : 0;
    return HColorSimple.create({ r: grayScale, g: grayScale, b: grayScale, a: 255 });
  }

  /**
   * The completion-shaded colour: HSL interpolation with a cubic ease,
   * `completion = (float)(completionInt / 100.0)` cubed in float32 (clamped
   * at 100). `new HSLColor(color)` -> `getHSL()` is `rgbToHsl`; `new HSLColor(hsl)`
   * (alpha 1.0f) -> `getRGB()` is `hslToRgb` with alpha 255.
   * @see HColorSimple.java:178-195
   */
  static unlinear(color1: HColorSimple, color2: HColorSimple, completionInt: number): HColorSimple {
    const hsl1 = rgbToHsl(color1.color);
    const hsl2 = rgbToHsl(color2.color);

    if (completionInt > 100) completionInt = 100;

    let completion = Math.fround(completionInt / 100.0);
    completion = Math.fround(Math.fround(completion * completion) * completion);
    const hsl = HColorSimple.linearHsl(completion, hsl1, hsl2);

    return HColorSimple.create(hslToRgb(hsl));
  }

  /** `linear(float, float[], float[])`. @see HColorSimple.java:197-202 */
  private static linearHsl(factor: number, hsl1: Hsl, hsl2: Hsl): Hsl {
    const h = HColorSimple.linear(factor, hsl1[0], hsl2[0]);
    const s = HColorSimple.linear(factor, hsl1[1], hsl2[1]);
    const l = HColorSimple.linear(factor, hsl1[2], hsl2[2]);
    return [h, s, l];
  }

  /** `linear(float, float, float)`: `x + (y - x) * factor` in float32. @see HColorSimple.java:204-206 */
  private static linear(factor: number, x: number, y: number): number {
    return Math.fround(x + Math.fround(Math.fround(y - x) * factor));
  }

  /** @see HColorSimple.java:141-143 */
  static create(c: ResolvedColor): HColorSimple {
    return new HColorSimple(c, undefined, TransparentFillBehavior.WITH_FILL_NONE);
  }

  /** `[WITHDARK ]<XColor> α=<alpha>[ transparent]`. @see HColorSimple.java:49-65 */
  toString(): string {
    let sb = this.dark === undefined ? '' : 'WITHDARK ';
    sb += `${xColorToString(this.color)} α=${String(this.color.a)}`;
    if (this.isTransparent()) sb += ' transparent';
    if (this.fillBehavior !== TransparentFillBehavior.WITH_FILL_NONE) sb += ` ${this.fillBehavior}`;
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

  /** The awt colour when transparent, else the mapper's answer.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColorSimple.java:172-176 */
  toColor(mapper: ColorMapper): ResolvedColor {
    if (this.isTransparent()) return this.getAwtColor();
    return mapper.fromColorSimple(this);
  }

  /** `#00000000` when transparent, else `XColor#toSvg` of `toColor(mapper)`
   *  (the inherited `HColor#toSvg`, final there).
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColor.java:74-79 */
  toSvg(mapper: ColorMapper): string {
    if (this.isTransparent()) return '#00000000';
    return toSvgHex(this.toColor(mapper));
  }

  /** @see HColorSimple.java:225-228 */
  withDark(dark: HColor): HColor {
    return new HColorSimple(this.color, dark, this.fillBehavior);
  }

  /** What `SvgGraphics#setFillColor` does with a transparent fill:
   *  `WITH_FILL_NONE` (the default) writes `fill="none"`, `WITH_FILL_OPACITY`
   *  keeps the colour's own `#rrggbbaa` (`fill="#000" fill-opacity="0"`).
   *  @see HColorSimple.java:136-139, SvgGraphics.java:521-530 */
  transparentFillBehavior(): TransparentFillBehavior {
    return this.fillBehavior;
  }

  /** A copy with the given behaviour; colour and dark partner are kept.
   *  @see HColorSimple.java:230-233 */
  withTransparentFillBehavior(transparentFillBehavior: TransparentFillBehavior): HColorSimple {
    return new HColorSimple(this.color, this.dark, transparentFillBehavior);
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
   * ColorMapper.java:47-52). The dark partner is not consulted: a caller
   * that may draw under another mapper hands the `HColorSimple` itself to
   * `Fore`/`Back` instead, and the driver maps it ({@link toSvg}).
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColor.java:74-80
   */
  asPaint(): Paint {
    if (this.isTransparent()) return '#00000000';
    return toSvgHex(this.color);
  }
}
