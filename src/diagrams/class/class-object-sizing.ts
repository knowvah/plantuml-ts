/**
 * Object classifier sizing — the `kind:'object'`-SPECIFIC field/body math
 * for the class diagram layout engine (./layout.ts). Split out of
 * ./class-object-map-sizing.ts (S1 — pure relocation, no logic change) to
 * keep both files under the repo's 500-line-per-file cap and every function
 * under the CCN/NLOC caps — same motivation as the earlier G3/O1
 * class-map-sizing.ts split and the header-math class-object-map-header.ts
 * split noted in that file's own module doc. `class-object-map-sizing.ts`
 * keeps the `floorAtMinimumWidth` helper (shared by object/map/json) and
 * the re-exports of the header-row math, so every existing
 * `./class-object-map-sizing.js` import site keeps working unchanged.
 *
 * The member-row measurement group (`measureObjectFields`,
 * `methodOrFieldHeight`, `formatObjectMemberText`, and the field-area
 * constants) moved out to ./class-object-fields.ts (S-C — pure relocation,
 * no logic change) for the same 500-line/NLOC-cap reason; this file imports
 * `measureObjectFields`/`methodOrFieldHeight` back for
 * {@link buildFieldBasedObjectGeo}'s field-based branch. See that file's own
 * module doc for the field-row citations and verification fixtures.
 *
 * Faithful port of the dimension math:
 *   @see ~/git/plantuml/.../svek/image/EntityImageObject.java
 *   @see ~/git/plantuml/.../cucadiagram/MethodsOrFieldsArea.java (asBlockMemberImpl)
 *   @see ~/git/plantuml/.../cucadiagram/BodierLikeClassOrObject.java (getBody, OBJECT branch)
 *   @see ~/git/plantuml/.../klimt/font/FontParam.java (OBJECT_STEREOTYPE = size 12, italic)
 *
 * Verified byte-for-byte (WidthTableMeasurer, matching the jar's
 * `-DPLANTUML_DETERMINISTIC_TEXT=true` svek DOT dump) against:
 *   - test-results/dot-cache/object/beleso-08-ruca459 — plain object, no
 *     stereotype/fields (dimTitle only, both nodes — see
 *     ./class-object-map-header.ts's own module doc for the header-specific
 *     citations).
 *   - test-results/dot-cache/object/figeze-77-fozi735 — object with 2 fields,
 *     no stereotype (field-area width/height formula, per-row baseline+
 *     textLength, G3/O1).
 *   - oracle/goldens/object/nukera-08-dige359 — object with 4 raw (non-
 *     structured) member lines, each carrying a distinct explicit visibility
 *     char (-#~+) — verifies `class-object-fields.ts#OBJECT_SMALL_ICON`'s
 *     fixed per-block icon reserve (p1: 133.7125 x 82.0 px exact) AND
 *     (G3/O1) that the field-row baseline stride is exactly fontSize,
 *     independent of the icon reserve.
 * See this task's mission-brief return for the worked numbers. `map`'s own
 * verification fixtures (bepafe-03-teda035, diveje-52-xefe514) live in
 * ./class-map-sizing.ts's module doc.
 */

import type { Classifier } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import type { MeasuredClassifier } from './class-layout-helpers.js';
import type { EnhancedBodyGeo } from './class-body-enhanced-layout.js';
import { isEnhancedBody } from './class-body-enhanced.js';
import { measureEnhancedBody } from './class-body-enhanced-layout.js';
import type { Dim } from './class-object-map-header.js';
import { titleDimension, measureStereo, headerRows, baselineOffsetFor } from './class-object-map-header.js';
import { floorAtMinimumWidth, objectBodyReportsPorts } from './class-object-map-sizing.js';
import { objectDisplayText } from './class-object-display.js';
import { measureObjectFields, methodOrFieldHeight } from './class-object-fields.js';
import { resolveStyleStereotypeTags } from './class-stereotype.js';

// ---------------------------------------------------------------------------
// Local interfaces (grouped at top — a declaration sitting between two
// functions gets mis-attributed to the preceding one's NLOC by lizard).
// ---------------------------------------------------------------------------


/** Result of {@link computeObjectTitle} -- the combined name+stereotype
 *  title dimension plus the resolved header FontSize override (if any),
 *  both needed by every branch of {@link measureObjectClassifier}. */
interface ObjectTitleInfo {
  title: Dim;
  nameFontSizeOverride: number | undefined;
}

/** Bundles {@link buildEnhancedObjectGeo}'s args -- introduced solely to
 *  keep that function's param count under the file's cap. */
interface EnhancedObjectBranchParams {
  classifier: Classifier;
  theme: Theme;
  measurer: StringMeasurer;
  title: Dim;
  nameFontSizeOverride: number | undefined;
  enhancedBody: EnhancedBodyGeo;
}

/** Bundles {@link buildFieldBasedObjectGeo}'s args -- introduced solely to
 *  keep that function's param count under the file's cap. */
interface FieldBasedObjectGeoParams {
  classifier: Classifier;
  theme: Theme;
  measurer: StringMeasurer;
  showFields: boolean;
  title: Dim;
  nameFontSizeOverride: number | undefined;
}

// ---------------------------------------------------------------------------
// object
// ---------------------------------------------------------------------------

/** `classDiagram,componentDiagram,objectDiagram > object { Padding 2 2 }`
 *  (plantuml.skin) -> ClockwiseTopRightBottomLeft.read("2 2") = all sides 2. */
const OBJECT_NAME_PADDING = 2;
/** EntityImageObject.xMarginCircle. */
const OBJECT_X_MARGIN_CIRCLE = 5;

/** The name+stereotype title dimension and the resolved header FontSize
 *  override for an `object` leaf -- split out of {@link measureObjectClassifier}
 *  solely to keep that function under the file's NLOC cap; no behavior
 *  change. `<style> object { header { FontSize N } } }` is resolved HERE
 *  (not inside `headerRows`) because it feeds `nameDim`/`title.width`,
 *  upstream of the box's own final `width` -- `headerRows`'s own
 *  `nameFontSizeOverride` doc comment (./class-object-map-header.ts). */
function computeObjectTitle(classifier: Classifier, theme: Theme, measurer: StringMeasurer): ObjectTitleInfo {
  // `headerFontSize` wins over the bucket's own `fontSize` for the NAME row,
  // but does not REPLACE it: `addConFont("object", SName.object)`
  // (`FromSkinparamToStyle.java:200,424-429`) maps `objectFontSize` to
  // `PName.FontSize` at `SName.object`, and `getStyleHeader()`'s signature
  // `{root, element, objectDiagram, object, header}`
  // (`EntityImageObject.java:132-134`) matches it by SET CONTAINMENT. So a
  // bare `skinparam object { FontSize 16 }` reaches the header even with no
  // header-specific override. Reading only `headerFontSize` left the name at
  // the diagram default -- jar draws `object/tenalu-53-meri239`'s B at 16
  // where this port drew 14.
  const objectBucket = theme.colors.elements?.['object'];
  // A stereotype-scoped size wins over both: upstream's
  // `getStyleHeader().withTOBECHANGED(stereotype)`
  // (`EntityImageObject.java:132-134`) merges the stereotype-qualified style
  // over the plain one. `object/tenalu-53-meri239` sets
  // `object { FontSize 16, <<Foo1>> { FontSize 8 } }`: its `A` must draw at 8
  // and its unstereotyped `B` at 16.
  const byStereo = objectBucket?.fontSizeByStereo;
  const stereoSize = byStereo === undefined
    ? undefined
    : resolveStyleStereotypeTags(classifier)
        .map((t) => byStereo[t.toLowerCase()])
        .find((v) => v !== undefined);
  const nameFontSizeOverride = stereoSize ?? objectBucket?.headerFontSize ?? objectBucket?.fontSize;
  const nameFontSpec = { family: theme.fontFamily, size: nameFontSizeOverride ?? theme.fontSize };
  // Tilde escapes resolved before measuring -- see `class-object-display.ts`.
  const nameM = measurer.measure(objectDisplayText(classifier.display), nameFontSpec);
  const nameDim: Dim = {
    width: nameM.width + OBJECT_NAME_PADDING * 2,
    height: nameM.height + OBJECT_NAME_PADDING * 2,
  };
  const stereoDim = measureStereo(classifier, theme, measurer);
  return { title: titleDimension(nameDim, stereoDim), nameFontSizeOverride };
}

/** The enhanced-body (separator/tree-list) branch of
 *  {@link measureObjectClassifier} -- split out solely to keep that
 *  function under the file's NLOC cap; no behavior change. `params` bundles
 *  the branch's args (see {@link EnhancedObjectBranchParams}) solely to
 *  keep this function's own param count under the file's cap. */
function buildEnhancedObjectGeo(params: EnhancedObjectBranchParams): MeasuredClassifier {
  const { classifier, theme, measurer, title, nameFontSizeOverride, enhancedBody } = params;
  const width = floorAtMinimumWidth(
    Math.max(enhancedBody.width, title.width + OBJECT_X_MARGIN_CIRCLE * 2), theme, 'object');
  const patchedHeaderRows = headerRows(classifier, theme, measurer, {
    boxWidth: width,
    namePadding: OBJECT_NAME_PADDING,
    underlineName: theme.strictUml === true,
    nameFontSizeOverride,
  });
  return {
    width, height: title.height + enhancedBody.height, rows: patchedHeaderRows,
    dividerYs: [title.height], enhancedBody,
    // B35/M40: an enhanced body is upstream `BodyEnhanced1`, whose
    // `decorate` wraps every block in `TextBlockUtils.withMargin(block,
    // getMarginX() = 6, 4)` (`BodyEnhancedAbstract.java:106-113`) -- a real
    // `TextBlockMarged`, so its `UEmpty` reservation exists and spans the
    // body's own full width. See `class-ink-box.ts#addRectInk`.
    bodyInkWidth: enhancedBody.width,
  };
}

/** The plain member-fields branch of {@link measureObjectClassifier} --
 *  split out solely to keep that function under the file's NLOC cap; no
 *  behavior change. `params` bundles the branch's args (see {@link
 *  FieldBasedObjectGeoParams}) solely to keep this function's own param
 *  count under the file's cap.
 *
 *  TextBlockLineBefore always draws its separator when reached — i.e.
 *  whenever showFields is true, regardless of whether there are visible
 *  members (the empty-fields placeholder is ALSO wrapped in one). */
function buildFieldBasedObjectGeo(params: FieldBasedObjectGeoParams): MeasuredClassifier {
  const { classifier, theme, measurer, showFields, title, nameFontSizeOverride } = params;
  const { dim: fieldsDim, rows: fieldRows, flat } = measureObjectFields(classifier, theme, measurer, showFields);
  const fieldsHeight = methodOrFieldHeight(fieldsDim.height, showFields);

  const width = floorAtMinimumWidth(
    Math.max(fieldsDim.width, title.width + OBJECT_X_MARGIN_CIRCLE * 2), theme, 'object');
  const height = title.height + fieldsHeight;

  const rows = headerRows(classifier, theme, measurer, {
    boxWidth: width,
    namePadding: OBJECT_NAME_PADDING,
    underlineName: theme.strictUml === true,
    nameFontSizeOverride,
  });
  for (const r of fieldRows) rows.push({ ...r, y: title.height + r.y });

  // B5/M6: an empty-but-SHOWN field list is upstream's
  // `TextBlockLineBefore(LineThickness, TextBlockEmpty(10, 16))` placeholder
  // branch (`EntityImageObject.java:110-113`), NOT the `showFields == false`
  // branch (`BodierLikeClassOrObject.java:225-229`'s `TextBlockUtils
  // .empty(0, 0)`) that `dividerYs: []` already marks. The two states carry
  // DIFFERENT ink rules -- see `class-ink-box.ts#addRectInkEmptyShownBody`.
  const emptyFieldPlaceholder = showFields && fieldRows.length === 0;

  // SI20 T1, publish-only: T0's resolved header (`title.height`, NOT
  // `+ margin` -- ../decision-journal.md's T0 entry) plus the already-built
  // field compartment. Mirrors `buildNormalClassifierResult`'s suppression
  // gate: omitted when SUPPRESSED (`showFields === false`), present
  // (possibly zero members) for shown-but-empty -- same gate `dividerYs`
  // above uses, so the two empty states stay distinct. SI20 T2 adds the
  // SECOND omission: a `MinimumWidth`-wrapped body reports no ports at all,
  // shape flip and edge ports notwithstanding -- `objectBodyReportsPorts`.
  const bodyPorts = showFields && objectBodyReportsPorts(theme);
  const portMemberSections = { headerHeight: title.height, ...(bodyPorts ? { fields: flat } : {}) };

  return {
    width, height, rows, portMemberSections,
    dividerYs: showFields ? [title.height] : [],
    ...(emptyFieldPlaceholder ? { emptyFieldPlaceholder: true as const } : {}),
    // B35/M40: only a POPULATED field list is a real `BodyFactory.create1`
    // body, whose `decorate` wraps it in a `TextBlockMarged` that draws the
    // `UEmpty` reservation (`BodyEnhancedAbstract.java:106-113`). Both empty
    // states draw NO `UEmpty` at all and so reserve zero body ink:
    // `showFields == false` is `TextBlockUtils.empty(0, 0)`
    // (`BodierLikeClassOrObject.java:225-229`) and the empty-but-shown
    // placeholder is `TextBlockEmpty(10, 16)` inside a bare
    // `TextBlockLineBefore` (`EntityImageObject.java:110-113`) -- neither is
    // a `TextBlockMarged`. See `class-ink-box.ts#addRectInk`.
    bodyInkWidth: showFields && !emptyFieldPlaceholder ? fieldsDim.width : 0,
  };
}

/**
 * Measure an `object` leaf (EntityImageObject#calculateDimensionSlow).
 *
 * @param suppressMemberSection - mapped to upstream's `showFields == false`
 *   (the "hide members" / "hide empty members" directives, same flag
 *   `measureClassifier` already threads through for every other kind).
 */
export function measureObjectClassifier(
  classifier: Classifier,
  theme: Theme,
  measurer: StringMeasurer,
  suppressMemberSection: boolean,
  // G3/O4: threaded through to `measureEnhancedBody`'s `EnhancedLayoutCtx`
  // (an enhanced-body member row may carry a `<$sprite>`/img atom, same as
  // class's own wiring, `class-layout-helpers.ts#measureClassifier`'s own
  // call site) -- absent for every hand-built test geometry that bypasses
  // `measureClassifier` (zero behavior change, `buildMemberRow`'s own
  // `sprites?: SpriteRegistry` optionality).
  sprites?: SpriteRegistry,
): MeasuredClassifier {
  const { title, nameFontSizeOverride } = computeObjectTitle(classifier, theme, measurer);
  const showFields = !suppressMemberSection;

  // G3/O4: `BodierLikeClassOrObject#getBody`'s OBJECT branch ALWAYS routes
  // through `BodyFactory.create1` (`BodyEnhanced1`) when `showFields` --
  // the SAME renderer class uses ONLY when a separator/tree-list trigger
  // is present (`class-layout-helpers.ts`'s own `enhancedBody` doc
  // comment) -- see `ast.ts#Classifier.rawBodyLines`'s own G3/O4 doc
  // comment for why gating on `isEnhancedBody` (rather than always
  // routing through this engine, matching jar's literal structure) is
  // safe: the plain-content case is numerically IDENTICAL either way
  // (this port's own `measureObjectFields` was independently jar-derived
  // and verified against it since O0/O1), so gating avoids regressing the
  // already-verified common case while adding ONLY the separator/tree
  // capability. `fontSpec` here is the FIELD font (theme default) -- the
  // header override above is name-row-only, unrelated.
  const fontSpec = { family: theme.fontFamily, size: theme.fontSize };
  const enhancedBody =
    isEnhancedBody(classifier.rawBodyLines) && showFields
      ? measureEnhancedBody(classifier.rawBodyLines!, {
          fontSpec, measurer, sprites, baselineOffset: baselineOffsetFor(fontSpec, measurer), bodyTop: title.height,
        })
      : undefined;

  if (enhancedBody !== undefined) {
    return buildEnhancedObjectGeo({ classifier, theme, measurer, title, nameFontSizeOverride, enhancedBody });
  }

  return buildFieldBasedObjectGeo({ classifier, theme, measurer, showFields, title, nameFontSizeOverride });
}
