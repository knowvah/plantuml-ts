/**
 * Classifier header stereotype row(s) — `HeaderLayout#getDimension`/`#drawU`'s
 * `stereoDim`/`xStereo`/`yStereo` terms (G2 N24; the mechanism N21/N22/N23
 * repeatedly named and deferred as an explicit DOT-gate/width-formula risk —
 * N23's own Mechanism 1 work on the SAME `HeaderLayout#drawU` derived the
 * `h1`/`h2` asymmetric-slack split this module reuses, and N23's Mechanism 2
 * fully derived the formula below without landing it).
 *
 * Split into its own module rather than added to class-layout-helpers.ts
 * (already at the repo's 500-line-per-file cap) — mirrors class-badge.ts's
 * own split precedent for a header sub-concern.
 *
 * Only the GENERIC name+members box (`class-layout-helpers.ts#
 * measureGenericClassifier`) uses this module. `object`/`map`/`json` leaves
 * have their own, separate, already-working single-stereotype header
 * (`class-object-map-sizing.ts#headerRows`/`measureStereo`) — untouched,
 * out of this task's scope (zero corpus fixture combines a stacked
 * stereotype with an object/map/json leaf).
 *
 * @see ~/git/plantuml/.../svek/HeaderLayout.java (getDimension/drawU)
 * @see ~/git/plantuml/.../svek/image/EntityImageClassHeader.java:124-132
 *   (stereo TextBlock construction: `withMargin(Display.create(labels)
 *   .create(FontConfiguration(skinParam, FontParam.CLASS_STEREOTYPE,
 *   stereotype)), 1, 0)`)
 * @see ~/git/plantuml/.../stereo/StereotypeDecoration.java:187-196
 *   (`cutLabels` — splits a stacked `<<A>><<B>>` blob back into individual
 *   labels)
 *
 * Jar-verified BYTE-EXACT (position AND size) on 2 independent samples:
 *   - `zejize-00-vivu578` — single stereotype `<<Test>>`.
 *   - `pajuba-83-roji161` — 3 STACKED inline stereotypes (`<<Singleton>>
 *     << Startup >>  << Stateless Session Bean >>`), confirming each label
 *     draws as its OWN centered line within the stereo block's own
 *     (widest-label) width, the whole block then centered against the name
 *     within their shared `widthStereoAndName` column — exactly
 *     `HeaderLayout#drawU`'s nested-centering read.
 */
import type { Classifier, ClassDiagramAST, HideStereotypeDirective } from './ast.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { ClassifierGeo } from './layout.js';

/** `FontParam.CLASS_STEREOTYPE`'s hardcoded DEFAULT size (12, italic) --
 *  independent of `theme.fontSize`/`AttributeFontSize` (a DIFFERENT
 *  `FontParam`), matches `class-object-map-sizing.ts`'s identical
 *  `STEREO_FONT_SIZE` constant. G2 N39: the DEFAULT only -- `skinparam
 *  classStereotypeFontSize`/`FontName`/`FontStyle` overrides are resolved
 *  by the caller (`class-layout-helpers.ts#measureGenericClassifier`, the
 *  only place `Theme` is available at this layer) and passed in as explicit
 *  `fontSize`/`fontFamily`/`bold`/`italic` parameters below -- see
 *  `theme.ts#classStereotypeFontSize`'s doc comment for the full upstream
 *  derivation, including why the UNSET default is italic (NOT plain). */
export const CLASS_STEREOTYPE_FONT_SIZE = 12;

/** `TextBlockUtils.withMargin(stereoBlock, 1, 0)`'s marginX — applied on
 *  BOTH left and right (total width contribution is 2x this). */
const CLASS_STEREO_MARGIN = 1;

// ---------------------------------------------------------------------------
// `StereotypeDecoration#buildComplex` — lifted to `core/stereotype-decoration.ts`
//
// The split between the displayed label(s) and the circled-char/sprite BADGE
// is upstream's, applied to every entity kind, and the sequence engine needs
// the same one for a participant's `<< ($sprite, #color) Name >>`.
// Re-exported here so this module's call sites and importers are unchanged.
// ---------------------------------------------------------------------------

export {
  DEFAULT_GUILLEMET,
  wrapGuillemet,
  splitStereotypeLabels,
  splitStereotypeStyleTags,
  parseCircledCharDecoration,
  parseCircledSpriteDecoration,
  type GuillemetPair,
  type CircledCharDecoration,
  type CircledSpriteDecoration,
} from '../../core/stereotype-decoration.js';

import {
  DEFAULT_GUILLEMET,
  wrapGuillemet,
  splitStereotypeLabels,
  splitStereotypeStyleTags,
  type GuillemetPair,
} from '../../core/stereotype-decoration.js';


/** Per-label raw (unmargined) text widths, matching jar's `SvgGraphics#format`
 *  rounding at emission (`core/svg.ts`'s `formatDecimal(value, 3)`, ADR-1) --
 *  this function itself returns unrounded floats. Empty when the classifier
 *  has no stereotype. `fontSize` defaults to the hardcoded
 *  `CLASS_STEREOTYPE_FONT_SIZE` -- G2 N39's `skinparam classStereotypeFontSize`
 *  override, see that constant's own doc comment. */
export function measureStereoLabelWidths(
  labels: readonly string[],
  fontFamily: string,
  measurer: StringMeasurer,
  guillemet: GuillemetPair = DEFAULT_GUILLEMET,
  fontSize: number = CLASS_STEREOTYPE_FONT_SIZE,
): number[] {
  return labels.map((l) =>
    measurer.measure(wrapGuillemet(l, guillemet), { family: fontFamily, size: fontSize }).width,
  );
}

interface Dim { width: number; height: number; }

/** A2s R2f (puvono-84-doro361 / sekame-22-meze147): every text line's
 *  height is floored at 10 — `AtomText#calculateDimensionSlow`'s
 *  `if (h < 10) h = 10` — so `skinparam ClassStereotypeFontSize 7` still
 *  stacks 10px per stereotype label, not 7 (hand-derived post-fix:
 *  Oscillator 1.583333x1.083333in == golden exact).
 * @see ~/git/plantuml/.../klimt/creole/legacy/AtomText.java:179-181
 */
function stereoLineHeight(fontSize: number): number {
  return Math.max(fontSize, 10);
}

/** `stereoDim` — the whole (margined) stereotype block's dimension: width =
 *  widest individual label + 2*margin, height = sum of each label's own
 *  line height (this codebase's measurer models line height == font size
 *  exactly — the same `nameDim.height ~= fontSize` convention
 *  `class-layout-helpers.ts#buildHeaderRow`'s own doc comment already
 *  relies on for the no-stereotype case — FLOORED at 10, {@link
 *  stereoLineHeight}). Zero when there is no stereotype.
 *  `fontSize` defaults to `CLASS_STEREOTYPE_FONT_SIZE` -- see that
 *  constant's own doc comment (G2 N39). */
export function stereoBlockDim(
  labelWidths: readonly number[],
  fontSize: number = CLASS_STEREOTYPE_FONT_SIZE,
): Dim {
  if (labelWidths.length === 0) return { width: 0, height: 0 };
  return {
    width: Math.max(...labelWidths) + CLASS_STEREO_MARGIN * 2,
    height: labelWidths.length * stereoLineHeight(fontSize),
  };
}

/** Inputs `buildStereoRows` needs to place the stacked stereotype rows +
 *  the name row's own vertical offset — grouped into one object (not
 *  positional params) to stay under the per-function param-count cap. */
export interface StereoRowsInput {
  labels: readonly string[];
  labelWidths: readonly number[];
  fontFamily: string;
  circleWidth: number;
  /** `HeaderLayout#drawU`'s `widthStereoAndName = max(stereoDim.width,
   *  nameDim.width)`. */
  widthStereoAndName: number;
  blockDim: Dim;
  /** The SAME asymmetric wider-box-slack terms `buildHeaderRow` derives
   *  (`class-layout-helpers.ts`, G2 N23) — passed in rather than
   *  recomputed, so the stereo rows and the name row agree on one split. */
  h1: number;
  h2: number;
  headerRowHeight: number;
  nameLineHeight: number;
  stereoBaselineOffset: number;
  /** G2 N27: `skinparam guillemet <value>` override — defaults to `«`/`»`
   *  when omitted (every pre-existing caller). */
  guillemet?: GuillemetPair | undefined;
  /** G2 N39: `skinparam classStereotypeFontSize` override -- see
   *  `CLASS_STEREOTYPE_FONT_SIZE`'s own doc comment. Required (not
   *  defaulted here) since every internal caller now resolves it
   *  explicitly; a hand-built test input must pass the constant itself. */
  fontSize: number;
  /** G2 N39: `skinparam classStereotypeFontStyle` -- `FontParam
   *  .CLASS_STEREOTYPE`'s own default face is ITALIC (unlike every other
   *  class font param), so `italic` has NO implicit default here -- the
   *  caller must pass `true` explicitly for the common (unset-skinparam)
   *  case, matching the pre-existing hardcoded behavior byte-for-byte. */
  bold?: boolean;
  italic: boolean;
}

/**
 * Builds the stacked stereotype text rows (empty when there is no
 * stereotype) and the name row's own top-of-line Y offset —
 * `HeaderLayout#drawU`'s `xStereo`/`yStereo` (per label, nested-centered
 * within the stereo block) and `yName`'s stereo-height-dependent term.
 */
export function buildStereoRows(
  input: StereoRowsInput,
): { rows: ClassifierGeo['rows']; nameTop: number } {
  const { labels, labelWidths, fontFamily, circleWidth, widthStereoAndName, blockDim } = input;
  const { h1, h2, headerRowHeight, nameLineHeight, stereoBaselineOffset, fontSize, bold, italic } = input;
  const guillemet = input.guillemet ?? DEFAULT_GUILLEMET;
  const diffHeight = headerRowHeight - blockDim.height - nameLineHeight;
  if (labels.length === 0) return { rows: [], nameTop: diffHeight / 2 };

  const blockX = circleWidth + (widthStereoAndName - blockDim.width) / 2 + h1 + h2 + CLASS_STEREO_MARGIN;
  const rawBlockWidth = Math.max(...labelWidths);
  // A2s R2f: rows step by the FLOORED line height ({@link stereoLineHeight})
  // so stacking matches `stereoBlockDim`'s reserved block height.
  const lineHeight = stereoLineHeight(fontSize);
  const rows: ClassifierGeo['rows'] = labels.map((label, i) => {
    const rawWidth = labelWidths[i]!;
    const indent = blockX + (rawBlockWidth - rawWidth) / 2;
    const top = diffHeight / 2 + i * lineHeight;
    return {
      text: wrapGuillemet(label, guillemet),
      y: top + stereoBaselineOffset,
      indent,
      italic,
      ...(bold === true ? { bold: true as const } : {}),
      width: rawWidth,
      fontFamily,
      fontSize,
    };
  });
  return { rows, nameTop: diffHeight / 2 + blockDim.height };
}

// ---------------------------------------------------------------------------
// Header display info + the header (name) row itself -- moved here from
// class-layout-helpers.ts (G2 N24) to keep that file under the repo's
// 500-line-per-file cap; `buildHeaderRow` needs the SAME `h1`/`h2`/`nameTop`
// values `buildStereoRows` above computes, so the two now live together.
// ---------------------------------------------------------------------------


// Header-row + generic-tag layout moved to a sibling module (line cap).
export {
  computeHeaderInfo, buildHeaderRows, measureGenericTagDim, buildGenericTagGeo,
} from './class-stereotype-layout.js';
export type { HeaderInfo, GenericTagDim, GenericTagGeo } from './class-stereotype-layout.js';

/**
 * `hide|show [<<pattern>>] stereotype(s)` (upstream `CommandHideShowByGender`,
 * `PORTION=stereotype`, G2 N24) — narrower than the full upstream command
 * (which also covers `members`/`circle`/etc, already ported separately by
 * `class-directives.ts#parseHideShowDirective`/`parseHideShowVisibilityDirective`):
 * only the `GENDER` slot's `<<...>>`-stereotype-pattern form (or no gender
 * at all) is matched here; a bare type keyword (`hide class stereotype`) or
 * entity-id gender is a distinct, unported sub-case of the same upstream
 * command. `pattern` is stored WITHOUT its `<<`/`>>` brackets, trimmed —
 * the same shape {@link splitStereotypeLabels} produces for a classifier's
 * own labels, so {@link isStereotypeLabelHidden} can compare them directly.
 */
const STEREOTYPE_HIDESHOW_RE = /^(hide|show)\s+(?:(<<.*>>)\s+)?stereotypes?\s*$/i;

export function parseHideStereotypeDirective(line: string): HideStereotypeDirective | null {
  const m = STEREOTYPE_HIDESHOW_RE.exec(line);
  if (m === null) return null;

  const action: 'hide' | 'show' = /^hide/i.test(m[1]!) ? 'hide' : 'show';
  const bracketed = m[2];
  if (bracketed === undefined) return { kind: 'hidestereotype', action };
  const pattern = bracketed.slice(2, -2).trim();
  return { kind: 'hidestereotype', action, pattern };
}

/**
 * `CucaDiagram#isStereotypeLabelShown`: scans the accumulated
 * `hide|show [<<pattern>>] stereotype(s)` directives IN ORDER, last matching
 * one wins; a directive with no `pattern` matches every label. Default
 * (no directive matches) is VISIBLE — mirrors upstream's `result = true`
 * seed.
 */
export function isStereotypeLabelHidden(
  label: string,
  directives: readonly HideStereotypeDirective[],
): boolean {
  let shown = true;
  for (const d of directives) {
    if (d.pattern === undefined || d.pattern === label) shown = d.action === 'show';
  }
  return !shown;
}

/**
 * Post-parse pass (G2 N24): populates `Classifier.visibleStereotypeLabels`
 * for every classifier carrying a `stereotype`, pre-filtering out any label
 * hidden by a `hide|show [<<pattern>>] stereotype(s)` directive — mirrors
 * `class-directives.ts#applyVisibilityHideShow`'s "mutate the AST once,
 * layout reads the result" shape. Runs unconditionally (even with zero
 * directives) so `measureGenericClassifier` always has a populated,
 * order-preserving label list to read rather than needing its own fallback
 * branch in the common (no-directive) case.
 */
export function applyStereotypeHideShow(ast: ClassDiagramAST): void {
  const directives = ast.hideStereotypeDirectives ?? [];
  for (const classifier of ast.classifiers) {
    if (classifier.stereotype === undefined) continue;
    const labels = splitStereotypeLabels(classifier.stereotype);
    classifier.visibleStereotypeLabels = directives.length === 0
      ? labels
      : labels.filter((l) => !isStereotypeLabelHidden(l, directives));
  }
}

/**
 * `Classifier.visibleStereotypeLabels` when populated (post-hideshow), else
 * an unfiltered split of `classifier.stereotype` -- the SAME fallback
 * `class-layout-helpers.ts#measureGenericClassifier`'s own `stereoLabels`
 * local already computed inline (G2 N24); extracted here (G2 N37) so
 * `class-geo-builders.ts` can copy the identical resolved list onto
 * `ClassifierGeo.stereotypeLabels` for render-time `.tagname` matching
 * without duplicating the expression a third time.
 */
export function resolveVisibleStereotypeLabels(classifier: Classifier): string[] {
  return classifier.visibleStereotypeLabels
    ?? (classifier.stereotype !== undefined ? splitStereotypeLabels(classifier.stereotype) : []);
}

/**
 * EVERY stereotype label (2-or-3-bracket) a classifier carries, for
 * `.tagname` `<style>` cascade matching (G2 N37) -- deliberately NOT
 * `hide|show stereotype`-filtered (that directive only controls DISPLAY,
 * `splitStereotypeTokens`'s own doc comment on why display and
 * style-matching are independent axes; no corpus sample combines
 * `hide stereotype` with a `.tagname` cascade, so this is the most
 * defensible reading of the two features' independence rather than a
 * jar-verified interaction).
 */
export function resolveStyleStereotypeTags(classifier: Classifier): string[] {
  return classifier.stereotype !== undefined ? splitStereotypeStyleTags(classifier.stereotype) : [];
}
