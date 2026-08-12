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
 *     char (-#~+) — verifies {@link OBJECT_SMALL_ICON}'s fixed per-block icon
 *     reserve (p1: 133.7125 x 82.0 px exact) AND (G3/O1) that the field-row
 *     baseline stride is exactly fontSize, independent of the icon reserve.
 * See this task's mission-brief return for the worked numbers. `map`'s own
 * verification fixtures (bepafe-03-teda035, diveje-52-xefe514) live in
 * ./class-map-sizing.ts's module doc.
 */

import type { Classifier, Member } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import type { ClassifierGeo } from './layout.js';
import type { MeasuredClassifier } from './class-layout-helpers.js';
import type { EnhancedBodyGeo } from './class-body-enhanced-layout.js';
import { isEnhancedBody } from './class-body-enhanced.js';
import { measureEnhancedBody } from './class-body-enhanced-layout.js';
import type { Dim } from './class-object-map-header.js';
import { titleDimension, measureStereo, headerRows, baselineOffsetFor } from './class-object-map-header.js';
import { floorAtMinimumWidth, objectBodyReportsPorts } from './class-object-map-sizing.js';
import { objectDisplayText, CANONICAL_OBJECT_SEPARATOR } from './class-object-display.js';
import { buildObjectMemberRow } from './class-object-member-creole.js';
import type { ObjectMemberRow } from './class-object-member-creole.js';
import { atomsToPlainText } from './class-member-creole.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { resolveStyleStereotypeTags } from './class-stereotype.js';
import type { FlatMemberRows } from './class-member-rows.js';

// ---------------------------------------------------------------------------
// Local interfaces (grouped at top — a declaration sitting between two
// functions gets mis-attributed to the preceding one's NLOC by lizard).
// ---------------------------------------------------------------------------


interface FieldsResult {
  dim: Dim;
  rows: ClassifierGeo['rows'];
  /** SI20 T1, publish-only: `visibleMembers`/`texts`/`builds`, already
   *  computed for `dim`/`rows` above, reshaped into `class-layout-generic-
   *  classifier.ts#buildNormalClassifierResult`'s `FlatMemberRows` shape --
   *  no new measurement. See {@link toFlatMemberRows}. */
  flat: FlatMemberRows;
}

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
/** MethodsOrFieldsArea#asBlockMemberImpl: `withMargin(this, 6, 4)`. */
const OBJECT_FIELD_MARGIN_X = 6;
const OBJECT_FIELD_MARGIN_Y = 4;
/** `TextBlockEmpty(10, 16)` — the "no fields but shown" placeholder box
 *  (EntityImageObject ctor, `fieldsToDisplay.size() == 0 && showFields`). */
const OBJECT_EMPTY_FIELDS: Dim = { width: 10, height: 16 };
/** EntityImageObject.xMarginCircle. */
const OBJECT_X_MARGIN_CIRCLE = 5;
/** BodierLikeClassOrObject#marginEmptyFieldsOrMethod — substituted only when
 *  the fields area is BOTH empty and shown. Unreachable in practice for
 *  object (the empty-fields branch above always yields height 16, never 0),
 *  ported anyway per this project's "port the awkward code too" discipline. */
const OBJECT_EMPTY_HEIGHT_FALLBACK = 13;
/**
 * `MethodsOrFieldsArea#calculateDimensionOnlyMembers`'s `smallIcon` term —
 * `skinParam.getCircledCharacterRadius() + 3`, added to the block's width
 * ONCE (not per row) whenever ANY visible member carries an explicit
 * visibility char (`hasSmallIcon()`). Upstream's default radius is
 * `FontParam.CIRCLED_CHARACTER`'s size (17) integer-divided by 3, plus 6:
 * `17/3 + 6 = 5 + 6 = 11`; `+3` -> 14. Verified against nukera-08-dige359's
 * p1 (four visibility-char member rows, all sharing the same post-strip
 * text): `107.7125 (text) + 14 (icon) + 12 (2*marginX) = 133.7125` px, the
 * oracle width exactly.
 * @see ~/git/plantuml/.../skin/SkinParam.java:542-545 (getCircledCharacterRadius)
 * @see ~/git/plantuml/.../klimt/font/FontParam.java:55 (CIRCLED_CHARACTER size 17)
 * @see ~/git/plantuml/.../cucadiagram/MethodsOrFieldsArea.java:125-138,155-157
 */
const OBJECT_SMALL_ICON = 14;

/**
 * G3/O4: `AtomText#getTabSize`/`tabString` -- the pixel width of ONE tab
 * stop, matching upstream's own quirky clamp: a configured `skinparam
 * tabSize N` in [1,6] uses N literal spaces; ANY other value (including
 * the upstream default 8, and `skinparam tabSize 20`) falls back to a
 * HARDCODED 8-space string regardless of N (`AtomText.java:258-264`'s own
 * `nb >= 1 && nb < 7` gate -- a genuine upstream quirk, ported faithfully
 * per this project's "port the awkward code too" discipline). When that
 * string measures to width 0 (`DeterministicMeasurer`'s width table has no
 * entry for the space glyph -- jar-verified), the tab stop becomes
 * `fontSize * 4` instead (`AtomText.java:272-274`'s own `width == 0`
 * fallback) -- jar-verified against `nufoju-44-dabi767` (`skinparam
 * tabSize 20`, 14pt font -> tab stop 56 = 14*4, NOT a function of the
 * configured `20` at all).
 */
function tabStopWidthPx(theme: Theme, measurer: StringMeasurer): number {
  const nb = theme.tabSize ?? 8;
  const spaces = nb >= 1 && nb < 7 ? ' '.repeat(nb) : '        ';
  const width = measurer.measure(spaces, { family: theme.fontFamily, size: theme.fontSize }).width;
  return width === 0 ? theme.fontSize * 4 : width;
}


/** Format a member text string for object diagram instances: the raw,
 *  visibility-stripped source line verbatim when present (upstream's
 *  `Member#getDisplay(false)` — `Bodier` never rejects a body line, see
 *  class-object-commands.ts#parseObjectField), else the structured
 *  `name = value` / bare `name` reconstruction for the two shapes this AST
 *  still parses eagerly. Exported: also used by tests constructing expected
 *  row text directly.
 *
 *  G3/O4: a literal `\t` (backslash + 't', TWO source chars -- `skinparam
 *  tabSize`'s own trigger, `nufoju-44-dabi767`) is unescaped to a REAL tab
 *  byte (U+0009) here, mirroring `Display.getWithNewlines`'s own `c2 ==
 *  't'` branch (`Display.java:302-304`, `current.append('\t')`) -- the
 *  GENERIC backslash-escape site every Display-backed text line (title/
 *  caption/legend/member) routes through upstream. Scoped to ONLY the `\t`
 *  escape (not the full `\n`/`\r`/`\l`/`\\` family Display.java also
 *  handles) -- no corpus object-field fixture exercises the others, and
 *  `\n` specifically has NO meaning inside a single already-newline-split
 *  field line. `layoutTabRuns` (above) consumes the resulting real tab
 *  byte via `AtomText#drawU`'s own tokenizer shape. */
export function formatObjectMemberText(
  member: Pick<Member, 'name' | 'type' | 'rawDisplay' | 'typeSeparator'>,
): string {
  const raw =
    member.rawDisplay !== undefined
      ? member.rawDisplay
      : member.type !== undefined
        ? `${member.name}${member.typeSeparator ?? CANONICAL_OBJECT_SEPARATOR}${member.type}`
        : member.name;
  return raw.includes('\\t') ? raw.replace(/\\t/g, '\t') : raw;
}

/** BodierLikeClassOrObject#getMethodOrFieldHeight (OBJECT branch). */
function methodOrFieldHeight(fieldsHeight: number, showFields: boolean): number {
  return fieldsHeight === 0 && showFields ? OBJECT_EMPTY_HEIGHT_FALLBACK : fieldsHeight;
}

/** SI20 T1, publish-only: reshapes already-computed `visibleMembers`/
 *  `texts`/`builds` into `buildNormalClassifierResult`'s `FlatMemberRows`
 *  shape -- no new measurement. `ObjectMemberRow.runs[].atom` unwraps into
 *  `MemberRowBuild.atoms` (`x` is run-only, unused by `toPortCompartments`,
 *  which reads only `.height`). */
function toFlatMemberRows(
  members: Classifier['members'],
  texts: string[],
  builds: readonly ObjectMemberRow[],
): FlatMemberRows {
  return {
    members,
    texts,
    builds: builds.map((b) => ({ atoms: b.runs.map((r) => r.atom), width: b.width, height: b.height })),
  };
}

/**
 * MethodsOrFieldsArea (via BodyFactory.create1 -> BodyEnhanced1 -> a single
 * buildTextBlock, since object field lines never contain a block separator/
 * tree/table): one row per visible member, width = widest row + 2*marginX
 * (+ {@link OBJECT_SMALL_ICON} once, when any row has an explicit visibility
 * char — `MethodsOrFieldsArea#hasSmallIcon`), height = sum(rowHeights) +
 * 2*marginY. Every row's TEXT indent shifts by the same icon reserve when
 * `hasIcon` is true, even for a row with no modifier of its own — upstream's
 * `PlacementStrategyVisibility` reserves that column uniformly across the
 * whole block (a modifier-less row just draws nothing in it,
 * `getUBlock(null, ...)`). Falls back to the empty-fields placeholder / a
 * zero box per BodierLikeClassOrObject#getBody's OBJECT branch (see file doc
 * for the exact showFields/hasMembers matrix).
 *
 * G3/O1: each row's baseline is `OBJECT_FIELD_MARGIN_Y + i*fontSize +
 * baselineOffset` (the SAME "ascent-from-row-top" convention as
 * `headerRows` in ./class-object-map-header.ts, one row-height stride per
 * index `i`) -- NOT the pre-O1 half-height guess (`i*fontSize +
 * fontSize/2`), which only coincided with jar for a font with zero descent
 * (never, for real text). Every row also carries its OWN raw text width
 * for `textLength` (rounded at emission, `core/svg.ts`) -- jar-verified
 * against figeze-77-fozi735's
 * "user" (`name = "Dummy"` -> 101.4125, `id = 123` -> 42.525, visibly
 * DIFFERENT per-row values, ruling out a shared-block-width hypothesis) and
 * nukera-08-dige359's p1 (4 identical-text visibility-icon rows, baseline
 * stride unperturbed by the icon reserve).
 */
function measureObjectFields(
  classifier: Classifier,
  theme: Theme,
  measurer: StringMeasurer,
  showFields: boolean,
): FieldsResult {
  const visibleMembers = classifier.members.filter((m) => m.hidden !== true);
  if (!showFields) return { dim: { width: 0, height: 0 }, rows: [], flat: toFlatMemberRows([], [], []) };
  if (visibleMembers.length === 0) return { dim: OBJECT_EMPTY_FIELDS, rows: [], flat: toFlatMemberRows([], [], []) };

  const fontSpec = { family: theme.fontFamily, size: theme.fontSize };
  const texts = visibleMembers.map(formatObjectMemberText);
  // G3/O4: `\t` characters (`skinparam tabSize`) split a line into
  // multiple independently-positioned text runs -- see `layoutTabRuns`'s
  // own doc comment. `tabStopWidthPx` is computed once per block (font-
  // dependent only, not per-row).
  const tabStopPx = tabStopWidthPx(theme, measurer);
  // Member rows are CREOLE lines upstream (`MethodsOrFieldsArea
  // #createTextBlock`, java:238-265, `CreoleMode.SIMPLE_LINE`), with tab
  // stops expanded inside the resulting text atoms rather than instead of
  // them -- see `class-object-member-creole.ts`.
  const font: FontConfiguration = {
    family: fontSpec.family, size: fontSpec.size, color: null, styles: new Set(),
  };
  const builds = texts.map((t) => buildObjectMemberRow(t, font, measurer, tabStopPx));
  const widths = builds.map((b) => b.width);
  const hasIcon = visibleMembers.some((m) => m.visibilityExplicit === true);
  const iconReserve = hasIcon ? OBJECT_SMALL_ICON : 0;
  const textIndent = OBJECT_FIELD_MARGIN_X + iconReserve;
  const width = Math.max(...widths) + iconReserve + OBJECT_FIELD_MARGIN_X * 2;
  // Sum of each row's OWN height, not `count * fontSize`:
  // `MethodsOrFieldsArea#calculateDimensionOnlyMembers` advances
  // `y += dim.getHeight()` per member (java:161-166). A plain text row's
  // height equals the font size, so text-only bodies are unchanged.
  const height = builds.reduce((a, b) => a + b.height, 0) + OBJECT_FIELD_MARGIN_Y * 2;
  const baselineOffset = baselineOffsetFor(fontSpec, measurer);
  const rows: ClassifierGeo['rows'] = [];
  let rowTop = OBJECT_FIELD_MARGIN_Y;
  builds.forEach((build, i) => {
    const y = rowTop + baselineOffset;
    rowTop += build.height;
    build.runs.forEach(({ atom, x }, runIndex) => {
      rows.push({
        text: atomsToPlainText([atom]),
        atoms: [atom],
        y,
        indent: textIndent + x,
        width: atom.width,
        // G3/O4: `visibilityIsField: true` UNCONDITIONALLY -- upstream's
        // `BodierLikeClassOrObject#getFieldsToDisplay` OBJECT branch
        // constructs EVERY member via `Member.field(s)` (never `Member
        // .method(s)`, regardless of the text looking method-like, e.g.
        // `getName()`), so `MethodsOrFieldsArea`'s own icon-fill derivation
        // (`modifier.isField()`, baked in at Member-construction time, NOT
        // a dynamic per-row check) is ALWAYS true for an object field --
        // `class-visibility-icon.ts#isFilled`'s own `!memberIsField` rule
        // therefore ALWAYS resolves to stroke-only (`fill="none"`) for
        // object rows, regardless of the visibility char -- jar-verified
        // `xuvesu-44-laru205` (`+`/`-` icons both `fill="none"`, `PUBLIC_
        // FIELD`/`PRIVATE_FIELD` data-attributes, never `_METHOD`). Absent
        // pre-O4, `row.visibilityIsField === true` evaluated false for
        // every object row, incorrectly filling `+` icons like a method.
        ...(runIndex === 0 && visibleMembers[i]!.visibilityExplicit === true
          ? { visibilityIcon: visibleMembers[i]!.visibility, visibilityIsField: true as const }
          : {}),
      });
    });
  });
  return { dim: { width, height }, rows, flat: toFlatMemberRows(visibleMembers, texts, builds) };
}

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
