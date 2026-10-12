/**
 * The class layout under `!pragma layout elk` (cdd8 T3a, D3/D13):
 * `CucaDiagram.java:478-479` picks `CucaDiagramFileMakerElk` for such a
 * diagram, and its `getTextBlock` (`CucaDiagramFileMakerElk.java:477-499`)
 * lays the entities out with ELK and measures the resulting `MyElkDrawing`.
 *
 * The entities are the svek path's own: the same page pre-steps
 * (`layout.ts#layoutSinglePage`: empty-package collapse, `topurl`, the
 * per-classifier pre-measure, `remove`), and the same leaf geometry builder,
 * at the corner ELK gives each node. Upstream has no degenerate shortcut on
 * this path (`GraphvizImageBuilder.java:211-223` is svek's), so a one-class
 * diagram is laid out by ELK too.
 *
 * Not on this path, by upstream: the same-class-width floor
 * (`CucaDiagramFileMakerElk.java:468-469` only prints "NOT YET
 * IMPLEMENTED"), `Kal` shields (built by `SvekEdge`), and the hexagon
 * polygon (`DotStringFactory.java:414-420`, never reached without DOT).
 */
import type { ClassDiagramAST, Relationship } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { ClassifierGeo, ClassGeometry } from './class-geo-types.js';
import type { ElkBackend } from '../../core/elk/elk-backend.js';
import type { DotLayoutResult } from '../../core/graph-layout.js';
import type { MeasuredClassifier } from './class-layout-helpers.js';
import { makeElkLayout } from '../../core/elk/CucaDiagramFileMakerElk.js';
import { MyElkDrawing, newMyElkDrawing } from '../../core/elk/MyElkDrawing.js';
import { LimitFinder } from '../../core/klimt/drawing/LimitFinder.js';
import { UEmpty } from '../../core/klimt/shape/UEmpty.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { MeasurerStringBounder } from '../../core/measurer-bounder.js';
import { preMeasureClassifiers } from './layout.js';
import { collapseEmptyNamespacesFinal, packedGroupRanksField } from './class-namespace.js';
import { applyTopUrlToClassifiers } from './class-url.js';
import { filterRemovedEntities, computeHiddenIds, computeRemovedRanks } from './class-directives.js';
import { buildClassifierGeos } from './class-geo-builders.js';
import { buildInkBox } from './class-ink-box.js';
import { shiftClassifierGeo } from './class-layout-shift.js';
import { applyClassDocumentMargin } from './layout-ink-extent.js';
import { iconSizeOf } from './class-visibility-icon.js';
import { LOLLIPOP_SIZE, ASSOC_POINT_SIZE } from './class-lollipop.js';
import { classUidPlanInputFromAst } from './renderer-uid.js';
import { buildClassMagmaEdges } from './class-magma.js';
import { packageEndpointAnchors } from './class-shield-helpers.js';
import { nonEmptyNamespaceIds } from './class-dot-clusters.js';
import { createClassElkAdapter, type ClassElkLeafDrawer, type ClassElkModel } from './class-elk-adapter.js';

/** The page AST the svek path lays out (`layout.ts#layoutSinglePage`). */
function classElkPageAst(ast: ClassDiagramAST, theme: Theme): ClassDiagramAST {
  const collapsedAst = collapseEmptyNamespacesFinal(ast);
  const urledClassifiers = applyTopUrlToClassifiers(collapsedAst.classifiers, theme.topurl);
  return urledClassifiers === collapsedAst.classifiers
    ? collapsedAst
    : { ...collapsedAst, classifiers: [...urledClassifiers] };
}

/**
 * Each leaf's image dimension (`printEntityInternal(ent).calculateDimension`,
 * `CucaDiagramFileMakerElk.java:375`): the size the svek path gives the same
 * entity's DOT node (`class-dot-graph.ts#buildOneDotNode`), at (0, 0).
 */
function originPositions(
  ast: ClassDiagramAST,
  measuredMap: ReadonlyMap<string, MeasuredClassifier>,
): Map<string, DotLayoutResult['nodes'][number]> {
  const positions = new Map<string, DotLayoutResult['nodes'][number]>();
  for (const c of ast.classifiers) {
    const measured = measuredMap.get(c.id);
    if (measured === undefined) continue;
    const fixed = c.kind === 'lollipop' ? LOLLIPOP_SIZE : c.kind === 'assoc-circle' ? ASSOC_POINT_SIZE : undefined;
    positions.set(c.id, { id: c.id, x: 0, y: 0, width: fixed ?? measured.width, height: fixed ?? measured.height });
  }
  return positions;
}

/**
 * The leaf draw of the maker's `LimitFinder` pass
 * (`TextBlockUtils.getMinMax(new MyElkDrawing(...), stringBounder, false)`,
 * `CucaDiagramFileMakerElk.java:495-496`): the leaf's ink, by the svek ink
 * walk's own per-leaf rules (`class-ink-box.ts`, `LimitFinder.java`'s), drawn
 * as the plain box it spans.
 */
function inkLeafDrawer(model: ClassElkModel): ClassElkLeafDrawer {
  const inkOptions = { iconSize: iconSizeOf(model.theme), cardinalityFontSize: model.theme.cardinalityFontSize };
  return (entityId, ug, corner) => {
    if (!(ug instanceof LimitFinder)) throw new Error('class ELK: the layout adapter draws into a LimitFinder only');
    const geo = model.leafGeos.get(entityId);
    if (geo === undefined) throw new Error(`class ELK: unknown leaf ${entityId}`);
    const box = buildInkBox([shiftClassifierGeo(geo, corner.x, corner.y)], [], [], [], inkOptions);
    ug.apply(new UTranslate(box.minX, box.minY)).draw(new UEmpty(box.maxX - box.minX, box.maxY - box.minY));
  };
}

/**
 * The invisible links `applySingleStrategy` chains a group's standalone
 * leaves with (`CucaDiagram.java:701-726`), as the svek path computes them
 * (`class-magma.ts`), each `new Link(..., a, b, NONE-INVISIBLE-NONE)`
 * (`Magma.java:51`).
 */
function magmaLinks(ast: ClassDiagramAST): Relationship[] {
  const anchors = packageEndpointAnchors(ast, nonEmptyNamespaceIds(ast));
  return buildClassMagmaEdges(ast, anchors).map((e) => ({
    from: e.from,
    to: e.to,
    type: 'association',
    sourceDecor: 'none',
    targetDecor: 'none',
    invis: true,
  }));
}

function buildModel(
  effAst: ClassDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
  pageAst: ClassDiagramAST,
): ClassElkModel {
  const measuredMap = preMeasureClassifiers(pageAst, theme, measurer);
  const hiddenIds = computeHiddenIds(effAst);
  const geos = buildClassifierGeos(effAst, measuredMap, originPositions(effAst, measuredMap), {
    hiddenIds,
    theme,
    protectedIds: new Set(),
  });
  const leafGeos = new Map<string, ClassifierGeo>(geos.map((g) => [g.id, g]));
  return { ast: effAst, theme, measurer, leafGeos, hiddenIds, links: [...effAst.relationships, ...magmaLinks(effAst)] };
}

/**
 * Lays a `!pragma layout elk` class diagram out through `backend`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/CucaDiagramFileMakerElk.java:477-499
 */
export function layoutClassElk(
  ast: ClassDiagramAST,
  skinTheme: Theme,
  measurer: StringMeasurer,
  backend: ElkBackend,
): ClassGeometry {
  const theme = ast.sprites === undefined ? skinTheme : { ...skinTheme, sprites: ast.sprites };
  const pageAst = classElkPageAst(ast, theme);
  const effAst = filterRemovedEntities(pageAst);
  const removedRanks = computeRemovedRanks(pageAst);
  const model = buildModel(effAst, theme, measurer, pageAst);
  const adapter = createClassElkAdapter(model, inkLeafDrawer(model));
  const result = makeElkLayout(adapter, backend, newMyElkDrawing);
  // `TextBlockExporter#calculateFinalDimension` (`TextBlockExporter.java:199-203`)
  // over `MyElkDrawing#calculateDimension` (`MyElkDrawing.java:339-346`).
  const raw = new MyElkDrawing(adapter, result.minMax, result).calculateDimension(new MeasurerStringBounder(measurer));
  const rawDims = { width: raw.getWidth(), height: raw.getHeight() };
  const total = applyClassDocumentMargin(rawDims);
  const removed = removedRanks.length > 0 ? { removedRanks } : {};
  const uidPlanInput = { ...classUidPlanInputFromAst(effAst), ...removed, ...packedGroupRanksField(effAst) };
  return {
    totalWidth: total.width,
    totalHeight: total.height,
    rawWidth: rawDims.width,
    rawHeight: rawDims.height,
    leaves: [],
    edges: [],
    namespaces: [],
    elk: { adapter, result, leafGeos: model.leafGeos, uidPlanInput },
  };
}
