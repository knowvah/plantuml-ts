import { HColorGradient, type GradientPolicy } from './HColorGradient.js';
import { HColorSet, type ResolvedColor } from './HColorSet.js';
import { HColorSimple } from './HColorSimple.js';

/** `new XColor(0, 0, 0, 0)` (HColors.java:121). */
const TRANSPARENT_XCOLOR: ResolvedColor = { r: 0, g: 0, b: 0, a: 0 };

/** Java's checked `(HColorSimple)` cast on a `getColorOrWhite` result (HColors.java:84-85). */
function asSimple(c: HColorSimple | HColorGradient): HColorSimple {
  if (!(c instanceof HColorSimple)) throw new Error('ClassCastException: not an HColorSimple');
  return c;
}

/**
 * HColors — the colour constants and factories the style engine reaches:
 * `BLACK`, `WHITE`, `transparent()`, `none()`, `gradient()`, `simple()`. The other
 * constants (`RED_LIGHT` … `COL_BBBBBB`) and helpers (`noGradient`,
 * `changeBack`, `unlinear`, `middle`) are not ported.
 *
 * Every constant is built on first read, as the JVM initializes the class
 * on first use (static initializer, java:82-86, 121): `HColorSet` reads
 * `HColors.WHITE`/`none()` and `HColors` reads `HColorSet.instance()`, so
 * an eager module-level construction would depend on ES-module evaluation
 * order across that import cycle. The cached instances are immutable.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColors.java:45-181
 */
export class HColors {
  private static black: HColorSimple | undefined;
  private static white: HColorSimple | undefined;
  /** `TRANSPARENT = HColorSimple.create(new XColor(0, 0, 0, 0))`. @see HColors.java:121 */
  private static transparentColor: HColorSimple | undefined;

  /** `(HColorSimple) set.getColorOrWhite("#000000")`. @see HColors.java:84 */
  static get BLACK(): HColorSimple {
    HColors.black ??= asSimple(HColorSet.instance().getColorOrWhite('#000000'));
    return HColors.black;
  }

  /** `(HColorSimple) set.getColorOrWhite("#FFFFFF")`. @see HColors.java:85 */
  static get WHITE(): HColorSimple {
    HColors.white ??= asSimple(HColorSet.instance().getColorOrWhite('#FFFFFF'));
    return HColors.white;
  }

  /** @see HColors.java:123-125 */
  static transparent(): HColorSimple {
    HColors.transparentColor ??= HColorSimple.create(TRANSPARENT_XCOLOR);
    return HColors.transparentColor;
  }

  /** The same instance as {@link transparent}. @see HColors.java:131-133 */
  static none(): HColorSimple {
    return HColors.transparent();
  }

  /** @see HColors.java:174-176 */
  static gradient(
    color1: HColorSimple | HColorGradient,
    color2: HColorSimple | HColorGradient,
    policy: GradientPolicy,
  ): HColorGradient {
    return new HColorGradient(color1, color2, policy);
  }

  /** @see HColors.java:178-180 */
  static simple(c: ResolvedColor): HColorSimple {
    return HColorSimple.create(c);
  }
}
