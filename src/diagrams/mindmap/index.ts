/**
 * Mindmap diagram plugin — `MindMapDiagramFactory` (parse, with the style
 * engine built from the block's own skin/skinparam/`<style>` sources, D2),
 * then `TextBlockExporter`'s export of `MindMapDiagram#getTextBlock` on the
 * klimt substrate (D3): canvas = the text block's dimension plus the
 * `TitledDiagram` margins, the block drawn translated by the top-left
 * margin, `scale`/`dpi` resolved against that final dimension.
 *
 * The drawn document is handed back as a `RenderFragment` carrying
 * `diagramType: 'MINDMAP'` so title/caption/legend/header/footer/mainframe
 * compose through the shared chrome step (`src/index.ts` →
 * `annotations/chrome.ts#applyChrome`) and `assemble-svg.ts` stamps the
 * root `data-diagram-type` (TextBlockExporter.java:292-294, D5).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/MindMapDiagramFactory.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:153-203
 */
import { isDisplayPositionedNull, isEmpty } from '../../core/annotations/index.js';
import { addWarnings } from '../../core/annotations/WarningBannerBlock.js';
import type { RenderFragment, SyncPlugin } from '../../core/dispatcher.js';
import { extractFlatContent, extractViewBoxDims, VERSION_PLACEHOLDER } from '../../core/klimt/document-shell.js';
import type { StringBounder as DriverStringBounder } from '../../core/klimt/drawing/svg/driver-text-svg.js';
import { UGraphicHandwritten } from '../../core/klimt/drawing/hand/UGraphicHandwritten.js';
import { basicSvgOption } from '../../core/klimt/drawing/svg/svg-graphics-core.js';
import { UGraphicSvg } from '../../core/klimt/drawing/svg/u-graphic-svg.js';
import { ColorMapper, mapPaint } from '../../core/klimt/color/ColorMapper.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { resolveScaleFactor } from '../../core/scale-command.js';
import { BODY_ANCHOR } from '../../core/TextBlockExporter.js';
import { TextBlockUtils } from '../../core/klimt/shape/TextBlockUtils.js';
import type { InkBox } from '../../core/annotations/body-ink.js';
import { createMindMapDiagram } from './MindMapDiagramFactory.js';
import type { MindMapDiagram } from './MindMapDiagram.js';

/** `DiagramType.MINDMAP.name()`, the root `data-diagram-type` value.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:292-294 */
const DIAGRAM_TYPE_MINDMAP = 'MINDMAP';

/** The parsed diagram and the measurer its text is sized with. */
export interface MindMapGeometry {
  readonly diagram: MindMapDiagram;
  readonly measurer: StringMeasurer;
}

/** The width-only driver half of `UGraphicSvg`'s two text seams — the same
 *  local adapter `document-shell-fragment.ts#driverBounderFor` defines. */
function driverBounderFor(measurer: StringMeasurer): DriverStringBounder {
  return {
    calculateDimension(font, text) {
      return { width: measurer.measure(text, font).width };
    },
  };
}

function textBlockDimension(diagram: MindMapDiagram, measurer: StringMeasurer): XDimension2D {
  const probe = UGraphicSvg.build(0, basicSvgOption(), VERSION_PLACEHOLDER, driverBounderFor(measurer), measurer);
  return exportedTextBlock(diagram).calculateDimension(probe.getStringBounder());
}

/**
 * `TitledDiagram#muteColorMapper` over the export's `ColorMapper.IDENTITY`
 * (`FileFormatOption`'s default): `mode dark` → `DARK_MODE`, `monochrome
 * true` → `MONOCHROME`, `monochrome reverse` → `MONOCHROME_REVERSE`. The
 * `reversecolor` arms (java:300-311, `LIGTHNESS_INVERSE` /
 * `ColorMapper.reverse(ColorOrder)`) are not ported and fall to the
 * identity.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java:291-311
 */
/** `TextBlockUtils.getMinMax(original, sb, false)` over the raw text block --
 *  the ink `DiagramChromeFactory.decorateWithFrame` frames it by
 *  (`DiagramChromeFactory.java:329-335`; `BigFrame.java:81,89`). It cannot be
 *  read back from the serialized body: every `TextBlockMarged` around an idea
 *  box draws a `UEmpty` of its margined size (`TextBlockMarged.java:77-79`),
 *  which `LimitFinder` counts (`:drawEmpty`) and the SVG never shows. */
function textBlockInk(diagram: MindMapDiagram, measurer: StringMeasurer): InkBox {
  const probe = UGraphicSvg.build(0, basicSvgOption(), VERSION_PLACEHOLDER, driverBounderFor(measurer), measurer);
  const minMax = TextBlockUtils.getMinMax(exportedTextBlock(diagram), probe.getStringBounder(), false);
  return { minX: minMax.getMinX(), minY: minMax.getMinY(), maxX: minMax.getMaxX(), maxY: minMax.getMaxY() };
}

function muteColorMapper(diagram: MindMapDiagram): ColorMapper {
  const skinParam = diagram.getSkinParam();
  if (skinParam.getValue('mode')?.toLowerCase() === 'dark') return ColorMapper.DARK_MODE;
  const monochrome = skinParam.getValue('monochrome');
  if (monochrome === 'true') return ColorMapper.MONOCHROME;
  if (monochrome === 'reverse') return ColorMapper.MONOCHROME_REVERSE;
  return ColorMapper.IDENTITY;
}

/**
 * `TitledDiagram#isHandwritten`: `skinParam.handwritten()` — `isTrue`, i.e.
 * `"true".equalsIgnoreCase(getValue("handwritten"))` — else
 * `UgDiagram#isHandwritten`'s `!option handwritten true`, which this port's
 * mindmap does not see (the factory's `PreprocessingArtifact` is a fresh,
 * empty one).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java:114-119
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/SkinParam.java:347-353,1075-1078
 */
function isHandwritten(diagram: MindMapDiagram): boolean {
  return diagram.getSkinParam().getValue('handwritten')?.toLowerCase() === 'true';
}

/**
 * The block the export draws before the string-composed chrome:
 * `DiagramChromeFactory.create`'s first step, `addWarnings`
 * (DiagramChromeFactory.java:128), over `getTextBlock`. A no-op (the same
 * block) when the diagram has no warning.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java:469-477
 */
function exportedTextBlock(diagram: MindMapDiagram): TextBlock {
  return addWarnings(diagram.getTextBlock(), diagram.getWarnings(), muteColorMapper(diagram));
}

/** One klimt pass over the text block: `minDim`, `scale`, and where the
 *  block is drawn. */
interface DrawPass {
  readonly minDim: XDimension2D;
  readonly scale: number;
  readonly translate: UTranslate;
}

/** Draws the text block per `pass` and unwraps the document to a fragment
 *  sized by `size` (the viewBox when undefined). The graphic's seed only
 *  names gradient/shadow ids, which `assemble-svg.ts#assembleSvg` re-mints
 *  from the block's own seed.
 *
 *  The background goes through the muted colour mapper
 *  (`backcolor.toSvg(option.getColorMapper())`, SvgGraphics.java:176-188).
 *  After the translate, `if (isHandwritten) ug = new UGraphicHandwritten(ug)`
 *  (TextBlockExporter.java:173-175), so the warnings banner jiggles too. */
function drawFragment(diagram: MindMapDiagram, measurer: StringMeasurer, pass: DrawPass): RenderFragment {
  const backcolor = mapPaint(diagram.calculateBackColor(), muteColorMapper(diagram));
  const option = basicSvgOption({
    minDim: { width: pass.minDim.getWidth(), height: pass.minDim.getHeight() },
    backcolor,
    scale: pass.scale,
    rootAttributes: new Map([['data-diagram-type', DIAGRAM_TYPE_MINDMAP]]),
  });
  const ug = UGraphicSvg.build(0, option, VERSION_PLACEHOLDER, driverBounderFor(measurer), measurer);
  let drawn: UGraphic = ug.apply(pass.translate);
  if (isHandwritten(diagram)) drawn = new UGraphicHandwritten(drawn);
  exportedTextBlock(diagram).drawU(drawn);

  const svg = ug.getSvgString();
  const { width, height } = extractViewBoxDims(svg);
  const { body, extraDefs } = extractFlatContent(svg);
  const fragment: RenderFragment = { body, width, height, diagramType: DIAGRAM_TYPE_MINDMAP };
  const withBackground = typeof backcolor === 'string' ? { ...fragment, background: backcolor } : fragment;
  return extraDefs.length > 0 ? { ...withBackground, extraDefs } : withBackground;
}

/**
 * `TextBlockExporter#exportTo` for SVG, no chrome: `calculateFinalDimension`
 * (the text block plus the margins, java:198-202) as `minDim`, the scale
 * resolved against it (`computeScaleFactor`, java:205-209), the margin
 * translate (java:173), then `textBlock.drawU`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:159-176
 */
function exportTextBlock(diagram: MindMapDiagram, measurer: StringMeasurer): RenderFragment {
  const dim = textBlockDimension(diagram, measurer);
  const margin = diagram.getDefaultMargins();
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
  return drawFragment(diagram, measurer, {
    minDim,
    scale,
    translate: new UTranslate(margin.getLeft(), margin.getTop()),
  });
}

/**
 * With chrome, upstream decorates the RAW text block
 * (`TitledDiagram#addChrome` → `DiagramChromeFactory.create`) and only then
 * exports it with the margins, drawing the whole chromed document through
 * ONE `UGraphic` carrying `option.scale` (TextBlockExporter.java:159-176).
 * The chrome is composed outside klimt here, so the fragment is sized by
 * the raw block's exact `calculateDimension` and its body is only
 * `BODY_ANCHOR`: `applyChrome` composes around it, and
 * `core/TextBlockExporter.ts#finalizeTitledDiagramFragment` resolves the
 * factor against the chrome-included dimension (`computeScaleFactor` reads
 * `calculateFinalDimension()`, TextBlockExporter.java:184-188), then calls
 * `drawBodyAt` with it and the anchor's final translate — the block drawn
 * through klimt at that scale, so its numbers are rounded once. The first
 * pass at scale 1 only supplies the background and `<defs>`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java:469-477
 */
function rawTextBlock(diagram: MindMapDiagram, measurer: StringMeasurer): RenderFragment {
  const dim = textBlockDimension(diagram, measurer);
  const fragment = drawFragment(diagram, measurer, { minDim: dim, scale: 1, translate: new UTranslate(0, 0) });
  const drawBodyAt = (scale: number, dx: number, dy: number): string =>
    drawFragment(diagram, measurer, { minDim: dim, scale, translate: new UTranslate(dx, dy) }).body;
  const anchored: RenderFragment = {
    ...fragment,
    body: BODY_ANCHOR,
    width: dim.getWidth(),
    height: dim.getHeight(),
    dpi: diagram.getSkinParam().getDpi(),
    drawBodyAt,
    ...(isDisplayPositionedNull(diagram.annotations.mainFrame) ? {} : { frameInk: textBlockInk(diagram, measurer) }),
  };
  return diagram.scale === undefined ? anchored : { ...anchored, scaleSpec: diagram.scale };
}

/** The diagram as the fragment `src/index.ts` chromes and assembles. */
export function renderMindMap(diagram: MindMapDiagram, measurer: StringMeasurer): RenderFragment {
  return isEmpty(diagram.annotations) ? exportTextBlock(diagram, measurer) : rawTextBlock(diagram, measurer);
}

export const mindmapPlugin: SyncPlugin<MindMapDiagram, MindMapGeometry> = {
  type: 'mindmap',

  parse(source) {
    return createMindMapDiagram(source);
  },

  layoutSync(ast, _theme, measurer) {
    return { diagram: ast, measurer };
  },

  render(geo) {
    return renderMindMap(geo.diagram, geo.measurer);
  },
};
