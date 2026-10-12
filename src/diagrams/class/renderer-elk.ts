/**
 * The class document body under `!pragma layout elk` (cdd8 T3a): the
 * `MyElkDrawing` the maker returned (`CucaDiagramFileMakerElk.java:498`),
 * drawn in place of the svek body inside the same document
 * (`renderer-document.ts`).
 *
 * `MyElkDrawing` draws through klimt; each node is the class engine's own
 * string-drawn leaf (`renderer-leaf.ts`), translated to its ELK corner
 * (`MyElkDrawing.java:131-142`) and spliced into the klimt document at its
 * place in the draw order: clusters, then nodes, then edges (`:110-114`).
 * The splice bypasses `SvgGraphics#ensureVisible`, so the leaf's own extent
 * is added back from its box -- `SvgGraphics.java:1033-1034`'s
 * `ensureVisible(x + width + 2 * deltaShadow, y + height + 2 * deltaShadow)`
 * for the `URectangle` that bounds every class leaf.
 */
import type { ClassGeometry, ClassifierGeo } from './class-geo-types.js';
import type { Theme } from '../../core/theme.js';
import type { RenderFragment } from '../../core/dispatcher.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { XPoint2D } from '../../core/klimt/geom/XPoint2D.js';
import { UGraphicSvg } from '../../core/klimt/drawing/svg/u-graphic-svg.js';
import { MyElkDrawing } from '../../core/elk/MyElkDrawing.js';
import { mergeFragmentDefs, renderDrawableToFragment, type DrawableFragment } from '../../core/klimt/document-shell.js';
import {
  CUCA_DOCUMENT_MARGIN_BOTTOM,
  CUCA_DOCUMENT_MARGIN_LEFT,
  CUCA_DOCUMENT_MARGIN_RIGHT,
  CUCA_DOCUMENT_MARGIN_TOP,
} from '../../core/atmp/CucaDiagram.js';
import { beginClassDocument, finishClassDocument } from './renderer-document.js';
import { renderClassLeaf, type ClassLeafRenderContext, type ClassLeafSink } from './renderer-leaf.js';
import { buildClassUidPlan } from './renderer-uid.js';
import { shiftClassifierGeo } from './class-layout-shift.js';
import { withClassElkLeafDrawer } from './class-elk-adapter.js';

/** `SvgGraphics#ensureVisible`'s truncating `(int) (v + 1)` (`SvgGraphics.java:129-133`). */
function ensureVisibleExtent(v: number): number {
  return Math.floor(v + 1);
}

/** The draw-time state the SVG pass's leaf draw writes into. */
interface ElkLeafPass {
  readonly ctx: ClassLeafRenderContext;
  readonly fragments: DrawableFragment[];
  maxX: number;
  maxY: number;
}

/** A leaf's `URectangle` extent: `SvgGraphics.java:1033-1034`. */
function recordLeafExtent(pass: ElkLeafPass, leaf: ClassifierGeo): void {
  const shadow = 2 * (leaf.shadowing ?? 0);
  pass.maxX = Math.max(pass.maxX, ensureVisibleExtent(leaf.x + leaf.width + shadow));
  pass.maxY = Math.max(pass.maxY, ensureVisibleExtent(leaf.y + leaf.height + shadow));
}

/**
 * `IEntityImageUtils.translate(printEntityInternal(entity), UTranslate.point(corner)).drawU(ug)`
 * (`MyElkDrawing.java:136-142`) for a class leaf: its string draw at
 * `corner` plus the graphic's own translate, appended where the graphic draws.
 */
function svgLeafDrawer(pass: ElkLeafPass, leafGeos: ReadonlyMap<string, ClassifierGeo>) {
  return (entityId: string, ug: UGraphic, corner: XPoint2D): void => {
    if (!(ug instanceof UGraphicSvg)) throw new Error('class ELK: the render adapter draws into a UGraphicSvg only');
    const geo = leafGeos.get(entityId);
    if (geo === undefined) throw new Error(`class ELK: unknown leaf ${entityId}`);
    const translate = ug.getTranslate();
    const leaf = shiftClassifierGeo(geo, corner.x + translate.getDx(), corner.y + translate.getDy());
    const sink: ClassLeafSink = { children: [], noteConnectors: [], usymbolEntityFragments: pass.fragments };
    renderClassLeaf(leaf, pass.ctx, sink);
    ug.getSvgGraphics().getG().appendRaw(sink.children.join(''));
    recordLeafExtent(pass, leaf);
  };
}

/**
 * Renders `geo` (which must carry `elk`) as `renderClass` would.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkDrawing.java:110-148
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:159-180
 */
export function renderClassElk(geo: ClassGeometry, rawTheme: Theme): RenderFragment {
  const elk = geo.elk;
  if (elk === undefined) throw new Error('renderClassElk: the geometry has no ELK layout');
  const doc = beginClassDocument(geo, rawTheme);
  const uidPlan = buildClassUidPlan(elk.uidPlanInput);
  const ctx: ClassLeafRenderContext = {
    theme: doc.theme,
    uidPlan,
    noteCtx: { uidPlan, tips: new Map() },
    measurer: geo.measurer,
    sprites: geo.sprites,
    edges: [],
  };
  const pass: ElkLeafPass = { ctx, fragments: [], maxX: 0, maxY: 0 };
  const adapter = withClassElkLeafDrawer(elk.adapter, svgLeafDrawer(pass, elk.leafGeos));
  const measurer = geo.measurer;
  if (measurer === undefined) throw new Error('renderClassElk: the geometry carries no measurer');
  // `calculateFinalDimension` (`TextBlockExporter.java:199-203`) seeds `ensureVisible` as `minDim`.
  const drawn = renderDrawableToFragment(new MyElkDrawing(adapter, elk.result.minMax, elk.result), {
    width: (geo.rawWidth ?? 0) + CUCA_DOCUMENT_MARGIN_LEFT + CUCA_DOCUMENT_MARGIN_RIGHT,
    height: (geo.rawHeight ?? 0) + CUCA_DOCUMENT_MARGIN_TOP + CUCA_DOCUMENT_MARGIN_BOTTOM,
    measurer,
    uid: 'class-elk',
  });
  return finishClassDocument(doc, geo, {
    body: drawn.body,
    width: Math.max(drawn.width, pass.maxX, ...pass.fragments.map((f) => f.width)),
    height: Math.max(drawn.height, pass.maxY, ...pass.fragments.map((f) => f.height)),
    extraDefs: (drawn.extraDefs ?? '') + (mergeFragmentDefs(pass.fragments) ?? ''),
  });
}
