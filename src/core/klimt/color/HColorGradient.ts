import type { Gradient } from '../../paint.js';
import type { HColor } from '../../style/Value.js';
import type { ResolvedColor } from './HColorSet.js';
import type { HColorSimple } from './HColorSimple.js';

/** A gradient policy character, the separator `HColorSet#parseColor` split on (HColorSet.java:111). */
export type GradientPolicy = Gradient['policy'];

/**
 * `HColor#toRGB(ColorMapper.IDENTITY)`: `XColor.toHexRGBColor(color.getRGB())`
 * = `String.format("#%06X", rgb & 0xFFFFFF)` -- uppercase `#RRGGBB`, alpha
 * DROPPED (unlike `toSvg`). `toColor(IDENTITY)` of an `HColorSimple` is its
 * `XColor` (`HColorSimple.java:172-176`, `ColorMapper.java:47-52`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColor.java:69-72
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/awt/XColor.java:127-129
 */
function toRGB(color: HColorSimple): string {
  const { r, g, b } = color.getAwtColor();
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase()}`;
}

/**
 * HColorGradient — a two-colour gradient and its direction `policy`
 * (`-` vertical, `|` horizontal, `/` and `\` diagonal), built by
 * `HColorSet#parseColor`'s separator scan (HColorSet.java:109-117) through
 * `HColors.gradient` (HColors.java:174-176).
 *
 * The port's only concrete colour reaching here is {@link HColorSimple}
 * (`parseColor` wraps both halves in `HColors.simple`, java:115), so the
 * halves are typed as such. There is no `ColorMapper` port: every
 * `mapper` argument is `ColorMapper.IDENTITY`, as in `HColorSimple#asPaint`.
 * Not ported: `getRGB` (TeaVM/AWT raster only), `opposite` (`HColorSimple
 * #opposite` is unported). Inherited `HColor#withDark` throws, as upstream.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColorGradient.java:43-112
 */
export class HColorGradient implements HColor {
  /** @see HColorGradient.java:45 */
  private readonly color1: HColorSimple;
  /** @see HColorGradient.java:46 */
  private readonly color2: HColorSimple;
  /** @see HColorGradient.java:47 */
  private readonly policy: GradientPolicy;

  /** A gradient half unwraps to that gradient's own colour. @see HColorGradient.java:49-59 */
  constructor(
    color1arg: HColorSimple | HColorGradient,
    color2arg: HColorSimple | HColorGradient,
    policy: GradientPolicy,
  ) {
    this.color1 = color1arg instanceof HColorGradient ? color1arg.color1 : color1arg;
    this.color2 = color2arg instanceof HColorGradient ? color2arg.color2 : color2arg;
    this.policy = policy;
  }

  /** @see HColorGradient.java:61-63 */
  getColor1(): HColorSimple {
    return this.color1;
  }

  /** @see HColorGradient.java:65-67 */
  getColor2(): HColorSimple {
    return this.color2;
  }

  /**
   * The colour `coeff` of the way from `color1` to `color2`, each channel
   * truncated toward zero (`(int)`), with the given alpha.
   * @see HColorGradient.java:69-90
   */
  getColor(coeff: number, alpha: number): ResolvedColor {
    if (coeff > 1 || coeff < 0) throw new Error(`IllegalArgumentException: c=${String(coeff)}`);
    const c1 = this.color1.getAwtColor();
    const c2 = this.color2.getAwtColor();
    return {
      r: c1.r + Math.trunc(coeff * (c2.r - c1.r)),
      g: c1.g + Math.trunc(coeff * (c2.g - c1.g)),
      b: c1.b + Math.trunc(coeff * (c2.b - c1.b)),
      a: alpha,
    };
  }

  /** @see HColorGradient.java:98-100 */
  getPolicy(): GradientPolicy {
    return this.policy;
  }

  /** `color1.toColor(mapper)`. @see HColorGradient.java:102-105 */
  toColor(): ResolvedColor {
    return this.color1.getAwtColor();
  }

  /** The inherited `"?" + getClass().getSimpleName()`. @see HColor.java:113-115 */
  asString(): string {
    return '?HColorGradient';
  }

  /** @see HColor.java:125-127 */
  withDark(_dark: HColor): HColor {
    throw new Error('UnsupportedOperationException');
  }

  /**
   * PORT-ONLY adapter onto the klimt substrate's `Paint`: the arguments
   * `DriverRectangleSvg` hands `SvgGraphics#createSvgGradient` --
   * `gr.getColor1().toRGB(mapper), gr.getColor2().toRGB(mapper),
   * gr.getPolicy()` (DriverRectangleSvg.java:87-90, 103-106). The port's
   * rectangle driver makes that call for a `Gradient` paint.
   */
  asPaint(): Gradient {
    return { color1: toRGB(this.color1), color2: toRGB(this.color2), policy: this.policy };
  }
}
