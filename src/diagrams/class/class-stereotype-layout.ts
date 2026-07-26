/**
 * Class header-row + generic type-parameter-tag layout. Split out of
 * `class-stereotype.ts` (line cap); depends one-way on the stereo-measurement
 * cluster there. Re-exported from it so import sites are unchanged.
 */

import type { Classifier } from './ast.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { ClassifierGeo } from './layout.js';
import { javaRound4 } from '../../core/number-format.js';
import { BADGE_LEFT_MARGIN, NAME_LEFT_MARGIN } from './class-badge.js';
import { CLASS_STEREOTYPE_FONT_SIZE } from './class-stereotype.js';

export interface HeaderInfo {
  headerText: string;
  headerItalic: boolean;
}

/** Build the header display string and kind-derived flags for a classifier. */
export function computeHeaderInfo(classifier: Classifier): HeaderInfo {
  // Just the name (kind shown via badge + italic) — annotations get an `@` prefix.
  const headerText =
    classifier.kind === 'annotation'
      ? `@${classifier.display}`
      : classifier.display;
  const headerItalic =
    classifier.kind === 'interface' || classifier.kind === 'abstract';
  return { headerText, headerItalic };
}

/**
 * The header row's badge + text x-positions -- G2 N23, replacing N4's
 * symmetric `centerOffset` guess; G2 N24 generalized it to also cover the
 * `stereoDim` term (a classifier's `<<stereotype>>` row(s)). `HeaderLayout
 * #drawU` (`~/git/plantuml/.../svek/HeaderLayout.java:81-117`) does NOT
 * split the wider-box slack evenly between badge and name: it reserves
 * `h2 = min(circleDim.width / 4, suppWith * 0.1)` of the slack as an
 * asymmetric "extra" term shared by BOTH sides, then splits the REMAINDER
 * `h1 = (suppWith - h2) / 2` evenly -- the badge moves right by `h1` alone,
 * while the name/stereo column moves right by `h1 + h2`. `h1`/`h2` are
 * computed ONCE by the caller (`computeHeaderSlack`, `class-badge.ts`) and
 * shared with `buildStereoRows` above so the stereo rows and the name row
 * agree on one split.
 *
 * `nameTop`/`widthStereoAndName` fold in the stereo term: `nameTop` is
 * `buildStereoRows`'s own returned name-row Y offset (`diffHeight / 2 +
 * stereoDim.height`, reducing to the OLD `(headerRowHeight - fontSpec.size)
 * / 2` exactly when there is no stereotype); `indent` uses
 * `widthStereoAndName = max(stereoDim.width, nameDim.width)` in place of the
 * OLD formula's bare `nameDim.width` (identical when there is no
 * stereotype, since `widthStereoAndName` then reduces to `nameWidth`).
 *
 * Jar-verified BYTE-EXACT (not just direction) on 3 independent
 * stereotype-free fixtures sharing this exact header (`sufide-66-sanu583`/
 * `xajefo-97-julu315`/`cokeje-99-gede231`, `plans/g2-class-svg/ledger.md`
 * N23) and 2 stereotype-bearing fixtures (`zejize-00-vivu578`/
 * `pajuba-83-roji161`, N24 -- see this file's own doc comment).
 */
/**
 * G2 N64 item 45: generalizes `buildHeaderRow` (single name row) to N name
 * rows -- a classifier display name split on `\n`/`\l`/`\r`
 * ({@link splitEdgeLabelLines}, already-split `lines`/`align` passed in by
 * the caller, which owns the `StringMeasurer` this module has never needed
 * before). Reduces to the OLD single-row formula exactly when
 * `lines.length === 1` (`align` is always `'center'` in that case --
 * `splitEdgeLabelLines` only sets `'left'`/`'right'` on an ACTUAL `\l`/`\r`
 * split, which requires at least 2 lines): `lineIndent` offset is `0`, `y`'s
 * `i * fontSpec.size` term is `0`, `badgeIndent` still lands on the (only)
 * row.
 *
 * Per-line horizontal placement mirrors `class-geo-builders.ts
 * #multiLineLabelAnchor`'s own generalization of a single-line indent
 * formula to a block `maxWidth` (item 43, N63) -- jar-verified against
 * `dofima-22-kofe334`'s golden SVG (`ledger.md` N64): the block's own left
 * edge is the UNCHANGED `indent` formula below (using `headerTextWidth` =
 * the WIDEST line's width, computed by the caller), and each line offsets
 * from that shared left edge by `0` (LEFT), `headerTextWidth-lineWidth`
 * (RIGHT), or `(headerTextWidth-lineWidth)/2` (CENTER) -- exactly
 * `HeaderLayout#drawU`'s `TextBlock`-internal per-line centering, one level
 * deeper than the block-level `xName` placement `HeaderLayout` itself
 * computes (`Display#create0`'s own per-line alignment inside the merged
 * multi-line `TextBlock`).
 *
 * Vertical stacking is `nameTop + i * fontSpec.size + baselineOffset` --
 * jar-verified against `dofima`'s own per-line `y` delta (exactly
 * `fontSpec.size`, 14, matching `measurer.measure(line, font).height ===
 * font.size` for EVERY measurer in this codebase, `measurer-deterministic
 * .ts`'s own doc comment).
 */
export function buildHeaderRows(input: {
  header: HeaderInfo;
  /** G2 N64: already-split via {@link splitEdgeLabelLines} -- this module
   *  never imports that function itself (would cycle back to
   *  `class-layout-helpers.ts`, which already imports FROM this module). */
  lines: string[];
  /** G2 N64: per-line width, pre-measured by the caller -- mirrors
   *  `buildStereoRows`'s own `labelWidths` "resolve once, pass down"
   *  precedent rather than threading a `StringMeasurer` through this
   *  module for the first time. */
  lineWidths: number[];
  align: 'center' | 'left' | 'right';
  circleWidth: number;
  widthStereoAndName: number;
  nameWidth: number;
  h1: number;
  h2: number;
  nameTop: number;
  baselineOffset: number;
  fontSpec: { family: string; size: number; bold?: boolean; italic?: boolean };
  /** The WIDEST line's own (unmargined) width -- `nameWidth === headerTextWidth
   *  + NAME_MARGIN_TOTAL` (the caller's own invariant, unchanged from the
   *  single-line formula). */
  headerTextWidth: number;
  /** G2 N38: the classifier's OWN resolved badge radius (`class-badge.ts
   *  #resolveBadgeRadius`) -- replaces the pre-existing hardcoded
   *  `BADGE_RADIUS` default so a non-default `circledCharacterFontSize`/
   *  `circledCharacterRadius` skinparam repositions the badge correctly. */
  badgeRadius: number;
  /** G2 N64: the NBSP (U+00A0) glyph's own measured width at `fontSpec`,
   *  pre-measured by the caller -- see the blank-line handling below. */
  blankLineRenderWidth: number;
}): ClassifierGeo['rows'] {
  const { header, lines, lineWidths, align, circleWidth, widthStereoAndName, nameWidth, h1, h2 } = input;
  const { nameTop, baselineOffset, fontSpec, headerTextWidth, badgeRadius, blankLineRenderWidth } = input;
  const indent = circleWidth + (widthStereoAndName - nameWidth) / 2 + h1 + h2 + NAME_LEFT_MARGIN;
  const badgeIndent = h1 + BADGE_LEFT_MARGIN + badgeRadius;
  const lastIndex = lines.length - 1;
  return lines.map((line, i) => {
    const lineWidth = lineWidths[i] ?? 0;
    const lineOffset = align === 'left'
      ? 0
      : align === 'right'
        ? headerTextWidth - lineWidth
        : (headerTextWidth - lineWidth) / 2;
    // G2 N64 (item 45 corollary, jar-verified `julixi-10-jide878`'s own
    // golden -- a `class "Name\n<Generic>" as x` declaration's generic-tag
    // extraction (`extractGenericFromDisplay`) leaves a TRAILING `\n` on
    // the base display, so `splitEdgeLabelLines` produces a genuinely
    // BLANK final line): `DriverTextSvg.java`'s `text.matches("^\s*$")`
    // RENDER-time NBSP substitution (N57 item 38's already-landed
    // mechanism, `class-member-creole.ts#resolveOneAtom`'s doc comment)
    // applies here too -- UNLIKE that member/note-atom port, jar's own
    // regex matches the EMPTY string too (zero repetitions of `\s`), and
    // jar-verified `julixi`'s blank line draws a LONE NBSP glyph
    // (`textLength="3.85"`, exactly `measurer.measure('\u00A0',
    // font).width` at 14pt) -- not the N57 port's `length > 0` narrowing
    // (that guard had zero corpus reach at the time; a header line CAN be
    // genuinely zero-length, unlike a creole tokenizer's text atoms). The
    // LAYOUT `lineOffset` above is DELIBERATELY computed from the RAW
    // (possibly `0`) `lineWidth`, matching `julixi`'s own jar-verified `x`
    // position exactly -- only the DRAWN `text`/`width` substitute NBSP,
    // mirroring N57's "layout width stays raw, render width doesn't" split.
    const isBlank = /^\s*$/.test(line);
    return {
      text: isBlank ? '\u00A0' : line,
      y: nameTop + i * fontSpec.size + baselineOffset,
      indent: indent + lineOffset,
      // G2 N32: kind-derived italic (interface/abstract) UNIONED with
      // `skinparam classFontStyle italic` -- see `theme.ts#classFontItalic`'s
      // doc comment; the two are independent, non-exclusive sources.
      italic: header.headerItalic || fontSpec.italic === true,
      ...(fontSpec.bold === true ? { bold: true as const } : {}),
      width: isBlank ? blankLineRenderWidth : lineWidth,
      // G2 N64: badgeIndent lives ONLY on the LAST name-line row -- matches
      // `renderer-classifier-box.ts#renderBadge`'s own `nameRowIndex =
      // headerRowCount - 1` read (unchanged by this generalization).
      ...(i === lastIndex ? { badgeIndent } : {}),
      fontFamily: fontSpec.family,
      fontSize: fontSpec.size,
    };
  });
}

// ---------------------------------------------------------------------------
// `class Foo<T>`/`class Bar<P, Q>` generic type-parameter TAG box (G2 N32) --
// `HeaderLayout#getDimension`/`#drawU`'s `genericDim`/`xGeneric`/`yGeneric`
// terms, deferred at N12 (explicit DOT-gate risk, since `genericDim.width`
// widens the classifier's own MEASURED box -- jar-verified, see below) and
// re-surveyed here per the header formulas (N23/N24) now being fully
// verified. Drawn OUTSIDE/ABOVE the classifier box (`yGeneric = -delta`) but
// its WIDTH is added directly into `HeaderLayout#getDimension`'s width sum,
// so it DOES change the DOT-emitted node width -- confirmed via 2 byte-exact
// samples: `caboco-62-jula911` (`Foo<Param>`: headerWidth 26+30.15+39.325 =
// 95.475, matches jar's `rect/@width` exactly; `Bar<P, Q>`: 26+27.7875+
// 24.625 = 78.4125, matches exactly) -- landed only after the empirical
// `dot-sync-report.ts class` gate confirmed 708/708 unchanged (see
// `plans/g2-class-svg/ledger.md` N32).
//
// Font: `FontParam.CLASS_STEREOTYPE` (SAME 12pt-italic param the stereotype
// rows above use) -- `EntityImageClassHeader.java:144-148`'s
// `Display.create(FontConfiguration.create(skinParam, FontParam
// .CLASS_STEREOTYPE, stereotype), CENTER, skinParam)`.
//
// Sizing: `genericBlock` is wrapped in `TextBlockUtils.withMargin(_, 1, 1)`
// TWICE -- once around the raw text (BEFORE it becomes the `TextBlockGeneric`
// box, `TextBlockGeneric.java`'s own `calculateDimension` returns exactly
// its wrapped inner block's dimension with no size of its own) and once
// again around the `TextBlockGeneric` wrapper itself. Each `withMargin(_,
// 1,1)` adds 2px total per axis (1px each side) -- so the RECT drawn by
// `TextBlockGeneric` is `rawText + 2` (the FIRST margin only), while
// `genericDim` (what `HeaderLayout` actually sums into its own width/height)
// is `rawText + 4` (both margins) -- jar-verified: `caboco`'s "Param" rect
// `width="37.325"` = rawTextWidth(35.325, matching the rendered `<text
// textLength>`) + 2; `headerWidth` includes `rawTextWidth + 4 = 39.325`.
//
// Position: `HeaderLayout#drawU`'s `xGeneric = width - genericDim.width +
// delta(4)` places the OUTER (second-margin) block's own top-left; the
// RECT then draws 1px further in/down (the outer margin's own left/top
// inset) -- `rectX = boxWidth - genericDim.width + delta + 1`, `rectY =
// -delta + 1`. `width` here is the classifier's FINAL box width (post
// `Math.max(headerWidth, memberAreaWidth)`, matching `HeaderLayout#drawU`'s
// own `width` PARAMETER, the SAME value `computeHeaderSlack` above already
// receives) -- NOT the pre-max `headerWidth` alone (only coincide when the
// header, not member content, is the box's widest term, the common case
// every corpus sample so far happens to hit).
// ---------------------------------------------------------------------------

/** `withMargin(_, 1, 1)` applied twice (raw text, then the TextBlockGeneric
 *  wrapper) -- 2px total per axis, per application; see this section's own
 *  doc comment for the jar derivation. */
const GENERIC_TAG_MARGIN = 4;

/** Pre-measured generic-tag block dimension -- `HeaderLayout`'s own
 *  `genericDim` (both margins folded in), plus the UNMARGINED raw text
 *  width `buildGenericTagGeo` needs for the rendered `<text textLength>`. */
export interface GenericTagDim {
  width: number;
  height: number;
  rawTextWidth: number;
}

/**
 * Measure the `<T>`/`<P, Q>` tag block for a classifier's `typeParams`
 * (`Classifier.typeParams`, `ast.ts` -- always joined `', '`, matching
 * upstream's own captured generic-clause text). Returns `undefined` when
 * there are no type parameters (the overwhelmingly common case -- zero
 * behavior change for every classifier this mission has already verified).
 */
export function measureGenericTagDim(
  typeParams: readonly string[],
  fontFamily: string,
  measurer: StringMeasurer,
  // G2 N39: `skinparam classStereotypeFontSize` override -- see
  // `CLASS_STEREOTYPE_FONT_SIZE`'s own doc comment (SAME FontParam the
  // stereotype label row(s) use, jar-verified `EntityImageClassHeader
  // .java:144-148`).
  fontSize: number = CLASS_STEREOTYPE_FONT_SIZE,
  // G2 N49: `Classifier.typeParamsRawText` -- the VERBATIM source text, used
  // in place of `typeParams.join(', ')` when present (see that field's own
  // doc comment for the jar-verified "no re-join" mechanism). Optional and
  // trailing so every pre-existing positional call (unit tests constructing
  // `typeParams` by hand) keeps its old join-based behavior unchanged.
  rawText?: string,
): GenericTagDim | undefined {
  if (typeParams.length === 0) return undefined;
  const text = rawText ?? typeParams.join(', ');
  const rawTextWidth = javaRound4(
    measurer.measure(text, { family: fontFamily, size: fontSize }).width,
  );
  return {
    width: rawTextWidth + GENERIC_TAG_MARGIN,
    height: fontSize + GENERIC_TAG_MARGIN,
    rawTextWidth,
  };
}

/** Render-ready generic-tag geometry -- every field box-RELATIVE (added to
 *  `geo.x`/`geo.y` at render time), matching `badgeIndent`/`row.indent`'s
 *  existing convention. */
export interface GenericTagGeo {
  text: string;
  rectX: number;
  rectY: number;
  rectWidth: number;
  rectHeight: number;
  textX: number;
  textY: number;
  textWidth: number;
  fontFamily: string;
  /** G2 N39: `skinparam classStereotypeFontSize`/`FontStyle` overrides --
   *  see `CLASS_STEREOTYPE_FONT_SIZE`'s own doc comment. `italic` has no
   *  implicit default (matches `StereoRowsInput.italic`'s own doc comment
   *  -- `FontParam.CLASS_STEREOTYPE`'s default face is italic). */
  fontSize: number;
  bold?: boolean;
  italic: boolean;
}

/**
 * Position the tag box against the classifier's FINAL box width -- see this
 * section's own doc comment for why `boxWidth` (not `headerWidth` alone)
 * is the correct term, matching `HeaderLayout#drawU`'s own `width` param.
 * `baselineOffset` is the SAME `CLASS_STEREOTYPE_FONT_SIZE`-scaled ascent
 * value `measureGenericClassifier`'s `stereoBaselineOffset` already computes
 * for the `<<stereotype>>` row(s) above (same font param, reused as-is).
 */
export function buildGenericTagGeo(
  typeParams: readonly string[],
  dim: GenericTagDim,
  boxWidth: number,
  fontFamily: string,
  baselineOffset: number,
  // G2 N39: `skinparam classStereotypeFontSize`/`FontStyle` overrides --
  // see `GenericTagGeo`'s own doc comment. Defaults match the pre-existing
  // hardcoded behavior byte-for-byte (12pt, plain weight, always italic).
  fontSize: number = CLASS_STEREOTYPE_FONT_SIZE,
  bold = false,
  italic = true,
  // G2 N49: SAME `Classifier.typeParamsRawText` override as
  // `measureGenericTagDim`'s own trailing `rawText` param -- see that
  // param's doc comment.
  rawText?: string,
): GenericTagGeo {
  const rectX = boxWidth - dim.width + GENERIC_TAG_MARGIN + 1;
  const rectY = -GENERIC_TAG_MARGIN + 1;
  return {
    text: rawText ?? typeParams.join(', '),
    rectX,
    rectY,
    rectWidth: dim.width - 2,
    rectHeight: dim.height - 2,
    textX: rectX + 1,
    textY: rectY + 1 + baselineOffset,
    textWidth: dim.rawTextWidth,
    fontFamily,
    fontSize,
    ...(bold ? { bold: true as const } : {}),
    italic,
  };
}

// ---------------------------------------------------------------------------
// `hide|show [<<pattern>>] stereotype(s)` directive (G2 N24) -- lives here
// (not class-directives.ts, already at the 500-line cap) since it operates
// on the SAME `splitStereotypeLabels` output this file already owns.
// ---------------------------------------------------------------------------
