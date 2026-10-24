import type { UShape } from '../UShape.js';
import type { UStroke } from '../UStroke.js';
import type { HColorSimple } from '../color/HColorSimple.js';
import { FontPosition, fontPositionSpace, muteFontSize } from '../font/FontPosition.js';
import type { SvgAttributes } from '../SvgAttributes.js';

/**
 * FontStyle — the seven style flags a `FontConfiguration` can carry.
 *
 * Upstream: klimt/font/FontStyle.java (a Java `enum`: PLAIN, ITALIC,
 * BOLD, UNDERLINE, STRIKE, WAVE, BACKCOLOR). Ported as an as-const
 * string-union object per project convention (no `const enum`). The
 * enum's identity/name plus `getRegexActivationPattern`/
 * `getRegexDeactivationPattern` (below, module functions over the constant)
 * are ported here — `starters(isCreolePure)` belongs to the creole markup
 * parser, out of scope for a shape.
 */
export const FontStyle = {
  PLAIN: 'PLAIN',
  ITALIC: 'ITALIC',
  BOLD: 'BOLD',
  UNDERLINE: 'UNDERLINE',
  STRIKE: 'STRIKE',
  WAVE: 'WAVE',
  BACKCOLOR: 'BACKCOLOR',
} as const;
export type FontStyle = (typeof FontStyle)[keyof typeof FontStyle];

/**
 * `FontStyle#getRegexActivationPattern` — the opening-tag regex source
 * `Splitter.htmlTag` assembles (Splitter.java:88-93). Strings are the Java
 * literals' runtime values. STRIKE returns the UBREX spelling verbatim
 * (java:102 is the same literal as `getUbrexActivationPattern`, :131), NOT a
 * translated alternation: upstream compiles it as a `java.util.regex`
 * pattern, where `【…┇…】` is literal text and the mid-pattern `$` can never
 * be followed by `XC`, so the arm matches nothing — the jar keeps `<s>`
 * through `purgeAllTag` (field-length-strike-s). The Java's trailing
 * `return null` is unreachable for the seven constants (the exhaustive
 * switch below).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/FontStyle.java:88-111
 */
export function getRegexActivationPattern(style: FontStyle): string {
  switch (style) {
    case FontStyle.PLAIN:
      return '\\<[pP][lL][aA][iI][nN]\\>';
    case FontStyle.ITALIC:
      return '\\<[iI]\\>';
    case FontStyle.BOLD:
      return '\\<[bB]\\>';
    case FontStyle.UNDERLINE:
      return '\\<[uU](?::(#[0-9a-fA-F]{6}|\\w+))?\\>';
    case FontStyle.WAVE:
      return '\\<[wW](?::(#[0-9a-fA-F]{6}|\\w+))?\\>';
    case FontStyle.BACKCOLOR:
      return '\\<[bB][aA][cC][kK](?::(#?\\w+(?:[-\\\\|/]#?\\w+)?))?\\>';
    case FontStyle.STRIKE:
      return '<【strike┇STRIKE┇s┇S┇del┇DEL】〇?〘:〶$XC=【#〇{6}「0〜9a〜fA〜F」┇〇+〴w】〙>';
  }
}

/**
 * `FontStyle#getRegexDeactivationPattern` — the closing-tag regex source
 * (Java literals' runtime values; the trailing `return null` is unreachable,
 * as in {@link getRegexActivationPattern}).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/FontStyle.java:166-189
 */
export function getRegexDeactivationPattern(style: FontStyle): string {
  switch (style) {
    case FontStyle.PLAIN:
      return '\\</[pP][lL][aA][iI][nN]\\>';
    case FontStyle.ITALIC:
      return '\\</[iI]\\>';
    case FontStyle.BOLD:
      return '\\</[bB]\\>';
    case FontStyle.UNDERLINE:
      return '\\</[uU]\\>';
    case FontStyle.WAVE:
      return '\\</[wW]\\>';
    case FontStyle.BACKCOLOR:
      return '\\</[bB][aA][cC][kK]\\>';
    case FontStyle.STRIKE:
      return '\\</(?:s|S|strike|STRIKE|del|DEL)\\>';
  }
}

/**
 * FontConfiguration — the minimal font-rendering surface
 * `DriverTextSvg.java` actually reads off `UText#getFontConfiguration`:
 * family, size, style flags, and (foreground) color.
 *
 * Upstream: klimt/font/FontConfiguration.java is a much larger class
 * (underline stroke object, extended/back color, `UFontFace`
 * weight/style, attribute map, `containsStyle`, `getFont(): UFont`
 * with its own `getFamily`/`getSize`/`getSize2D`/`createTextLayout`
 * surface, ...) — full class deferred, out of scope for a shape task.
 * `DriverTextSvg.draw` additionally reads
 * `getUnderlineStroke().getThickness()`, `getExtendedColor()`, and
 * `getFontFace().getCssWeight()`/`isItalic()` for the underline/strike/
 * backcolor/bold-weight rendering decisions. cdd-B7FU-R1 closes two of
 * those three: {@link FontConfiguration.extendedColor} and
 * {@link FontConfiguration.fontFace} are now carried here (both optional,
 * so every pre-existing literal is unchanged) and read by
 * `driver-text-svg.ts`. `getUnderlineStroke()` stays deferred — this port
 * has no `UStroke` on a font configuration, so the UNDERLINE branch's
 * `getThickness() > 0` gate is assumed true whenever the flag is present
 * (that driver's own doc comment).
 *
 * `color` is `null` to mean upstream's `HColor#isTransparent()`
 * (`DriverTextSvg` skips drawing entirely in that case) — `HColor`
 * itself is not ported; a resolved SVG-ready color string stands in,
 * matching the `Paint`-instead-of-`HColor` adaptation already made in
 * `UParam.ts` (T2).
 */
/**
 * FontFace — the weight/slant half of upstream's `UFontFace`
 * (klimt/font/UFontFace.java), the value `FontConfiguration#getFontFace()`
 * (java:114-115) returns off `currentFont`.
 *
 * Ported: `getCssWeight()` (java:150-152) and `isItalic()` (java:154-156),
 * the only two members `DriverTextSvg.draw` reads (java:97-107). The
 * `UFontStyle`/`UFontWeight` value objects behind them, `deriveFont`
 * (AWT), and the `withStyle`/`withWeight` builders are not needed by any
 * SVG-side consumer and are not ported here.
 *
 * Why this is a SEPARATE field from {@link FontConfiguration.styles}, and
 * not just another flag in it: upstream keeps the two independent on
 * purpose. `FontConfiguration#add(FontStyle)` (java:301-309) clones and —
 * for `PLAIN` — CLEARS `styles`, but passes `currentFont` (hence its face)
 * through verbatim, so `<plain>` cannot undo the base font's own weight.
 * A flat single-set model collapses that distinction and drops a
 * skinparam-seeded bold on `<plain>` (cdd-T25, journal row 120).
 *
 * @see ~/git/plantuml/.../klimt/font/UFontFace.java:150-156,232-234
 */
export interface FontFace {
  /** `UFontFace#getCssWeight()` — 400 is upstream's `normal()` default. */
  readonly cssWeight: number;
  /** `UFontFace#isItalic()`. */
  readonly italic: boolean;
}

/** Upstream `UFontFace.normal()` (java:71-73): weight 400, upright. The
 *  value every `FontConfiguration` that carries no explicit face reads as,
 *  so the field can stay optional and every pre-existing literal stays
 *  valid and byte-identical. */
export const NORMAL_FONT_FACE: FontFace = { cssWeight: 400, italic: false };

export interface FontConfiguration {
  readonly family: string;
  readonly size: number;
  readonly color: string | null;
  /** The `HColorSimple` {@link color} was resolved from, when the
   *  configuration came from upstream's single `FontConfiguration` class
   *  (`font/FontConfigurationBridge.ts`): it keeps the dark partner
   *  (`FontConfiguration.blackBlueTrue` = BLACK.withDark(WHITE),
   *  FontConfiguration.java:63-65) that `DriverTextSvg` maps with the
   *  drawing graphic's `ColorMapper` (DriverTextSvg.java:177-178). Valid only
   *  while {@link color} is still its `asPaint()`: a creole/skin override
   *  that spreads a NEW colour over this configuration leaves the field
   *  behind, and the driver then reads {@link color} (`fontColorOf`).
   *  Optional, so every existing literal is unchanged. */
  readonly hColor?: HColorSimple;
  readonly styles: ReadonlySet<FontStyle>;
  /** Upstream's `currentFont.getFontFace()` (`FontConfiguration#getFontFace`,
   *  java:114-115) — the BASE face, independent of {@link styles}. Optional:
   *  `undefined` means {@link NORMAL_FONT_FACE}, which is what every
   *  pre-existing `FontConfiguration` literal in this port already behaved
   *  as. Read through {@link getFontFace}, never directly. */
  readonly fontFace?: FontFace;
  /** Upstream's `extendedColor` field (`FontConfiguration.java:144`, set by
   *  `changeExtendedColor`, java:263-266) — the `<u:color>`/`<w:color>`/
   *  `<s:color>`/`<back:color>` colour a creole style command captured.
   *  A resolved `#RRGGBB` (or `colorA<sep>colorB` gradient token) string
   *  rather than an `HColor`, matching {@link FontConfiguration.color}'s
   *  own already-resolved adaptation. `undefined` is upstream's `null`. */
  readonly extendedColor?: string;
  /** Upstream's own `FontConfiguration.fontPosition` field
   *  (`FontConfiguration.java:145`, set by `changeFontPosition`, java:277-280).
   *  `undefined` means `FontPosition.NORMAL` — the ~28 existing
   *  `FontConfiguration` object literals in this port predate the field and
   *  stay valid unchanged, which is why it is optional rather than required.
   */
  readonly fontPosition?: FontPosition;
  /** Upstream's `hyperlinkColor` field (`FontConfiguration.java:144`),
   *  populated at construction time from `style.value(PName.HyperLinkColor)`
   *  (`FontConfiguration.java:213-219`, `Style.java:265`) — a resolved
   *  `#RRGGBB` string, matching {@link color}'s own already-resolved
   *  adaptation. Read by `FontConfiguration#hyperlink()`'s `withHyperlink()`
   *  (java:253-256), which copies it onto {@link color}; this port's mirror
   *  is `CommandCreoleUrl.ts`'s `applyHyperlinkStyleAndPush`. `undefined`
   *  means no `<style>`/skinparam override reached this configuration — the
   *  caller falls back to upstream's own `blue` default
   *  (`plantuml.skin:7,565`, `SkinParam.java:305-311`). decisions.md#D3. */
  readonly hyperlinkColor?: string;
  /** Upstream's `hyperlinkUnderlineStroke` field (`FontConfiguration.java:146`),
   *  set from `skinParam.useUnderlineForHyperlink()` (`SkinParam.java:1057-1060`:
   *  `UStroke.simple()` unless `skinparam hyperlinkUnderline false`, then
   *  `null`). `FontConfiguration#hyperlink()` (java:335-340) adds `UNDERLINE`
   *  only when it is non-null. `undefined` is the unset-skinparam default
   *  (`UStroke.simple()`); only `null` suppresses the underline. */
  readonly hyperlinkUnderlineStroke?: UStroke | null;
  /** Upstream's `svgAttributes` field (`FontConfiguration.java:147`), set by
   *  `changeAttributes` (java:248-251) from a `<text name=value>` creole tag
   *  and read by `DriverTextSvg` (`getAttributes()`, java:178-180). `undefined`
   *  is upstream's `SvgAttributes.empty()` -- so every pre-existing literal
   *  stays valid and draws no extra attribute. */
  readonly svgAttributes?: SvgAttributes;
}

/**
 * The EFFECTIVE drawing font of a configuration — upstream
 * `FontConfiguration#getFont()` (`FontConfiguration.java:98-104`), whose
 * last act is `return fontPosition.mute(result)`.
 *
 * Upstream keeps `currentFont` UNMUTED and mutes at READ time; this port
 * does the same (decisions.md#D1, `plans/creole-exposant-port/`), so a
 * nested `<sup><size:20>x</size></sup>` stores size 20 + EXPOSANT and
 * yields 17 here, exactly as the jar does — an eagerly-muted stored size
 * would instead yield 20.
 *
 * Every measure/draw site reads the font through this function; only
 * `size` can differ from the stored configuration (upstream's style-flag
 * `mutateFont` loop, java:99-101, has no equivalent on this port's
 * `FontConfiguration` — the style flags are consumed directly by the SVG
 * driver).
 */
export function getFont(fc: FontConfiguration): { readonly family: string; readonly size: number } {
  return { family: fc.family, size: muteFontSize(fc.size, fc.fontPosition ?? FontPosition.NORMAL) };
}

/**
 * Upstream `FontConfiguration#getFontFace()` (`FontConfiguration.java:
 * 114-115`, `return currentFont.getFontFace()`) — the one read-side seam
 * for the base face, so an absent field resolves to upstream's
 * `UFontFace.normal()` in exactly one place.
 */
export function getFontFace(fc: FontConfiguration): FontFace {
  return fc.fontFace ?? NORMAL_FONT_FACE;
}

/**
 * Upstream `FontConfiguration#changeExtendedColor(HColor)`
 * (`FontConfiguration.java:263-266`) — a new configuration with every other
 * field, `styles` and `currentFont` included, passed through verbatim.
 */
export function changeExtendedColor(fc: FontConfiguration, extendedColor: string): FontConfiguration {
  return { ...fc, extendedColor };
}

/**
 * Upstream `FontConfiguration#changeAttributes(SvgAttributes)`
 * (`FontConfiguration.java:248-251`): `svgAttributes.add(toBeAdded)`, every
 * other field passed through verbatim.
 */
export function changeAttributes(fc: FontConfiguration, toBeAdded: SvgAttributes): FontConfiguration {
  return { ...fc, svgAttributes: fc.svgAttributes === undefined ? toBeAdded : fc.svgAttributes.add(toBeAdded) };
}

/** Upstream `FontConfiguration#getSpace()` (`FontConfiguration.java:370-372`)
 *  — a straight delegation to `fontPosition.getSpace()`. This is the value
 *  `AtomText#getStartingAltitude` reports to `Sea` (decisions.md#D2). */
export function getSpace(fc: FontConfiguration): number {
  return fontPositionSpace(fc.fontPosition ?? FontPosition.NORMAL);
}

// Upstream constants from jaws/Jaws.java — UText's constructor replaces
// these two creole line-break markers with their visible glyphs before
// storing the text. Ported as local literals (the full Jaws class is a
// creole-preprocessor subsystem, out of scope for a shape).
const BLOCK_E1_NEWLINE = '';
const BLOCK_E1_BREAKLINE = '';

function normalizeText(text: string): string {
  return text.split(BLOCK_E1_NEWLINE).join('↵').split(BLOCK_E1_BREAKLINE).join('⏎');
}

/**
 * UText — a string plus its font configuration and orientation, the
 * shape `DriverTextSvg.java` serializes to an SVG `<text>` element.
 *
 * Upstream: klimt/shape/UText.java. Ported: `build`, `withOrientation`,
 * the plain accessors, and `toString`, plus the Jaws newline-marker
 * substitution upstream's constructor performs (see `normalizeText`
 * above).
 *
 * Deferred (out of D3' scope, reported):
 * - `getDescent(stringBounder)` / `calculateDimension(stringBounder)` /
 *   `createTextLayout()` — all three require `StringBounder` (text
 *   measurement) or AWT's `TextLayout`; measurement is a separate
 *   subsystem from shape data, not ported here.
 */
export class UText implements UShape {
  private readonly text: string;
  private readonly font: FontConfiguration;
  private readonly orientation: number;

  private constructor(text: string, font: FontConfiguration, orientation: number) {
    this.text = normalizeText(text);
    this.font = font;
    this.orientation = orientation;
  }

  static build(text: string, font: FontConfiguration): UText {
    return new UText(text, font, 0);
  }

  withOrientation(orientation: number): UText {
    return new UText(this.text, this.font, orientation);
  }

  getText(): string {
    return this.text;
  }

  getFontConfiguration(): FontConfiguration {
    return this.font;
  }

  getOrientation(): number {
    return this.orientation;
  }

  toString(): string {
    return `UText[${this.text}]`;
  }
}
