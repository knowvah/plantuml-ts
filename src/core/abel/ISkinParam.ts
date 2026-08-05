import type { Stereotype } from '../stereo/Stereotype.js';
import type { UStroke } from '../klimt/UStroke.js';
import type { Pragma } from '../skin/Pragma.js';
import type { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import type { HColor } from './Colors.js';

/**
 * ADR-2 consumed-interface stubs for the style/skinparam seam
 * (`Entity` and `Bodier` reference these; the real classes are the
 * unported `style/` + `skin/` packages ADR-2 scopes out of SI1).
 * Each name below is declared with EXACTLY the member surface this
 * task's closure calls — implementers arrive with the future style
 * missions, which should move each symbol to its upstream-mirroring
 * home (`src/core/style/`, `src/core/klimt/font/`) and widen it there.
 * Journaled in SI1's decision journal (T5).
 */

/**
 * UFont — opaque stand-in for `klimt/font/UFont.java`. `Entity` only
 * pipes fonts from `ISkinParam#getFont` into `FontConfiguration.create`
 * (never calls a method on one) — same scope reduction as
 * `stereo/Stereotype.ts`'s `CircledFont` and its stated rationale.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/UFont.java
 */
export type UFont = object;

/**
 * StyleBuilder — opaque stand-in for `style/StyleBuilder.java`.
 * `Entity` stores the builder active at creation time and returns it
 * from `getCurrentStyleBuilder`; nothing in this closure calls into it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleBuilder.java
 */
export type StyleBuilder = object;

/**
 * Style — consumed slice of `style/Style.java`: `Entity#getStateDescription`
 * reads only `getHorizontalAlignment()`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/Style.java
 */
export interface Style {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/Style.java (getHorizontalAlignment) */
  getHorizontalAlignment(): HorizontalAlignment;
}

/**
 * FontParam — consumed slice of `klimt/font/FontParam.java` (an enum of
 * ~80 per-element font selectors). `Entity#getTitleFontParam` uses only
 * `STATE` and `PACKAGE`; the full enum lands with the skinparam
 * missions.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/FontParam.java
 */
export const FontParam = {
  STATE: 'STATE',
  PACKAGE: 'PACKAGE',
} as const;
export type FontParam = (typeof FontParam)[keyof typeof FontParam];

/**
 * ISkinParam — consumed slice of `style/ISkinParam.java` (which
 * upstream extends `ISkinSimple`; the extension is deferred until a
 * consumer reaches the `ISkinSimple` surface through this seam —
 * `Entity` itself calls only the members below plus `getPragma`).
 * T10's `CucaDiagram#getSkinParam` returns one.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/ISkinParam.java
 */
export interface ISkinParam {
  /** Varargs `FontParam... param` preserved as a rest parameter.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/ISkinParam.java (getFontHtmlColor) */
  getFontHtmlColor(stereotype: Stereotype | undefined, ...param: FontParam[]): HColor;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/ISkinParam.java (getFont) */
  getFont(stereotype: Stereotype | undefined, inGroup: boolean, ...fontParam: FontParam[]): UFont;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/ISkinParam.java (getHyperlinkColor) */
  getHyperlinkColor(): HColor;

  /** Returns the hyperlink underline stroke (upstream return type `UStroke`).
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/ISkinParam.java (useUnderlineForHyperlink) */
  useUnderlineForHyperlink(): UStroke;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/ISkinParam.java (getTabSize) */
  getTabSize(): number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/ISkinParam.java (getCurrentStyleBuilder) */
  getCurrentStyleBuilder(): StyleBuilder;

  /** On `ISkinSimple` upstream; declared here directly, see the
   * interface doc comment.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/ISkinSimple.java (getPragma) */
  getPragma(): Pragma;
}
