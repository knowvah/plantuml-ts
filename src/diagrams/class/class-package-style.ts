/**
 * class-package-style.ts — the package title metrics (`USymbolFolder`'s
 * `getWTitle`/`getHTitle`, the title font) and the package style values a
 * cluster (`Cluster#drawU`) and a collapsed-empty package leaf
 * (`EntityImageEmptyPackage`) resolve against their entity's stereotype.
 *
 * Split out of `class-namespace-shape.ts` (cdd3-T21, 500-line cap) so both
 * that module and `class-empty-package.ts` read ONE resolution without an
 * import cycle; `class-namespace-shape.ts` re-exports the title metrics, so
 * no existing import path changed.
 *
 * Style tiers (cdd3-T21, E3-1/E3-2/E3-5). Upstream resolves every value
 * below through a merged `Style` (`StyleSignatureBasic.withTOBECHANGED(
 * stereotype).getMergedStyle(...)`); a skinparam key carrying `<<label>>` is
 * re-signed with that label at +1000 priority (`FromSkinparamToStyle.java:
 * 292-302,396-408`, `StyleLoader.java:178-186`), so a stereotype-qualified
 * value outranks the plain one whenever the entity carries the label. This
 * port holds the stereotype tier in `ElementColors.*ByStereo` maps (see
 * `skinparam-stereo-keys.ts#applyPackageByStereo`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:285-324
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java:115-220
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageEmptyPackage.java:91-138
 */
import type { StringMeasurer, FontSpec } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';
import type { ElementColors } from '../../core/theme-graph-colors.js';
import { isTransparentColor, type Paint } from '../../core/paint.js';
import type { LineStyleDash } from '../../core/style-line-style.js';
import { namespaceTitleWidth, namespaceTitleHeight, packageTitleFontSpec } from './class-namespace-title-runs.js';

// marginTitleX1/X2/X3/Y1/Y2 — upstream's own field names
// (USymbolFolder.java), kept verbatim per this project's porting discipline.
export const MARGIN_TITLE_X1 = 3;
export const MARGIN_TITLE_X2 = 3;
export const MARGIN_TITLE_X3 = 7;
const MARGIN_TITLE_Y1 = 3;
/** The package style's `RoundCorner` in the class/object family --
 *  `plantuml.skin:205-210` (`classDiagram,componentDiagram,objectDiagram {
 *  element { RoundCorner 5 } }`): `A2.5,2.5`/`A3.75,3.75` folder arcs,
 *  `rx="2.5"` rects. */
export const PACKAGE_ROUND_CORNER = 5;
const MARGIN_TITLE_Y2 = 3;

/** `FontParam.PACKAGE`'s `defaultColor` (`klimt/font/FontParam.java:67`,
 *  `plantuml.skin:9` `root { FontColor black }`). */
const DEFAULT_FONT_COLOR = '#000000';

/** A group's text colour when no element tier applies -- `plantuml.skin:9`
 *  `root { FontColor black }`. */
export const DEFAULT_GROUP_FONT_COLOR = DEFAULT_FONT_COLOR;

/** The keywords `ClusterDecoration` resolves to `USymbolFolder` (`USymbols
 *  .java`: `PACKAGE`/`FOLDER`), which this engine draws through the
 *  package-styled folder/rect path, not a USymbol `asBig`. */
export function isFolderFamilyUSymbol(usymbol: string): boolean {
  return usymbol === 'package' || usymbol === 'folder';
}

function packageBucket(theme: Theme): ElementColors | undefined {
  return theme.colors.elements?.package;
}

/** `StyleSignatureBasic#clean`: lowercase, `_`/`.` stripped -- the SAME
 *  cleaning `skinparam-key-normalize.ts` applies to the `<<label>>` half of
 *  the key, so the two sides of the lookup agree. */
function cleanStyleTag(tag: string): string {
  return tag.toLowerCase().replace(/[_.]/g, '');
}

/** The stereotype tier: the LAST of `tags` with a value wins, mirroring the
 *  merge's last-registered-wins rule (`renderer-classifier-colors.ts
 *  #resolveElementBackground`'s identical convention). */
export function byStereo<T>(map: Readonly<Record<string, T>> | undefined, tags: readonly string[]): T | undefined {
  if (map === undefined) return undefined;
  let hit: T | undefined;
  for (const tag of tags) {
    const v = map[cleanStyleTag(tag)];
    if (v !== undefined) hit = v;
  }
  return hit;
}

/** A colour that paints nothing (`HColors.transparent()`): upstream emits no
 *  `<text>` for it (`DriverTextSvg.java:92-94`) and `stroke:none` for a
 *  line (`DriverLineSvg` -> `toSvg`). */
export function isNoPaint(color: string): boolean {
  return isTransparentColor(color);
}

/** The title font every package title measure reads (G2 N18 + E3-5). */
export function titleFont(theme: Theme): FontSpec {
  return packageTitleFontSpec(theme);
}

/** The folder-tab title's own text colour -- `skinparam packageFontColor`/
 *  `skinparam package { FontColor ... }` (the plain tier). A gradient
 *  override is not a text fill here (the plain-string `text()` primitive has
 *  no gradient path), so it falls back to jar's default. */
export function titleFontColor(theme: Theme): string {
  const override = packageBucket(theme)?.font;
  return typeof override === 'string' ? override : DEFAULT_FONT_COLOR;
}

/** Title colour of a cluster (`ClusterHeader#getTitleBlock`) or empty leaf
 *  (`EntityImageEmptyPackage`'s `desc`): `{..., package_, title}
 *  .withTOBECHANGED(stereotype)` -- the `packageFontColor<<label>>` tier
 *  first (E3-1), then the plain one. */
export function packageTitleFontColor(theme: Theme, tags: readonly string[]): string {
  // cdd6 T2a: `<style> package { title { FontColor } }` (T1a's `titleFont`)
  // matches the `{..., package_, title}` signature too (`ClusterHeader.java
  // :161-162`; `EntityImageEmptyPackage.java:88`) -- jar juzica-68.
  const pkg = packageBucket(theme);
  return byStereo(pkg?.fontByStereo, tags) ?? plainString(pkg?.titleFont) ?? titleFontColor(theme);
}

/** A `Paint` narrowed to the plain colour a text fill can carry (the
 *  `text()` primitive has no gradient path, {@link titleFontColor}). */
function plainString(paint: Paint | undefined): string | undefined {
  return typeof paint === 'string' ? paint : undefined;
}

/**
 * cdd6 T2a (D2): the title colour of a USymbol cluster (`ClusterHeader
 * #getTitleBlock`, `ClusterHeader.java:120-122` over the `{root, element,
 * <diagram>, <usymbol>, composite, title}` signature `:158-160`,
 * `.withTOBECHANGED(stereotype)` `:146-147`) or of an `EntityImageDescription`
 * leaf's `fcTitle` (`EntityImageDescription.java:147-153,172`): the
 * `<sname>FontColor<<label>>` / `.label { FontColor }` tier, then `<sname> {
 * title { FontColor } }`, then `<sname> { FontColor }`. `undefined` = no
 * element tier (the caller keeps its own default). Jar catana-32 / juzica-68.
 */
export function elementTitleFontColor(theme: Theme, sname: string, tags: readonly string[]): string | undefined {
  const b = theme.colors.elements?.[sname];
  return byStereo(b?.fontByStereo, tags) ?? plainString(b?.titleFont) ?? plainString(b?.font);
}

/**
 * cdd6 T2a (D2): the stereotype colour of a USymbol cluster
 * (`ClusterHeader.java:211-215`, `Cluster.getDefaultStyleDefinition(...)
 * .forStereotypeItself(stereotype)` = `{..., group, <usymbol>, stereotype}`
 * + the label, `StyleSignatureBasic.java:134-148`) or an
 * `EntityImageDescription` leaf's `fcStereo` (`EntityImageDescription.java
 * :155-157,174`). Both +1000 tiers match that signature: `<sname>
 * StereotypeFontColor<<label>>` ({stereotype, <sname>} + label) and
 * `<sname>FontColor<<label>>` ({<sname>} + label); upstream keeps whichever
 * was REGISTERED LATER (`DarkString.java:54-57`, priority = declaration
 * counter). T1d (fepiko-26-vobi566): the skinparam front-end now records
 * that tie-break itself in `stereoTextFontByStereo`
 * (`skinparam-stereo-keys.ts#applyFontColorByStereo`), so it is read FIRST;
 * `stereotypeFontByStereo`/`fontByStereo` remain as the fallback for a value
 * set by the `<style>` block front-end alone (`style-map-element.ts
 * #collectTagFontColor`), which does not populate the merged field. Then
 * `<sname> { stereotype { FontColor } }`, then `<sname> { FontColor } }`.
 */
export function elementStereoFontColor(theme: Theme, sname: string, tags: readonly string[]): string | undefined {
  const b = theme.colors.elements?.[sname];
  return (
    byStereo(b?.stereoTextFontByStereo, tags) ??
    byStereo(b?.stereotypeFontByStereo, tags) ??
    byStereo(b?.fontByStereo, tags) ??
    b?.stereotypeFont ??
    plainString(b?.font)
  );
}

/**
 * cdd6 T2a (D2): the dash half of `Style#getStroke` (`Style.java:299-320`)
 * for a signature holding each of `snames` (in the caller's precedence
 * order) plus the entity's stereotype labels: every `<sname>BorderStyle
 * <<label>>` tier first (+1000, `FromSkinparamToStyle.java:292-302,396-408`),
 * then every plain `<sname> { LineStyle }`. `undefined` = no LineStyle
 * declared (solid).
 */
export function elementLineStyle(
  theme: Theme,
  snames: readonly string[],
  tags: readonly string[],
): LineStyleDash | undefined {
  const buckets = snames.map((s) => theme.colors.elements?.[s]);
  for (const b of buckets) {
    const hit = byStereo(b?.lineStyleByStereo, tags);
    if (hit !== undefined) return hit;
  }
  return buckets.find((b) => b?.lineStyle !== undefined)?.lineStyle;
}

/** `UStroke(dashVisible, dashSpace, thickness)` -> the SVG
 *  `stroke-dasharray` value (`SvgGraphics` writes `visible,space`), or
 *  `undefined` for a solid stroke (`{0, 0}`, `UStroke.withThickness`). */
export function dashArrayOf(dash: LineStyleDash | undefined): string | undefined {
  if (dash === undefined || (dash.dashVisible === 0 && dash.dashSpace === 0)) return undefined;
  return `${String(dash.dashVisible)},${String(dash.dashSpace)}`;
}

/** Cluster border (`Cluster.java:316-320`): `packageBorderColor<<label>>`,
 *  then `packageBorderColor`, then `<style> package { LineColor }` (cdd5-T5c:
 *  the folder signature `{..., group, package_}`, `Cluster.java:291` with
 *  `USymbols.PACKAGE`, `:386-388`, matches the `package` selector -- jar
 *  cevoti-40/guxico-27), then the caller's style default. The relative
 *  rank of the two plain tiers is not jar-verified (no fixture sets both). */
export function packageBorderColor(theme: Theme, tags: readonly string[], fallback: string): string {
  const styled = packageBucket(theme)?.border;
  return (
    byStereo(packageBucket(theme)?.borderByStereo, tags) ??
    theme.colors.graph.packageBorder ??
    (typeof styled === 'string' ? styled : undefined) ??
    fallback
  );
}

/** Cluster stroke (`Cluster#getStrokeInternal` -> `style.getStroke()`):
 *  `packageBorderThickness<<label>>` (giraca-14), then the plain key, then
 *  the caller's style default. */
export function packageBorderThickness(theme: Theme, tags: readonly string[], fallback: number): number {
  return (
    byStereo(packageBucket(theme)?.lineThicknessByStereo, tags) ?? theme.colors.graph.packageBorderThickness ?? fallback
  );
}

/** Empty-leaf stroke (`EntityImageEmptyPackage.java:103` `style.getStroke`):
 *  the stereotype tier over the leaf's own element-bucket thickness. */
export function emptyPackageThickness(theme: Theme, tags: readonly string[], fallback: number): number {
  const pkg = packageBucket(theme);
  return byStereo(pkg?.lineThicknessByStereo, tags) ?? pkg?.lineThickness ?? fallback;
}

/** Empty-leaf border: the stereotype tier over the leaf's existing cascade
 *  (`class-empty-package.ts#emptyPackagePaint`). */
export function emptyPackageBorder(theme: Theme, tags: readonly string[], fallback: string): string {
  return byStereo(packageBucket(theme)?.borderByStereo, tags) ?? fallback;
}

/**
 * Cluster stereotype colour -- `ClusterHeader#getStereoBlockWithoutLegend`
 * (`ClusterHeader.java:209-215`): `{..., package_, group}
 * .forStereotypeItself(stereotype)`. The +1000 stereotype tiers first
 * (`packageStereotypeFontColor<<label>>`, `packageFontColor<<label>>`), then
 * the plain `{stereotype, package_}` value (E3-2, dojanu-92's red «Dummy»),
 * then the plain `{package_}` title colour.
 */
export function clusterStereoFontColor(theme: Theme, tags: readonly string[]): string {
  const pkg = packageBucket(theme);
  return (
    byStereo(pkg?.stereotypeFontByStereo, tags) ??
    byStereo(pkg?.fontByStereo, tags) ??
    pkg?.stereotypeFont ??
    titleFontColor(theme)
  );
}

/**
 * Empty-leaf stereotype colour -- the LEGACY `FontConfiguration.create(
 * skinParam, FontParam.PACKAGE_STEREOTYPE, stereotype)` (`EntityImageEmptyPackage
 * .java:134-135`) -> `SkinParam#getFontHtmlColor` (`SkinParam.java:484-505`):
 * `packageStereotypeFontColor<<label>>`, then `packageStereotypeFontColor`,
 * then the FontParam default. It never reads `packageFontColor`.
 */
export function emptyPackageStereoFontColor(theme: Theme, tags: readonly string[]): string {
  const pkg = packageBucket(theme);
  return byStereo(pkg?.stereotypeFontByStereo, tags) ?? pkg?.stereotypeFont ?? DEFAULT_FONT_COLOR;
}

/**
 * `USymbolFolder#getHTitle`: `measuredHeight + marginTitleY1 +
 * marginTitleY2`, or 10 for an empty title -- jar-verified at 14pt
 * (`finono-05-cuvu171`: 20) and 40pt (`pixexi-81-sete111`: 46). Sums every
 * physical line's own height (cdd-T26, `daxeno-00-kasu166`).
 */
export function getHTitle(measurer: StringMeasurer, theme: Theme, label: string): number {
  // isw-T2-cls: the SAME title block `getWTitle` tests (`USymbolFolder.java:
  // 127-143` reads `dimTitle.getWidth()` in both). An empty label is one " "
  // atom (`StripeSimple.java:125-126`), 3.85 wide at 14pt, so it takes the
  // `height + marginTitleY1 + marginTitleY2` branch (jar probe `package "" as
  // p`: tab bottom at 26, not 16).
  if (namespaceTitleWidth(measurer, theme, label) === 0) return 10;
  return namespaceTitleHeight(measurer, theme, label) + MARGIN_TITLE_Y1 + MARGIN_TITLE_Y2;
}

/**
 * `USymbolFolder#getWTitle`: title text width plus X1/X2, falling back to
 * `max(30, width/4)` for an empty label -- jar-verified `titleWidth+6`
 * (`finono-05-cuvu171`, `jinibe-02-tebi269`).
 */
export function getWTitle(measurer: StringMeasurer, theme: Theme, label: string, width: number): number {
  const titleWidth = namespaceTitleWidth(measurer, theme, label);
  if (titleWidth === 0) return Math.max(30, width / 4);
  return titleWidth + MARGIN_TITLE_X1 + MARGIN_TITLE_X2;
}

/**
 * The title baseline's Y offset from the box top: `USymbolFolder#asBig`
 * draws the title at local `(4, 2)` (`title.drawU(ug.apply(new UTranslate(4,
 * 2)))`), glyph baseline = ascent below that line top -- jar-verified
 * `finono-05-cuvu171` (`y=18.8889` = 6 + 2 + 10.8889). Reads the SAME font
 * `titleFont` measures with (cdd-T37, `pixexi-81-sete111`).
 */
export function getTitleBaselineOffset(measurer: StringMeasurer, theme: Theme, label: string): number {
  return 2 + titleFont(theme).size - measurer.getDescent(titleFont(theme), label);
}
