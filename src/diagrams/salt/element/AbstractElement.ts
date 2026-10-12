import { FontConfiguration as AbelFontConfiguration } from '../../../core/abel/FontConfiguration.js';
import { HColors } from '../../../core/klimt/color/HColors.js';
import { HColorSet } from '../../../core/klimt/color/HColorSet.js';
import type { HColorSimple } from '../../../core/klimt/color/HColorSimple.js';
import { bridgeFontConfiguration } from '../../../core/klimt/font/FontConfigurationBridge.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { UFont } from '../../../core/klimt/font/UFont.js';
import type { XDimension2D } from '../../../core/klimt/geom/XDimension2D.js';
import type { FontConfiguration } from '../../../core/klimt/shape/UText.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { UStroke } from '../../../core/klimt/UStroke.js';
import { Pragma } from '../../../core/skin/Pragma.js';
import type { HColor } from '../../../core/style/Value.js';
import type { Element } from './Element.js';

/** `HColors.BLUE = set.getColorOrWhite("#0000FF")` — not in the port's
 *  `HColors` (`klimt/color/HColors.ts`), so read the same way here.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColors.java:92 */
const BLUE = '#0000FF';
/** `blackBlueTrue`'s tab size. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/FontConfiguration.java:64 */
const BLACK_BLUE_TRUE_TAB_SIZE = 8;

/** Every palette colour is `HColorSimple#withDark`, which always builds an
 *  `HColorSimple` (`new HColorSimple(this.color, dark)`, HColorSimple.java:
 *  225-228, `HColorSimple.ts#withDark`); the port types its result as the
 *  opaque `HColor`, so the cast restores the class the call returned. */
function simple(color: HColor): HColorSimple {
  return color as HColorSimple;
}

/**
 * AbstractElement — the salt palette (each a light colour with its
 * `@media dark` partner), the black-ink font configuration and the empty
 * pragma every widget draws with. Salt reads no style (decisions.md D3).
 *
 * Colours are returned as `HColorSimple` (upstream: `HColor`), the concrete
 * class every getter builds, so a widget can paint one
 * (`HColorSimple#asPaint`) where upstream applies it (`color.bg()`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/AbstractElement.java:45-89
 */
export abstract class AbstractElement implements Element {
  abstract getPreferredDimension(stringBounder: StringBounder, x: number, y: number): XDimension2D;

  abstract drawU(ug: UGraphic, zIndex: number, dimToUse: XDimension2D): void;

  /** @see AbstractElement.java:47-49 */
  protected getBlack(): HColorSimple {
    return simple(HColors.BLACK.withDark(HColors.WHITE));
  }

  /** @see AbstractElement.java:51-53 */
  protected getColor88(): HColorSimple {
    return this.buildColor('#8', '#8');
  }

  /** @see AbstractElement.java:55-57 */
  protected getColorAA(): HColorSimple {
    return this.buildColor('#A', '#6');
  }

  /** @see AbstractElement.java:59-61 */
  protected getColorBB(): HColorSimple {
    return this.buildColor('#B', '#5');
  }

  /** @see AbstractElement.java:63-65 */
  protected getColorDD(): HColorSimple {
    return this.buildColor('#D', '#3');
  }

  /** @see AbstractElement.java:67-69 */
  protected getColorEE(): HColorSimple {
    return this.buildColor('#E', '#2');
  }

  /** @see AbstractElement.java:71-73 */
  protected getWhite(): HColorSimple {
    return simple(HColors.WHITE.withDark(HColors.BLACK));
  }

  /** @see AbstractElement.java:75-79 */
  private buildColor(color1: string, color2: string): HColorSimple {
    const tmp1 = HColorSet.instance().getColorOrWhite(color1);
    const tmp2 = HColorSet.instance().getColorOrWhite(color2);
    return simple(tmp1.withDark(tmp2));
  }

  /**
   * `FontConfiguration.blackBlueTrue(font)` = `create(font,
   * HColors.BLACK.withDark(HColors.WHITE), HColors.BLUE, UStroke.simple(), 8)`
   * (FontConfiguration.java:63-65). The port has no klimt
   * `FontConfiguration.blackBlueTrue`: the five-argument `create` is
   * `abel/FontConfiguration.ts`, and `bridgeFontConfiguration` turns it into
   * the creole `FontConfiguration` — whose unset hyperlink colour and
   * underline stroke ARE blue and `UStroke.simple()` (`UText.ts`,
   * `hyperlinkColor`/`hyperlinkUnderlineStroke`).
   *
   * @see AbstractElement.java:81-83
   */
  protected blackBlueTrue(font: UFont): FontConfiguration {
    return bridgeFontConfiguration(
      AbelFontConfiguration.create(
        font,
        HColors.BLACK.withDark(HColors.WHITE),
        HColorSet.instance().getColorOrWhite(BLUE),
        UStroke.simple(),
        BLACK_BLUE_TRUE_TAB_SIZE,
      ),
    );
  }

  /** @see AbstractElement.java:85-87 */
  protected getPragma(): Pragma {
    return Pragma.createEmpty();
  }
}
