/**
 * class-namespace-usymbol-shape.ts — cdd-T12 (diagnosis A2b E3): a NON-EMPTY
 * `package X <<Node>>` / `<<Database>>` / `<<cloud>>` / `<<Rectangle>>`
 * container draws its USymbol's own `asBig` chrome, not the default
 * folder-tab outline.
 *
 * Upstream: `svek/Cluster.java:367-374` builds `new ClusterDecoration(
 * packageStyle, group.getUSymbol(), clusterHeader.getTitle(),
 * clusterHeader.getStereo(), rectangleArea, stroke)` and calls
 * `decoration.drawU(...)`; `svek/ClusterDecoration.java:66-71` (`guess`)
 * keeps an explicit `USymbol` and only falls back to `style.toUSymbol()`
 * when there is none, then `:81-92` (`getTextBlock`) hands the resolved
 * symbol's `asBig(title, titleAlignment, stereo, width, height,
 * symbolContext, stereoAlignment)` back for drawing.
 *
 * REUSE, not re-port: every `USymbol#asBig` in that dispatch is already
 * ported under `src/core/decoration/symbol/` and already exercised by the
 * description engine's own cluster path (`description/renderer-cluster.ts`
 * -> `core/svek/Cluster.ts` -> `core/svek/ClusterDecoration.ts`). This
 * module assembles the SAME `ClusterDecoration` from a `NamespaceGeo` and
 * unwraps the klimt draw through `core/klimt/document-shell.ts
 * #renderDrawableToFragment` -- the identical bridge
 * `class/renderer-usymbol-entity.ts` (SI14 T4) already uses to draw a
 * class-diagram usecase/actor leaf through klimt from this engine's
 * plain-SVG-string renderer. Hand-porting a second `asBig` table as SVG
 * strings would fork geometry that is already jar-verified.
 *
 * NOT handled here (the caller falls through to
 * `class-namespace-shape.ts#renderNamespaceFolder`/`renderNamespaceRect`):
 * the folder family (`package`/`folder`), whose byte-exact plain-string
 * outline plus its `skinparam style strictuml` `<polygon>` branch and
 * `skinparam packageStyle rect` sibling are already ported there, and any
 * keyword that resolves to no `USymbol` at all.
 */
import type { Paint } from '../../core/paint.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';
import type { ScaledTheme } from './class-scale-geo.js';
import type { NamespaceGeo } from './class-geo-namespace-types.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { FontStyle } from '../../core/klimt/shape/UText.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { TextBlockUtils } from '../../core/klimt/shape/TextBlockUtils.js';
import { buildTextBlock } from '../../core/svek/image/EntityImageDescriptionSupport.js';
import { splitDisplayLines } from '../../core/klimt/creole/DisplayNewlines.js';
import { resolveDescriptionUSymbol } from '../../core/svek/image/EntityImageDescription.js';
import { resolveActorStyle, mapComponentStyle } from '../../core/decoration/symbol/usymbol-resolve.js';
import type { USymbol as UpstreamUSymbol } from '../../core/decoration/symbol/USymbol.js';
import { ClusterDecoration } from '../../core/svek/ClusterDecoration.js';
import { renderDrawableToFragment } from '../../core/klimt/document-shell.js';

/** `FontParam.PACKAGE`'s `getDefaultFontFace` returns `UFontFace.bold()`
 *  for every group title regardless of the container's own keyword
 *  (`klimt/font/FontParam.java:167-172`, `inPackageTitle=true`) -- the same
 *  bold the folder path's own `titleFont` already applies, and the same
 *  convention `description/renderer-cluster.ts#TITLE_STYLES` carries. */
const TITLE_STYLES: ReadonlySet<FontStyle> = new Set([FontStyle.BOLD]);

/** `plantuml.skin:102-104` -- `group { BackGroundColor transparent;
 *  LineThickness 1.0 }`. The nested `group { package { LineThickness 1.5;
 *  LineColor black } folder { ... } }` overrides apply to the FOLDER family
 *  only, which never reaches this module (see the header doc comment), so a
 *  USymbol cluster's unstyled border is the generic element default
 *  (`theme.colors.border`) at thickness 1 -- jar-verified against
 *  `dativu-93-pona469`'s `<<Node>>` clusters (`stroke:#181818;
 *  stroke-width:1`). */
const GROUP_STROKE_WIDTH = 1;

/** The folder-family keywords `ClusterDecoration` would resolve to a
 *  `USymbolFolder` (`USymbols.ts`: `FOLDER`/`PACKAGE` are both
 *  `new USymbolFolder(...)`), i.e. exactly the shapes
 *  `class-namespace-shape.ts` already draws byte-exactly as plain strings.
 *  `USymbolFolder#asBig` is identical for both registry entries (`showTitle`
 *  only branches inside `asSmall`, `USymbolFolder.java:150-170`), so
 *  `<<Folder>>` needs no separate path either. */
function isFolderFamily(usymbol: string): boolean {
  return usymbol === 'package' || usymbol === 'folder';
}

/** `ClusterHeader#getTitleBlock`'s font, expressed as this codebase's
 *  `FontConfiguration` -- the SAME size/colour resolution
 *  `class-namespace-shape.ts#titleFont`/`titleFontColor` already establish
 *  for the folder path (and that `class-namespace-title-table.ts` sizes the
 *  DOT label table with), so the two never disagree about the drawn glyphs. */
function clusterTitleFont(theme: Theme, fontColor: string): FontConfiguration {
  return {
    family: theme.fontFamily,
    size: theme.colors.elements?.package?.fontSize ?? theme.fontSize,
    color: fontColor,
    styles: TITLE_STYLES,
  };
}

/** {@link renderNamespaceUSymbol}'s already-resolved paint inputs -- bundled
 *  to stay inside this project's 5-parameter budget (the same
 *  `WrapLinkInfo`/`DecorateEntityImageParts` precedent
 *  `renderer-group.ts`/`core/svek/DecorateEntityImage.ts` use). */
export interface NamespaceUSymbolPaint {
  /** `Cluster#drawU`'s resolved back colour -- the group's own inline
   *  `#COLOR` override first, else the global package background
   *  (`Cluster.java:360-362`). CDD T18/D8: a `Paint`, matching the
   *  `ClusterDecoration#drawU` seam this feeds (which has taken
   *  `Paint | null` since it was ported) -- an inline `#yellow\gold`
   *  group colour is an `HColorGradient` upstream. */
  readonly backColor: Paint;
  /** `Cluster#drawU`'s resolved border colour (`Cluster.java:316-320`).
   *  cdd-B7FU-R3: widened `string` -> `Paint` -- `ClusterDecoration#drawU`
   *  already accepts `Paint | null` (never just `string`), and a per-
   *  element `<sname>BorderColor` override
   *  (`resolveClusterUSymbolPaint`) reads `ElementColors.border?: Paint`. */
  readonly borderColor: Paint;
  /** `Cluster#drawU`'s `rounded` (`:321-324`: `style.value(RoundCorner)`,
   *  forced to 0 under `skinParam.strictUmlStyle()`). */
  readonly roundCorner: number;
  /** Title text fill (`ClusterHeader#getTitleBlock`'s font colour). Kept a
   *  plain `string` (unlike `borderColor`): `clusterTitleFont`'s
   *  `FontConfiguration.color` has no gradient-fill text path (mirrors
   *  `usymbol-resolve.ts#textFontColor`'s identical string-only contract),
   *  so `resolveClusterUSymbolPaint` narrows a `Paint` `font` override to a
   *  plain string before assigning here, exactly as `textFontColor` does. */
  readonly fontColor: string;
}

/**
 * Draws one non-empty container's `USymbol#asBig` chrome, or `undefined`
 * when this namespace is not a USymbol container (no keyword, the folder
 * family, or a keyword that resolves to no `USymbol`) and the caller should
 * fall through to the folder/rect path.
 *
 * Byte-verified against `dativu-93-pona469`'s cached oracle: `package foo
 * <<Node>>` at box `(16,6,150,102)` emits exactly `<polygon points=
 * "16,16,26,6,166,6,166,98,156,108,16,108,16,16" fill="none" style=
 * "stroke:#181818;stroke-width:1;..."/>` + the three `<line>`s
 * `USymbolNode#drawNode` (`USymbolNode.java:71-92`) draws + `<text
 * x="77.288" y="29.889" ... font-weight="700">foo</text>` -- 5 children,
 * matching the jar's own cluster child count.
 *
 * `extraDefs` (gradient `<linearGradient>` blocks, when a package colour is
 * a two-colour gradient) is prepended to the body, matching
 * `core/usymbol-shapes.ts#filledPath`'s established convention for the same
 * situation (`svgRoot` dedupes them).
 */
function buildDecoration(
  geo: NamespaceGeo,
  symbol: UpstreamUSymbol,
  titleFont: FontConfiguration,
  scaleK: number,
): ClusterDecoration {
  // cdd-T26 residual round (`daxeno-00-kasu166`): `buildTextBlock`'s own
  // multi-line split (`EntityImageDescriptionTextBlock.ts`) is a real
  // newline-CHARACTER split (`text.split('\n')`) — `geo.label` carries the
  // `Display#getWithNewlines` `\n` ESCAPE (a literal backslash-n pair,
  // `ClusterHeader.java:115-142#getTitleBlock` receives an already-split
  // `Display` at PARSE time; this port has none for a namespace label, see
  // `class-namespace-title-runs.ts#namespaceTitleLines`'s own doc comment
  // for the identical gap on the folder/rect paths). Converting the escape
  // to a real newline BEFORE `buildTextBlock` sees it reuses that already
  // jar-verified multi-line/multi-font-size stacking machinery unchanged —
  // no new stacking math needed here, unlike the plain-string paths.
  //
  // cdd-B7FU-R3: alignment CENTER, not LEFT -- `ClusterHeader#getTitleBlock`
  // (`java:125`) reads `style.getHorizontalAlignment()` off the title-scoped
  // signature (`{root, element, <diagram>, uSymbol.getSNames(), composite,
  // title}`), which `plantuml.skin:94-98`'s `element { composite,package {
  // title { HorizontalAlignment center } } }` selector matches as a
  // subsequence regardless of the diagram/uSymbol components in between --
  // `TITLE_STYLES`'s BOLD below is that SAME selector's `FontStyle bold`.
  // Jar-verified `daxeno-00-kasu166`'s two-line `<<Database>>` cluster title
  // ("styled2" 18px / "should be styled" 14px): the narrower line's `@x` sits
  // exactly half the width delta right of the wider line's `@x`
  // (162.701-144.495=18.206 == (93.45-57.037)/2), i.e. each line centered
  // within the merged block -- LEFT drew both lines flush at the SAME `@x`.
  // Every other USymbol-cluster fixture in the corpus has a single-line
  // title, where LEFT and CENTER produce byte-identical output (the one line
  // spans the block's own full measured width), so this was invisible until
  // a multi-line title existed to distinguish the two.
  const title = buildTextBlock(splitDisplayLines(geo.label).lines.join('\n'), titleFont, HorizontalAlignment.CENTER);
  // `ClusterHeader#getStereoBlock` is empty here by construction: a
  // stereotype that NAMES a USymbol is consumed AS the shape and never
  // stored for display (`CommandPackage.java:178-191`'s `if (stereotype !=
  // null && usymbol == null) p.setStereotype(...)`, mirrored by
  // `class-container.ts#setNamespaceStereotype`'s gated branch).
  return new ClusterDecoration(
    null,
    symbol,
    title,
    TextBlockUtils.empty(0, 0),
    { position: new UTranslate(geo.x, geo.y), width: geo.width, height: geo.height },
    // cdd-B8FU: GROUP_STROKE_WIDTH is a raw literal (jar's unscaled
    // thickness-1 default); `geo.x/y/width/height` are already scaled
    // (`scaleNamespaceGeo`), so the stroke needs its own scaleK factor.
    UStroke.withThickness(GROUP_STROKE_WIDTH * scaleK),
  );
}

/**
 * cdd-B7FU-R3 (`daxeno-00-kasu166`'s `skinparam database { BackgroundColor
 * yellow; border { color grey }; Font { Color LightGrey } }`): `Cluster
 * .java:358-364`'s `getStyle()` builds the style signature with the
 * USymbol's OWN `SName` appended (`getDefaultStyleDefinition(diagramType,
 * uSymbol, groupType)` -> `{root, element, <diagram>, group, database}`),
 * so a `skinparam <keyword> { ... }` element-bucket override (already
 * resolved into `theme.colors.elements[keyword]` by `skinparam-key-
 * handlers.ts`'s generic per-element cascade) OUTRANKS the generic
 * `plantuml.skin:102-104` `group { BackGroundColor transparent;
 * LineThickness 1.0 }` default this module's caller (`renderer.ts
 * #renderNamespace`) resolves into `paint` -- exactly the same "specific
 * tier, else the caller's fallback" cascade `resolveElementPaint` (`theme-
 * element-resolve.ts`) already applies for the LEAF path (`renderer-
 * usymbol-entity.ts#buildUSymbolEntityParams`), inlined here (not called)
 * because `resolveElementPaint`'s OWN fallback tier (`nodeBackground`/
 * `theme.colors.border`/`theme.colors.text`) is the WRONG default for a
 * cluster -- `dativu-93-pona469`'s unstyled `<<Node>>` cluster (T12,
 * jar-verified) must keep drawing with the generic group default
 * (`theme.colors.border` at thickness 1, transparent fill), not
 * `resolveElementPaint`'s leaf-scoped fallback.
 *
 * Inline `package "X" #yellow <<Database>>` (`Cluster#drawU`'s `group
 * .getColors().getColor(ColorType.BACK)`, `NamespaceGeo.color`) outranks
 * BOTH tiers for the background -- already encoded into `paint.backColor`
 * by the caller (`namespaceFill`'s own `geo.color ?? ...` cascade), so the
 * element-bucket override is applied ONLY when `geo.color` is unset (no
 * inline override to protect). No inline border/font-color carry exists on
 * `NamespaceGeo` (T12's own "not modeled" note, `.agent-notes/cdd-T12.md`),
 * so those two roles apply the element-bucket override unconditionally.
 */
function resolveClusterUSymbolPaint(theme: Theme, geo: NamespaceGeo, keyword: string, fallback: NamespaceUSymbolPaint): NamespaceUSymbolPaint {
  const specific = theme.colors.elements?.[keyword];
  const backColor = geo.color === undefined && specific?.background !== undefined ? specific.background : fallback.backColor;
  const borderColor = specific?.border ?? fallback.borderColor;
  const fontColor = typeof specific?.font === 'string' ? specific.font : fallback.fontColor;
  return { backColor, borderColor, roundCorner: fallback.roundCorner, fontColor };
}

export function renderNamespaceUSymbol(
  geo: NamespaceGeo,
  theme: ScaledTheme,
  measurer: StringMeasurer,
  paint: NamespaceUSymbolPaint,
): string | undefined {
  const keyword = geo.usymbol;
  if (keyword === undefined || isFolderFamily(keyword)) return undefined;
  const symbol = resolveDescriptionUSymbol(
    keyword,
    resolveActorStyle(theme.actorStyle),
    mapComponentStyle(theme.componentStyle),
  );
  if (symbol === null) return undefined;

  const resolvedPaint = resolveClusterUSymbolPaint(theme, geo, keyword, paint);
  const decoration = buildDecoration(geo, symbol, clusterTitleFont(theme, resolvedPaint.fontColor), theme.scaleK);
  const fragment = renderDrawableToFragment(
    {
      drawU(ug) {
        decoration.drawU(
          ug,
          resolvedPaint.backColor,
          resolvedPaint.borderColor,
          0,
          resolvedPaint.roundCorner,
          HorizontalAlignment.LEFT,
          HorizontalAlignment.CENTER,
          0,
        );
      },
    },
    { width: geo.x + geo.width, height: geo.y + geo.height, measurer, uid: geo.id },
  );
  return (fragment.extraDefs ?? '') + fragment.body;
}
