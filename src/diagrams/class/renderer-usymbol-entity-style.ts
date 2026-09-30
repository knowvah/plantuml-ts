/**
 * renderer-usymbol-entity-style.ts -- the per-leaf style resolution
 * (`EntityImageDescription.java:141-175`'s `styleTitle`/`style`/
 * `styleStereo` reads) for `renderer-usymbol-entity.ts`, moved out of that
 * file (cdd7 T2b) when the stereotype sprite, RoundCorner-by-stereotype and
 * root-alignment reads pushed it past the 500-line hook cap. A pure move of
 * the helpers and constants below; `renderer-usymbol-entity.ts` imports
 * them back.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageDescription.java
 */
import type { ClassifierGeo } from './class-geo-types.js';
import { resolveElementPaint, resolveElementLineThickness } from '../../core/theme.js';
import type { ScaledTheme } from './class-scale-geo.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { textFont, entityTitleStyles } from '../../core/decoration/symbol/usymbol-resolve.js';
import type { USymbol } from '../../core/descriptive-keywords.js';
import { resolveBareOrBackColor } from '../../core/color-override.js';
import { parseColor, isTransparentColor, type Paint } from '../../core/paint.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import { FontStyle, type FontConfiguration } from '../../core/klimt/shape/UText.js';
import { byStereo, elementLineStyle, elementStereoFontColor, elementTitleFontColor } from './class-package-style.js';

/** Jar default line thickness for an `EntityImageDescription`-family shape
 *  with no `LineThickness` skinparam override — see `renderer-entity.ts
 *  #ENTITY_STROKE_WIDTH`'s identical citation (`sacuso-94-gugi476/in.svg`:
 *  `style="...stroke-width:0.5;"`). Duplicated (not imported) — that
 *  constant is module-private in a file outside this task's write-set.
 *  cdd-B8FU: multiplied by `theme.scaleK` at its one call site below (both
 *  the override tier from `resolveElementLineThickness` and this default
 *  tier — "materialize the fallback", same rule as `attributeFontSize`). */
const ENTITY_STROKE_WIDTH = 0.5;

/** cdd-T22 (cacoma-43-poxu615) / cdd3-T12 (sijisi-94-ripu606): `ENTITY_
 *  ROUND_CORNER`, duplicated (not imported, same reason as
 *  `ENTITY_STROKE_WIDTH` above) from `description/renderer-entity.ts`.
 *  Upstream computes this UNCONDITIONALLY for every `EntityImageDescription`
 *  leaf (`EntityImageDescription.java:168`: `final double roundCorner =
 *  styleTitle.value(PName.RoundCorner).asDouble();`) — the classDiagram-
 *  scoped `element { RoundCorner 5 }` cascade (`plantuml.skin:193-197`)
 *  applies to every descriptive leaf's `element` `SName`, not just
 *  `component`. Only the shapes that actually READ `SymbolContext
 *  #getRoundCorner()` in their `drawRect`/`drawComponent2` show it:
 *  `USymbolComponent2#drawComponent2` and `USymbolRectangle#drawRect`
 *  (`USymbolRectangle.ts` ported from `USymbolRectangle.java:65-71` — the
 *  `diagonalCorner > 0 ? rect.diagonalCorner(...) : rect.rounded(roundCorner)`
 *  branch) — usecase/actor/circle/database's shapes ignore the field
 *  entirely, so passing this same value to them is a no-op, not a
 *  divergence (verified: `class-circle-usymbol-routing.test.ts`'s circle/
 *  component draw assertions are unchanged by this widening).
 *  `driver-rectangle-svg.ts` halves `roundCorner` at serialization (`rx =
 *  rx/2`), so 5.0 emits the jar's `rect/@rx="2.5"` (`sijisi-94-ripu606`'s
 *  golden `foo3` leaf: `<rect ... rx="2.5" ry="2.5"/>`). cdd-B8FU:
 *  multiplied by `theme.scaleK` at its one call site below. */
export const ELEMENT_ROUND_CORNER = 5.0;

/** `fcStereo`'s face (`EntityImageDescription.java:155-157,174`):
 *  `plantuml.skin:79-82` `stereotype { FontStyle italic }`. */
const STEREOTYPE_STYLES: ReadonlySet<FontStyle> = new Set([FontStyle.ITALIC]);

/**
 * cdd-B7FU-R3 (`daxeno-00-kasu166`): `desc`/`name` alignment is symbol-
 * scoped, not a blanket CENTER -- `EntityImageDescription.java:175,183-191`'s
 * `defaultAlign = styleTitle.getHorizontalAlignment()` reads the TITLE-
 * scoped signature (`{root, element, <diagram>, symbol.getSNames(), title}`),
 * which `plantuml.skin:452-454`'s bare `usecase { HorizontalAlignment
 * center }` selector matches (a one-component style selector matches any
 * signature CONTAINING it, upstream's subsequence cascade) for `usecase`
 * ONLY -- no equivalent rule exists for `actor`/`component`/`circle`/
 * `database`, so those four fall through to `root { HorizontalAlignment
 * left }` (`plantuml.skin:12`). Jar-verified `daxeno-00-kasu166`'s two-line
 * `<<Database>>` leaf: `"styled"` (18px) and `"should be styled"` (14px)
 * draw flush at the SAME `@x` (16) despite their different widths -- CENTER
 * would offset the narrower line right by half the width delta, which is
 * NOT what the golden SVG shows. `usecase` keeps CENTER (unchanged from
 * before this task, and jar-verified correct by its own selector).
 */
export function titleAlignmentFor(symbolKeyword: USymbol): HorizontalAlignment {
  // cdd5-T5c (gejuvu-17-vufu851): `USymbolUsecase#getSNames` is `{usecase,
  // business}` for the business variant (`USymbolUsecase.java:67-70`), so
  // its title signature contains `usecase` too and the same skin rule
  // centres it.
  return symbolKeyword === 'usecase' || symbolKeyword === 'usecase-business'
    ? HorizontalAlignment.CENTER
    : HorizontalAlignment.LEFT;
}

/**
 * cdd5-T3b (`usymbol-leaf-entity-color-dropped`, `jimizu-14-zole306`):
 * `EntityImageDescription.java:164-166` -- `HColor backcolor =
 * colors.getColor(ColorType.BACK); if (backcolor == null) backcolor =
 * styleTitle.value(PName.BackGroundColor)...`. The leaf's OWN inline
 * `#color` decoration (`Classifier.color` / `ClassifierGeo.color`, the SAME
 * field `class Foo #White { ... }` populates) wins over the theme/style
 * default `resolveElementPaint` supplies. Reuses the bare/`back:`-token
 * extraction (`resolveBareOrBackColor`) plus the gradient/hex resolution
 * `renderer-classifier-colors.ts#classifierFill` already established for
 * this identical field (`resolveBareOrBackColor` -> `parseColor` ->
 * `resolveColorToSvgHex` for a plain color, the `Gradient` object
 * unchanged for a compound one) -- one shared grammar, two draw paths.
 */
export function resolveBackcolor(classifier: ClassifierGeo, theme: ScaledTheme, symbolKeyword: USymbol): Paint {
  // cdd6 T2a (D2): below the inline colour, `styleTitle`'s BackGroundColor
  // is stereotype-signed (`withTOBECHANGED`, `EntityImageDescription.java
  // :151-153`), so `<sname>BackgroundColor<<label>>` (+1000) outranks the
  // plain tier -- jar probe `rectangle<<person>> { BackgroundColor #08427B }`.
  const own = theme.colors.elements?.[symbolKeyword];
  const byLabel = byStereo(own?.backgroundColorByStereo, leafTags(classifier));
  const override = resolveBareOrBackColor(classifier.color) ?? byLabel;
  if (override !== undefined) return resolvedPaint(override);
  if (own?.background !== undefined || symbolKeyword !== 'package') {
    return resolveElementPaint(theme, symbolKeyword, 'background');
  }
  // `skinparam packageBackgroundColor` also registers on `{package_}`
  // (`addMagic`, `FromSkinparamToStyle.java:127,129`), so a `package` leaf's
  // styleTitle reads it (jar probe: `packageBackgroundColor yellow` fills
  // the leaf `#FF0`); a gradient value is T1a's `backgroundGradient`.
  const skin = own?.backgroundGradient ?? theme.colors.graph.packageBackground;
  return skin === undefined ? resolveElementPaint(theme, symbolKeyword, 'background') : resolvedPaint(skin);
}

/** A raw colour/gradient spec as a drawable `Paint` -- `parseColor`, then
 *  the `HColorSet` hex for a plain colour (cdd5-T3b's grammar above). */
function resolvedPaint(spec: string | Paint): Paint {
  const parsed = typeof spec === 'string' ? parseColor(spec) : spec;
  return typeof parsed === 'string' ? resolveColorToSvgHex(parsed) : parsed;
}

/** The leaf's style-matching stereotype labels (`withTOBECHANGED(stereotype)`
 *  matches every label, `StyleSignatureBasic.java:119-132`). */
export function leafTags(classifier: ClassifierGeo): readonly string[] {
  return classifier.stereotypeLabels ?? [];
}

/** `styleTitle.value(PName.LineColor)` (`EntityImageDescription.java:162`):
 *  the `<sname>BorderColor<<label>>` tier over the plain one (jar probe
 *  `rectangle<<person>> { BorderColor #073B6F }`; fepiko-26). */
export function resolveForecolor(classifier: ClassifierGeo, theme: ScaledTheme, symbolKeyword: USymbol): Paint {
  const own = theme.colors.elements?.[symbolKeyword];
  const byLabel = byStereo(own?.borderByStereo, leafTags(classifier));
  if (byLabel !== undefined) return byLabel;
  // `skinparam packageBorderColor` likewise reaches a `package` leaf through
  // `addMagic(SName.package_)` (`FromSkinparamToStyle.java:128-129`) -- jar
  // gigoru-88 / probe: `packageBorderColor red` strokes the leaf `#F00`.
  const skin = symbolKeyword === 'package' && own?.border === undefined ? theme.colors.graph.packageBorder : undefined;
  return skin ?? resolveElementPaint(theme, symbolKeyword, 'border');
}

/**
 * `styleTitle.getStroke(colors)` (`EntityImageDescription.java:170`,
 * `Style.java:299-320`): LineThickness from `<sname>BorderThickness<<label>>`,
 * then the plain element tier, then {@link ENTITY_STROKE_WIDTH}; the dash
 * from T1a's `lineStyle` tiers (jar palida-11 / zivilu-35: `7,7`; probe
 * `rectangle { LineStyle 5-3; LineThickness 2 }`). cdd-B8FU: both halves
 * scale with `theme.scaleK` (`SvgGraphics#format` scales the dasharray too).
 */
export function resolveStroke(classifier: ClassifierGeo, theme: ScaledTheme, symbolKeyword: USymbol): UStroke {
  const tags = leafTags(classifier);
  const byLabel = byStereo(theme.colors.elements?.[symbolKeyword]?.lineThicknessByStereo, tags);
  const thickness =
    (byLabel ?? resolveElementLineThickness(theme, symbolKeyword) ?? ENTITY_STROKE_WIDTH) * theme.scaleK;
  const dash = elementLineStyle(theme, [symbolKeyword], tags);
  if (dash === undefined) return UStroke.withThickness(thickness);
  return new UStroke(dash.dashVisible * theme.scaleK, dash.dashSpace * theme.scaleK, thickness);
}

/** `font` with its colour replaced by `color` when an element tier set one;
 *  a transparent colour elides the text (`DriverTextSvg.java:92-94`,
 *  `usymbol-resolve.ts#textFontColor`'s identical `null`). */
function recolor(font: FontConfiguration, color: string | undefined): FontConfiguration {
  if (color === undefined) return font;
  return { ...font, color: isTransparentColor(color) ? null : color };
}

/**
 * The leaf's three text fonts (`EntityImageDescription.java:172-174`), each
 * through its own signature's T1a tiers: `fcTitle` (`{<sname>, title}`,
 * {@link elementTitleFontColor}), `fc` (`{<sname>}` withTOBECHANGED: the
 * `FontColor<<label>>` tier over the plain font `textFont` already reads),
 * `fcStereo` (`{<sname>, stereotype}` forStereotypeItself,
 * {@link elementStereoFontColor}). Jar probe: `Foo` (display == code) draws
 * `title { FontColor red }`, `"Some Bar" as Bar` draws the plain orange.
 */
export function resolveLeafFonts(classifier: ClassifierGeo, theme: ScaledTheme, symbolKeyword: USymbol) {
  const tags = leafTags(classifier);
  const byLabel = byStereo(theme.colors.elements?.[symbolKeyword]?.fontByStereo, tags);
  return {
    fontTitle: recolor(
      textFont(theme, symbolKeyword, 0, entityTitleStyles(symbolKeyword)),
      elementTitleFontColor(theme, symbolKeyword, tags),
    ),
    fontBody: recolor(textFont(theme, symbolKeyword), byLabel),
    // `plantuml.skin:79-82` `stereotype { FontStyle italic }` -- the same
    // STEREOTYPE_STYLES `description/renderer-entity.ts:82,214` passes.
    fontStereo: recolor(
      textFont(theme, symbolKeyword, 0, STEREOTYPE_STYLES, 'stereotype'),
      elementStereoFontColor(theme, symbolKeyword, tags),
    ),
  };
}
