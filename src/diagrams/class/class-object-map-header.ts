/**
 * Header-row math (name + optional stereotype, stacked, centered) SHARED by
 * object/map/json (`kind:'object'`) leaves in the class diagram layout engine
 * (./layout.ts). Split out of ./class-object-map-sizing.ts (which now holds
 * only the `object`-specific field/body sizing) to keep both files under the
 * repo's 500-line-per-file cap and every function under the CCN/NLOC caps —
 * same motivation as the earlier G3/O1 class-map-sizing.ts split noted in
 * that file's own module doc.
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
 *     stereotype/fields (dimTitle only, both nodes).
 *   - test-results/dot-cache/object/majake-62-pero492 — object with/without 1
 *     stereotype + 1 field (stereo line HEIGHT only — no fixture in the
 *     corpus has a stereo-dominant WIDTH, so the guillemet-wrapped stereo
 *     WIDTH formula below is a faithful port but numerically unverified).
 *   - oracle/goldens/object/nukera-08-dige359 — verifies (G3/O1) that the
 *     field-row baseline stride in ./class-object-map-sizing.ts is
 *     independent of this file's header math (icon reserve doesn't perturb
 *     it) — see that file's own module doc for the field-row-specific
 *     fixtures (figeze-77-fozi735, nukera-08-dige359).
 * `map`'s own verification fixtures (bepafe-03-teda035, diveje-52-xefe514)
 * live in ./class-map-sizing.ts's module doc.
 *
 * `titleDimension`/`measureStereo`/`headerRows`/`baselineOffsetFor` are
 * exported — `object` (./class-object-map-sizing.ts), `map`
 * (./class-map-sizing.ts) and `json` (class-json-sizing.ts) share the SAME
 * header formula as EntityImageObject (name margin 2,2 + optional italic
 * stereotype line, both centered and stacked) and the SAME "ascent-from-
 * row-top" baseline convention for their OWN data rows, so all three reuse
 * these helpers rather than duplicating the math a second/third time.
 */

import type { Classifier } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer, FontSpec } from '../../core/measurer.js';
import type { ClassifierGeo } from './layout.js';
import { javaRound4 } from '../../core/number-format.js';
import { splitStereotypeLabels, measureStereoLabelWidths } from './class-stereotype.js';

// ---------------------------------------------------------------------------
// Local interfaces (grouped at top — a declaration sitting between two
// functions gets mis-attributed to the preceding one's NLOC by lizard).
// ---------------------------------------------------------------------------

export interface Dim {
  width: number;
  height: number;
}

/** Bundles {@link buildUnderlinedNameRows}'s font/measurer/override args —
 *  introduced solely to keep that function's param count under the file's
 *  cap; the fields are the exact same values the pre-split positional
 *  params carried, zero behavior change. */
interface UnderlinedNameContext {
  fontSpec: FontSpec;
  measurer: StringMeasurer;
  fontSizeOverride?: number | undefined;
}

/** Bundles {@link headerRows}'s box-layout args — introduced solely to keep
 *  that function's param count under the file's cap; the fields are the
 *  exact same values the pre-split positional params carried, zero
 *  behavior change. */
export interface HeaderRowsOptions {
  boxWidth: number;
  namePadding: number;
  /** G3/O4: `skinparam style strictuml` -- OBJECT kind only
   *  (`buildUnderlinedNameRows`'s own doc comment); map/json callers never
   *  pass `true` (`EntityImageMap`/`Json` never call `underlinedName()`,
   *  jar-verified). Defaults to `false`. */
  underlineName?: boolean | undefined;
  /** G3/O4: `<style> <sname> { header { FontSize N } } }` -- the CALLER
   *  resolves this (it also feeds `nameDim`/`title.width`, upstream of
   *  `headerRows`'s own `boxWidth` field -- `measureObjectClassifier`'s own
   *  doc comment) and passes it through so the name row's OWN width/
   *  baseline use the SAME size the caller already measured with, rather
   *  than re-deriving it here. */
  nameFontSizeOverride?: number | undefined;
}

/** Result of {@link buildStereoHeaderRows} — the stacked stereotype row(s)
 *  plus their total block height (feeds the name row's own `y`). */
interface StereoHeaderRowsResult {
  rows: ClassifierGeo['rows'];
  stereoHeight: number;
}

/** FontParam.OBJECT_STEREOTYPE's hardcoded size (12, italic) — shared by
 *  EntityImageObject and EntityImageMap; independent of theme.fontSize. */
const STEREO_FONT_SIZE = 12;

/** Guillemet.GUILLEMET (`«`/`»`) — upstream's default wrapping when
 *  no `skinparam guillemet` override is configured. */
function wrapGuillemet(label: string): string {
  return `«${label}»`;
}

/**
 * `fontSize - measurer.getDescent(fontSpec, text)` — the "ascent-from-
 * line-top" baseline convention every class text row uses
 * (`class-layout-helpers.ts`'s own `baselineOffset`, `headerRows` below,
 * `class-namespace-shape.ts#getTitleBaselineOffset`). Every {@link
 * StringMeasurer} implementation's `getDescent` is content-independent
 * (ignores its `text` argument — `core/measurer.ts`'s own doc comment), so
 * this is safe to compute ONCE per (fontFamily, fontSize) and reuse across
 * every row in a block, rather than re-deriving it per row. Exported for
 * ./class-map-sizing.ts's own data-row baseline (G3/O1).
 */
export function baselineOffsetFor(fontSpec: FontSpec, measurer: StringMeasurer): number {
  return fontSpec.size - measurer.getDescent(fontSpec, '');
}

/** EntityImageObject/Map#getNameAndSteretypeDimension: width = max of the two
 *  (both already margin-padded by the caller), height = sum (stacked). */
export function titleDimension(nameDim: Dim, stereoDim: Dim): Dim {
  return { width: Math.max(nameDim.width, stereoDim.width), height: nameDim.height + stereoDim.height };
}

/**
 * The (un-padded) stacked stereotype BLOCK dimension, zero when absent --
 * mirrors upstream's `stereoDim = new XDimension2D(0, 0)` fallback. No
 * margin is applied to the stereo TextBlock in either EntityImageObject or
 * EntityImageMap (unlike the name block, which gets a style/fixed margin).
 *
 * G3/O2: `classifier.stereotype` carries the RAW, possibly multi-bracket
 * blob the parser's own greedy-regex-collision quirk captures for stacked
 * stereotypes (`object X <<Bar>> <<Foo>>` -> `"Bar>> <<Foo"`,
 * `class-object-stacked-stereo.test.ts`'s own doc comment) -- split via
 * {@link splitStereotypeLabels} (the SAME helper `class-stereotype.ts
 * #buildStereoRows` already uses for CLASS) into one label per stacked
 * line: width = the WIDEST individual label (each line centers against
 * boxWidth independently, {@link headerRows} below), height = `labels.length
 * * STEREO_FONT_SIZE` (one stacked line per label, `Stereotype#getLabels()`'s
 * own shape) -- jar-verified `fafozi-27-reja300`'s node2 (`<<Bar>> <<Foo>>`,
 * no fields): box height 58 = stereoHeight(24, 2 lines) + nameHeight(18) +
 * fieldsHeight(16, OBJECT_EMPTY_FIELDS).
 */
export function measureStereo(classifier: Classifier, theme: Theme, measurer: StringMeasurer): Dim {
  // G3/O4: `hide <object|...> stereotypes` (`EntityPortion.STEREOTYPE`,
  // `CucaDiagram#showPortion`) -- object/map/json ONLY consult this flag
  // (`ast.ts#Classifier.hideStereotype`'s own doc comment); jar-verified
  // `kocupi-02-ripa662`.
  if (classifier.stereotype === undefined || classifier.hideStereotype === true) return { width: 0, height: 0 };
  const labels = splitStereotypeLabels(classifier.stereotype);
  if (labels.length === 0) return { width: 0, height: 0 };
  const widths = measureStereoLabelWidths(labels, theme.fontFamily, measurer, undefined, STEREO_FONT_SIZE);
  return { width: Math.max(...widths), height: labels.length * STEREO_FONT_SIZE };
}

/**
 * G3/O4: `Display#underlinedName`'s split pattern (`Display.java:468`) --
 * matches ONLY up to the FIRST colon: group1 excludes ':' entirely (so it
 * can only end right before the first colon encountered), group2's `\s*`
 * backtracks to absorb any trailing whitespace group1 would otherwise
 * capture. `null` when the display has no colon at all (the whole-name-
 * underlined case, `firstObject` in `jotaga-99-fatu830`).
 */
const INSTANCE_NAME_TYPE_PATTERN = /^([^:]+?)(\s*:.+)$/;

/**
 * G3/O4: `EntityImageObject#getUnderlinedName` -- `skinparam style
 * strictuml`'s UML instance-notation convention. No colon: the WHOLE name
 * draws underlined, one row. With a colon: the name splits into TWO
 * ADJACENT runs sharing the SAME row `y` -- the name portion (underlined)
 * at `indent`, the `: type` portion (plain, LEADING whitespace stripped --
 * jar's own rendered `<text>` never carries it, `jotaga-99-fatu830`'s own
 * `": type"` citation) immediately following at `indent + nameRawWidth`
 * (raw, unrounded -- matches this file's own "round once for textLength,
 * reuse raw for position math" convention, `headerRows`'s own stereo-row
 * precedent). `indent` is the CALLER's already-centered offset for the
 * COMBINED block (both runs together occupy the same span the un-split
 * name would have) -- jar-verified `jotaga-99-fatu830`'s `o2`: full-name
 * width 117.425 == "instance name" (87.15) + " : type" (30.275) exactly,
 * so splitting never perturbs the block's own centering math.
 *
 * `ctx` bundles the trailing font/measurer/override args (see {@link
 * UnderlinedNameContext}) solely to keep this function's param count under
 * the file's cap — same values the pre-split positional params carried.
 */
function buildUnderlinedNameRows(
  display: string,
  y: number,
  indent: number,
  // G3/O4: `<style> object { header { FontSize N } } }` -- `fcHeader`'s
  // OWN FontConfiguration wraps the WHOLE underlined-name TextBlock
  // (`EntityImageObject.java:98`, `getUnderlinedName(entity).create(fcHeader,
  // ...)`), so BOTH split runs (name + type suffix) carry the SAME override
  // when set -- unverified in combination (no corpus fixture combines
  // strictuml + header FontSize), but the most defensible reading of the
  // single-FontConfiguration construction above.
  ctx: UnderlinedNameContext,
): ClassifierGeo['rows'] {
  const { fontSpec: nameFontSpec, measurer, fontSizeOverride } = ctx;
  const fontSizeField = fontSizeOverride !== undefined ? { fontSize: fontSizeOverride } : {};
  const match = INSTANCE_NAME_TYPE_PATTERN.exec(display);
  if (match === null) {
    return [
      {
        text: display, y, indent,
        width: measurer.measure(display, nameFontSpec).width,
        underline: true,
        ...fontSizeField,
      },
    ];
  }
  const namePart = match[1]!;
  const typePart = match[2]!.replace(/^\s+/, '');
  const nameRawWidth = measurer.measure(namePart, nameFontSpec).width;
  const typeRawWidth = measurer.measure(typePart, nameFontSpec).width;
  return [
    { text: namePart, y, indent, width: nameRawWidth, underline: true, ...fontSizeField },
    { text: typePart, y, indent: indent + nameRawWidth, width: typeRawWidth, ...fontSizeField },
  ];
}

/**
 * Builds the stacked, guillemet-wrapped stereotype row(s) for {@link
 * headerRows} — each line centers against `boxWidth` independently using
 * its OWN raw width (not a shared block width), per {@link measureStereo}'s
 * own doc comment for the split mechanism and the `fafozi-27-reja300` jar
 * citation. `getDescent` is content-independent (every {@link
 * StringMeasurer} implementation, `baselineOffsetFor`'s own doc comment),
 * so the baseline offset is computed once and reused per stacked line.
 * G3/O4: `hide <kind> stereotypes` -- suppresses every stacked label line
 * identically to "no stereotype at all" for header-row PURPOSES (the raw
 * `classifier.stereotype` string itself is untouched -- only rendering
 * skips it). Split out of `headerRows` solely to keep that function under
 * the file's NLOC cap; no behavior change.
 */
function buildStereoHeaderRows(
  classifier: Classifier,
  theme: Theme,
  measurer: StringMeasurer,
  boxWidth: number,
): StereoHeaderRowsResult {
  const stereoFontSpec = { family: theme.fontFamily, size: STEREO_FONT_SIZE };
  const stereoLabels =
    classifier.stereotype === undefined || classifier.hideStereotype === true
      ? []
      : splitStereotypeLabels(classifier.stereotype);
  const stereoWidths = measureStereoLabelWidths(stereoLabels, theme.fontFamily, measurer, undefined, STEREO_FONT_SIZE);
  const stereoBaselineOffset = STEREO_FONT_SIZE - measurer.getDescent(stereoFontSpec, '');
  const rows: ClassifierGeo['rows'] = stereoLabels.map((label, i) => {
    const width = stereoWidths[i]!;
    return {
      text: wrapGuillemet(label),
      y: i * STEREO_FONT_SIZE + stereoBaselineOffset,
      indent: (boxWidth - width) / 2,
      italic: true,
      width,
      fontSize: STEREO_FONT_SIZE,
    };
  });
  return { rows, stereoHeight: stereoLabels.length * STEREO_FONT_SIZE };
}

/**
 * Header rows shared by object/map/json: stereo (italic, if present) stacked
 * above the name, BOTH horizontally centered within the classifier's FINAL
 * content width -- `EntityImageObject#getLayout` builds a `ULayoutGroup`
 * (`PlacementStrategyY1Y2`) over `[stereo?, name]` and draws it via
 * `header.drawU(ug, dimTotal.getWidth(), dimTitle.getHeight())`;
 * `PlacementStrategyY1Y2#getPositions` centers EVERY block at
 * `x = (width - blockWidth) / 2` (klimt/geom/PlacementStrategyY1Y2.java) --
 * `width` there is `dimTotal.getWidth()`, the classifier's FULL final box
 * width (post `Math.max(fieldsWidth, title.width + 2*marginCircle)`), NOT
 * `title.width` alone -- so `boxWidth` here must be the caller's already-
 * computed FINAL width, not a value derivable from this function's own
 * inputs (G3/O0, jar-verified against 6 samples spanning all three kinds:
 * `niloru-34-nuve651`/`pagidu-67-doxa131`/`sobosi-40-xuda813`/
 * `vozomu-86-rodo657` (plain object, no stereo), `majake-62-pero492`'s
 * `foo3` + `fafozi-27-reja300`'s `node2` (object with stereotype/stacked
 * stereotypes), `bepafe-03-teda035`'s `CapitalCity` (map) and `A` (json) --
 * every sample's `<text x>` matches `boxWidth`-centered exactly; the
 * PRE-O0 code centered against nothing (`indent: 0`, flush-left) and never
 * set `width` at all (jar always emits `lengthAdjust`/`textLength` on both
 * rows -- `renderRowText`'s own `row.width !== undefined` gate, this
 * function's own prior doc comment already noted the omission was
 * inherited, not deliberate).
 *
 * The name TextBlock is drawn `TextBlockUtils.withMargin(tmp, padding)` --
 * the raw name text is itself CENTERED within that padded block
 * (`HorizontalAlignment.CENTER`), so with a symmetric `namePadding` the
 * block-level centering (against `nameWidth + 2*namePadding`) and the
 * inner-block centering compose to exactly `(boxWidth - nameWidth) / 2` for
 * `indent` -- algebraically identical, verified directly against the raw
 * (unpadded) `nameWidth`/`stereoWidth` this function already measures for
 * `textLength`. The stereo TextBlock carries NO margin (this function's own
 * pre-O0 doc comment, unchanged), so its indent uses the SAME formula
 * against its own raw width with no padding term.
 *
 * Vertical stacking uses the SAME "ascent-from-line-top" `baselineOffset =
 * fontSize - measurer.getDescent(fontSpec, text)` convention every other
 * class text row uses (`class-layout-helpers.ts`'s own `baselineOffset`,
 * `class-namespace-shape.ts#getTitleBaselineOffset`) -- the stereo row (no
 * margin) draws at `y = stereoBaselineOffset` (its own 12pt
 * `STEREO_FONT_SIZE`); the name row draws BELOW it at `y = stereoH +
 * namePadding + nameBaselineOffset` (`namePadding` accounts for the name
 * block's own top margin the stereo row never had) -- jar-verified: EVERY
 * sample's name-row `y` equals `stereoH + namePadding + (fontSize -
 * descent)` exactly, and the stereo row's `y` (when present) equals
 * `STEREO_FONT_SIZE - descent(12pt)` exactly.
 *
 * `namePadding` is caller-supplied (not a shared constant here) because
 * object/map/json each define their OWN "coincidentally-equal-but-
 * independently-named" margin literal (`OBJECT_NAME_PADDING`,
 * `class-map-sizing.ts`'s `MAP_NAME_MARGIN`, `class-json-sizing.ts`'s
 * `JSON_NAME_MARGIN` -- all `2`, per each file's own doc-comment precedent
 * for NOT sharing a single named constant across files for a coincidental
 * numeric match).
 *
 * G3/O1 landed the SAME missing-`width`/wrong-baseline fix for object FIELD
 * rows (`class-object-map-sizing.ts#measureObjectFields`), map DATA rows
 * (`class-map-sizing.ts#buildMapRowGeo`), and json entry rows
 * (`class-json-sizing.ts#buildJsonRows`) — a related but functionally
 * separate mechanism from this function's own header fix (different padding
 * constants, variable per-row heights for map/json, and — map-specific — a
 * CENTER-vs-LEFT alignment split between the key and value columns that
 * this header function's own single-column centering does not need). See
 * those functions' own doc comments for the per-mechanism formulas.
 *
 * Does NOT thread a per-classifier `<style>`/`<<tag>>`-cascade FontSize
 * override (`skinparam object { FontSize }` / `<<tag>> { FontSize }`) --
 * that cascade is entirely unbuilt for object/map/json kinds (unlike the
 * generic class header's `row.fontSize`, N23/N32) and is its own separate,
 * larger, unbuilt feature (jar-verified absent via `tenalu-53-meri239`,
 * which combines this gap with the centering bug and was excluded from
 * this fix's own verification set for exactly that reason).
 *
 * `options` bundles the box-layout args (see {@link HeaderRowsOptions})
 * solely to keep this function's param count under the file's cap — same
 * values the pre-split positional params carried, zero behavior change.
 */
export function headerRows(
  classifier: Classifier,
  theme: Theme,
  measurer: StringMeasurer,
  options: HeaderRowsOptions,
): ClassifierGeo['rows'] {
  const { boxWidth, namePadding, underlineName = false, nameFontSizeOverride } = options;
  const nameFontSpec = { family: theme.fontFamily, size: nameFontSizeOverride ?? theme.fontSize };
  const { rows, stereoHeight } = buildStereoHeaderRows(classifier, theme, measurer, boxWidth);
  const nameWidth = javaRound4(measurer.measure(classifier.display, nameFontSpec).width);
  const nameBaseline = nameFontSpec.size - measurer.getDescent(nameFontSpec, classifier.display);
  const nameY = stereoHeight + namePadding + nameBaseline;
  const nameIndent = (boxWidth - nameWidth) / 2;
  if (underlineName) {
    rows.push(
      ...buildUnderlinedNameRows(classifier.display, nameY, nameIndent, {
        fontSpec: nameFontSpec,
        measurer,
        fontSizeOverride: nameFontSizeOverride,
      }),
    );
  } else {
    rows.push({
      text: classifier.display, y: nameY, indent: nameIndent, width: nameWidth,
      ...(nameFontSizeOverride !== undefined ? { fontSize: nameFontSizeOverride } : {}),
    });
  }
  return rows;
}
