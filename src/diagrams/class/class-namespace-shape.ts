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
import type { StringMeasurer } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';
import type { ScaledTheme } from './class-scale-geo.js';
import type { NamespaceGeo } from './layout.js';
import { rect, PAINT_NONE } from '../../core/svg.js';
import { shiftFragmentBody } from '../../core/annotations/coord-shift.js';
import { isTransparentColor, parseColor, type Paint } from '../../core/paint.js';
import { renderFolderTabShape } from './class-namespace-folder-outline.js';
import {
  renderNamespaceTitleAuto,
  TITLE_LOCAL_TOP_OFFSET,
  TITLE_LOCAL_LEFT_OFFSET as TITLE_X_OFFSET,
  packageTitleFontFamily,
  packageTitleFontSize,
} from './class-namespace-title-runs.js';
import {
  MARGIN_TITLE_X1,
  MARGIN_TITLE_X2,
  MARGIN_TITLE_X3,
  PACKAGE_ROUND_CORNER,
  packageTitleFontColor,
  packageBorderColor,
  packageBorderThickness,
} from './class-package-style.js';

// cdd3-T21: the title metrics and the empty-package leaf moved out (500-line
// cap); re-exported so no import path changed.
export {
  PACKAGE_ROUND_CORNER,
  titleFontColor,
  getHTitle,
  getWTitle,
  getTitleBaselineOffset,
} from './class-package-style.js';
export {
  measureEmptyPackageLeafDim,
  renderEmptyPackageIcon,
  type EmptyPackageLeafDim,
  type EmptyPackageLeafExtras,
} from './class-empty-package.js';

const TOP = TITLE_LOCAL_TOP_OFFSET; // the `2` of both `asBig` stereo/title translates

/** Jar-observed default class-diagram package/namespace border width
 *  (`stroke-width:1.5`, e.g. `finono-05-cuvu171`, `jinibe-02-tebi269`) —
 *  matches description's own `CLUSTER_STROKE_WIDTH` for folder-styled
 *  containers (`renderer-cluster.ts`). */
export const PACKAGE_STROKE_WIDTH = 1.5;

/** CDD T18b: the populated-namespace cluster's own `...package_,group`
 *  unstyled defaults (`Cluster.java:285-296`) -- `plantuml.skin:102-114`'s
 *  `group { BackGroundColor transparent; package { LineThickness 1.5;
 *  LineColor black } }`. Applied explicitly (`?? PACKAGE_CLUSTER_*`) at
 *  every cluster draw site now that `theme.colors.graph.packageBackground`/
 *  `packageBorder` are optional (theme.ts no longer bakes them in) --
 *  see `emptyPackagePaint`'s doc comment for why the leaf must NOT share
 *  this same baked-in default. */
const PACKAGE_CLUSTER_BACKGROUND_DEFAULT = 'none';
const PACKAGE_CLUSTER_BORDER_DEFAULT = '#000000';

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
function packageFillValue(color: Paint): Paint {
  // CDD T18/D8: a gradient is never the "no paint" keyword -- upstream's
  // `HColorSet#parseColor` returns `HColors.none()` only from its two
  // literal-keyword arms (java:82-83), before the separator scan.
  if (typeof color !== 'string') return color;
  return isTransparentColor(color) ? 'none' : color;
}

/**
 * cdd-T12 (diagnosis A3 M3): a namespace's OWN inline `package "X" #COLOR {`
 * background wins over the diagram-wide `skinparam packageBackgroundColor`/
 * `<style> package { BackGroundColor }` fallback -- `Cluster#drawU`
 * (`svek/Cluster.java:360-362`) resolves the back colour as
 * `getBackColor(style)` then the static
 * `getBackColor(backColor, stereotype, ...)` overload, both of which put the
 * group's own `Colors`/`ColorType.BACK` override ahead of the style value
 * (`core/svek/Cluster.ts#resolveBackColor`'s ported `backColorOverride ??
 * backGroundColorDefault` is the same precedence). `NamespaceGeo.color` is
 * already resolved to its bare/`back:` half at parse time (T11), so there is
 * nothing left to re-parse here.
 *
 * Jar-verified on `garumi-63-vuze973` (`package "Voici mon package" #DDDDDD
 * {`): `<path ... fill="#DDD">` where this port previously emitted
 * `fill="none"` (the global default).
 */
/**
 * CDD T18/D8: `parseColor` wraps BOTH tiers, not just one -- upstream's
 * `Cluster#getBackColor` yields a single `HColor` from the one
 * `HColorSet#parseColor` (java:78-119) whichever tier supplied the token,
 * and `Cluster#drawU`'s shape is a `URectangle`/`UPolygon`, both of which
 * emit a real def for a gradient (`DriverRectangleSvg.java:82-96`,
 * `DriverPolygonSvg.java:63`). Jar-verified `dacixi-46-lina038`
 * (`namespace A::B::C #yellow\gold {`: `<path fill="url(#…)">`, where this
 * port previously emitted the unsplit literal `fill="#yellow\gold"`).
 */
export function namespaceFill(geo: NamespaceGeo, theme: Theme): Paint {
  return packageFillValue(
    parseColor(geo.color ?? theme.colors.graph.packageBackground ?? PACKAGE_CLUSTER_BACKGROUND_DEFAULT),
  );
}

// folderPathD / folderPolygonPoints / renderFolderPolygon / FolderTabPaint /
// renderFolderTabShape all live in class-namespace-folder-outline.ts (T7b +
// cdd-B8FU, file-length split -- see that module's own doc comment).

export function renderNamespaceFolder(geo: NamespaceGeo, theme: ScaledTheme, measurer?: StringMeasurer): string {
  // G2 N18: `packageBorderThickness`/`packageFontSize`/`packageFontColor`
  // override the folder defaults; `fontSize` must match `titleFont` or the
  // pre-computed `htitle`/`wtitle` disagree with the drawn glyphs.
  // cdd-B8FU: both tiers (the `<style>`/skinparam override AND the
  // PACKAGE_STROKE_WIDTH default) get their own scaleK factor -- the
  // "materialize the fallback" rule (`renderer-classifier-rows.ts
  // #attributeFontSize`'s own doc comment) applies here identically.
  // cdd3-T21 (E3-1): each through the group's `package<Role><<label>>`
  // tier first (`Cluster#getStyle`'s `withTOBECHANGED`, `Cluster.java:386-
  // 392`) -- giraca-14's `packageBorderThickness<<stereo>> 1.5`.
  const tags = geo.stereotypeTags ?? [];
  const strokeWidth = packageBorderThickness(theme, tags, PACKAGE_STROKE_WIDTH) * theme.scaleK;
  // CDD T18b: `theme.colors.graph.packageBorder` is optional now -- this IS
  // a `...package_,group`-signature draw site, so it supplies the
  // cluster's own unstyled default explicitly (see that constant's doc
  // comment).
  const border = packageBorderColor(theme, tags, PACKAGE_CLUSTER_BORDER_DEFAULT);
  // G2 N18: `strictuml` -> sharp-corner `UPolygon` branch (roundCorner=0).
  // G2 N59: `packageFillValue` maps "no paint" to jar's literal `fill="none"`.
  const fill = namespaceFill(geo, theme);
  const { outline, hline } = renderFolderTabShape(geo, {
    strictUml: theme.strictUml,
    border,
    strokeWidth,
    fill,
    roundCorner: PACKAGE_ROUND_CORNER * theme.scaleK,
    marginX3: MARGIN_TITLE_X3 * theme.scaleK,
  });
  // G2 N18: deterministic-text `textLength` from `wtitle` (= rawTextWidth +
  // X1 + X2 for a non-empty label, `getWTitle`); omitted for the empty-label
  // `max(30, width/4)` fallback. cdd-B8FU: `geo.wtitle` is already scaled,
  // so the margin literals subtracted back out take their own scaleK.
  const titleTextLength =
    geo.label.length > 0 ? geo.wtitle - (MARGIN_TITLE_X1 + MARGIN_TITLE_X2) * theme.scaleK : undefined;
  const titleX = geo.x + TITLE_X_OFFSET * theme.scaleK;
  const label = renderNamespaceTitleAuto(
    { label: geo.label, theme, measurer, blockTopY: geo.y + TITLE_LOCAL_TOP_OFFSET * theme.scaleK },
    {
      x: titleX,
      y: geo.y + geo.baselineOffset,
      fontFamily: packageTitleFontFamily(theme), // E3-5 packageFontName
      fontSize: packageTitleFontSize(theme),
      fontColor: packageTitleFontColor(theme, tags),
      textLength: titleTextLength,
    },
    () => titleX,
  );
  // cdd2-T19b: `stereotype.drawU(ug.apply(new UTranslate(4 + posStereo, 2 +
  // getHTitle(dimTitle))))`, `posStereo = (width - dimStereo.w) / 2`
  // (`USymbolFolder.java` `asBig`); `geo.htitle` IS `getHTitle`.
  const stereo = placeHeaderStereo(geo, geo.x + TITLE_X_OFFSET * theme.scaleK, geo.y + TOP * theme.scaleK + geo.htitle);
  return outline + hline + label + stereo.body;
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
 * DRAWN shape differs, not the reserved box).
 *
 * cdd3-T21 (E3-4): `rounded = style.value(RoundCorner)`, forced to 0 only
 * under `skinParam.strictUmlStyle()` (`Cluster.java:321-324`), reaches
 * `USymbolRectangle#drawRect`'s `rect.rounded(roundCorner)` (`:65-71`);
 * `DriverRectangleSvg` writes `rx = roundCorner / 2` (`:78`). mucuxi-36 is
 * strictuml (no rx); nijeli-04 is not (`rx="2.5"`).
 */
export function renderNamespaceRect(geo: NamespaceGeo, theme: ScaledTheme, measurer?: StringMeasurer): string {
  // cdd-B8FU: both tiers scaled -- see renderNamespaceFolder's identical
  // citation.
  const tags = geo.stereotypeTags ?? [];
  const strokeWidth = packageBorderThickness(theme, tags, PACKAGE_STROKE_WIDTH) * theme.scaleK;
  const fill = namespaceFill(geo, theme);
  // CDD T18b: `...package_,group`-signature site -- see
  // `PACKAGE_CLUSTER_BORDER_DEFAULT`'s doc comment.
  const border = packageBorderColor(theme, tags, PACKAGE_CLUSTER_BORDER_DEFAULT);
  const corner = ((theme.strictUml === true ? 0 : PACKAGE_ROUND_CORNER) * theme.scaleK) / 2;
  const outline = rect(geo.x, geo.y, geo.width, geo.height, {
    stroke: isTransparentColor(border) ? PAINT_NONE : border, // SvgGraphics.java:539-540 fixColor
    strokeWidth,
    fill,
    rx: corner,
    ry: corner,
  });
  // cdd2-T19b: `USymbolRectangle#asBig`: stereo at `((width - w) / 2, 2)`
  // BEFORE the title, title at `2 + dimStereo.getHeight()` (CENTER branch).
  const stereo = placeHeaderStereo(geo, geo.x, geo.y + TOP * theme.scaleK);
  if (geo.label.length === 0) return outline + stereo.body;
  const rawTextWidth = geo.wtitle - (MARGIN_TITLE_X1 + MARGIN_TITLE_X2) * theme.scaleK;
  const posTitle = (geo.width - rawTextWidth) / 2;
  // cdd-T26 residual round: each physical line is centred against
  // `geo.width` independently -- the exact per-line generalization of this
  // function's own pre-existing single-line `posTitle` formula (`(width -
  // rawTextWidth) / 2`), matching `mucuxi-36-beku683`'s own citation above
  // for a markup-free, single-line label.
  const label = renderNamespaceTitleAuto(
    { label: geo.label, theme, measurer, blockTopY: geo.y + stereo.height + TITLE_LOCAL_TOP_OFFSET * theme.scaleK },
    {
      x: geo.x + posTitle,
      y: geo.y + stereo.height + geo.baselineOffset,
      fontFamily: packageTitleFontFamily(theme),
      fontSize: packageTitleFontSize(theme),
      fontColor: packageTitleFontColor(theme, tags),
      textLength: rawTextWidth,
    },
    (line) => geo.x + (geo.width - line.width) / 2,
  );
  return outline + stereo.body + label;
}

/** cdd2-T19b: the pre-built `ClusterHeader` stereo block
 *  (`class-cluster-header.ts`) centred in the box from `x0`: `posStereo =
 *  (width - dimStereo.w) / 2` in both `asBig`s above. */
function placeHeaderStereo(geo: NamespaceGeo, x0: number, y: number): { body: string; height: number } {
  const h = geo.clusterHeaderStereo;
  if (h === undefined) return { body: '', height: 0 };
  return { body: shiftFragmentBody(h.body, x0 + (geo.width - h.width) / 2, y), height: h.height };
}
