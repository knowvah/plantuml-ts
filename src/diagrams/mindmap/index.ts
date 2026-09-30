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
import { isEmpty } from '../../core/annotations/index.js';
import type { RenderFragment, SyncPlugin } from '../../core/dispatcher.js';
import { extractFlatContent, extractViewBoxDims, VERSION_PLACEHOLDER } from '../../core/klimt/document-shell.js';
import type { StringBounder as DriverStringBounder } from '../../core/klimt/drawing/svg/driver-text-svg.js';
import { basicSvgOption } from '../../core/klimt/drawing/svg/svg-graphics-core.js';
import { UGraphicSvg } from '../../core/klimt/drawing/svg/u-graphic-svg.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { resolveScaleFactor } from '../../core/scale-command.js';
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
  return diagram.getTextBlock().calculateDimension(probe.getStringBounder());
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
 *  from the block's own seed. */
function drawFragment(diagram: MindMapDiagram, measurer: StringMeasurer, pass: DrawPass): RenderFragment {
  const backcolor = diagram.calculateBackColor();
  const option = basicSvgOption({
    minDim: { width: pass.minDim.getWidth(), height: pass.minDim.getHeight() },
    backcolor,
    scale: pass.scale,
    rootAttributes: new Map([['data-diagram-type', DIAGRAM_TYPE_MINDMAP]]),
  });
  const ug = UGraphicSvg.build(0, option, VERSION_PLACEHOLDER, driverBounderFor(measurer), measurer);
  diagram.getTextBlock().drawU(ug.apply(pass.translate));

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
 * exports it with the margins. The fragment is the raw block at the origin,
 * sized by its exact `calculateDimension`, which `applyChrome` composes
 * around; `core/TextBlockExporter.ts#finalizeTitledDiagramFragment` applies
 * the margin afterwards. `scale` is not applied on this path: the chrome is
 * composed outside klimt, so a scale here would shrink the diagram but not
 * its title.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java:469-477
 */
function rawTextBlock(diagram: MindMapDiagram, measurer: StringMeasurer): RenderFragment {
  const dim = textBlockDimension(diagram, measurer);
  const fragment = drawFragment(diagram, measurer, { minDim: dim, scale: 1, translate: new UTranslate(0, 0) });
  return { ...fragment, width: dim.getWidth(), height: dim.getHeight() };
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
