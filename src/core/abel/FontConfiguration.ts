import type { UStroke } from '../klimt/UStroke.js';
import type { HColor } from './Colors.js';
import type { ISkinParam, Style, UFont } from './ISkinParam.js';

/**
 * FontConfiguration — ADR-2 consumed-slice LOCAL port of
 * `klimt/font/FontConfiguration.java` (a ~470-line class). `Entity`
 * reaches exactly two members:
 *
 *  - `create(UFont, HColor, HColor, UStroke, int)` — ported for real
 *    (upstream stores the five arguments plus derived fields —
 *    `getStyles(font)`, mother font/color, `FontPosition.NORMAL`,
 *    `SvgAttributes.empty()` — none of which anything in this closure
 *    reads; deferred to the full `klimt/font` port)
 *  - `create(ISkinParam, Style)` — DEFERRED (throws): its body reads
 *    `style.value(PName.HyperLinkColor/FontColor).asColor(...)` +
 *    `style.getUFont()`, the style value-resolution machinery ADR-2
 *    scopes out of SI1
 *
 * NOT the same type as `klimt/shape/UText.ts`'s structural
 * `FontConfiguration` interface (that file's documented DriverTextSvg
 * narrowing `{family,size,style,color}`); unification is the full
 * `klimt/font/FontConfiguration` port's job — move this file to
 * `src/core/klimt/font/` then. Journaled (T5).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/FontConfiguration.java:55
 */
export class FontConfiguration {
  private constructor(
    private readonly font: UFont,
    private readonly color: HColor,
    private readonly hyperlinkColor: HColor,
    private readonly hyperlinkUnderlineStroke: UStroke,
    private readonly tabSize: number,
  ) {}

  /** The two upstream `create` overloads `Entity` calls — see the class
   * doc comment for which is live and which is deferred.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/FontConfiguration.java:57-61 (5-arg)
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/FontConfiguration.java:209-211 (skinParam+style) */
  static create(skinParam: ISkinParam, style: Style): FontConfiguration;
  static create(
    font: UFont,
    color: HColor,
    hyperlinkColor: HColor,
    hyperlinkUnderlineStroke: UStroke,
    tabSize: number,
  ): FontConfiguration;
  static create(
    a: UFont | ISkinParam,
    b: HColor | Style,
    hyperlinkColor?: HColor,
    hyperlinkUnderlineStroke?: UStroke,
    tabSize?: number,
  ): FontConfiguration {
    if (hyperlinkColor === undefined) {
      void a;
      void b;
      throw new Error(
        'deferred per SI1/ADR-2: FontConfiguration.create(ISkinParam, Style) needs the style value-resolution machinery (style/Style#value, PName) not yet ported',
      );
    }
    return new FontConfiguration(
      a,
      b,
      hyperlinkColor,
      hyperlinkUnderlineStroke as UStroke,
      tabSize as number,
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/FontConfiguration.java (getFont) */
  getFont(): UFont {
    return this.font;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/FontConfiguration.java (getColor) */
  getColor(): HColor {
    return this.color;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/FontConfiguration.java (getHyperlinkColor) */
  getHyperlinkColor(): HColor {
    return this.hyperlinkColor;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/FontConfiguration.java (getHyperlinkUnderlineStroke) */
  getHyperlinkUnderlineStroke(): UStroke {
    return this.hyperlinkUnderlineStroke;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/FontConfiguration.java (getTabSize) */
  getTabSize(): number {
    return this.tabSize;
  }
}
