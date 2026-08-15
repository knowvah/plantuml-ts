/**
 * class-namespace-shape.ts — G2 N17: the package/namespace folder-tab
 * outline (`USymbolFolder`'s tab-notch shape, `core/decoration/symbol/
 * USymbolFolder.ts#folderPath`/`getWTitle`/`getHTitle`) wired into class's
 * plain-SVG-string render path.
 *
 * REUSE, not re-port: `USymbolFolder.ts`'s shape geometry (arc formula,
 * `marginTitleX1/X2/X3`/`Y1/Y2` constants) is already ported and
 * jar-verified for description's `Cluster`/`ClusterDecoration` (`asBig`,
 * the SAME group/cluster draw path upstream's own `Cluster#drawU` uses for
 * `package X { ... }`). Class's renderer draws every element as a plain SVG
 * string (`core/svg.ts` primitives), never through a `UGraphic` — mirroring
 * `note-opale.ts`'s established precedent, this module re-expresses the
 * SAME verified geometry as pure functions over plain numbers instead of
 * adopting the klimt `UGraphic`/`TextBlock` machinery wholesale (see
 * `renderer-group.ts`'s own doc comment for the identical rationale).
 *
 * Upstream: `decoration/symbol/USymbolFolder.java#asBig`/`drawFolder`
 * (dispatched via `svek/ClusterDecoration.java#getTextBlock` ->
 * `USymbolFolder#asBig`, the group/cluster draw path — NOT `asSmall`,
 * which is the unrelated `folder X`/`package X` LEAF-entity notation).
 *
 * Scope (G2 N17, jar-verified against `finono-05-cuvu171`, `jinibe-02-
 * tebi269`, `pecabi-95-demu756`, `pixexi-81-sete111`): the DEFAULT
 * rounded-corner tab (`roundCorner=5`, `USymbolFolder#asBig`'s `UPath`
 * branch) only. Two upstream variants are deliberately NOT modeled this
 * iteration (named remainders, `plans/g2-class-svg/ledger.md` N17):
 *   - `skinparam style strictuml` (`roundCorner=0`, the sharp-corner
 *     `UPolygon` branch, jar-verified present via `jinibe-02-tebi269`'s own
 *     `<polygon>` output) — class has no `strictUmlStyle`/`packageStyle`
 *     skinparam threading at all yet (same gap `renderer-cluster.ts`'s own
 *     `isFolderStyled`/`buildStyleDefaults` cover for description, not
 *     ported to class).
 *   - `skinparam packageStyle rect|frame|node|...` (a DIFFERENT `USymbol`
 *     entirely, e.g. a plain unnotched rounded rect — jar-verified via
 *     `mucuxi-36-beku683`) — same unmodeled skinparam gap.
 */
import type { StringMeasurer, FontSpec } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';
import type { NamespaceGeo } from './layout.js';
import { path, line, text, rect } from '../../core/svg.js';
import { isTransparentColor } from '../../core/paint.js';
import { measureStereoLabelWidths, stereoBlockDim } from './class-stereotype.js';
import { folderPathD, folderPolygonPoints, renderFolderPolygon } from './class-namespace-folder-outline.js';

// marginTitleX1/X2/X3/Y1/Y2 — upstream's own field names
// (USymbolFolder.java), kept verbatim per this project's porting
// discipline (mirrors `USymbolFolder.ts`'s identical constants).
const MARGIN_TITLE_X1 = 3;
const MARGIN_TITLE_X2 = 3;
const MARGIN_TITLE_X3 = 7;
const MARGIN_TITLE_Y1 = 3;
const MARGIN_TITLE_Y2 = 3;

/** `USymbolFolder#asBig`'s unstyled default `roundCorner` — jar-verified
 *  identical to every OTHER container's default (`A2.5,2.5`/`A3.75,3.75`
 *  arcs, `half = roundCorner/2`), matching description's own G1 I10
 *  finding (`renderer-cluster.ts#NON_FOLDER_ROUND_CORNER`). `skinparam
 *  style strictuml` (roundCorner=0) is NOT modeled — see module doc
 *  comment. */
export const PACKAGE_ROUND_CORNER = 5;

/** Jar-observed default class-diagram package/namespace border width
 *  (`stroke-width:1.5`, e.g. `finono-05-cuvu171`, `jinibe-02-tebi269`) —
 *  matches description's own `CLUSTER_STROKE_WIDTH` for folder-styled
 *  containers (`renderer-cluster.ts`). */
export const PACKAGE_STROKE_WIDTH = 1.5;

/** `USymbolFolder.java`'s title-text font is always bold; `skinparam
 *  packageFontSize N` / `skinparam package { FontSize N }` overrides the
 *  diagram-wide `theme.fontSize` for the folder-tab title ONLY (G2 N18,
 *  jar-verified against `pixexi-81-sete111`: title font-size 40, the
 *  classifier's OWN member text stays the diagram default 14). Reads the
 *  SAME generic per-element bucket description's package/folder USymbol
 *  rendering already consumes (`colors.elements.package.fontSize`, G1
 *  I4b) rather than a class-local field -- both diagram types' package
 *  groups share upstream's one `Entity`/`FontParam.PACKAGE` mechanism
 *  (`abel/Entity.java`). */
function titleFont(theme: Theme): FontSpec {
  const size = theme.colors.elements?.package?.fontSize ?? theme.fontSize;
  return { family: theme.fontFamily, size, weight: 'bold' };
}

/** The folder-tab title's own text color -- `skinparam packageFontColor`/
 *  `skinparam package { FontColor ... }`, the SAME generic per-element
 *  bucket `titleFont` reads from (`renderer-symbol.ts#textFontColor`'s
 *  identical `typeof override !== 'string'` Gradient-guard precedent: the
 *  plain-SVG-string `text()` primitive has no gradient-fill path here
 *  either). Falls back to jar's true default `#000000`. */
function titleFontColor(theme: Theme): string {
  const override = theme.colors.elements?.package?.font;
  return typeof override === 'string' ? override : '#000000';
}

/**
 * G2 N59: package/namespace outline fill for a "no paint" background color
 * (`skinparam packagebackgroundcolor transparent`/`background`) -- jar's
 * REAL captured output emits the literal CSS keyword `fill="none"` for a
 * cluster's own outline shape (`ClusterDecoration`/`PackageStyle#drawU`'s
 * `Fashion` back-color argument, jar-verified against `mucuxi-36-beku683`'s
 * `<rect fill="none">`), NOT the generic `#00000000` hex this port's shared
 * `resolveColorToSvgHex` collapses a transparent color to for MOST other
 * shapes (`core/paint.ts#isTransparentColor`'s own doc comment). Scoped to
 * package/namespace outlines only -- no evidence this applies to any other
 * element family, so the shared helper is left untouched.
 */
function packageFillValue(color: string): string {
  return isTransparentColor(color) ? 'none' : color;
}

/**
 * `USymbolFolder#getHTitle`: the tab's own height — jar-verified via TWO
 * independent font sizes (`finono-05-cuvu171`/`jinibe-02-tebi269` at the
 * diagram default 14pt: htitle=20; `pixexi-81-sete111`'s `skinparam
 * package { FontSize 40 }`: htitle=46) — both reduce EXACTLY to
 * `measuredHeight + marginTitleY1 + marginTitleY2`, confirming the formula
 * (not a flat constant) even though `StringMeasurer.measure().height`
 * always returns the raw font size regardless of text content.
 */
export function getHTitle(measurer: StringMeasurer, theme: Theme, label: string): number {
  const dim = measurer.measure(label, titleFont(theme));
  if (dim.width === 0) return 10;
  return dim.height + MARGIN_TITLE_Y1 + MARGIN_TITLE_Y2;
}

/**
 * `USymbolFolder#getWTitle`: the tab's own width (title text width plus
 * X1/X2 margin), falling back to `max(30, width/4)` for an empty label —
 * jar-verified `titleWidth+6` exactly against `finono-05-cuvu171` ("foo",
 * textLength 19.425 -> wtitle 25.425) and `jinibe-02-tebi269` ("a",
 * textLength 7.7875 -> wtitle 13.7875).
 */
export function getWTitle(measurer: StringMeasurer, theme: Theme, label: string, width: number): number {
  const dim = measurer.measure(label, titleFont(theme));
  if (dim.width === 0) return Math.max(30, width / 4);
  return dim.width + MARGIN_TITLE_X1 + MARGIN_TITLE_X2;
}

/**
 * The title text's baseline Y offset from the namespace box's own top edge
 * -- `USymbolFolder#asBig` draws the title at local `(4, 2)`
 * (`title.drawU(ug.apply(new UTranslate(4, 2)))`); the SAME ascent-from-
 * line-top convention every other class text row uses
 * (`class-layout-helpers.ts`'s `baselineOffset`) resolves the glyph
 * baseline within that translated line. Computed at LAYOUT time (like
 * `getWTitle`/`getHTitle`) so the render phase never needs a
 * `StringMeasurer` of its own -- jar-verified against `finono-05-cuvu171`
 * (`y="18.8889"` = box-top 6 + 2 + 10.8889).
 *
 * T7 (`plans/namespace-cluster-box/`) considered deriving this from
 * `@knowvah/dot-engine`'s own placed `cluster.label` (the layout-computed
 * title-table reservation position, `ClusterGeometry.label`) instead of
 * this fixed `2`. NOT adopted: `class-geo-builders.ts#namespaceGeoFromBox`'s
 * own doc comment has the full mechanism (`USymbolFolder#asBig` draws at a
 * fixed local offset, independent of graphviz's title-table placement) and
 * the measured 333-matched-shape regression that confirmed it.
 */
export function getTitleBaselineOffset(measurer: StringMeasurer, theme: Theme, label: string): number {
  return 2 + theme.fontSize - measurer.getDescent(titleFont(theme), label);
}

// folderPathD / folderPolygonPoints / renderFolderPolygon moved to
// class-namespace-folder-outline.ts (T7b, file-length split -- see that
// module's own doc comment).

/**
 * Renders one namespace/package's folder-tab outline + title, matching
 * `USymbolFolder#asBig`'s draw order: outline path, then the hline under
 * the tab (`ug.apply(UTranslate.dy(htitle)).draw(ULine.hline(...))`), then
 * the bold title text at local `(4, 2)` (baseline resolved the SAME
 * ascent-from-line-top way every other class text row is, `class-layout-
 * helpers.ts`'s `baselineOffset` convention) — jar-verified byte-exact
 * against `finono-05-cuvu171`'s `<path>`/`<line>`/`<text>` triple.
 */
export function renderNamespaceFolder(geo: NamespaceGeo, theme: Theme): string {
  // G2 N18: `packageBorderThickness`/`packageFontSize`/`packageFontColor`
  // override the folder-specific defaults (`theme.ts`'s own doc comments) --
  // `fontSize` here previously read the DIAGRAM-WIDE `theme.fontSize`
  // unconditionally, a latent bug moot until this iteration threaded a
  // package-specific override (must match `titleFont`'s own resolution, or
  // `getHTitle`/`getWTitle`'s pre-computed `htitle`/`wtitle` would silently
  // disagree with the glyphs actually drawn here).
  const strokeWidth = theme.colors.graph.packageBorderThickness ?? PACKAGE_STROKE_WIDTH;
  const fontSize = theme.colors.elements?.package?.fontSize ?? theme.fontSize;
  const fontColor = titleFontColor(theme);
  // G2 N18: `skinparam style strictuml` selects the sharp-corner `UPolygon`
  // branch (`roundCorner=0`) instead of the default rounded-arc `UPath` --
  // `folderPolygonPoints`/`renderFolderPolygon`'s own doc comments.
  // G2 N59: `packageFillValue` maps a "no paint" background (skinparam
  // packagebackgroundcolor transparent/background) to jar's real literal
  // `fill="none"` -- see that helper's own doc comment.
  const fill = packageFillValue(theme.colors.graph.packageBackground);
  const outline = theme.strictUml === true
    ? renderFolderPolygon(
        folderPolygonPoints(geo.x, geo.y, geo.wtitle, geo.htitle, geo.width, geo.height),
        theme.colors.graph.packageBorder,
        strokeWidth,
        fill,
      )
    : path(
        folderPathD(geo.x, geo.y, geo.wtitle, geo.htitle, geo.width, geo.height, PACKAGE_ROUND_CORNER),
        { stroke: theme.colors.graph.packageBorder, strokeWidth, fill },
      );
  const hline = line(
    geo.x,
    geo.y + geo.htitle,
    geo.x + geo.wtitle + MARGIN_TITLE_X3,
    geo.y + geo.htitle,
    { stroke: theme.colors.graph.packageBorder, strokeWidth },
  );
  // G2 N18: jar's deterministic-text mode always emits `textLength`/
  // `lengthAdjust` on this title (matches every OTHER class text row,
  // `renderer-classifier-box.ts`'s identical convention) plus the RAW
  // numeric `font-weight="700"` (never the CSS keyword) -- pure arithmetic
  // from `wtitle` (no measurer needed at render time, matching this
  // module's "measure once, at layout time" architecture): `wtitle` is
  // ALWAYS `rawTextWidth + MARGIN_TITLE_X1 + MARGIN_TITLE_X2` for a
  // non-empty label (`getWTitle`'s own doc comment); the empty-label
  // fallback branch (`max(30, width/4)`) has no real text to stretch, so
  // textLength is omitted then, matching every other row's `row.width ===
  // undefined` skip convention.
  const titleTextLength = geo.label.length > 0 ? geo.wtitle - MARGIN_TITLE_X1 - MARGIN_TITLE_X2 : undefined;
  const label = text(geo.x + 4, geo.y + geo.baselineOffset, geo.label, {
    fontFamily: theme.fontFamily,
    fontSize,
    fontWeight: '700',
    fill: fontColor,
    ...(titleTextLength !== undefined ? { lengthAdjust: 'spacing' as const, textLength: titleTextLength } : {}),
  });
  return outline + hline + label;
  // #lizard forgives -- pre-existing (unchanged by A2s F-D): linear jar-verified draw sequence (G2 N17/N18); splitting would refactor faithfully-ported geometry mid-port.
}

/**
 * G2 N59: `skinparam packageStyle rect|rectangle` -- `PackageStyle
 * .RECTANGLE#asBig` (`decoration/symbol/USymbolRectangle.java`), NOT
 * `USymbolFolder#asBig` (`renderNamespaceFolder`'s own doc comment): a
 * plain outline (`URectangle`, no tab notch, no hline) with the title
 * CENTERED horizontally and NO stereotype offset -- `posTitle = (width -
 * rawTextWidth) / 2` (jar-verified against `mucuxi-36-beku683`: box
 * `x=7 width=48`, title `"a"` `x=27.1063`, `rawTextWidth=7.7875`,
 * `(48-7.7875)/2=20.10625` local -> `7+20.10625=27.10625` matches exactly).
 * The vertical baseline offset is the SAME `geo.baselineOffset`
 * `renderNamespaceFolder` uses -- jar-verified identical local Y (`12.8889`)
 * for BOTH styles, confirming the footprint/`topPad` formula
 * (`class-geo-builders.ts#buildNamespaceGeos`) is style-agnostic (only the
 * DRAWN shape differs, not the reserved box). `roundCorner` is always 0 here
 * -- the only corpus sample (`mucuxi-36-beku683`) carries `strictuml`, and
 * `Cluster.java:323-324`'s `rounded=0` override applies uniformly to every
 * `PackageStyle`, not just FOLDER; a non-strict `skinparam RoundCorner`
 * value for RECT is unmodeled (same established gap `PACKAGE_ROUND_CORNER`
 * already carries for FOLDER, see this module's own header doc comment).
 */
export function renderNamespaceRect(geo: NamespaceGeo, theme: Theme): string {
  const strokeWidth = theme.colors.graph.packageBorderThickness ?? PACKAGE_STROKE_WIDTH;
  const fontSize = theme.colors.elements?.package?.fontSize ?? theme.fontSize;
  const fontColor = titleFontColor(theme);
  const fill = packageFillValue(theme.colors.graph.packageBackground);
  const outline = rect(geo.x, geo.y, geo.width, geo.height, {
    stroke: theme.colors.graph.packageBorder,
    strokeWidth,
    fill,
  });
  if (geo.label.length === 0) return outline;
  const rawTextWidth = geo.wtitle - MARGIN_TITLE_X1 - MARGIN_TITLE_X2;
  const posTitle = (geo.width - rawTextWidth) / 2;
  const label = text(geo.x + posTitle, geo.y + geo.baselineOffset, geo.label, {
    fontFamily: theme.fontFamily,
    fontSize,
    fontWeight: '700',
    fill: fontColor,
    lengthAdjust: 'spacing' as const,
    textLength: rawTextWidth,
  });
  return outline + label;
}

/**
 * `EntityImageEmptyPackage#drawU`: draws the SAME `USymbolFolder#asBig`
 * folder-tab shape `renderNamespaceFolder` draws for a non-empty package's
 * cluster wrapper -- but resolved through a DIFFERENT style chain
 * (`EntityImageEmptyPackage#getStyleSignature`'s own `...package_,title`
 * selector, NOT the package/cluster border-color skinparam surface
 * `renderNamespaceFolder` itself reads) -- jar-verified this reduces to the
 * SAME defaults every OTHER classifier box uses (`theme.colors.border`,
 * stroke-width 0.5, `theme.colors.graph.classBackground`), NOT the
 * (thicker, `packageBorderColor`-overridable) real package-cluster
 * defaults (`cocube-46-tusu692`'s own `skinparam packageBorderColor blue`
 * does NOT recolor its empty-package leaf, confirming these are genuinely
 * separate style chains, not a shared cascade). `skinparam
 * packageBorderThickness`/`packageBorder*` overrides are NOT modeled here
 * (unconfirmed whether they apply at all -- no corpus sample carries both;
 * named remainder if a future sample contradicts this).
 */
export function renderEmptyPackageIcon(geo: NamespaceGeo, theme: Theme): string {
  const strokeWidth = 0.5;
  const border = theme.colors.border;
  const fill = theme.colors.graph.classBackground;
  const fontSize = theme.colors.elements?.package?.fontSize ?? theme.fontSize;
  const fontColor = titleFontColor(theme);
  const outline = theme.strictUml === true
    ? renderFolderPolygon(
        folderPolygonPoints(geo.x, geo.y, geo.wtitle, geo.htitle, geo.width, geo.height),
        border, strokeWidth, fill,
      )
    : path(
        folderPathD(geo.x, geo.y, geo.wtitle, geo.htitle, geo.width, geo.height, PACKAGE_ROUND_CORNER),
        { stroke: border, strokeWidth, fill },
      );
  const hline = line(
    geo.x, geo.y + geo.htitle,
    geo.x + geo.wtitle + MARGIN_TITLE_X3, geo.y + geo.htitle,
    { stroke: border, strokeWidth },
  );
  const titleTextLength = geo.label.length > 0 ? geo.wtitle - MARGIN_TITLE_X1 - MARGIN_TITLE_X2 : undefined;
  const label = text(geo.x + 4, geo.y + geo.baselineOffset, geo.label, {
    fontFamily: theme.fontFamily, fontSize, fontWeight: '700', fill: fontColor,
    ...(titleTextLength !== undefined ? { lengthAdjust: 'spacing' as const, textLength: titleTextLength } : {}),
  });
  return outline + hline + label;
}

/** `EntityImageEmptyPackage#calculateDimensionSlow`'s own MARGIN constant
 *  (distinct from `class-badge.ts`'s badge margin of the same name) --
 *  applied twice (both axes), see {@link measureEmptyPackageLeafDim}. */
const EMPTY_PACKAGE_MARGIN = 10;

/** Box + folder-tab geometry for a collapsed-empty `package`/`namespace`
 *  leaf (G2 N33 -- `class-magma.ts#isCollapsedGroup`'s own doc comment for
 *  which classifiers this applies to). */
export interface EmptyPackageLeafDim {
  width: number;
  height: number;
  wtitle: number;
  htitle: number;
  baselineOffset: number;
}

/** `FontParam.PACKAGE_STEREOTYPE` (klimt/font/FontParam.java:68) -- 14pt
 *  italic; NOT the 12pt `CLASS_STEREOTYPE` the classifier header uses. */
const PACKAGE_STEREOTYPE_FONT_SIZE = 14;

/**
 * `EntityImageEmptyPackage#calculateDimensionSlow` (G2 N33; stereotype merge
 * = A2s F-D mechanism A8): `dim = mergeTB(desc, withMargin(stereoBlock, 1,
 * 0), LEFT).atLeast(0, 2*dimDesc.height).delta(2*MARGIN)` -- width =
 * max(descW, widestStereoLabel + 2) + 20 (`stereoBlockDim`'s `STEREO_MARGIN
 * *2` IS the `withMargin(_, 1, 0)` +2px term; labels guillemet-wrapped at
 * `PACKAGE_STEREOTYPE` 14pt), height = max(descH + stereoH, 2*descH) + 20.
 * No stereotype reduces to `rawTextWidth + 20` x `2*rawTextHeight + 20`
 * (jar-verified `gatula-10-bifu561`: "foo" 39.425x48); `<<Dummy>>` jar
 * width = 1.191493in = 85.7875px (dojanu-92-vizo468 p3).
 * @see ~/git/plantuml/.../svek/image/EntityImageEmptyPackage.java:126-145
 */
export function measureEmptyPackageLeafDim(
  measurer: StringMeasurer,
  theme: Theme,
  label: string,
  stereotypeLabels: readonly string[] = [],
): EmptyPackageLeafDim {
  const dim = measurer.measure(label, titleFont(theme));
  const { guillemetStart: gs, guillemetEnd: ge } = theme.colors.graph;
  const g = gs === undefined && ge === undefined ? undefined : { start: gs ?? '«', end: ge ?? '»' };
  const stereo = stereoBlockDim(
    measureStereoLabelWidths(stereotypeLabels, theme.fontFamily, measurer, g, PACKAGE_STEREOTYPE_FONT_SIZE),
    PACKAGE_STEREOTYPE_FONT_SIZE,
  );
  return {
    width: Math.max(dim.width, stereo.width) + EMPTY_PACKAGE_MARGIN * 2,
    height: Math.max(dim.height + stereo.height, dim.height * 2) + EMPTY_PACKAGE_MARGIN * 2,
    wtitle: getWTitle(measurer, theme, label, 0),
    htitle: getHTitle(measurer, theme, label),
    baselineOffset: getTitleBaselineOffset(measurer, theme, label),
  };
}
