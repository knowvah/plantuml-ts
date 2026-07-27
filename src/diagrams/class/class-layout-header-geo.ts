/**
 * Generic classifier header geometry: badge decision + header display-text
 * sizing, `<<stereotype>>` block dimensions, `class Foo<T>` generic-tag box,
 * and the resulting stacked stereo/name rows -- the pieces
 * `class-layout-generic-classifier.ts#measureGenericClassifier` composes to
 * size the classifier header before laying out its member section.
 *
 * Split out of class-layout-generic-classifier.ts purely to keep every
 * function under the project's per-function complexity/size caps (CCN <=
 * 10, <= 30 NLOC) and the file under the 500-line cap. Every formula below
 * is a pure move from the original (pre-split) `measureGenericClassifier` --
 * see that function's own doc comment for the upstream jar derivation of
 * the overall box geometry.
 */

import type { Classifier } from './ast.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { ClassifierGeo } from './layout.js';
import { splitEdgeLabelLines, wrapPlainTextLine } from './class-layout-edge-labels.js';
import type { MeasuredClassifier } from './class-layout-helpers.js';
import {
  hasBadge,
  badgeBoxHeight,
  badgeBoxWidth,
  NAME_MARGIN_TOTAL,
  computeHeaderSlack,
} from './class-badge.js';
import {
  resolveVisibleStereotypeLabels,
  measureStereoLabelWidths,
  stereoBlockDim,
  buildStereoRows,
  buildHeaderRows,
  computeHeaderInfo,
  parseCircledCharDecoration,
  measureGenericTagDim,
  buildGenericTagGeo,
  type GuillemetPair,
  type GenericTagDim,
} from './class-stereotype.js';
import { javaRound4 } from '../../core/number-format.js';
import type { ClassFontSpecs } from './class-layout-generic-classifier-types.js';

export type { ClassFontSpecs };

export type CommonHeaderFields = Partial<
  Pick<MeasuredClassifier, 'headerRowCount' | 'nameRowCount' | 'badgeChar' | 'badgeColor' | 'genericTag'>
>;

/** Resolved-once options threaded down from `measureClassifier` -- see each
 *  field's own call-site doc comment there for the upstream derivation of
 *  each override. */
interface HeaderGeoOptions {
  strictUml: boolean;
  headerMaxWidth: number;
}

/** Resolved-once options for the stereotype/generic-tag/header-row geometry
 *  functions below -- see `measureClassifier`'s own doc comment for the
 *  upstream derivation of each override. */
export interface StereoGeoOptions {
  guillemet: GuillemetPair | undefined;
  badgeRadius: number;
  stereoFont: { family: string; size: number; bold: boolean; italic: boolean };
}

/**
 * The badge-decision + header display-text sizing half of the generic
 * classifier header (`HeaderLayout#getDimension`'s `nameDim`/badge terms).
 * Split out of `measureGenericClassifier` purely to keep that function's
 * NLOC/CCN under the project's per-function caps -- see that function's own
 * doc comment for the upstream derivation of every field below.
 */
export function computeHeaderNameGeo(
  classifier: Classifier,
  headerFont: { family: string; size: number },
  fontSpec: { family: string; size: number },
  measurer: StringMeasurer,
  options: HeaderGeoOptions,
) {
  const { strictUml, headerMaxWidth } = options;
  const badgeShown = hasBadge(classifier.kind) && classifier.hideCircle !== true && !strictUml;
  const memberRowHeight = fontSpec.size;
  const header = computeHeaderInfo(classifier);
  // G2 N26: `class Foo << (F,orange) >>`'s badge-customization override --
  // computed once here so BOTH `buildClassifierGeos` and
  // `degenerateSingleClassifier` (class-geo-builders.ts) can copy it
  // straight off the SAME `MeasuredClassifier`.
  const circledChar = parseCircledCharDecoration(classifier.stereotype);
  const badgeCharField: CommonHeaderFields = circledChar !== undefined ? { badgeChar: circledChar.char } : {};
  const badgeColorField: CommonHeaderFields = circledChar?.color !== undefined ? { badgeColor: circledChar.color } : {};
  // G2 N64 item 45: a classifier display name can itself carry `\n`/`\l`/
  // `\r` line-break escapes -- jar routes it through the SAME
  // `Display.getWithNewlines` state machine a relationship label uses, so
  // `splitEdgeLabelLines` (class-layout-edge-labels.ts) is reused verbatim.
  const rawHeaderSplit = splitEdgeLabelLines(header.headerText);
  // G2 N65 item 35: word-wraps EACH already-split line via `wrapPlainTextLine`
  // (Fission) when a `MaximumWidth` cascade is in effect -- a no-op at
  // `headerMaxWidth<=0` (the overwhelming majority of classifiers).
  const headerLines = headerMaxWidth > 0
    ? rawHeaderSplit.lines.flatMap((l) => wrapPlainTextLine(l, headerFont, headerMaxWidth, measurer))
    : rawHeaderSplit.lines;
  const headerAlign = rawHeaderSplit.align;
  const headerLineWidths = headerLines.map((l) => javaRound4(measurer.measure(l, headerFont).width));
  const headerTextWidth = Math.max(...headerLineWidths);
  const nameWidth = headerTextWidth + NAME_MARGIN_TOTAL;
  // G2 N64 (item 45 corollary): a trailing `\n` split can produce a BLANK
  // final line -- pre-measure the NBSP substitution glyph's own width ONCE
  // here (the only place with a `measurer` reference at this layer).
  const blankLineRenderWidth = javaRound4(measurer.measure('\u00A0', headerFont).width);
  return {
    badgeShown, memberRowHeight, header, badgeCharField, badgeColorField,
    headerLines, headerAlign, headerLineWidths, headerTextWidth, nameWidth, blankLineRenderWidth,
  };
}

/** Options for {@link computeStereoBlockGeo} -- see `measureClassifier`'s
 *  own doc comment for the upstream derivation of each override. */
interface StereoBlockOptions {
  guillemet: GuillemetPair | undefined;
  badgeShown: boolean;
  badgeRadius: number;
  nameWidth: number;
}

/**
 * The `<<stereotype>>` block dimensions half of the generic classifier
 * header (`HeaderLayout#getDimension`'s `stereoDim` term). Split out of
 * `measureGenericClassifier` purely to keep that function's NLOC/CCN under
 * the project's per-function caps -- see that function's own doc comment
 * for the upstream derivation.
 */
function computeStereoBlockGeo(
  classifier: Classifier,
  stereoFont: { family: string; size: number },
  measurer: StringMeasurer,
  options: StereoBlockOptions,
) {
  const { guillemet, badgeShown, badgeRadius, nameWidth } = options;
  // `visibleStereotypeLabels` is pre-filtered by `class-directives.ts
  // #applyStereotypeHideShow` (`hide|show [<<pattern>>] stereotype(s)`).
  const stereoLabels = resolveVisibleStereotypeLabels(classifier);
  const stereoLabelWidths = measureStereoLabelWidths(
    stereoLabels, stereoFont.family, measurer, guillemet, stereoFont.size,
  );
  const blockDim = stereoBlockDim(stereoLabelWidths, stereoFont.size);
  const circleWidth = badgeShown ? badgeBoxWidth(badgeRadius) : 0;
  const widthStereoAndName = Math.max(blockDim.width, nameWidth);
  return { stereoLabels, stereoLabelWidths, blockDim, circleWidth, widthStereoAndName };
}

/** Options for {@link computeHeaderDimsGeo} -- see `measureClassifier`'s
 *  own doc comment for the upstream derivation of each override. */
interface HeaderDimsOptions {
  badgeShown: boolean;
  badgeRadius: number;
  headerLinesCount: number;
  stereoFont: { family: string; size: number };
}

/**
 * The `class Foo<T>` generic-tag box dimensions + overall header row
 * height/width + text-baseline-offset half of the generic classifier
 * header. Split out of `measureGenericClassifier` purely to keep that
 * function's NLOC/CCN under the project's per-function caps -- see that
 * function's own doc comment for the upstream derivation of every field
 * below.
 */
function computeHeaderDimsGeo(
  classifier: Classifier,
  fonts: ClassFontSpecs,
  measurer: StringMeasurer,
  stereoBlockGeo: ReturnType<typeof computeStereoBlockGeo>,
  options: HeaderDimsOptions,
) {
  const { badgeShown, badgeRadius, headerLinesCount, stereoFont } = options;
  const { header: headerFont, attribute: fontSpec } = fonts;
  // G2 N32: `class Foo<T>`'s generic type-parameter tag box -- widens/
  // heightens the header exactly like the stereotype block. G2 N39: SAME
  // `FontParam.CLASS_STEREOTYPE` the stereotype label row(s) use --
  // `stereoFont`, not `headerFont`.
  const genericDim = measureGenericTagDim(
    classifier.typeParams ?? [], stereoFont.family, measurer, stereoFont.size,
    classifier.typeParamsRawText,
  );
  // G2 N64 item 45: `headerLinesCount * headerFont.size` generalizes the
  // pre-existing single-line `headerFont.size` term -- every same-size line
  // reduces to `N * font.size`.
  const headerRowHeight = Math.max(
    badgeShown ? badgeBoxHeight(badgeRadius) : 0,
    stereoBlockGeo.blockDim.height + headerLinesCount * headerFont.size + 10,
    genericDim?.height ?? 0,
  );
  const headerWidth = stereoBlockGeo.circleWidth + stereoBlockGeo.widthStereoAndName + (genericDim?.width ?? 0);
  // G2 N4: ascent-from-line-top -- the SAME baseline offset formula every
  // text row (header AND members) uses. G2 N32: computed TWICE (once per
  // font) now that header/attribute fonts can diverge.
  const headerBaselineOffset = headerFont.size - measurer.getDescent(headerFont, '');
  const memberBaselineOffset = fontSpec.size - measurer.getDescent(fontSpec, '');
  const stereoBaselineOffset = stereoFont.size -
    measurer.getDescent({ family: stereoFont.family, size: stereoFont.size }, '');
  return { genericDim, headerRowHeight, headerWidth, headerBaselineOffset, memberBaselineOffset, stereoBaselineOffset };
}

/** Explicit return type for {@link computeStereoAndTagGeo} -- required
 *  because that function is exported (cross-file, `measureGenericClassifier`
 *  in class-layout-generic-classifier.ts) and its inferred shape otherwise
 *  bubbles up `class-stereotype.ts`'s unexported local `Dim` type via
 *  `blockDim` (TS4058); `{ width: number; height: number }` here is that
 *  same shape, declared structurally instead of by (unreachable) name. */
export interface StereoAndTagGeo {
  stereoLabels: string[];
  stereoLabelWidths: number[];
  blockDim: { width: number; height: number };
  circleWidth: number;
  widthStereoAndName: number;
  genericDim: GenericTagDim | undefined;
  headerRowHeight: number;
  headerWidth: number;
  headerBaselineOffset: number;
  memberBaselineOffset: number;
  stereoBaselineOffset: number;
}

/** Thin composition of {@link computeStereoBlockGeo} +
 *  {@link computeHeaderDimsGeo} -- kept as a single call site for
 *  `measureGenericClassifier` (both halves are needed together downstream)
 *  while each half stays under the project's per-function NLOC cap. */
export function computeStereoAndTagGeo(
  classifier: Classifier,
  fonts: ClassFontSpecs,
  measurer: StringMeasurer,
  headerNameGeo: ReturnType<typeof computeHeaderNameGeo>,
  options: StereoGeoOptions,
): StereoAndTagGeo {
  const { guillemet, badgeRadius, stereoFont } = options;
  const { badgeShown, headerLines, nameWidth } = headerNameGeo;
  const stereoBlockGeo = computeStereoBlockGeo(
    classifier, stereoFont, measurer, { guillemet, badgeShown, badgeRadius, nameWidth },
  );
  const headerDimsGeo = computeHeaderDimsGeo(
    classifier, fonts, measurer, stereoBlockGeo, { badgeShown, badgeRadius, headerLinesCount: headerLines.length, stereoFont },
  );
  return { ...stereoBlockGeo, ...headerDimsGeo };
}

/** The `headerNameGeo` + `stereoGeo` pair every header-row-building step
 *  below needs together. */
export interface HeaderGeoBundle {
  headerNameGeo: ReturnType<typeof computeHeaderNameGeo>;
  stereoGeo: ReturnType<typeof computeStereoAndTagGeo>;
}

/**
 * `class Foo<T>`'s generic-tag geometry (against the FINAL box `width`,
 * post member-content max -- matching `HeaderLayout#drawU`'s own `width`
 * parameter) + the header's asymmetric left/right slack split. Split out
 * of `measureGenericClassifier` purely to keep that function's NLOC/CCN
 * under the project's per-function caps -- see that function's own doc
 * comment for the upstream derivation.
 */
function computeGenericTagSlackGeo(
  classifier: Classifier,
  stereoGeo: ReturnType<typeof computeStereoAndTagGeo>,
  width: number,
  stereoFont: { family: string; size: number; bold: boolean; italic: boolean },
) {
  const genericTagGeo = stereoGeo.genericDim !== undefined
    ? buildGenericTagGeo(
        classifier.typeParams ?? [], stereoGeo.genericDim, width, stereoFont.family, stereoGeo.stereoBaselineOffset,
        stereoFont.size, stereoFont.bold, stereoFont.italic, classifier.typeParamsRawText,
      )
    : undefined;
  const genericTagField: CommonHeaderFields = genericTagGeo !== undefined ? { genericTag: genericTagGeo } : {};
  const { h1, h2 } = computeHeaderSlack(width, stereoGeo.headerWidth, stereoGeo.circleWidth);
  return { genericTagField, h1, h2 };
}

/**
 * Builds the stacked `<<stereotype>>` label row(s) above the classifier
 * name. Split out of `measureGenericClassifier` purely to keep that
 * function's NLOC/CCN under the project's per-function caps -- see that
 * function's own doc comment for the upstream derivation.
 */
function buildStereoRowsGeo(
  fonts: ClassFontSpecs,
  headerGeo: HeaderGeoBundle,
  slack: ReturnType<typeof computeGenericTagSlackGeo>,
  options: StereoGeoOptions,
) {
  const { guillemet, stereoFont } = options;
  const { header: headerFont } = fonts;
  const { headerNameGeo, stereoGeo } = headerGeo;
  const { h1, h2 } = slack;
  return buildStereoRows({
    labels: stereoGeo.stereoLabels,
    labelWidths: stereoGeo.stereoLabelWidths,
    fontFamily: stereoFont.family,
    circleWidth: stereoGeo.circleWidth,
    widthStereoAndName: stereoGeo.widthStereoAndName,
    blockDim: stereoGeo.blockDim,
    h1,
    h2,
    headerRowHeight: stereoGeo.headerRowHeight,
    nameLineHeight: headerNameGeo.headerLines.length * headerFont.size,
    stereoBaselineOffset: stereoGeo.stereoBaselineOffset,
    guillemet,
    fontSize: stereoFont.size,
    bold: stereoFont.bold,
    italic: stereoFont.italic,
  });
}

/**
 * Builds the classifier NAME row(s) below the stereo block. Split out of
 * `measureGenericClassifier` purely to keep that function's NLOC/CCN under
 * the project's per-function caps -- see that function's own doc comment
 * for the upstream derivation.
 */
function buildHeaderNameRowsGeo(
  fonts: ClassFontSpecs,
  headerGeo: HeaderGeoBundle,
  slack: ReturnType<typeof computeGenericTagSlackGeo>,
  nameTop: number,
  options: StereoGeoOptions,
) {
  const { badgeRadius } = options;
  const { header: headerFont } = fonts;
  const { headerNameGeo, stereoGeo } = headerGeo;
  const { h1, h2 } = slack;
  // G2 N64 item 45: `headerRowCount` now also grows for a multi-line NAME
  // (not just stacked stereotype rows) -- `nameRowCount` tells
  // `renderer-classifier-box.ts#buildHeaderPrimitive` how many of the
  // TRAILING header rows are name lines.
  return buildHeaderRows({
    header: headerNameGeo.header, lines: headerNameGeo.headerLines, lineWidths: headerNameGeo.headerLineWidths,
    align: headerNameGeo.headerAlign, circleWidth: stereoGeo.circleWidth, widthStereoAndName: stereoGeo.widthStereoAndName,
    nameWidth: headerNameGeo.nameWidth, h1, h2, nameTop,
    baselineOffset: stereoGeo.headerBaselineOffset, fontSpec: headerFont,
    headerTextWidth: headerNameGeo.headerTextWidth, badgeRadius, blankLineRenderWidth: headerNameGeo.blankLineRenderWidth,
  });
}

/** Thin composition of {@link buildStereoRowsGeo} + {@link
 *  buildHeaderNameRowsGeo} -- kept as a single call site for
 *  `measureGenericClassifier` while each half stays under the project's
 *  per-function NLOC cap. */
function buildStereoAndHeaderRowsGeo(
  fonts: ClassFontSpecs,
  headerGeo: HeaderGeoBundle,
  slack: ReturnType<typeof computeGenericTagSlackGeo>,
  options: StereoGeoOptions,
) {
  const { rows: stereoRows, nameTop } = buildStereoRowsGeo(fonts, headerGeo, slack, options);
  const headerRows = buildHeaderNameRowsGeo(fonts, headerGeo, slack, nameTop, options);
  const totalHeaderRows = stereoRows.length + headerRows.length;
  const headerRowCountField: CommonHeaderFields = totalHeaderRows > 1 ? { headerRowCount: totalHeaderRows } : {};
  const nameRowCountField: CommonHeaderFields = headerRows.length > 1 ? { nameRowCount: headerRows.length } : {};
  return { rows: [...stereoRows, ...headerRows] as ClassifierGeo['rows'], headerRowCountField, nameRowCountField };
}

/** Thin composition of {@link computeGenericTagSlackGeo} +
 *  {@link buildStereoAndHeaderRowsGeo} -- kept as a single call site for
 *  `measureGenericClassifier` while each half stays under the project's
 *  per-function NLOC cap. */
export function computeHeaderRowsGeo(
  classifier: Classifier,
  fonts: ClassFontSpecs,
  headerGeo: HeaderGeoBundle,
  width: number,
  options: StereoGeoOptions,
) {
  const slack = computeGenericTagSlackGeo(classifier, headerGeo.stereoGeo, width, options.stereoFont);
  const rowsGeo = buildStereoAndHeaderRowsGeo(fonts, headerGeo, slack, options);
  return { ...rowsGeo, genericTagField: slack.genericTagField };
}
