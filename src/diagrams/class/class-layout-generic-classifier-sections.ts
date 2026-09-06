/**
 * Member-section (fields/methods compartment) geometry for the generic
 * classifier box — `computeMemberSectionsGeo` (classic split) and
 * `computeEnhancedBodyGeo` (upstream's enhanced-body render strategy).
 *
 * Split out of class-layout-generic-classifier.ts to keep that file under
 * the project's 500-line cap (same split rationale as that file's own
 * class-layout-helpers.ts origin, see its doc comment). Both functions were
 * module-private helpers of `computeClassifierGeoPipeline`; they are
 * exported here and imported back so the caller's own code is unchanged
 * apart from the import path.
 */

import type { Classifier } from './ast.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import { formatMemberText, type MemberSuppression } from './class-layout-helpers.js';
import {
  isMethodMember,
  sectionHeight,
  sectionWidth,
  rowIconZoneWidth,
  buildWrappedSectionRowBuilds,
} from './class-member-rows.js';
import { isEnhancedBody } from './class-body-enhanced.js';
import { measureEnhancedBody } from './class-body-enhanced-layout.js';
import type { computeStereoAndTagGeo } from './class-layout-header-geo.js';

/** Params bundle for {@link computeMemberSectionsGeo} -- kept under the
 *  project's per-function param cap. */
interface MemberSectionsOptions {
  suppress: MemberSuppression;
  memberMaxWidth: number;
  sprites: SpriteRegistry | undefined;
  /** A13 -- see {@link MeasureGenericClassifierOptions.classAttributeIconSize}. */
  classAttributeIconSize?: number | undefined;
  /** A2s R2f -- the resolved badge radius ({@link
   *  MeasureGenericClassifierOptions.badgeRadius}); the per-section
   *  visibility-icon zone is `radius + 3` (`rowIconZoneWidth`), never a
   *  fixed 14 (puvono-84-doro361 / sekame-22-meze147:
   *  `skinparam CircledCharacterRadius 8` -> zone 11).
   * @see ~/git/plantuml/.../cucadiagram/MethodsOrFieldsArea.java:155-157 */
  badgeRadius: number;
}

/**
 * Field/method compartment row-building + width/height sizing, INDEPENDENT
 * of whether the classifier's body is ultimately drawn as an "enhanced
 * body" (the caller decides which width/height to actually use). Split out
 * of `measureGenericClassifier` purely to keep that function's NLOC/CCN
 * under the project's per-function caps -- see that function's own doc
 * comment for the upstream derivation of every field below.
 */
export function computeMemberSectionsGeo(
  classifier: Classifier,
  fontSpec: { family: string; size: number },
  measurer: StringMeasurer,
  options: MemberSectionsOptions,
) {
  const { suppress, memberMaxWidth, sprites } = options;
  // A2s F-G mechanism A13: `classAttributeIconSize 0` --
  // `MethodsOrFieldsArea#hasSmallIcon()` (java:125-127) returns false
  // before scanning any member, and `#createTextBlock` (java:244-246)
  // keeps the visibility char in the member text instead.
  const noIcon = options.classAttributeIconSize === 0;
  // Only include visible (non-hidden) members in layout; split into the two
  // upstream compartments (fields first, then methods — declaration order
  // preserved within each).
  const visibleMembers = classifier.members.filter((m) => m.hidden !== true);
  const fields = visibleMembers.filter((m) => !isMethodMember(m));
  const methods = visibleMembers.filter(isMethodMember);
  const fieldTexts = fields.map((m) => formatMemberText(m, noIcon));
  const methodTexts = methods.map((m) => formatMemberText(m, noIcon));
  // G2 N22/N65 item 35: each member's creole build is computed ONCE here and
  // reused for BOTH the section max-width scan and the stored row, and now
  // also word-wraps each member into 1+ rows when `memberMaxWidth` is set.
  const fieldFlat = buildWrappedSectionRowBuilds(fields, fieldTexts, fontSpec, measurer, memberMaxWidth, sprites);
  const methodFlat = buildWrappedSectionRowBuilds(methods, methodTexts, fontSpec, measurer, memberMaxWidth, sprites);
  // G2 N14: hasIcon is a per-SECTION scan, fields and methods independent.
  // A13: `hasSmallIcon`'s `classAttributeIconSize() == 0` early-false wins
  // over any explicit member.
  const fieldsHasIcon = !noIcon && fields.some((m) => m.visibilityExplicit === true);
  const methodsHasIcon = !noIcon && methods.some((m) => m.visibilityExplicit === true);
  // A2s R2f: the icon zone follows the RESOLVED badge radius (`radius + 3`,
  // MethodsOrFieldsArea.java:157) for both the width reserve here and the
  // row indent (`buildSectionRows` via `SectionRowContext.iconZoneWidth`).
  const iconZoneWidth = rowIconZoneWidth(options.badgeRadius);
  // G2 N26: a SUPPRESSED compartment must not contribute to the box width
  // either -- jar-verified `nujiga-81-peno983`.
  const sectionsWidth = Math.max(
    suppress.fields ? 0 : sectionWidth(fieldFlat.builds, fieldsHasIcon, iconZoneWidth),
    suppress.methods ? 0 : sectionWidth(methodFlat.builds, methodsHasIcon, iconZoneWidth),
  );
  // G2 N10: each compartment (fields, methods) is suppressed INDEPENDENTLY.
  // G2 N65 item 35: total FLAT row count (may exceed `fields.length`/
  // `methods.length` when a member wraps into multiple rows).
  // A2s R2i (lozego-15-coci435): per-row heights summed off each build
  // (`sectionHeight`'s own doc comment) -- `memberRowHeight` no longer
  // parameterizes section heights (every atom-free row's own height equals
  // it, so the sum is identical for the common case).
  const fieldsH = suppress.fields ? 0 : sectionHeight(fieldFlat.builds);
  const methodsH = suppress.methods ? 0 : sectionHeight(methodFlat.builds);
  return { fieldFlat, methodFlat, fieldsHasIcon, methodsHasIcon, sectionsWidth, fieldsH, methodsH, iconZoneWidth };
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
export function computeEnhancedBodyGeo(
  classifier: Classifier,
  fontSpec: { family: string; size: number },
  measurer: StringMeasurer,
  stereoGeo: ReturnType<typeof computeStereoAndTagGeo>,
  options: { sprites: SpriteRegistry | undefined; suppress: MemberSuppression },
) {
  const { sprites, suppress } = options;
  if (!isEnhancedBody(classifier.rawBodyLines) || (suppress.fields && suppress.methods)) return undefined;
  return measureEnhancedBody(classifier.rawBodyLines!, {
    fontSpec,
    measurer,
    sprites,
    baselineOffset: stereoGeo.memberBaselineOffset,
    bodyTop: stereoGeo.headerRowHeight,
  });
}
