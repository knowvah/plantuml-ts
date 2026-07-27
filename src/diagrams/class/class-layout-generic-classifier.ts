/**
 * Generic name+members classifier box sizing for the class diagram layout
 * engine (src/diagrams/class/layout.ts) -- the member-section half of
 * `measureGenericClassifier`. The header/stereotype/generic-tag half lives
 * in ./class-layout-header-geo.ts (same split rationale, see that file's
 * own doc comment).
 *
 * Split out of class-layout-helpers.ts purely to keep every function under
 * the project's per-function complexity/size caps (CCN <= 10, <= 30 NLOC)
 * and the file under the 500-line cap. `measureGenericClassifier`'s own
 * computation is unchanged from the pre-split version -- it is here broken
 * into small named steps purely to fit under the NLOC/CCN caps; every
 * individual formula is a pure move, not a rewrite. See
 * `measureGenericClassifier`'s own doc comment for the upstream jar
 * derivation of the overall box geometry.
 */

import type { Classifier } from './ast.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import type { ClassifierGeo } from './layout.js';
import { formatMemberText, type MeasuredClassifier, type MemberSuppression } from './class-layout-helpers.js';
import type { GuillemetPair } from './class-stereotype.js';
import {
  isMethodMember,
  sectionHeight,
  buildSectionRows,
  sectionWidth,
  buildWrappedSectionRowBuilds,
  type FlatMemberRows,
  type SectionRowContext,
} from './class-member-rows.js';
import { isEnhancedBody } from './class-body-enhanced.js';
import { measureEnhancedBody } from './class-body-enhanced-layout.js';
import {
  computeHeaderNameGeo,
  computeStereoAndTagGeo,
  computeHeaderRowsGeo,
  type HeaderGeoBundle,
  type CommonHeaderFields,
} from './class-layout-header-geo.js';
import type { ClassFontSpecs } from './class-layout-generic-classifier-types.js';

export type { ClassFontSpecs };

/** Params bundle for {@link computeMemberSectionsGeo} -- kept under the
 *  project's per-function param cap. */
interface MemberSectionsOptions {
  suppress: MemberSuppression;
  memberMaxWidth: number;
  sprites: SpriteRegistry | undefined;
}

/**
 * Field/method compartment row-building + width/height sizing, INDEPENDENT
 * of whether the classifier's body is ultimately drawn as an "enhanced
 * body" (the caller decides which width/height to actually use). Split out
 * of `measureGenericClassifier` purely to keep that function's NLOC/CCN
 * under the project's per-function caps -- see that function's own doc
 * comment for the upstream derivation of every field below.
 */
function computeMemberSectionsGeo(
  classifier: Classifier,
  fontSpec: { family: string; size: number },
  measurer: StringMeasurer,
  memberRowHeight: number,
  options: MemberSectionsOptions,
) {
  const { suppress, memberMaxWidth, sprites } = options;
  // Only include visible (non-hidden) members in layout; split into the two
  // upstream compartments (fields first, then methods — declaration order
  // preserved within each).
  const visibleMembers = classifier.members.filter((m) => m.hidden !== true);
  const fields = visibleMembers.filter((m) => !isMethodMember(m));
  const methods = visibleMembers.filter(isMethodMember);
  const fieldTexts = fields.map(formatMemberText);
  const methodTexts = methods.map(formatMemberText);
  // G2 N22/N65 item 35: each member's creole build is computed ONCE here and
  // reused for BOTH the section max-width scan and the stored row, and now
  // also word-wraps each member into 1+ rows when `memberMaxWidth` is set.
  const fieldFlat = buildWrappedSectionRowBuilds(fields, fieldTexts, fontSpec, measurer, memberMaxWidth, sprites);
  const methodFlat = buildWrappedSectionRowBuilds(methods, methodTexts, fontSpec, measurer, memberMaxWidth, sprites);
  // G2 N14: hasIcon is a per-SECTION scan, fields and methods independent.
  const fieldsHasIcon = fields.some((m) => m.visibilityExplicit === true);
  const methodsHasIcon = methods.some((m) => m.visibilityExplicit === true);
  // G2 N26: a SUPPRESSED compartment must not contribute to the box width
  // either -- jar-verified `nujiga-81-peno983`.
  const sectionsWidth = Math.max(
    suppress.fields ? 0 : sectionWidth(fieldFlat.builds, fieldsHasIcon),
    suppress.methods ? 0 : sectionWidth(methodFlat.builds, methodsHasIcon),
  );
  // G2 N10: each compartment (fields, methods) is suppressed INDEPENDENTLY.
  // G2 N65 item 35: total FLAT row count (may exceed `fields.length`/
  // `methods.length` when a member wraps into multiple rows).
  const fieldsH = suppress.fields ? 0 : sectionHeight(fieldFlat.builds.length, memberRowHeight);
  const methodsH = suppress.methods ? 0 : sectionHeight(methodFlat.builds.length, memberRowHeight);
  return { fieldFlat, methodFlat, fieldsHasIcon, methodsHasIcon, sectionsWidth, fieldsH, methodsH };
}

/**
 * G2 N42: upstream's "enhanced body" render strategy (`--`/`==`/`..`/`__`
 * block separator or a `|_` tree-list line anywhere in the raw body)
 * REPLACES the classic fields/methods split entirely. G2 N44 (regression
 * guard, `nirija-04-veti140`): a classifier whose whole member section is
 * suppressed (BOTH `suppress.fields` AND `suppress.methods`) draws NO body
 * at all, not the full enhanced-body content. Split out of
 * `measureGenericClassifier` purely to keep that function's NLOC/CCN under
 * the project's per-function caps.
 */
function computeEnhancedBodyGeo(
  classifier: Classifier,
  fontSpec: { family: string; size: number },
  measurer: StringMeasurer,
  stereoGeo: ReturnType<typeof computeStereoAndTagGeo>,
  options: { sprites: SpriteRegistry | undefined; suppress: MemberSuppression },
) {
  const { sprites, suppress } = options;
  if (!isEnhancedBody(classifier.rawBodyLines) || (suppress.fields && suppress.methods)) return undefined;
  return measureEnhancedBody(classifier.rawBodyLines!, {
    fontSpec, measurer, sprites, baselineOffset: stereoGeo.memberBaselineOffset, bodyTop: stereoGeo.headerRowHeight,
  });
}

/** Every field `measureGenericClassifier` threads down to size the
 *  generic name+members box -- see each field's own doc comment for the
 *  upstream override it resolves. */
export interface MeasureGenericClassifierOptions {
  sprites: SpriteRegistry | undefined;
  guillemet?: GuillemetPair | undefined;
  /** G2 N38: `skinparam circledCharacterFontSize`/`circledCharacterRadius`
   *  -- pre-resolved by the caller (`measureClassifier`, which has
   *  `theme`), since this function has no `Theme` param of its own. */
  badgeRadius: number;
  /** G2 N39: `skinparam classStereotypeFontSize`/`FontName`/`FontStyle`
   *  -- pre-resolved by the caller, mirroring `badgeRadius`'s own
   *  precedent above. */
  stereoFont: { family: string; size: number; bold: boolean; italic: boolean };
  /** G2 N58 item 40: `skinparam style strictuml` -- pre-resolved by the
   *  caller, mirroring `badgeRadius`'s own "resolve once, pass down"
   *  precedent above. */
  strictUml: boolean;
  /** G2 N65 item 35: `<style> class { MaximumWidth N } }` -- pre-resolved
   *  by the caller, mirroring `badgeRadius`'s own "resolve once, pass
   *  down" precedent above. `0` = no wrap. */
  headerMaxWidth: number;
  memberMaxWidth: number;
}

/** Every piece `measureGenericClassifier` needs to assemble its 3 possible
 *  return shapes (enhanced body / fully suppressed / normal). */
interface ClassifierGeoPipelineResult {
  headerNameGeo: ReturnType<typeof computeHeaderNameGeo>;
  stereoGeo: ReturnType<typeof computeStereoAndTagGeo>;
  enhancedBody: ReturnType<typeof computeEnhancedBodyGeo>;
  memberSections: ReturnType<typeof computeMemberSectionsGeo> | undefined;
  width: number;
  headerRowsGeo: ReturnType<typeof computeHeaderRowsGeo>;
  commonFields: CommonHeaderFields;
}

/**
 * Runs the full header + (enhanced-body-or-member-section) + header-rows
 * geometry pipeline `measureGenericClassifier` composes -- split out purely
 * to keep that function's NLOC/CCN under the project's per-function caps;
 * see that function's own doc comment for the upstream derivation.
 */
function computeClassifierGeoPipeline(
  classifier: Classifier,
  fonts: ClassFontSpecs,
  measurer: StringMeasurer,
  suppress: MemberSuppression,
  options: MeasureGenericClassifierOptions,
): ClassifierGeoPipelineResult {
  const { sprites, guillemet, badgeRadius, stereoFont, strictUml, headerMaxWidth, memberMaxWidth } = options;
  // G2 N32: `fontSpec` is the ATTRIBUTE/member-row font; `headerFont` is the
  // classifier HEADER's own, independently-overridable font -- see
  // `theme.ts#classFontSize`'s doc comment for the jar-verified cascade.
  const { header: headerFont, attribute: fontSpec } = fonts;
  const headerNameGeo = computeHeaderNameGeo(classifier, headerFont, fontSpec, measurer, { strictUml, headerMaxWidth });
  const stereoGeo = computeStereoAndTagGeo(
    classifier, fonts, measurer, headerNameGeo, { guillemet, badgeRadius, stereoFont },
  );
  const enhancedBody = computeEnhancedBodyGeo(classifier, fontSpec, measurer, stereoGeo, { sprites, suppress });
  const memberSections = enhancedBody !== undefined
    ? undefined
    : computeMemberSectionsGeo(
        classifier, fontSpec, measurer, headerNameGeo.memberRowHeight, { suppress, memberMaxWidth, sprites },
      );
  const memberAreaWidth = enhancedBody !== undefined ? enhancedBody.width : memberSections!.sectionsWidth;
  const width = Math.max(stereoGeo.headerWidth, memberAreaWidth);
  const headerRowsGeo = computeHeaderRowsGeo(
    classifier, fonts, { headerNameGeo, stereoGeo }, width, { guillemet, badgeRadius, stereoFont },
  );
  const commonFields = buildCommonHeaderFields(headerNameGeo, headerRowsGeo);
  return { headerNameGeo, stereoGeo, enhancedBody, memberSections, width, headerRowsGeo, commonFields };
}

/** The `headerRowCount`/`nameRowCount`/`badgeChar`/`badgeColor`/`genericTag`
 *  fields present in ALL 3 of `measureGenericClassifier`'s possible return
 *  shapes -- factored out purely to keep {@link computeClassifierGeoPipeline}
 *  under the project's per-function NLOC cap. */
function buildCommonHeaderFields(
  headerNameGeo: ReturnType<typeof computeHeaderNameGeo>,
  headerRowsGeo: ReturnType<typeof computeHeaderRowsGeo>,
): CommonHeaderFields {
  return {
    ...headerRowsGeo.headerRowCountField, ...headerRowsGeo.nameRowCountField,
    ...headerNameGeo.badgeCharField, ...headerNameGeo.badgeColorField, ...headerRowsGeo.genericTagField,
  };
}

/**
 * Measure the generic name+members box (class/interface/enum/annotation/…
 * every kind not intercepted above measureClassifier's dispatch).
 *
 * Width/height formulas mirror `EntityImageClassHeader`/`HeaderLayout`/
 * `MethodsOrFieldsArea` (see `class-badge.ts`'s doc comment for the header
 * geometry derivation; jar-verified, `plans/g2-class-svg/ledger.md` N3) —
 * replaces the previous ad hoc `Math.max(100, longestWidth + 20)` floor,
 * which upstream has no equivalent of (`MinimumWidth`/`SameClassWidth`
 * default to 0).
 */
/**
 * G2 N42: the enhanced-body box height is `headerRowHeight +
 * enhancedBody.height` -- upstream draws it as a SINGLE `TextBlockVertical`
 * stack, never split into the classic fields/methods `dividerYs` pair.
 * Split out of `measureGenericClassifier` purely to keep that function's
 * NLOC under the project's per-function cap.
 */
function buildEnhancedBodyResult(
  width: number,
  stereoGeo: ReturnType<typeof computeStereoAndTagGeo>,
  headerRowsGeo: ReturnType<typeof computeHeaderRowsGeo>,
  enhancedBody: NonNullable<ReturnType<typeof computeEnhancedBodyGeo>>,
  commonFields: CommonHeaderFields,
): MeasuredClassifier {
  return {
    width, height: stereoGeo.headerRowHeight + enhancedBody.height, rows: headerRowsGeo.rows,
    // `dividerYs[0]` is consulted by `renderer-classifier-box.ts
    // #renderBadge` for the header's own height (badge vertical center).
    dividerYs: [stereoGeo.headerRowHeight],
    enhancedBody, ...commonFields,
  };
}

export function measureGenericClassifier(
  classifier: Classifier,
  fonts: ClassFontSpecs,
  measurer: StringMeasurer,
  suppress: MemberSuppression,
  // G2 N27: `sprites` + the `guillemet` override folded into one trailing
  // options object -- this function was already at the repo's 5-param cap.
  options: MeasureGenericClassifierOptions,
): MeasuredClassifier {
  const { headerNameGeo, stereoGeo, enhancedBody, memberSections, width, headerRowsGeo, commonFields } =
    computeClassifierGeoPipeline(classifier, fonts, measurer, suppress, options);

  if (enhancedBody !== undefined) {
    return buildEnhancedBodyResult(width, stereoGeo, headerRowsGeo, enhancedBody, commonFields);
  }

  // G2 N24 (pre-existing bug, unmasked while jar-verifying the stereo
  // formula on `cuxuni-25-doxi736`): a fully-suppressed classifier's box
  // height is `headerRowHeight` EXACTLY, not `+4`.
  if (suppress.fields && suppress.methods) {
    return { width, height: stereoGeo.headerRowHeight, rows: headerRowsGeo.rows, dividerYs: [], ...commonFields };
  }

  return buildNormalClassifierResult(
    width, { headerNameGeo, stereoGeo, headerRowsGeo }, memberSections!, suppress, commonFields,
  );
}

/** The full geo bundle {@link buildNormalClassifierResult} needs. */
interface NormalClassifierGeo extends HeaderGeoBundle {
  headerRowsGeo: ReturnType<typeof computeHeaderRowsGeo>;
}

/** The two mutable accumulators {@link appendMemberSectionRows} appends
 *  into -- bundled to keep that function under the project's per-function
 *  param cap. */
interface RowAccumulator {
  rows: ClassifierGeo['rows'];
  dividerYs: number[];
}

/** One compartment's (fields' or methods') already-suppression-gated rows,
 *  appended to `acc.rows`/`acc.dividerYs` in place -- factored out of
 *  `buildNormalClassifierResult` purely to avoid repeating the identical
 *  fields/methods shape twice (G2 N10: each compartment suppressed
 *  INDEPENDENTLY). */
function appendMemberSectionRows(
  acc: RowAccumulator,
  section: FlatMemberRows,
  y: number,
  hasIcon: boolean,
  rowCtx: SectionRowContext,
): void {
  acc.dividerYs.push(y);
  acc.rows.push(...buildSectionRows(section.members, section.texts, section.builds, y, hasIcon, rowCtx));
}

/**
 * The default (no enhanced body, not fully suppressed) branch of
 * `measureGenericClassifier` -- draws each non-suppressed compartment's own
 * divider + rows (G2 N10: fields/methods suppressed INDEPENDENTLY). Split
 * out purely to keep `measureGenericClassifier` under the project's
 * per-function NLOC cap; see that function's own doc comment for the
 * upstream derivation.
 */
function buildNormalClassifierResult(
  width: number,
  geo: NormalClassifierGeo,
  memberSections: ReturnType<typeof computeMemberSectionsGeo>,
  suppress: MemberSuppression,
  commonFields: CommonHeaderFields,
): MeasuredClassifier {
  const { headerNameGeo, stereoGeo, headerRowsGeo } = geo;
  const { fieldsH, methodsH } = memberSections;
  const height = stereoGeo.headerRowHeight + fieldsH + methodsH;
  const acc: RowAccumulator = { rows: [...headerRowsGeo.rows], dividerYs: [] };
  const rowCtx: SectionRowContext = {
    memberRowHeight: headerNameGeo.memberRowHeight, baselineOffset: stereoGeo.memberBaselineOffset,
  };
  if (!suppress.fields) {
    appendMemberSectionRows(acc, memberSections.fieldFlat, stereoGeo.headerRowHeight, memberSections.fieldsHasIcon, rowCtx);
  }
  if (!suppress.methods) {
    appendMemberSectionRows(
      acc, memberSections.methodFlat, stereoGeo.headerRowHeight + fieldsH, memberSections.methodsHasIcon, rowCtx,
    );
  }
  return { width, height, rows: acc.rows, dividerYs: acc.dividerYs, ...commonFields };
}
