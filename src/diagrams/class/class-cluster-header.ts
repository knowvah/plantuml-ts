/**
 * `ClusterHeader#getStereoBlock` for a class/object package cluster
 * (cdd2-T19b): the group's DISPLAYED stereotype merged with the group's OWN
 * legend into the one block `ClusterDecoration` draws as the cluster's
 * "stereotype" and `ClusterHeader`'s constructor sizes into
 * `titleAndAttributeWidth/Height` (the DOT label table).
 *
 * Upstream (`svek/ClusterHeader.java:173-220`):
 *
 *   getStereoBlock: stereo = getStereoBlockWithoutLegend(...);
 *     legend = g.getLegend(); if (legend == null || legend.isNull()) return stereo;
 *     legendBlock = EntityImageLegend.create(legend.getDisplay(), skinParam);
 *     return DecorateEntityImage.add(null, legendBlock, stereo,
 *         legend.getHorizontalAlignment(), legend.getVerticalAlignment());
 *
 *   getStereoBlockWithoutLegend: stereotype == null -> empty(0,0); the
 *     visible labels (`CucaDiagram#getVisibleStereotypeLabels`,
 *     `CucaDiagram.java:596-620`) empty -> empty(0,0); else
 *     `Display.create(visibleStereotypes).create(fontConfiguration,
 *     getTitleHorizontalAlignment(), skinParam)`.
 *
 * The block is built ONCE at layout time as a plain SVG string with its own
 * top-left at (0, 0) -- this engine's "measure once, at layout time"
 * convention (`NamespaceGeo.wtitle`) -- and placed by each draw site:
 * `USymbolFolder#asBig` (`class-namespace-shape.ts`), `USymbolRectangle
 * #asBig` (`packageStyle rect`), and every other `USymbol#asBig` through
 * {@link clusterHeaderStereoTextBlock} (`undefined` -> `TextBlockUtils.empty(0,
 * 0)`, `ClusterHeader.java:189`).
 *
 * A `<<$sprite>>` stereotype (`stereotype.getSprite(skinParam)`,
 * `ClusterHeader.java:199-201`) replaces the label block (cdd5-T5c,
 * {@link buildStereoSprite}); an SVG sprite there is not drawn (the block is a
 * pre-built string, and the SVG sprite path draws through a klimt
 * `UGraphic`) -- it degrades to the label block. Not modelled: user
 * `skinparam legend*`/`<style> legend` overrides on a GROUP legend (this
 * layer sees only the `Theme`, not the skinparam map
 * `index.ts#applyAnnotationChrome` resolves the root legend's style from) --
 * no corpus fixture combines it with a group.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/DecorateEntityImage.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/EntityImageLegend.java
 */
import type { Theme } from '../../core/theme.js';
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import type { ClassDiagramAST, HideStereotypeDirective, Namespace } from './ast.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { AnnotationBlock } from '../../core/annotations/index.js';
import { buildAnnotationBlock, getTextX } from '../../core/annotations/index.js';
import { isDisplayPositionedNull } from '../../core/annotations/model.js';
import { resolveAnnotationStyles } from '../../core/annotations/style.js';
import { shiftFragmentBody } from '../../core/annotations/coord-shift.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { VerticalAlignment } from '../../core/klimt/geom/VerticalAlignment.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { UComment } from '../../core/klimt/shape/UComment.js';
import { TextBlockUtils } from '../../core/klimt/shape/TextBlockUtils.js';
import { text, image } from '../../core/svg.js';
import { StereotypeDecoration, cutLabels, GUILLEMET_NONE } from '../../core/stereo/StereotypeDecoration.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import { getSpriteMonochrome, getSpriteColor4096 } from '../../core/sprite-registry.js';
import {
  spriteMonochromeAsLike,
  spriteToPngDataUri,
  spriteColor4096ToPngDataUri,
} from '../../core/klimt/sprite/sprite-raster.js';
import { escapeComment } from '../../core/svg-format.js';
import {
  isStereotypeLabelHidden,
  splitStereotypeStyleTags,
  wrapGuillemet,
  type GuillemetPair,
} from './class-stereotype.js';
import {
  clusterStereoFontColor,
  elementStereoFontColor,
  isNoPaint,
  isFolderFamilyUSymbol,
  DEFAULT_GROUP_FONT_COLOR,
} from './class-package-style.js';
import { packageTitleFontFamily, packageTitleFontSize } from './class-namespace-title-runs.js';

/** One composed header stereo block, top-left at (0, 0). */
export interface ClusterHeaderStereo {
  readonly width: number;
  readonly height: number;
  readonly body: string;
}

/**
 * `CucaDiagram#getVisibleStereotypeLabels` (`CucaDiagram.java:596-620`):
 * every label of the group's stereotype that no `hide|show [<<label>>]
 * stereotype` directive hides -- the SAME last-matching-rule fold
 * `class-stereotype.ts#isStereotypeLabelHidden` applies to classifiers.
 *
 * cdd5-T5c: a group's stereotype is `Stereotype.build(stereotype)`
 * (`CommandPackage.java:196`) -> `StereotypeDecoration.buildSimple`, which
 * keeps the label RAW, and `Stereotype#getLabels` is `cutLabels(label,
 * guillemet)` (`Stereotype.java:177-183`, `StereotypeDecoration.java:
 * 186-195`) -- no `($sprite)`/`(C)` decoration strip, unlike a classifier's
 * `buildComplex`. So an unresolved `<<$nope>>` still shows `«$nope»`.
 */
export function visibleNamespaceStereotypeLabels(
  ns: Namespace,
  directives: readonly HideStereotypeDirective[],
): string[] {
  if (ns.stereotype === undefined) return [];
  return cutLabels(`<<${ns.stereotype}>>`, GUILLEMET_NONE).filter((l) => !isStereotypeLabelHidden(l, directives));
}

/**
 * `Stereotype#getSprite` (`Stereotype.java:108-117`) for a group: the
 * `buildSimple` decoration's sprite (`<<$name>>`/`<<$name{scale=N}>>`,
 * `StereotypeDecoration.java:129-141`), drawn as `Sprite#asTextBlock(
 * getHtmlColor(), null, spriteScale, null)` -- `buildSimple` sets no colour.
 * A monochrome or 4096-colour sprite rasterises exactly as the classifier
 * badge sprite does (`class-layout-header-creole.ts#resolveBadgeSpriteImage`);
 * `SpriteMonochrome#asTextBlock` sizes it `getWidth() * scale` x
 * `getHeight() * scale` (`SpriteMonochrome.java:221-225`). `undefined` when
 * the name does not resolve (upstream's `null`, so the labels run).
 */
function buildStereoSprite(ns: Namespace, sprites: SpriteRegistry | undefined): ClusterHeaderStereo | undefined {
  if (ns.stereotype === undefined || sprites === undefined) return undefined;
  const deco = StereotypeDecoration.buildSimple(`<<${ns.stereotype}>>`);
  if (deco.spriteName === undefined) return undefined;
  const mono = getSpriteMonochrome(sprites, deco.spriteName);
  const color4096 = mono === undefined ? getSpriteColor4096(sprites, deco.spriteName) : undefined;
  const png =
    mono !== undefined
      ? spriteToPngDataUri(spriteMonochromeAsLike(mono), undefined, undefined, deco.spriteScale)
      : color4096 !== undefined
        ? spriteColor4096ToPngDataUri(color4096, deco.spriteScale)
        : undefined;
  if (png === undefined) return undefined;
  return { width: png.width, height: png.height, body: image(0, 0, png.width, png.height, png.dataUri) };
}

/** `skinparam guillemet` -- the same resolution
 *  `class-namespace-shape.ts#measureEmptyPackageLeafDim` applies. */
function resolveGuillemet(theme: Theme): GuillemetPair | undefined {
  const { guillemetStart: gs, guillemetEnd: ge } = theme.colors.graph;
  return gs === undefined && ge === undefined ? undefined : { start: gs ?? '«', end: ge ?? '»' };
}

/** `Cluster.getDefaultStyleDefinition(...).forStereotypeItself(...)`
 *  (`ClusterHeader.java:209-215`): `{root, element, classDiagram, package,
 *  group, stereotype}` -- `plantuml.skin:79-82`'s `stereotype { FontStyle
 *  italic }`, size/colour from the `package` element (the same bucket the
 *  cluster title reads). */
function stereoFont(theme: Theme, ns: Namespace): FontSpec {
  // cdd3-T21 (E3-5): `packageFontName` is a `{package_}` FontName
  // (`FromSkinparamToStyle.java:278`) the stereotype merge also matches;
  // `plantuml.skin:79-82`'s `stereotype {}` sets no FontName to outrank it.
  // A USymbol group's signature has no `package_` ({@link stereoFontColor}).
  const usymbolGroup = ns.usymbol !== undefined && !isFolderFamilyUSymbol(ns.usymbol);
  const family = usymbolGroup ? theme.fontFamily : packageTitleFontFamily(theme);
  return { family, size: packageTitleFontSize(theme), style: 'italic' };
}

/**
 * The stereo block's colour. `Cluster.getDefaultStyleDefinition` (`Cluster
 * .java:285-296`): a USymbol group's signature is `{..., group, <usymbol>}`
 * -- no `package_`, so no `package*` skinparam reaches it (jar gigoru-88's
 * `rectangle ... <<something4>>` stereo is `#000` under `packageFontColor
 * green`); the folder family keeps the package tiers
 * ({@link clusterStereoFontColor}).
 */
function stereoFontColor(ns: Namespace, theme: Theme): string {
  const tags = ns.stereotype === undefined ? [] : splitStereotypeStyleTags(ns.stereotype);
  if (ns.usymbol !== undefined && !isFolderFamilyUSymbol(ns.usymbol)) {
    // cdd6 T2a (D2): `forStereotypeItself` adds `stereotype` + the label to
    // `{..., group, <usymbol>}` (`ClusterHeader.java:211-213`), so the
    // by-stereo and `<usymbol> { stereotype { FontColor } }` tiers reach it
    // (jar catana-32 / noxebo-98 / cevoti-40 / juzica-68).
    return elementStereoFontColor(theme, ns.usymbol, tags) ?? DEFAULT_GROUP_FONT_COLOR;
  }
  return clusterStereoFontColor(theme, tags);
}

/**
 * `getStereoBlockWithoutLegend`: one line per visible label, each centred
 * in the block's own width (`getTitleHorizontalAlignment()` is CENTER for a
 * class package title, `plantuml.skin:94-98`). `undefined` == `empty(0,0)`.
 */
function buildStereoText(ns: Namespace, ast: ClassDiagramAST, theme: Theme, measurer: StringMeasurer) {
  // `ClusterHeader.java:199-201`: the sprite is tried before the labels.
  const sprite = buildStereoSprite(ns, ast.sprites);
  if (sprite !== undefined) return sprite;
  const labels = visibleNamespaceStereotypeLabels(ns, ast.hideStereotypeDirectives ?? []);
  if (labels.length === 0) return undefined;
  const font = stereoFont(theme, ns);
  const guillemet = resolveGuillemet(theme);
  const lines = labels.map((l) => {
    const content = wrapGuillemet(l, guillemet);
    return { content, ...measurer.measure(content, font) };
  });
  const width = Math.max(...lines.map((l) => l.width));
  // cdd3-T21 (E3-1/E3-2): the stereotype style's own colour; transparent
  // ink draws no text but keeps the block's size (`DriverTextSvg.java:92-94`).
  const fill = stereoFontColor(ns, theme);
  let y = 0;
  let body = '';
  for (const line of lines) {
    if (isNoPaint(fill)) {
      y += line.height;
      continue;
    }
    const baseline = y + line.height - measurer.getDescent(font, line.content);
    body += text((width - line.width) / 2, baseline, line.content, {
      fontFamily: font.family,
      fontSize: font.size,
      fontStyle: 'italic',
      fill,
      textLength: line.width,
    });
    y += line.height;
  }
  return { width, height: y, body };
}

/** `EntityImageLegend.create` -- `Style#createTextBlockBordered` with the
 *  `{root, root, document, classDiagram, legend}` style, the SAME bordered
 *  block the root legend draws (`core/annotations/blocks.ts`). */
function buildLegendBlock(ns: Namespace, theme: Theme, measurer: StringMeasurer): AnnotationBlock | undefined {
  const legend = ns.legend;
  if (legend === undefined || isDisplayPositionedNull(legend)) return undefined;
  const style = resolveAnnotationStyles(theme, new Map(), new Map()).legend;
  return buildAnnotationBlock('legend', legend.display!, style, measurer);
}

/** Body with its optional inline defs, `usymbol-shapes.ts#filledPath`'s
 *  prepend convention (`svgRoot` dedupes them). */
function withDefs(block: AnnotationBlock): string {
  return (block.extraDefs ?? '') + block.body;
}

/**
 * `ClusterHeader#getStereoBlock`: the stereo text alone, or
 * `DecorateEntityImage.add(null, legendBlock, stereo, hAlign, vAlign)` --
 * legend is the ORIGINAL (centred, `xImage = (total - legend) / 2`), the
 * stereo text sits above it for `VerticalAlignment.TOP` and below it
 * otherwise, x per `getTextX(..., hAlign)`; width = max, height = sum
 * (`DecorateEntityImage.java:84-160`). `undefined` when both are empty.
 */
export function buildClusterHeaderStereo(
  ns: Namespace,
  ast: ClassDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
): ClusterHeaderStereo | undefined {
  const stereo = buildStereoText(ns, ast, theme, measurer);
  const legend = buildLegendBlock(ns, theme, measurer);
  if (legend === undefined) return stereo;
  const text2 = stereo ?? { width: 0, height: 0, body: '' };
  const width = Math.max(legend.width, text2.width);
  const height = legend.height + text2.height;
  const top = ns.legend!.verticalAlignment === VerticalAlignment.TOP;
  const halign = ns.legend!.horizontalAlignment ?? HorizontalAlignment.CENTER;
  const xText = getTextX(text2, { width, height }, halign);
  const legendBody = shiftFragmentBody(withDefs(legend), (width - legend.width) / 2, top ? text2.height : 0);
  const stereoBody = shiftFragmentBody(text2.body, xText, top ? 0 : legend.height);
  return { width, height, body: top ? stereoBody + legendBody : legendBody + stereoBody };
}

/** Comment token the klimt draw leaves where the header belongs. */
const MARKER = 'cdd2 cluster header stereo';
/** {@link MARKER} as the XML writer serializes a `UComment`. */
const MARKER_COMMENT = '<!--' + escapeComment(MARKER) + '-->';

/**
 * The header as the klimt `TextBlock` `ClusterDecoration`/`USymbol#asBig`
 * consumes (`class-namespace-usymbol-shape.ts`): it reports the block's
 * dimensions so every `asBig` positions title and stereo exactly as
 * upstream, and at draw time records its translate and leaves a comment
 * marker in draw order; {@link spliceClusterHeaderStereo} then replaces the
 * marker with the pre-built string body at that translate.
 */
export function clusterHeaderStereoTextBlock(header: ClusterHeaderStereo | undefined): {
  block: TextBlock;
  splice(svg: string): string;
} {
  if (header === undefined) return { block: TextBlockUtils.empty(0, 0), splice: (svg) => svg };
  let dx = 0;
  let dy = 0;
  const block: TextBlock = {
    drawU(ug: UGraphic): void {
      dx = ug.getTranslate().getDx();
      dy = ug.getTranslate().getDy();
      ug.draw(new UComment(MARKER));
    },
    calculateDimension(): XDimension2D {
      return new XDimension2D(header.width, header.height);
    },
  };
  return {
    block,
    splice: (svg) => svg.replace(MARKER_COMMENT, shiftFragmentBody(header.body, dx, dy)),
  };
}
