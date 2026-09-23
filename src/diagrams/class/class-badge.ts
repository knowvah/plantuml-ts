/**
 * EntityImageClassHeader kind-badge geometry + glyph data (G2/N3).
 *
 * Upstream draws the header's "kind badge" as a `CircledCharacter`
 * (`klimt/shape/CircledCharacter.java`): a filled `<ellipse>` plus the
 * badge LETTER rendered as a real vector glyph outline (an AWT
 * `Font.createGlyphVector` -> `PathIterator` walk, baked into a fixed
 * `<path d="...">` at SVG-emission time) -- never `<text>`. This port
 * previously drew a `<circle r="10">` + `<text>` placeholder; this module
 * replaces both with upstream-faithful shapes.
 *
 * Geometry (`EntityImageClassHeader.java` ctor + `HeaderLayout.java#
 * getDimension`/`#drawU`, all jar-verified against 3+ cached fixtures --
 * `plans/g2-class-svg/ledger.md` N3):
 *   - `circledCharacter = TextBlockUtils.withMargin(getCircledCharacter(...),
 *     4, 0, 5, 5)` -- a `CircledCharacter` of radius
 *     `getCircledCharacterRadius()` (default 11, matches every sampled
 *     fixture's `rx="11" ry="11"`), wrapped with left margin 4, top/bottom
 *     margin 5 each (right margin 0).
 *   - `name = TextBlockUtils.withMargin(name, 3, 3, 0, 0)` -- the header
 *     name text, margin 3 each side (no visibility-modifier prefix case).
 *   - `HeaderLayout#getDimension`: `width = circleDim.width +
 *     max(stereoDim.width, nameDim.width)` (no stereotype here: stereoDim
 *     is 0); `height = max(circleDim.height, nameDim.height + 10)` (no
 *     stereotype/generic terms).
 *   - `HeaderLayout#drawU` with `suppWith == 0` (box width == exact content
 *     sum, the common case with no stereotype padding): badge drawn at
 *     local `(0, (height - circleDim.height) / 2)`; the CIRCLED CHARACTER
 *     itself (inside its own margined block) is inset by its own left/top
 *     margin (4, 5), so its absolute center relative to the classifier's
 *     own local origin is `(4 + radius, headerHeight/2 - circleDim.height/2
 *     + 5 + radius)` -- verified to reduce to `(15, headerHeight/2)` when
 *     `circleDim.height == headerHeight` (the common "badge is the taller
 *     term" case every sampled fixture hits): `cx = boxLocalX + 15`,
 *     `cy = boxLocalY + headerHeight/2`.
 */
import type { ClassifierKind } from './ast.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import { paintToSvg, type Paint } from '../../core/paint.js';
import { formatDecimal, DEFAULT_SVG_DECIMALS } from '../../core/svg-format.js';
import { lookupSizedGlyph } from './class-badge-sized-glyphs.js';
import { type BadgeLetter, BADGE_GLYPH_D, REFERENCE_CX, REFERENCE_CY } from './class-badge-glyph-data.js';

/** `SkinParam#getCircledCharacterRadius()` default (fontSize 17 -> formula
 *  below). Retained as the module's own default constant -- every call site
 *  that has no theme available (tests, the pre-existing default path) keeps
 *  behaving exactly as before. */
export const BADGE_RADIUS = 11;
/** `TextBlockUtils.withMargin(circledCharacter, 4, 0, 5, 5)` left margin.
 *  Exported (G2 N4): `class-layout-helpers.ts`'s header-indent formula needs
 *  this same left margin to place the badge box within the (possibly
 *  member-content-widened) header row -- see that file's `measureGeneric
 *  Classifier` doc comment. */
export const BADGE_LEFT_MARGIN = 4;
/** Same call's top/bottom margin (5 each, symmetric). */
const BADGE_TOP_BOTTOM_MARGIN = 5;
/** `TextBlockUtils.withMargin(name, 3, 3, 0, 0)` -- left+right margin, summed. */
export const NAME_MARGIN_TOTAL = 6;
/** Same call's LEFT margin alone (half of {@link NAME_MARGIN_TOTAL}) -- the
 *  header name text's own left inset from the end of the badge box, needed
 *  standalone (not just doubled into the width total) for the header text's
 *  X position (G2 N4). */
export const NAME_LEFT_MARGIN = 3;

/** `circleDim.width` (`HeaderLayout#getDimension`): diameter + left margin. */
export const BADGE_BOX_WIDTH = BADGE_RADIUS * 2 + BADGE_LEFT_MARGIN;
/** `circleDim.height`: diameter + top+bottom margin. */
export const BADGE_BOX_HEIGHT = BADGE_RADIUS * 2 + BADGE_TOP_BOTTOM_MARGIN * 2;
// G2 N4: the fixed `BADGE_CENTER_X_OFFSET = BADGE_LEFT_MARGIN + BADGE_RADIUS`
// constant this module used to export was removed -- `renderer.ts#renderBadge`
// now derives the badge's real x-position from the header row's own `indent`
// (which bakes in the header-centering term this fixed constant never
// accounted for), reducing to the SAME value in the common, header-dominated
// case. See that function's own doc comment.

/** `FontParam.CIRCLED_CHARACTER`'s own default font size (17,
 *  `klimt/font/FontParam.java:55`) -- feeds {@link resolveBadgeRadius}'s
 *  formula when `skinparam circledCharacterFontSize` is unset. */
export { DEFAULT_CIRCLED_CHARACTER_FONT_SIZE } from '../../core/stereotype-decoration.js';

/**
 * `SkinParam#getCircledCharacterRadius()` (`skin/SkinParam.java:542-545`):
 *
 * ```java
 * public int getCircledCharacterRadius() {
 *   final int value = getAsInt("circledCharacterRadius", -1);
 *   return value == -1 ? getFontSize(null, FontParam.CIRCLED_CHARACTER) / 3 + 6 : value;
 * }
 * ```
 *
 * An explicit `circledCharacterRadius` skinparam wins unconditionally;
 * otherwise the radius is derived from `circledCharacterFontSize`
 * (`floor(fontSize / 3) + 6`, Java int division) -- the DEFAULT fontSize
 * 17 reduces to `floor(17/3)+6 = 11`, the PRE-EXISTING hardcoded
 * {@link BADGE_RADIUS} constant, so every classifier with no
 * `circledCharacter*` skinparam is byte-identical to before this
 * function existed.
 *
 * Jar-verified byte-exact against 12/12 class-corpus samples spanning
 * `circledCharacterFontSize` 13-30 (G2 N38, `plans/g2-class-svg/
 * ledger.md`): `munepa-74-lebe963`(13->10), `macira-65-mugu751`(14->10),
 * `mudune-38-kide806`(15->11), `pafare-13-raje687`(16->11), `defipi-14-
 * xunu847`(18->12), `datugo-88-sote552`(18->12, cross-checks the formula
 * is independent of the UNRELATED `classStereotypeFontSize` skinparam the
 * SAME fixture also sets), `pucebe-24-xebi219`(19->12), `fipezi-47-
 * jafu042`(20->12), `zijaso-54-gova798`(21->13), `koloba-22-bolo151`
 * (22->13); explicit-override path: `depulu-53-xoca727`
 * (`circledCharacterRadius 13`, fontSize 20 -- the formula alone would
 * predict 12, confirming the override truly short-circuits it) and
 * `gateja-70-losi738` (`circledCharacterRadius 18`, fontSize 30 -- formula
 * alone would predict 16).
 */
export { resolveBadgeRadius } from '../../core/stereotype-decoration.js';

/** `circleDim.width` for an ARBITRARY radius (generalizes {@link
 *  BADGE_BOX_WIDTH}, which stays the default-radius constant for callers
 *  that have not been threaded through {@link resolveBadgeRadius}). */
export function badgeBoxWidth(radius: number): number {
  return radius * 2 + BADGE_LEFT_MARGIN;
}
/** `circleDim.height` for an ARBITRARY radius (generalizes {@link
 *  BADGE_BOX_HEIGHT}). */
export function badgeBoxHeight(radius: number): number {
  return radius * 2 + BADGE_TOP_BOTTOM_MARGIN * 2;
}

/**
 * `HeaderLayout#drawU`'s asymmetric wider-box-slack split (G2 N23):
 * `suppWith = max(0, boxWidth - headerWidth)`, `h2 = min(badgeBoxWidth / 4,
 * suppWith * 0.1)` (a capped "extra" term), `h1 = (suppWith - h2) / 2` (the
 * remainder, split evenly). Extracted out of `class-layout-helpers.ts#
 * buildHeaderRow` (G2 N24) so `class-stereotype.ts`'s stereo-row layout can
 * share the SAME `h1`/`h2` values the name/badge positioning already uses,
 * rather than recomputing them a second time.
 */
export function computeHeaderSlack(
  boxWidth: number,
  headerWidth: number,
  badgeBoxWidth: number,
): { h1: number; h2: number } {
  const suppWith = Math.max(0, boxWidth - headerWidth);
  const h2 = Math.min(badgeBoxWidth / 4, suppWith * 0.1);
  const h1 = (suppWith - h2) / 2;
  return { h1, h2 };
}

// ---------------------------------------------------------------------------
// object/map/json never draw the kind badge -- upstream EntityImageObject,
// EntityImageMap, and EntityImageJson have no circled-character affordance
// at all (the header is just an optional stereotype line above the name).
// ---------------------------------------------------------------------------

export function hasBadge(kind: ClassifierKind): boolean {
  return kind !== 'object' && kind !== 'map' && kind !== 'json';
}

/**
 * `EntityImageClassHeader.java#getCircledCharacter`'s `spotStyleSignature`
 * -> `~/git/plantuml/src/main/resources/skin/plantuml.skin`'s `spot { ... }`
 * block, the default (light-theme) `BackGroundColor` for each
 * `spot<Kind>` style class -- jar-verified against 146+ `class`-badge
 * occurrences (`fill="#ADD1B2"`) across the corpus, none of which matched
 * this function's PREVIOUS constants (G2 N4). `object`/`map`/`json` never
 * reach this function ({@link hasBadge} gates them out first). `ClassifierKind`
 * has several OTHER badge-bearing members this iteration did not survey
 * against the jar (`entity`/`circle`/`descriptive`/`usecase`/`state`/
 * association-diamond kinds, `ast.ts`) -- the `default` case preserves
 * their PRE-EXISTING (unverified, possibly also wrong) fallback rather than
 * silently reassigning them `spotClass`'s color without jar evidence;
 * narrower scope than auditing the whole enum this iteration.
 */
export function badgeFill(kind: ClassifierKind): string {
  switch (kind) {
    case 'class':
      return '#ADD1B2'; // spotClass
    case 'abstract':
      return '#A9DCDF'; // spotAbstractClass
    case 'interface':
      return '#B4A7E5'; // spotInterface
    case 'enum':
      return '#EB937F'; // spotEnum
    case 'annotation':
      return '#E3664A'; // spotAnnotation
    default:
      return '#ADD1B2'; // spotClass -- default/unsurveyed kinds
  }
}

/**
 * G2 N26: `class Foo << (F,orange) >>`'s badge-customization COLOR half
 * (`EntityImageClassHeader.java:180-182`: `stereotype.getHtmlColor() ==
 * null ? spotBackColor : stereotype.getHtmlColor()`) -- the custom color
 * wins over the kind default when present, resolved through the SAME
 * `HColorSet` table every other fill/stroke in this renderer uses (unlike
 * description's own `colorOverride`, an I2-ledgered unresolved-named-color
 * gap -- see `Relationship.colorOverride`'s doc comment, ast.ts, for the
 * precedent this mirrors).
 */
export function resolveBadgeFill(
  kind: ClassifierKind,
  colorOverride: string | undefined,
  // G2 N32: `theme.colors.elements['spot<Kind>'].background` -- the
  // `skinparam stereotype<X>BackgroundColor` / `<style> spot<Kind> {
  // BackgroundColor }` badge spot-color override (see `spotSnameForKind`'s
  // own doc comment). Wins over the kind default, LOSES to `colorOverride`
  // (the per-classifier `<<(F,orange)>>` inline decoration, N26) --
  // `EntityImageClassHeader.java:183`'s exact precedence.
  spotBackground?: Paint,
  // G2 N36: `theme.colors.graph.spotCascadeBackground` -- a bare `<style>
  // root { BackGroundColor } }` ancestor-cascade fallback (`EntityImage
  // ClassHeader#spotStyleSignature`'s `{root,element,spot,spot<Kind>}`
  // signature has NO `classDiagram` token, so ONLY `root` can ever reach
  // it -- see `style-cascade-class.ts`'s own doc comment). Sits BELOW the
  // `spot<Kind>` bucket above, ABOVE the hardcoded kind default.
  rootFallback?: string,
): string {
  if (colorOverride !== undefined) return resolveColorToSvgHex(colorOverride);
  if (spotBackground !== undefined) return paintToSvg(spotBackground).fill;
  if (rootFallback !== undefined) return rootFallback;
  return badgeFill(kind);
}

/**
 * G2 N32: `spot<Kind>` bucket's own `border`/`font` roles -- the badge
 * ellipse's STROKE and the glyph `<path>`'s own FILL, both otherwise a flat
 * theme/hardcoded default (`theme.colors.border`, `#000000`). No
 * per-classifier override exists for either (N26's `<<(F,orange)>>` is
 * BackgroundColor-only, matching upstream: `EntityImageClassHeader.java`
 * never lets a classifier's OWN stereotype color override the badge's
 * BORDER or glyph color, only its background).
 */
export function resolveBadgeBorder(
  defaultBorder: string,
  spotBorder?: Paint,
  // G2 N36: same root-only ancestor-cascade fallback as {@link
  // resolveBadgeFill}'s `rootFallback`, for the badge ellipse's OWN stroke
  // (`<style> root { LineColor } }`).
  rootFallback?: string,
): string {
  if (spotBorder !== undefined) return paintToSvg(spotBorder).fill;
  if (rootFallback !== undefined) return rootFallback;
  return defaultBorder;
}

export function resolveBadgeGlyphColor(
  spotFont?: Paint,
  // G2 N36: same root-only ancestor-cascade fallback, for the badge glyph
  // `<path>`'s own fill (`<style> root { FontColor } }`, jar-verified
  // `bikuka-40-pezi068`).
  rootFallback?: string,
): string {
  if (spotFont !== undefined) return paintToSvg(spotFont).fill;
  if (rootFallback !== undefined) return rootFallback;
  return '#000000';
}

/**
 * `ClassifierKind` -> the `spot<Kind>` element-bucket SName
 * (`skinparam.ts#ELEMENT_BUCKET_SNAMES`'s own doc comment for the upstream
 * `spotStyleSignature` mapping) -- `undefined` for every kind this port's
 * `badgeFill` above does not individually distinguish (they share
 * `spotClass`'s default there, but have no OWN override bucket -- narrower
 * scope than `badgeFill`'s existing "default" precedent, matches this
 * iteration's "survey reach, land the tractable ones" instruction rather
 * than guessing an override bucket name for an unsurveyed kind).
 */
export function spotSnameForKind(kind: ClassifierKind): string | undefined {
  switch (kind) {
    case 'class':
      return 'spotclass';
    case 'abstract':
      return 'spotabstractclass';
    case 'interface':
      return 'spotinterface';
    case 'enum':
      return 'spotenum';
    case 'annotation':
      return 'spotannotation';
    default:
      return undefined;
  }
}

/**
 * Glyph outline `d` data for badge letters C/I/A/E/@/P/M/F/? (G2 N3/N33) and
 * R/J/O/W/D/Q/S/X (T21, A5 M3a) -- moved to `class-badge-glyph-data.ts`
 * ({@link BADGE_GLYPH_D}) to keep this file under the repo's 500-line cap;
 * see that module's own doc comment for every letter's source-fixture
 * citation and the reference-center convention ({@link REFERENCE_CX},
 * {@link REFERENCE_CY}).
 */


/**
 * `getCircledChar(LeafType)`: which glyph letter a classifier kind draws
 * (`svek/image/EntityImageClassHeader.java:229-260`).
 *
 * T21 (A5 M3b): `entity` was falling to the `default: 'C'` branch below --
 * upstream's switch has a DEDICATED `case ENTITY: return 'E';` arm
 * (`EntityImageClassHeader.java:241-242`), the SAME letter `case ENUM`
 * already returns two lines above it (`:239-240`), not a new glyph. Fixed
 * `lilura-67-cati343`/`tepazu-23-zapo261`/`xidura-26-teki974` (each
 * declares `entity ENTITY` with no spot override; their one remaining
 * structural diff was this classifier's badge drawing our `C` curve
 * instead of the jar's all-straight `E` outline) -- jar-verified against
 * `xidura-26-teki974/in.svg`'s `ENTITY` badge `<path d="M379.614,137.5 ...">`,
 * byte-identical (after the standard center-translation) to this table's
 * pre-existing `E` entry (`class-badge-glyph-data.ts`).
 */
export function badgeLetter(kind: ClassifierKind): 'C' | 'I' | 'A' | 'E' | '@' | 'P' {
  switch (kind) {
    case 'interface':
      return 'I';
    case 'abstract':
      return 'A';
    case 'enum':
      return 'E';
    case 'annotation':
      return '@';
    // T14 (dispatch-by-parse-attempt): `protocol`'s own badge letter --
    // `getCircledChar` returns 'P' for `LeafType.PROTOCOL`, distinct from
    // the 'C' every other un-surveyed kind falls to below.
    // @see ~/git/plantuml/.../svek/image/EntityImageClassHeader.java:243
    case 'protocol':
      return 'P';
    // T21 (A5 M3b): `LeafType.ENTITY` shares ENUM's own letter upstream
    // -- see this function's own doc comment for the fixture evidence.
    // @see ~/git/plantuml/.../svek/image/EntityImageClassHeader.java:241-242
    case 'entity':
      return 'E';
    default:
      return 'C';
  }
}

/** Numeric-token regex (lizard-safe: built from a string, matches the
 *  `svg.ts`/`paint.ts` convention for `<`/`>`-adjacent regex literals). */
const NUMBER_RE = new RegExp('-?\\d+(?:\\.\\d+)?', 'g');

/**
 * Translate {@link BADGE_GLYPH_D}'s reference-position path data to an
 * arbitrary badge center by shifting every numeric token by `(dx, dy)`
 * alternately (x, y, x, y, ...) -- every command in the captured letter set
 * (`M`/`L`/`Q`/`Z`) emits coordinate pairs in that order, verified against
 * all 5 letters above.
 *
 * G2 N38: an optional trailing `circledCharacterFontSize` param selects a
 * SIZE-specific 'C' capture from `class-badge-sized-glyphs.ts` when
 * one exists for that exact size (letter 'C' only, sizes 13-22) --
 * `undefined`/17/any other size or letter falls through to the existing
 * default-size table unchanged, so every pre-N38 call site (no 5th arg)
 * is 100% behavior-identical.
 *
 * G2 N47: three further optional params (`circledCharacterFontFamily`/
 * `Bold`/`Italic`) narrow that size-specific lookup to a (size, family,
 * style) VARIANT capture when one exists (`class-badge-sized-glyphs.ts
 * #BADGE_GLYPH_C_BY_VARIANT`) -- a non-default family/style draws a
 * structurally different glyph outline, not a scaled one. All three
 * `undefined` (every pre-N47 call site) is 100% behavior-identical to
 * the size-only lookup.
 */
export function badgeGlyphPath(
  kind: ClassifierKind,
  cx: number,
  cy: number,
  charOverride?: string,
  circledCharacterFontSize?: number,
  circledCharacterFontFamily?: string,
  circledCharacterFontBold?: boolean,
  circledCharacterFontItalic?: boolean,
  // cdd-T29 R2 (D4/journal row 175): the glyph outline is captured at a
  // FIXED reference size (`BADGE_GLYPH_D`/`lookupSizedGlyph`) -- `cx`/`cy`
  // (the caller's already-scaled badge center) only TRANSLATE it, so a
  // `scale` diagram drew the letter at its unscaled stroke size, off-center
  // inside a now-differently-sized ellipse. `k` scales every captured
  // coordinate around the reference center (`refCx`,`refCy`) BEFORE the
  // translate, matching `SvgGraphics#format`'s "scale every emitted
  // numeric" rule for this shape too.
  k = 1,
): string {
  const letter = resolveBadgeLetter(kind, charOverride);
  const sized =
    circledCharacterFontSize !== undefined
      ? lookupSizedGlyph(
          letter,
          circledCharacterFontSize,
          circledCharacterFontFamily,
          circledCharacterFontBold,
          circledCharacterFontItalic,
        )
      : undefined;
  const refD = sized?.d ?? BADGE_GLYPH_D[letter];
  const refCx = sized?.refCx ?? REFERENCE_CX;
  const refCy = sized?.refCy ?? REFERENCE_CY;
  const dx = cx - refCx * k;
  const dy = cy - refCy * k;
  let axis = 0;
  // T7b: `formatDecimal` (ADR-1) replaces the raw `String(shifted)` --
  // shifting a captured glyph coordinate by a fractional `dx`/`dy` (badge
  // centers are rarely on an integer pixel) produced the same class of
  // raw-float leak T6e found in `class-namespace-shape.ts`'s `d` attribute.
  return refD.replace(NUMBER_RE, (tok) => {
    const shifted = Number(tok) * k + (axis === 0 ? dx : dy);
    axis = 1 - axis;
    return formatDecimal(shifted, DEFAULT_SVG_DECIMALS);
  });
  // #lizard forgives -- pre-existing 8-param signature (kind/cx/cy/
  // charOverride?/four circledCharacterFont* overrides from G2 N38/N47),
  // unrelated to T7b; collapsing to an options object is outside this
  // task's write-set. cdd-T29 R2 adds a 9th (`k`), same forgiveness.
}

/** Every letter {@link BADGE_GLYPH_D} has a captured outline for -- derived
 *  once from the table's own keys (T21) rather than repeating the 17-letter
 *  list a second time here (no-magic-strings-in-two-places). */
const CAPTURED_BADGE_LETTERS = new Set<string>(Object.keys(BADGE_GLYPH_D));

/**
 * G2 N26/N33/T21: `class Foo << (F,orange) >>`'s badge-customization CHAR
 * half -- a custom char always wins over the kind default when present
 * (`EntityImageClassHeader.java:179-183`, `stereotype.getCharacter() !=
 * 0`). This port's own glyph OUTLINE table ({@link BADGE_GLYPH_D}) covers
 * all 17 corpus letters as of T21 (C/I/A/E/@ from G2 N3, P/M/F/? added
 * N33, R/J/O/W/D/Q/S/X added T21 -- A5 M3a) plus `$sprite` names (handled
 * upstream of this function, `getSprite`) -- a custom char matching one of
 * those 17 renders byte-exact; any OTHER custom char has no captured
 * outline, so this falls back to the kind's own default letter rather than
 * drawing nothing (a missing `<path>` would itself be a childCount
 * mismatch, strictly worse than a wrong-but-present one).
 */
export function resolveBadgeLetter(kind: ClassifierKind, charOverride: string | undefined): BadgeLetter {
  const upper = charOverride?.toUpperCase();
  if (upper !== undefined && CAPTURED_BADGE_LETTERS.has(upper)) {
    return upper as BadgeLetter;
  }
  return badgeLetter(kind);
}
