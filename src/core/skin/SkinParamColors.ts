import type { Colors, HColor } from '../abel/Colors.js';
import { ColorType } from '../abel/ColorType.js';
import type { FontParam, ISkinParamWithSimple } from '../abel/ISkinParam.js';
import type { Stereotype } from '../stereo/Stereotype.js';
import { SkinParamDelegator } from './SkinParamDelegator.js';

/**
 * SkinParamColors — a `SkinParamDelegator` carrying an element's own
 * `Colors` (`[#color]` on a mindmap/wbs idea): `FtileBoxOld` reads them
 * back through `getColors()` and feeds `style.eventuallyOverride`.
 *
 * Ported: `getColors`, the constructor, `toString`, and the
 * `getFontHtmlColor` override. Not ported: the `shadowing(Stereotype)`
 * (java:64-70) and `getHtmlColor(ColorParam, Stereotype, boolean)`
 * (java:81-93) overrides — they override members the port's `ISkinParam`
 * slice does not declare, so nothing can reach them yet; each lands with
 * that slice member.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/SkinParamColors.java:46-95
 */
export class SkinParamColors extends SkinParamDelegator {
  /** @see SkinParamColors.java:52 */
  private readonly colors: Colors;

  /** @see SkinParamColors.java:54-57 */
  constructor(skinParam: ISkinParamWithSimple, colors: Colors) {
    super(skinParam);
    this.colors = colors;
  }

  /** @see SkinParamColors.java:48-50 */
  getColors(): Colors {
    return this.colors;
  }

  /** @see SkinParamColors.java:59-62 */
  toString(): string {
    return `SkinParamColors::${this.colors.toString()}`;
  }

  /** The `Colors` TEXT colour, else the wrapped answer. @see SkinParamColors.java:72-79 */
  override getFontHtmlColor(stereotype: Stereotype | undefined, ...param: FontParam[]): HColor {
    const value = this.colors.getColor(ColorType.TEXT);
    if (value === undefined) return super.getFontHtmlColor(stereotype, ...param);

    return value;
  }
}
