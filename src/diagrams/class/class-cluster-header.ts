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
 * Not modelled: a sprite stereotype (`stereotype.getSprite(skinParam)`,
 * `ClusterHeader.java:199-201`) and user `skinparam legend*`/`<style>
 * legend` overrides on a GROUP legend (this layer sees only the `Theme`, not
 * the skinparam map `index.ts#applyAnnotationChrome` resolves the root
 * legend's style from) -- no corpus fixture combines either with a group.
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
import { text } from '../../core/svg.js';
import { escapeComment } from '../../core/svg-format.js';
import {
  isStereotypeLabelHidden,
  splitStereotypeLabels,
  wrapGuillemet,
  type GuillemetPair,
} from './class-stereotype.js';
import { titleFontColor } from './class-namespace-shape.js';

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
 */
export function visibleNamespaceStereotypeLabels(
  ns: Namespace,
  directives: readonly HideStereotypeDirective[],
): string[] {
  if (ns.stereotype === undefined) return [];
  return splitStereotypeLabels(ns.stereotype).filter((l) => !isStereotypeLabelHidden(l, directives));
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
function stereoFont(theme: Theme): FontSpec {
  const size = theme.colors.elements?.package?.fontSize ?? theme.fontSize;
  return { family: theme.fontFamily, size, style: 'italic' };
}

/**
 * `getStereoBlockWithoutLegend`: one line per visible label, each centred
 * in the block's own width (`getTitleHorizontalAlignment()` is CENTER for a
 * class package title, `plantuml.skin:94-98`). `undefined` == `empty(0,0)`.
 */
function buildStereoText(ns: Namespace, ast: ClassDiagramAST, theme: Theme, measurer: StringMeasurer) {
  const labels = visibleNamespaceStereotypeLabels(ns, ast.hideStereotypeDirectives ?? []);
  if (labels.length === 0) return undefined;
  const font = stereoFont(theme);
  const guillemet = resolveGuillemet(theme);
  const lines = labels.map((l) => {
    const content = wrapGuillemet(l, guillemet);
    return { content, ...measurer.measure(content, font) };
  });
  const width = Math.max(...lines.map((l) => l.width));
  let y = 0;
  let body = '';
  for (const line of lines) {
    const baseline = y + line.height - measurer.getDescent(font, line.content);
    body += text((width - line.width) / 2, baseline, line.content, {
      fontFamily: font.family,
      fontSize: font.size,
      fontStyle: 'italic',
      fill: titleFontColor(theme),
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
