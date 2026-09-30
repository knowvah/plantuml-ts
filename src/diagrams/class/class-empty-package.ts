/**
 * class-empty-package.ts — `EntityImageEmptyPackage`: a collapsed-empty
 * `package`/`namespace` leaf (G2 N33, `class-magma.ts#isCollapsedGroup`).
 *
 * Split out of `class-namespace-shape.ts` (cdd3-T21, 500-line cap), which
 * re-exports every symbol below so no import path changed.
 *
 * cdd3-T21 (E3-6): the draw is now a `ClusterDecoration` port
 * (`EntityImageEmptyPackage#drawU`, `:147-171`): `new ClusterDecoration(
 * getSkinParam().packageStyle(), null, desc, stereoBlock, rectangleArea,
 * stroke)` -> `PackageStyle#toUSymbol` -> `USymbol#asBig(title, ...,
 * stereo, ...)`. It was a fixed folder that never drew the stereo block.
 * The two `PackageStyle`s this port models (`theme.packageStyle`) are
 * FOLDER (`USymbolFolder#asBig`) and RECTANGLE (`USymbolRectangle#asBig`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageEmptyPackage.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDecoration.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/symbol/USymbolFolder.java:216-233
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/symbol/USymbolRectangle.java:65-71,103-131
 */
import type { StringMeasurer, FontSpec } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';
import type { ScaledTheme } from './class-scale-geo.js';
import type { NamespaceGeo } from './layout.js';
import { rect, text, PAINT_NONE } from '../../core/svg.js';
import { parseColor, type Paint } from '../../core/paint.js';
import type { DisplayPositioned } from '../../core/annotations/index.js';
import { buildAnnotationBlock } from '../../core/annotations/index.js';
import { isDisplayPositionedNull } from '../../core/annotations/model.js';
import { resolveAnnotationStyles } from '../../core/annotations/style.js';
import { shiftFragmentBody } from '../../core/annotations/coord-shift.js';
import { stereoBlockDim, wrapGuillemet, type GuillemetPair } from './class-stereotype.js';
import { renderFolderTabShape } from './class-namespace-folder-outline.js';
import { namespaceTitleInk, folderTitlePlacement, rectTitlePlacement } from './class-namespace-title-ink.js';
import type { LeafSymbolInk } from '../../core/svek/image/leaf-sizing-entity.js';
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
  titleFont,
  getWTitle,
  getHTitle,
  getTitleBaselineOffset,
  packageTitleFontColor,
  emptyPackageBorder,
  emptyPackageThickness,
  emptyPackageStereoFontColor,
  isNoPaint,
  elementLineStyle,
  dashArrayOf,
} from './class-package-style.js';

/**
 * The leaf's `...package_,title` style defaults (`EntityImageEmptyPackage
 * #getStyleSignature`, NOT the cluster's `...package_,group`): the generic
 * element `LineThickness 0.5` (`plantuml.skin:91-93`), `theme.colors.border`
 * (#181818), `classBackground` (#F1F1F1) -- jar-verified `gatula-10-bifu561`.
 * `<style> package {}` (the element bucket) wins over `skinparam
 * packageBorderColor`/`packageBackgroundColor` (cdd-T12, CDD T18b).
 */
const EMPTY_PACKAGE_STROKE_WIDTH = 0.5;

/** `EntityImageEmptyPackage#calculateDimensionSlow`'s own MARGIN constant
 *  (`:73`), applied on both axes. */
const EMPTY_PACKAGE_MARGIN = 10;

/** `FontParam.PACKAGE_STEREOTYPE` (klimt/font/FontParam.java:68) -- 14pt
 *  italic; NOT the 12pt `CLASS_STEREOTYPE` the classifier header uses. */
const PACKAGE_STEREOTYPE_FONT_SIZE = 14;

/** `TextBlockUtils.withMargin(stereo, 1, 0)` (`EntityImageEmptyPackage
 *  .java:133-136`) -- the stereo block's own X margin. */
const STEREO_BLOCK_MARGIN_X = 1;

/** One stereotype line of the leaf's `stereoBlock`, relative to the block's
 *  own top-left (margin included). */
export interface EmptyPackageStereoLine {
  readonly content: string;
  readonly x: number;
  readonly baseline: number;
  readonly width: number;
}

/** Box + title/stereo geometry for a collapsed-empty package leaf. */
export interface EmptyPackageLeafDim {
  width: number;
  height: number;
  wtitle: number;
  htitle: number;
  baselineOffset: number;
  /** cdd3-T21 (E3-6): the leaf's `stereoBlock`; absent == `empty(0, 0)`. */
  stereo?: {
    readonly width: number;
    readonly height: number;
    readonly lines: readonly EmptyPackageStereoLine[];
    /** cdd6-T3d (bijufi): a legend stereo block's pre-rendered SVG fragment,
     *  local to the block's top-left (`lines` is then empty). */
    readonly body?: string;
  };
  /** cdd3-T31 (E1-2): the title `UText` ink (`LimitFinder.java:217-224`),
   *  local to the leaf -- `class-namespace-title-ink.ts#namespaceTitleInk`
   *  at the leaf's own folder/rect title placement. Absent for an empty
   *  label. */
  titleInk?: LeafSymbolInk;
  /** cdd3-T21 (E3-6): `skinparam packageStyle rect` -- the leaf draws
   *  `USymbolRectangle#asBig` (a `URectangle`, `LimitFinder`'s inset rect
   *  ink rule) instead of the folder `UPath`. */
  rect?: true;
}

function stereoFont(theme: Theme): FontSpec {
  return { family: theme.fontFamily, size: PACKAGE_STEREOTYPE_FONT_SIZE, style: 'italic' };
}

function resolveGuillemet(theme: Theme): GuillemetPair | undefined {
  const { guillemetStart: gs, guillemetEnd: ge } = theme.colors.graph;
  return gs === undefined && ge === undefined ? undefined : { start: gs ?? '«', end: ge ?? '»' };
}

/**
 * The leaf's `stereoBlock` (`EntityImageEmptyPackage.java:126-137`):
 * `withMargin(Display.create(labels).create(PACKAGE_STEREOTYPE font,
 * titleHorizontalAlignment), 1, 0)` -- one line per label, each centred in
 * the block (`plantuml.skin:94-98` title `HorizontalAlignment center`).
 */
function buildStereo(measurer: StringMeasurer, theme: Theme, labels: readonly string[]): EmptyPackageLeafDim['stereo'] {
  if (labels.length === 0) return undefined;
  const font = stereoFont(theme);
  const g = resolveGuillemet(theme);
  const measured = labels.map((l) => {
    const content = wrapGuillemet(l, g);
    return { content, width: measurer.measure(content, font).width, descent: measurer.getDescent(font, content) };
  });
  const dim = stereoBlockDim(
    measured.map((m) => m.width),
    PACKAGE_STEREOTYPE_FONT_SIZE,
  );
  const inner = dim.width - STEREO_BLOCK_MARGIN_X * 2;
  const lineHeight = dim.height / labels.length;
  const lines = measured.map((m, i) => ({
    content: m.content,
    x: STEREO_BLOCK_MARGIN_X + (inner - m.width) / 2,
    baseline: i * lineHeight + lineHeight - m.descent,
    width: m.width,
  }));
  return { width: dim.width, height: dim.height, lines };
}

/**
 * cdd6-T3d (bijufi-98-xafa015): `if (legend != null) stereoBlock =
 * EntityImageLegend.create(legend.getDisplay(), getSkinParam())` -- the
 * group's own legend REPLACES the stereotype block. `EntityImageLegend
 * .create` is the bordered legend block the root legend draws, the same
 * `buildAnnotationBlock` `class-cluster-header.ts` uses for a titled
 * cluster's legend.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageEmptyPackage.java:121-124
 */
function buildLegendStereo(
  legend: DisplayPositioned,
  theme: Theme,
  measurer: StringMeasurer,
): EmptyPackageLeafDim['stereo'] {
  if (isDisplayPositionedNull(legend)) return undefined;
  const style = resolveAnnotationStyles(theme, new Map(), new Map()).legend;
  const block = buildAnnotationBlock('legend', legend.display!, style, measurer);
  return { width: block.width, height: block.height, lines: [], body: (block.extraDefs ?? '') + block.body };
}

/** The leaf's `stereoBlock`: the legend when present, else the stereotype
 *  labels (`EntityImageEmptyPackage.java:121-137`). */
function leafStereoBlock(
  measurer: StringMeasurer,
  theme: Theme,
  labels: readonly string[],
  legend: DisplayPositioned | undefined,
): EmptyPackageLeafDim['stereo'] {
  return legend !== undefined ? buildLegendStereo(legend, theme, measurer) : buildStereo(measurer, theme, labels);
}

/**
 * `EntityImageEmptyPackage#calculateDimensionSlow` (G2 N33; A2s F-D A8):
 * `mergeTB(desc, stereoBlock, LEFT).atLeast(0, 2*dimDesc.height)
 * .delta(2*MARGIN)` -- jar-verified `gatula-10-bifu561` ("foo" 39.425x48)
 * and `dojanu-92-vizo468` p3 (`<<Dummy>>` 85.7875 wide).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageEmptyPackage.java:140-145
 */
export function measureEmptyPackageLeafDim(
  measurer: StringMeasurer,
  theme: Theme,
  label: string,
  stereotypeLabels: readonly string[] = [],
  legend?: DisplayPositioned,
): EmptyPackageLeafDim {
  const dim = measurer.measure(label, titleFont(theme));
  const stereo = leafStereoBlock(measurer, theme, stereotypeLabels, legend);
  const sh = stereo?.height ?? 0;
  const width = Math.max(dim.width, stereo?.width ?? 0) + EMPTY_PACKAGE_MARGIN * 2;
  const wtitle = getWTitle(measurer, theme, label, 0);
  const baselineOffset = getTitleBaselineOffset(measurer, theme, label);
  const place =
    theme.packageStyle === 'rect'
      ? rectTitlePlacement({ width, wtitle }, sh, baselineOffset)
      : folderTitlePlacement(baselineOffset);
  const titleInk = namespaceTitleInk(measurer, theme, label, place);
  return {
    width,
    height: Math.max(dim.height + sh, dim.height * 2) + EMPTY_PACKAGE_MARGIN * 2,
    wtitle,
    htitle: getHTitle(measurer, theme, label),
    baselineOffset,
    ...(stereo !== undefined ? { stereo } : {}),
    ...(titleInk !== undefined ? { titleInk } : {}),
    ...(theme.packageStyle === 'rect' ? { rect: true as const } : {}),
  };
}

/** The leaf's paint: stroke thickness, border, back (`EntityImageEmptyPackage
 *  .java:97-112`) -- each through the stereotype tier (E3-1) first. */
function emptyPackagePaint(
  theme: ScaledTheme,
  tags: readonly string[],
): { strokeWidth: number; border: string; fill: Paint; dash: string | undefined } {
  const pkg = theme.colors.elements?.package;
  const plainBorder =
    typeof pkg?.border === 'string' ? pkg.border : (theme.colors.graph.packageBorder ?? theme.colors.border);
  // cdd6 T2a (D2): `style.getStroke(colors)` (`EntityImageEmptyPackage
  // .java:108`) carries the LineStyle dash too; cdd-B8FU scales it with the
  // thickness.
  const dash = elementLineStyle(theme, ['package'], tags);
  const k = theme.scaleK;
  return {
    // cdd-B8FU: both tiers scaled.
    strokeWidth: emptyPackageThickness(theme, tags, EMPTY_PACKAGE_STROKE_WIDTH) * k,
    border: emptyPackageBorder(theme, tags, plainBorder),
    fill: emptyPackageFill(theme),
    dash: dashArrayOf(
      dash === undefined ? undefined : { dashVisible: dash.dashVisible * k, dashSpace: dash.dashSpace * k },
    ),
  };
}

/**
 * The leaf's `style.value(PName.BackGroundColor)` (`EntityImageEmptyPackage
 * .java:111-112`): `<style> package { BackgroundColor }`, then `skinparam
 * packageBackgroundColor` -- carried as T1a's `backgroundGradient` when it
 * parses as a gradient (`HColorSet.java:107-116`; `{package_}` registration,
 * `FromSkinparamToStyle.java:129`), else the flattened solid string -- then
 * the class default. Jar kacecu-90: `BackgroundColor red-green` fills the
 * leaf `url(#…)` over `#F00`..`#008000`.
 */
function emptyPackageFill(theme: ScaledTheme): Paint {
  const pkg = theme.colors.elements?.package;
  if (typeof pkg?.background === 'string') return pkg.background;
  return pkg?.backgroundGradient ?? theme.colors.graph.packageBackground ?? theme.colors.graph.classBackground;
}

/** The leaf entity's own draw inputs beyond its box: the measured stereo
 *  block + symbol ({@link EmptyPackageLeafDim}) and its style-matching
 *  stereotype tags (`withTOBECHANGED(stereotype)`, `:88-91`). */
export interface EmptyPackageLeafExtras {
  readonly tab?: Pick<EmptyPackageLeafDim, 'stereo' | 'rect'>;
  readonly tags?: readonly string[];
}

interface EmptyPackageLeafDraw {
  readonly geo: NamespaceGeo;
  readonly tab: Pick<EmptyPackageLeafDim, 'stereo' | 'rect'>;
  readonly tags: readonly string[];
}

/** `stereotype.drawU(ug.apply(new UTranslate(x0, y0)))` for the pre-built
 *  block -- each line at its own centred x. Transparent ink draws nothing
 *  (`DriverTextSvg.java:92-94`). */
function drawStereo(draw: EmptyPackageLeafDraw, theme: ScaledTheme, x0: number, y0: number): string {
  const stereo = draw.tab.stereo;
  // cdd6-T3d: a legend block draws itself (its own style colours).
  if (stereo?.body !== undefined) return shiftFragmentBody(stereo.body, x0, y0);
  const fill = emptyPackageStereoFontColor(theme, draw.tags);
  if (stereo === undefined || isNoPaint(fill)) return '';
  return stereo.lines
    .map((l) =>
      text(x0 + l.x, y0 + l.baseline, l.content, {
        fontFamily: theme.fontFamily,
        fontSize: PACKAGE_STEREOTYPE_FONT_SIZE * theme.scaleK,
        fontStyle: 'italic',
        fill,
        textLength: l.width,
      }),
    )
    .join('');
}

/** The leaf title (`desc`), single- or multi-line, at `(x, baselineY)`. */
function drawTitle(
  draw: EmptyPackageLeafDraw,
  theme: ScaledTheme,
  measurer: StringMeasurer | undefined,
  at: {
    x: number;
    blockTopY: number;
    baselineY: number;
    xForLine: (w: number) => number;
  },
): string {
  const { geo } = draw;
  const titleTextLength =
    geo.label.length > 0 ? geo.wtitle - (MARGIN_TITLE_X1 + MARGIN_TITLE_X2) * theme.scaleK : undefined;
  return renderNamespaceTitleAuto(
    { label: geo.label, theme, measurer, blockTopY: at.blockTopY },
    {
      x: at.x,
      y: at.baselineY,
      fontFamily: packageTitleFontFamily(theme),
      fontSize: packageTitleFontSize(theme),
      fontColor: packageTitleFontColor(theme, draw.tags),
      textLength: titleTextLength,
    },
    (line) => at.xForLine(line.width),
  );
}

/**
 * `USymbolFolder#asBig` (`:216-233`): the folder shape, title at `(4, 2)`,
 * stereo at `(4 + (width - dimStereo.w) / 2, 2 + getHTitle(dimTitle))`.
 * `roundCorner` is the leaf's own style RoundCorner (`EntityImageEmptyPackage
 * .java:104`) -- unlike `Cluster.java:323-324`, NOT zeroed under strictuml,
 * so the leaf always takes `drawFolder`'s `UPath` branch (`:92-116`).
 */
function renderFolderLeaf(
  draw: EmptyPackageLeafDraw,
  theme: ScaledTheme,
  measurer: StringMeasurer | undefined,
): string {
  const { geo } = draw;
  const { strokeWidth, border, fill, dash } = emptyPackagePaint(theme, draw.tags);
  const { outline, hline } = renderFolderTabShape(geo, {
    strictUml: false,
    // cdd6-T3d (fokudi-24-limo685): `style.getStroke(colors)`'s LineStyle
    // dash (EntityImageEmptyPackage.java:108) reaches the tab too.
    ...(dash !== undefined ? { strokeDasharray: dash } : {}),
    border,
    strokeWidth,
    fill: geo.color !== undefined ? parseColor(geo.color) : fill, // S-12: EntityImageEmptyPackage.java:97,109-112
    roundCorner: PACKAGE_ROUND_CORNER * theme.scaleK,
    marginX3: MARGIN_TITLE_X3 * theme.scaleK,
  });
  const titleX = geo.x + TITLE_X_OFFSET * theme.scaleK;
  const top = TITLE_LOCAL_TOP_OFFSET * theme.scaleK;
  const title = drawTitle(draw, theme, measurer, {
    x: titleX,
    blockTopY: geo.y + top,
    baselineY: geo.y + geo.baselineOffset,
    xForLine: () => titleX,
  });
  const sw = draw.tab.stereo?.width ?? 0;
  const stereo = drawStereo(draw, theme, titleX + (geo.width - sw) / 2, geo.y + top + geo.htitle);
  return outline + hline + title + stereo;
}

/**
 * `USymbolRectangle#asBig` (`:103-131`): `drawRect` (`rect.rounded(
 * roundCorner)`, `:65-71`), stereo at `((width - dimStereo.w) / 2, 2)`,
 * title at `((width - dimTitle.w) / 2, 2 + dimStereo.h)` -- the CENTER
 * `packageTitleAlignment` default (jar nijeli-04 `DCN WAN`: title x = box
 * x + 10). `DriverRectangleSvg` writes `rx = roundCorner / 2`.
 */
function renderRectLeaf(draw: EmptyPackageLeafDraw, theme: ScaledTheme, measurer: StringMeasurer | undefined): string {
  const { geo } = draw;
  const { strokeWidth, border, fill, dash } = emptyPackagePaint(theme, draw.tags);
  const corner = (PACKAGE_ROUND_CORNER * theme.scaleK) / 2;
  const outline = rect(geo.x, geo.y, geo.width, geo.height, {
    stroke: isNoPaint(border) ? PAINT_NONE : border, // SvgGraphics.java:539-540 fixColor
    strokeWidth,
    ...(dash !== undefined ? { strokeDasharray: dash } : {}),
    fill: geo.color !== undefined ? parseColor(geo.color) : fill,
    rx: corner,
    ry: corner,
  });
  const sw = draw.tab.stereo?.width ?? 0;
  const sh = draw.tab.stereo?.height ?? 0;
  const top = TITLE_LOCAL_TOP_OFFSET * theme.scaleK;
  const stereo = drawStereo(draw, theme, geo.x + (geo.width - sw) / 2, geo.y + top);
  const rawTextWidth = geo.wtitle - (MARGIN_TITLE_X1 + MARGIN_TITLE_X2) * theme.scaleK;
  const title =
    geo.label.length === 0
      ? ''
      : drawTitle(draw, theme, measurer, {
          x: geo.x + (geo.width - rawTextWidth) / 2,
          blockTopY: geo.y + sh + top,
          baselineY: geo.y + sh + geo.baselineOffset,
          xForLine: (w) => geo.x + (geo.width - w) / 2,
        });
  return outline + stereo + title;
}

/** `EntityImageEmptyPackage#drawU` -> `ClusterDecoration#drawU` with
 *  `packageStyle().toUSymbol()` (`ClusterDecoration.java:66-71`). */
export function renderEmptyPackageIcon(
  geo: NamespaceGeo,
  theme: ScaledTheme,
  measurer?: StringMeasurer,
  extras: EmptyPackageLeafExtras = {},
): string {
  const draw: EmptyPackageLeafDraw = { geo, tab: extras.tab ?? {}, tags: extras.tags ?? [] };
  return draw.tab.rect === true ? renderRectLeaf(draw, theme, measurer) : renderFolderLeaf(draw, theme, measurer);
}
