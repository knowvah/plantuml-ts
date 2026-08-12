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
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { spriteDimsLookupFor, type SpriteRegistry } from '../../core/sprite-commands.js';
import type { ClassifierGeo } from './layout.js';
import { formatMemberText, type MeasuredClassifier, type MemberSuppression } from './class-layout-helpers.js';
import { resolveVisibleStereotypeLabels, type GuillemetPair } from './class-stereotype.js';
import { measureLeafNode } from '../description/leaf-sizing.js';
import type { DescriptiveNode } from '../description/ast.js';
import { KEYWORD_TO_SYMBOL } from '../../core/descriptive-keywords.js';
import {
  resolveElementFontSize,
  resolveElementMinimumWidth,
} from '../../core/theme-element-resolve.js';
import {
  isMethodMember,
  sectionHeight,
  buildSectionRows,
  sectionWidth,
  rowIconZoneWidth,
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

/**
 * A2s F-D mechanism A2: upstream routes EVERY `LeafType.DESCRIPTION` leaf
 * and every `LeafType.EMPTY_PACKAGE` leaf with `getUSymbol() != null` to
 * `EntityImageDescription` (GeneralImageBuilder.java:158-166 DESCRIPTION,
 * :200-202 EMPTY_PACKAGE-with-USymbol) -- never to `EntityImageClass`'s
 * generic name+members box. This port previously sized such leaves
 * (allowmixing `database`/`component`/`rectangle`/... and empty brace-groups
 * that kept their usymbol) as the generic box: jar delta e.g.
 * givofi-11-xumu978's `database dummy2` 1.022743x0.597222in vs our old
 * 1.189410x0.666667in. Routes through the SAME `measureLeafNode` entry the
 * description engine's own DOT builder uses (`layout-dot-tree.ts:171`),
 * with the SAME per-element opts resolution. Dispatched from
 * `class-layout-helpers.ts#tryMeasureNonGenericClassifier` (usecase/actor
 * keep their earlier `measureUsecaseOrActor` branch).
 *
 * Deliberate exclusions (named remainder, F-D report):
 * - a leaf with visible members: `measureLeafNode` sizes the display only;
 *   upstream folds the body block into `EntityImageDescription`'s desc.
 *
 * `package`/`folder` WERE excluded here (the F-D report's other named
 * remainder) while the description engine's folder-title path was
 * SI1-narrowed; SI1 T12 un-narrowed it (the shown title now measures
 * through the real `BodyFactory.create2`→`BodyEnhanced1` route,
 * `leaf-sizing-folder-title.ts`), so both now route like every other
 * description-shaped leaf -- closing gujigi-63-roki030 (`package
 * "Elektronisk dokument"`, jar 171.9375x37px, previously pinned at
 * 0.152778in).
 */
export function tryMeasureDescriptionLeaf(
  classifier: Classifier,
  theme: Theme,
  measurer: StringMeasurer,
  sprites: SpriteRegistry | undefined,
): MeasuredClassifier | undefined {
  if (classifier.kind !== 'descriptive' || classifier.usymbol === undefined) return undefined;
  const symbol = KEYWORD_TO_SYMBOL.get(classifier.usymbol);
  if (symbol === undefined || symbol === 'actor') return undefined;
  if (classifier.members.some((m) => m.hidden !== true)) return undefined;
  const stereotype = resolveVisibleStereotypeLabels(classifier);
  const node: DescriptiveNode = {
    id: classifier.id, display: classifier.display, symbol, children: [],
    ...(stereotype.length > 0 ? { stereotype } : {}),
  };
  const dim = measureLeafNode(
    node, { family: theme.fontFamily, size: theme.fontSize }, measurer,
    buildDescriptionLeafOpts(theme, symbol),
    sprites !== undefined ? spriteDimsLookupFor(sprites) : undefined,
  );
  // Same single-row composition as `measureUsecaseOrActor` -- the renderer's
  // `tryRenderUSymbol` path reads `rows[0].text` for the drawn label.
  return {
    width: dim.width, height: dim.height, dividerYs: [],
    rows: [{ text: classifier.display, y: dim.height / 2, indent: 0, italic: false }],
  };
}

/** The SAME per-element `BoxSizingOpts` resolution the description engine's
 *  own DOT builder performs (`layout-dot-tree.ts:171-181` via `ClassifyCtx
 *  .minimumWidthFor`/`.fontSizeFor`, `layout.ts:435-441`) -- split out of
 *  {@link tryMeasureDescriptionLeaf} purely for the per-function CCN cap. */
function buildDescriptionLeafOpts(theme: Theme, symbol: DescriptiveNode['symbol']) {
  return {
    componentStyle: theme.componentStyle,
    actorStyle: theme.actorStyle,
    minimumWidth: resolveElementMinimumWidth(theme, symbol),
    wrapWidth: theme.wrapWidth ?? 0,
    guillemet: {
      start: theme.colors.graph.guillemetStart ?? '«',
      end: theme.colors.graph.guillemetEnd ?? '»',
    },
    fontSize: resolveElementFontSize(theme, symbol, 'title'),
  };
}

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
function computeMemberSectionsGeo(
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
  /** A2s F-D mechanism A7: `skinparam minClassWidth` / `<style> MinimumWidth`
   *  (`PName.MinimumWidth`) -- pre-resolved by the caller
   *  (`measureClassifier`, via `resolveElementMinimumWidth(theme, 'class')`),
   *  mirroring `badgeRadius`'s "resolve once, pass down" precedent. Floors
   *  the box width AFTER `max(header, body)`, BEFORE the header rows are
   *  placed (upstream `HeaderLayout#drawU` centers against the FINAL width).
   *  Optional; absent/0 = no floor (upstream's own default).
   *  @see ~/git/plantuml/.../svek/image/EntityImageClass.java:104-106 */
  minClassWidth?: number;
  /** A2s F-G mechanism A13: `skinparam classAttributeIconSize`
   *  (`SkinParam#classAttributeIconSize()` = `getAsInt(..., 10)`,
   *  SkinParam.java:554-556) -- pre-resolved by the caller
   *  (`measureClassifier`, from `theme.classAttributeIconSize`), mirroring
   *  `badgeRadius`'s precedent. ONLY the value `0` changes behavior
   *  (`MethodsOrFieldsArea#hasSmallIcon` java:125-127 returns false
   *  outright; `#createTextBlock` java:244-246 keeps the visibility char in
   *  the member text instead). Absent = upstream default 10 = icons on.
   *  `| undefined` for exactOptionalPropertyTypes: the caller passes
   *  `theme.classAttributeIconSize` through unconditionally. */
  classAttributeIconSize?: number | undefined;
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
  const minClassWidth = options.minClassWidth ?? 0;
  // G2 N32: `fontSpec` is the ATTRIBUTE/member-row font; `headerFont` is the
  // classifier HEADER's own, independently-overridable font -- see
  // `theme.ts#classFontSize`'s doc comment for the jar-verified cascade.
  const { header: headerFont, attribute: fontSpec } = fonts;
  // A2s R2i: `sprites` threads into the header geo (item-1 creole routing:
  // a header NAME can carry `<$sprite>`/`<:emoji:>` atoms and the R2i badge
  // sprite `<<($name)>>` sizes off the registry) -- both option shapes are
  // owned by class-layout-header-geo.ts.
  const headerNameGeo =
    computeHeaderNameGeo(classifier, headerFont, fontSpec, measurer, { strictUml, headerMaxWidth, sprites });
  const stereoGeo =
    computeStereoAndTagGeo(classifier, fonts, measurer, headerNameGeo, { guillemet, badgeRadius, stereoFont });
  const enhancedBody = computeEnhancedBodyGeo(classifier, fontSpec, measurer, stereoGeo, { sprites, suppress });
  const memberSections = enhancedBody !== undefined
    ? undefined
    : computeMemberSectionsGeo(
        classifier, fontSpec, measurer,
        { suppress, memberMaxWidth, sprites, classAttributeIconSize: options.classAttributeIconSize, badgeRadius },
      );
  const memberAreaWidth = enhancedBody !== undefined ? enhancedBody.width : memberSections!.sectionsWidth;
  // A2s F-D mechanism A7: `EntityImageClass#calculateDimensionSlow`'s
  // `if (width < minClassWidth) width = minClassWidth` floor (EntityImageClass
  // .java:104-106), applied to `max(header, body)` BEFORE `computeHeaderRowsGeo`
  // so the header rows center against the floored width -- exactly
  // `HeaderLayout#drawU`'s own `width` parameter (the final box width).
  // Jar-verified: novaro-13-socu897 (`skinparam minClassWidth 70` -> `class a`
  // emits width 0.972222in = 70px exactly).
  const width = Math.max(Math.max(stereoGeo.headerWidth, memberAreaWidth), minClassWidth);
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
  const { stereoGeo, headerRowsGeo } = geo;
  const { fieldsH, methodsH } = memberSections;
  const height = stereoGeo.headerRowHeight + fieldsH + methodsH;
  const acc: RowAccumulator = { rows: [...headerRowsGeo.rows], dividerYs: [] };
  const rowCtx: SectionRowContext = {
    baselineOffset: stereoGeo.memberBaselineOffset,
    iconZoneWidth: memberSections.iconZoneWidth,
  };
  if (!suppress.fields) {
    appendMemberSectionRows(acc, memberSections.fieldFlat, stereoGeo.headerRowHeight, memberSections.fieldsHasIcon, rowCtx);
  }
  if (!suppress.methods) {
    appendMemberSectionRows(
      acc, memberSections.methodFlat, stereoGeo.headerRowHeight + fieldsH, memberSections.methodsHasIcon, rowCtx,
    );
  }
  // T2 (SI17), publish-only: surface the ALREADY-COMPUTED headerRowHeight +
  // per-compartment FlatMemberRows for `class-port-rows.ts#classPortRows`'
  // caller -- see `MeasuredClassifier.portMemberSections`'s own doc comment.
  // No new measurement; `suppress.fields`/`.methods` gate exactly like
  // `fieldsH`/`methodsH` above (a suppressed compartment is OMITTED, not an
  // empty one).
  const portMemberSections = {
    headerHeight: stereoGeo.headerRowHeight,
    ...(suppress.fields ? {} : { fields: memberSections.fieldFlat }),
    ...(suppress.methods ? {} : { methods: memberSections.methodFlat }),
  };
  return { width, height, rows: acc.rows, dividerYs: acc.dividerYs, ...commonFields, portMemberSections };
}
