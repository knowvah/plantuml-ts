/**
 * Salt diagram plugin — `PSystemSaltFactory` (parse), then
 * `TextBlockExporter`'s export of `PSystemSalt#getTextBlock` on the klimt
 * substrate: canvas = the text block's dimension plus `same(5)`
 * (`PSystemSalt#getDefaultMargins`), the block drawn translated by the
 * top-left margin, `scale`/`dpi` resolved against that final dimension
 * (TextBlockExporter.java:159-209). Mirrors the mindmap plugin's shape
 * (`src/diagrams/mindmap/index.ts`).
 *
 * `getTextBlock` runs ONCE per render, as upstream's `UgDiagram#getExporter`
 * calls it once (UgDiagram.java:123-128): it re-runs `manageSprite` (which
 * may set the scale) and builds a fresh element tree, and its root's
 * `drawU` mutates (`ElementMenuBar`'s z-index-1 background), so a second
 * draw is not a no-op. The `LimitFinder` ink pass a mainframe needs runs
 * first, as `DiagramChromeFactory.create` does before the export draws.
 *
 * With chrome (title/caption/legend/header/footer/mainframe) the fragment is
 * the raw block around `BODY_ANCHOR` and carries its `calculateMargin`
 * result as `exportMargin`: chrome composes around the raw block and
 * `core/TextBlockExporter.ts#finalizeTitledDiagramFragment` applies the
 * margin and `scale` after (UgDiagram.java:123-131), as for mindmap.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/PSystemSaltFactory.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:153-209
 */
import { isDisplayPositionedNull, isEmpty } from '../../core/annotations/index.js';
import type { InkBox } from '../../core/annotations/body-ink.js';
import { addWarnings } from '../../core/annotations/WarningBannerBlock.js';
import type { RenderFragment, SyncPlugin } from '../../core/dispatcher.js';
import { ColorMapper, toSvgPaint } from '../../core/klimt/color/ColorMapper.js';
import { fromString as colorOrderFromString } from '../../core/klimt/color/ColorOrder.js';
import { extractFlatContent, extractViewBoxDims, VERSION_PLACEHOLDER } from '../../core/klimt/document-shell.js';
import { UGraphicHandwritten } from '../../core/klimt/drawing/hand/UGraphicHandwritten.js';
import type { StringBounder as DriverStringBounder } from '../../core/klimt/drawing/svg/driver-text-svg.js';
import { lengthAdjustOverride } from '../../core/klimt/drawing/svg/svg-option.js';
import { basicSvgOption } from '../../core/klimt/drawing/svg/svg-graphics-core.js';
import { UGraphicSvg } from '../../core/klimt/drawing/svg/u-graphic-svg.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import type { ClockwiseTopRightBottomLeft } from '../../core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import { TextBlockUtils } from '../../core/klimt/shape/TextBlockUtils.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { resolveScaleFactor } from '../../core/scale-command.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import { BODY_ANCHOR } from '../../core/TextBlockExporter.js';
import type { PSystemSalt } from './PSystemSalt.js';
import { createSaltDiagram } from './PSystemSaltFactory.js';

/** `DiagramType.SALT.name()`, the root `data-diagram-type` value.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:292-294 */
const DIAGRAM_TYPE_SALT = 'SALT';

/** The parsed diagram and the measurer its text is sized with. */
export interface SaltGeometry {
  readonly diagram: PSystemSalt;
  readonly measurer: StringMeasurer;
}

/** The width-only driver half of `UGraphicSvg`'s two text seams (the
 *  mindmap plugin's local adapter). */
function driverBounderFor(measurer: StringMeasurer): DriverStringBounder {
  return {
    calculateDimension(font, text) {
      return { width: measurer.measure(text, font).width };
    },
  };
}

/** `fileFormatOption.getDefaultStringBounder(...)` (PSystemSalt.java:114). */
function stringBounderFor(measurer: StringMeasurer): StringBounder {
  return UGraphicSvg.build(
    0,
    basicSvgOption(),
    VERSION_PLACEHOLDER,
    driverBounderFor(measurer),
    measurer,
  ).getStringBounder();
}

/** `SkinParam.isDark`: `"dark".equalsIgnoreCase(getValue("mode"))`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/SkinParam.java:114-116 */
function isDark(diagram: PSystemSalt): boolean {
  return diagram.getSkinParam().getValue('mode')?.toLowerCase() === 'dark';
}

/** `reversecolor`'s arms: `dark` (any case) is `LIGTHNESS_INVERSE`, a
 *  `ColorOrder` name is `reverse(order)`, anything else (or unset) `init`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java:300-313 */
function reverseColorMapper(reversecolor: string | null | undefined): ColorMapper {
  if (reversecolor === null || reversecolor === undefined) return ColorMapper.IDENTITY;
  if (reversecolor.toLowerCase() === 'dark') return ColorMapper.LIGTHNESS_INVERSE;
  const order = colorOrderFromString(reversecolor);
  return order === undefined ? ColorMapper.IDENTITY : ColorMapper.reverse(order);
}

/**
 * `TitledDiagram#muteColorMapper(init)` with `init` the identity (the
 * `FileFormatOption` default): `mode dark`, else `monochrome true|reverse`,
 * else the `reversecolor` arms. The klimt `UGraphicSvg` carries the result
 * (`fileFormatOption.withColorMapper(mutedMapper)`, UgDiagram.java:134-135;
 * `UGraphicSvg.java:91`) and maps every drawn colour and the background with it.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java:291-313
 */
function muteColorMapper(diagram: PSystemSalt): ColorMapper {
  if (isDark(diagram)) return ColorMapper.DARK_MODE;
  const monochrome = diagram.getSkinParam().getValue('monochrome');
  if (monochrome === 'true') return ColorMapper.MONOCHROME;
  if (monochrome === 'reverse') return ColorMapper.MONOCHROME_REVERSE;
  return reverseColorMapper(diagram.getSkinParam().getValue('reversecolor'));
}

/** `TitledDiagram#isHandwritten`: `skinParam.handwritten()`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java:113-118 */
function isHandwritten(diagram: PSystemSalt): boolean {
  return diagram.getSkinParam().getValue('handwritten')?.toLowerCase() === 'true';
}

/** One klimt pass over the text block. */
interface DrawPass {
  readonly textBlock: TextBlock;
  readonly minDim: XDimension2D;
  readonly scale: number;
  readonly translate: UTranslate;
}

function svgGraphic(diagram: PSystemSalt, measurer: StringMeasurer, pass: DrawPass): UGraphicSvg {
  const option = basicSvgOption({
    minDim: { width: pass.minDim.getWidth(), height: pass.minDim.getHeight() },
    backcolor: diagram.calculateBackColor(),
    colorMapper: muteColorMapper(diagram),
    scale: pass.scale,
    rootAttributes: new Map([['data-diagram-type', DIAGRAM_TYPE_SALT]]),
    // lad-T2e: `TextBlockExporter.java:306-307`.
    ...lengthAdjustOverride(diagram.getSkinParam().getlengthAdjust()),
  });
  return UGraphicSvg.build(0, option, VERSION_PLACEHOLDER, driverBounderFor(measurer), measurer);
}

/** The text block drawn per `pass` (TextBlockExporter.java:165-176): the
 *  margin translate, then `UGraphicHandwritten` when handwritten. */
function drawSvg(diagram: PSystemSalt, measurer: StringMeasurer, pass: DrawPass): string {
  const ug = svgGraphic(diagram, measurer, pass);
  let drawn: UGraphic = ug.apply(pass.translate);
  if (isHandwritten(diagram)) drawn = new UGraphicHandwritten(drawn);
  pass.textBlock.drawU(drawn);
  return ug.getSvgString();
}

/**
 * Draws the text block per `pass` and unwraps the document to a fragment
 * whose body is the flat drawing (no content `<g>`). The klimt graphic maps
 * every colour, background included, once (SvgGraphics.java:176-188); the
 * fragment's `background` is that same `backcolor.toSvg(mapper)`.
 * @see TextBlockExporter.java:159-176
 */
function drawFragment(diagram: PSystemSalt, measurer: StringMeasurer, pass: DrawPass): RenderFragment {
  const backcolor = toSvgPaint(diagram.calculateBackColor(), muteColorMapper(diagram));
  const svg = drawSvg(diagram, measurer, pass);
  const { width, height } = extractViewBoxDims(svg);
  const { body, extraDefs } = extractFlatContent(svg);
  const fragment: RenderFragment = { body, width, height, diagramType: DIAGRAM_TYPE_SALT };
  const withBackground = typeof backcolor === 'string' ? { ...fragment, background: backcolor } : fragment;
  const withDefs = extraDefs.length > 0 ? { ...withBackground, extraDefs } : withBackground;
  const lengthAdjust = diagram.getSkinParam().getlengthAdjust();
  return lengthAdjust === undefined ? withDefs : { ...withDefs, lengthAdjust };
}

/** `TextBlockUtils.getMinMax(block, sb, false)`: the ink a mainframe
 *  frames (`DiagramChromeFactory.java:332-337`). */
function textBlockInk(textBlock: TextBlock, stringBounder: StringBounder): InkBox {
  const minMax = TextBlockUtils.getMinMax(textBlock, stringBounder, false);
  return { minX: minMax.getMinX(), minY: minMax.getMinY(), maxX: minMax.getMaxX(), maxY: minMax.getMaxY() };
}

/**
 * `TextBlockExporter.Builder#calculateMargin`: the merged `{root, document}`
 * style's `Margin` when it has one, else `getDefaultMargins()` (`same(5)`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:510-516
 */
function calculateMargin(diagram: PSystemSalt): ClockwiseTopRightBottomLeft {
  const style = StyleSignatureBasic.of('root', 'document').getMergedStyle(
    diagram.getSkinParam().getCurrentStyleBuilder(),
  );
  if (style?.hasValue('Margin') === true) return style.getMargin();
  return diagram.getDefaultMargins();
}

/** The block `TextBlockExporter` exports: `addWarnings(getTextBlock)`, its
 *  dimension, and the `calculateMargin` result. */
interface ExportedBlock {
  readonly textBlock: TextBlock;
  readonly dim: XDimension2D;
  readonly margin: ClockwiseTopRightBottomLeft;
}

/**
 * `TextBlockExporter#exportTo` for SVG, no chrome: `calculateFinalDimension`
 * (the text block plus the margins, java:198-202) as `minDim`, the scale
 * resolved against it (`computeScaleFactor`, java:205-209), the margin
 * translate (java:173), then `textBlock.drawU`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:159-209
 */
function exportTextBlock(diagram: PSystemSalt, measurer: StringMeasurer, block: ExportedBlock): RenderFragment {
  const { textBlock, dim, margin } = block;
  const minDim = new XDimension2D(
    dim.getWidth() + margin.getLeft() + margin.getRight(),
    dim.getHeight() + margin.getTop() + margin.getBottom(),
  );
  const scale = resolveScaleFactor(
    diagram.scale,
    minDim.getWidth(),
    minDim.getHeight(),
    diagram.getSkinParam().getDpi(),
  );
  const translate = new UTranslate(margin.getLeft(), margin.getTop());
  return drawFragment(diagram, measurer, { textBlock, minDim, scale, translate });
}

/**
 * With chrome, upstream decorates the RAW block (`UgDiagram#getExporter` →
 * `addChrome`, UgDiagram.java:123-131) and exports the result with the margin
 * and scale (TextBlockExporter.java:159-209). The chrome is composed outside
 * klimt here, so the fragment is the raw block's dimension around
 * `BODY_ANCHOR`, carrying the margin, `scale` and `dpi` for
 * `core/TextBlockExporter.ts#finalizeTitledDiagramFragment`, which calls
 * `drawBodyAt` once with the resolved factor and the anchor's translate —
 * the mindmap plugin's shape (`src/diagrams/mindmap/index.ts#rawTextBlock`).
 * The first pass draws no block (salt's only gradient is the background): it
 * supplies the background and `<defs>`, and the element tree is drawn once,
 * as upstream draws it once (its `drawU` mutates, see the file header).
 */
function rawTextBlock(
  diagram: PSystemSalt,
  measurer: StringMeasurer,
  block: ExportedBlock,
  frameInk: { frameInk?: InkBox },
): RenderFragment {
  const { textBlock, dim, margin } = block;
  const noTranslate = new UTranslate(0, 0);
  const background = drawFragment(diagram, measurer, {
    textBlock: TextBlockUtils.EMPTY_TEXT_BLOCK,
    minDim: dim,
    scale: 1,
    translate: noTranslate,
  });
  const drawBodyAt = (scale: number, dx: number, dy: number): string =>
    drawFragment(diagram, measurer, { textBlock, minDim: dim, scale, translate: new UTranslate(dx, dy) }).body;
  const anchored: RenderFragment = {
    ...background,
    body: BODY_ANCHOR,
    width: dim.getWidth(),
    height: dim.getHeight(),
    dpi: diagram.getSkinParam().getDpi(),
    exportMargin: margin,
    drawBodyAt,
    ...frameInk,
  };
  return diagram.scale === undefined ? anchored : { ...anchored, scaleSpec: diagram.scale };
}

/** The diagram as the fragment `src/index.ts` chromes and assembles. */
export function renderSalt(diagram: PSystemSalt, measurer: StringMeasurer): RenderFragment {
  const stringBounder = stringBounderFor(measurer);
  // `DiagramChromeFactory.create`'s first step, `addWarnings` (DiagramChromeFactory.java:128).
  const textBlock = addWarnings(diagram.getTextBlock(stringBounder), diagram.getWarnings(), muteColorMapper(diagram));
  const block: ExportedBlock = {
    textBlock,
    dim: textBlock.calculateDimension(stringBounder),
    margin: calculateMargin(diagram),
  };
  if (isEmpty(diagram.annotations)) return exportTextBlock(diagram, measurer, block);
  const frameInk = isDisplayPositionedNull(diagram.annotations.mainFrame)
    ? {}
    : { frameInk: textBlockInk(textBlock, stringBounder) };
  return rawTextBlock(diagram, measurer, block, frameInk);
}

export const saltPlugin: SyncPlugin<PSystemSalt, SaltGeometry> = {
  type: 'salt',

  parse(source) {
    return createSaltDiagram(source);
  },

  layoutSync(ast, _theme, measurer) {
    return { diagram: ast, measurer };
  },

  render(geo) {
    return renderSalt(geo.diagram, geo.measurer);
  },
};
