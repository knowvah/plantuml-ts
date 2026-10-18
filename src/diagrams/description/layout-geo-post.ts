/**
 * Geo post-processing for the description layout engine (phases 5–6): after the
 * graphviz result is mapped to a raw geo tree, these turn it into final pixel
 * geometry — edge-geo construction (spline clipping at container bboxes +
 * label placement) and total canvas dimensions. Split out of layout.ts to
 * keep each module within the complexity budget.
 *
 * G1b/J1 write-set expansion (journaled, mechanism C): Phase 4 (the global
 * coordinate shift) moved to `layout-ink-shift.ts#placeBody` — it now
 * needs the theme-aware draw primitives (`renderer-draw-sequence.ts`) to
 * mirror `SvekResult#calculateDimension`'s real ink-extent walk, which this
 * module deliberately stays free of (pure geometry only — see
 * `decision-journal.md` G1b/J1 for the full mechanism and the closed X/Y
 * formula).
 */

import type { DescriptiveLink } from './ast.js';
import type { DotLayoutResult } from '../../core/graph-layout.js';
import {
  type DescriptionNodeGeo,
  type DescriptionEdgeGeo,
  type Bbox,
  type EdgeContainerEndpoints,
  LAYOUT_MARGIN,
} from './layout-helpers.js';
import { clipSplineStart, clipSplineEnd } from '../../core/spline-clip.js';
import { resolveOpaleConnector } from '../../core/svek/image/Opale.js';
import { bareEntityName, leafDisplayName } from './namespace-groups.js';
import { DescriptionSolveRects } from './frontier-cluster-bbox.js';

/** One edge from the graphviz layout result. */
export type ResultEdge = DotLayoutResult['edges'][number];

/** Everything buildEdgeGeos needs to map result edges back to link geometry. */
export interface EdgeMapping {
  dotEdgeToLinkIdx: Map<string, number>;
  edgeContainerEndpoints: Map<string, EdgeContainerEndpoints>;
  geoIndex: Map<string, DescriptionNodeGeo>;
  dx: number;
  dy: number;
  /** The `xlabel` table each dot edge was given under `skinparam linetype ortho` (`xlabelWidth`/`xlabelHeight`,
   *  `link-edge-attrs.ts#applyMainLabel`). The engine echoes only `labelWidth`/`labelHeight`, which an ortho edge
   *  never carries, yet the jar draws the xlabel as the same label block (`SvekEdge.java:434-441`, :951-954). */
  xlabelTableByDotId?: ReadonlyMap<string, { w: number; h: number }>;
  /** `set separator` (`ast.namespaceSeparator`): `Quark#getName()` is the last segment of the split path
   *  (`Quark.java:84-86`), so edge ids/comments name endpoints by that leaf. */
  namespaceSeparator?: string | null | undefined;
}

// ── Phase 5: edge geo construction ──

/** `lhead`/`ltail.getRectangleArea()` for a container endpoint: the port
 *  cluster's rectangle as `manageEntryExitPoint` has left it
 *  (`Cluster.java:430`), else the container's geo box. */
function clipRectOf(g: DescriptionNodeGeo, solve: DescriptionSolveRects): Bbox {
  return solve.rectangleAreaOf(g) ?? { x: g.x, y: g.y, width: g.width, height: g.height };
}

function clipEdgePoints(
  pts: Array<{ x: number; y: number }>,
  info: EdgeContainerEndpoints | undefined,
  geoIndex: Map<string, DescriptionNodeGeo>,
  solve: DescriptionSolveRects,
): Array<{ x: number; y: number }> {
  const tail = info?.fromContainerAstId === undefined ? undefined : geoIndex.get(info.fromContainerAstId);
  const head = info?.toContainerAstId === undefined ? undefined : geoIndex.get(info.toContainerAstId);
  // `SvekEdge.java:660-663`: the projection cluster's rectangle is reassigned
  // before the compound clip reads `lhead`/`ltail`.
  solve.manageEntryExitPoint([tail, head]);
  let result = pts;
  if (tail !== undefined) result = clipSplineStart(result, clipRectOf(tail, solve));
  if (head !== undefined) result = clipSplineEnd(result, clipRectOf(head, solve));
  return result;
}

/** The label position graphviz gave the edge, or `undefined` when it gave none (`SvekEdge#getXY` returns null,
 *  `SvekEdge.java:742-746`, e.g. "port P unrecognized" on an edge to a `portout`): the jar then keeps
 *  `labelXY == null` and draws no label (`SvekEdge.java:951-954`). */
function edgeLabelGeo(re: ResultEdge, dx: number, dy: number): { x: number; y: number } | undefined {
  if (re.labelX === undefined || re.labelY === undefined) return undefined;
  return { x: re.labelX + dx, y: re.labelY + dy };
}

function assembleEdgeGeo(
  linkIdx: number,
  link: DescriptiveLink,
  pts: Array<{ x: number; y: number }>,
  hidden: ReadonlySet<string>,
  namespaceSeparator: string | null | undefined,
): DescriptionEdgeGeo {
  const geo: DescriptionEdgeGeo = {
    id: `edge-${linkIdx}`,
    from: link.from,
    to: link.to,
    // `Link.java:106-120` `idCommentForSvg()` -> `Entity.java:686-688` `getName()` -> `Quark.java:84-86`.
    fromName: leafDisplayName(bareEntityName(link.from), namespaceSeparator),
    toName: leafDisplayName(bareEntityName(link.to), namespaceSeparator),
    points: pts,
    style: link.style,
  };
  if (link.thicknessOverride !== undefined) geo.styleThickness = link.thicknessOverride;
  if (link.colorOverride !== undefined) geo.styleColor = link.colorOverride;
  if (link.stereotype !== undefined) geo.stereotype = link.stereotype;
  if (link.stereotypeIsLinkLabel) geo.stereotypeIsLinkLabel = true;
  if (link.arrowHead !== undefined) geo.arrowHead = link.arrowHead;
  // T17 write-set expansion — see DescriptionEdgeGeo's doc comment.
  if (link.tailDecor !== undefined) geo.tailDecor = link.tailDecor;
  if (link.headDecor !== undefined) geo.headDecor = link.headDecor;
  if (link.creationIndex !== undefined) geo.creationIndex = link.creationIndex;
  // G1 I-hideshow: `Link#isHidden()`'s `cl1.isHidden() || cl2.isHidden()`
  // disjunct (abel/Link.java:458-459) -- see `DescriptionEdgeGeo.hidden`'s
  // doc comment for why the `-[hidden]-` keyword disjunct is NOT folded in
  // here (G1 I-linkstyle: attempted and REVERTED -- see that doc comment).
  if (hidden.has(link.from) || hidden.has(link.to)) geo.hidden = true;
  return geo;
}

function addEdgeLabel(geo: DescriptionEdgeGeo, link: DescriptiveLink, re: ResultEdge, m: EdgeMapping): void {
  const { dx, dy } = m;
  const stereotypeLabel = link.stereotypeIsLinkLabel === true && link.stereotype !== undefined;
  if (link.label === undefined && !stereotypeLabel) return;
  const at = edgeLabelGeo(re, dx, dy);
  if (at === undefined) return;
  // `labelWidth`/`labelHeight` echo the table the engine was given
  // (`link-edge-attrs.ts#applyMainLabel` sets them together with
  // `labelBoxWidth`/`labelBoxHeight`). A `note on link` label is the merged
  // `EntityImageNoteLink` block -- a separate mechanism, left at its origin.
  const table =
    link.linkNote === undefined && re.labelWidth !== undefined && re.labelHeight !== undefined
      ? { w: re.labelWidth, h: re.labelHeight }
      : link.linkNote === undefined
        ? m.xlabelTableByDotId?.get(re.id)
        : undefined;
  if (link.label === undefined && table === undefined) return;
  geo.label = { text: link.label ?? '', ...at, ...table };
}

/**
 * `GraphvizImageBuilder.java#isOpalisable`/`:245-260` (strictUml gate
 * excluded -- see the doc comment below): when exactly one end of `link`
 * is a `symbol === 'note'` leaf that touches no OTHER link, and the other
 * end is not itself a note, resolve the Opale connector
 * (`Opale.ts#resolveOpaleConnector`, the SAME call `class/note-opale.ts
 * #buildOpaleNoteGeo` makes for the class engine's own note renderer)
 * against the note's own box + this edge's routed (already clip-processed)
 * points, and mark `geo` so `renderer-draw-sequence.ts#drawEdges` skips
 * drawing it (`SvekEdge#drawU`'s `if (opale) return;`) and
 * `renderer-entity.ts#drawEntity` draws the note's folded-corner+notch
 * outline instead of the plain box.
 *
 * `isOpalisable`'s FIRST guard (`dotData.getSkinParam().strictUmlStyle()`)
 * is NOT applied here: `EdgeMapping` carries no `Theme` (this module is
 * deliberately theme-free, `decision-journal.md` G1b/J1) and no
 * description-corpus fixture in this task's scope exercises `skinparam
 * style strictuml` together with an on-entity note. Documented residual
 * (cdd7-T1e report), not a silent drop -- threading `Theme` into
 * `EdgeMapping` from `layout.ts` is a follow-up, outside this task's
 * write-set. `entity.isGroup()` (Java's second guard) needs no explicit
 * check: a `symbol === 'note'` leaf is never `declaredAsGroup`/has
 * children in this AST.
 *
 * @see ~/git/plantuml/.../svek/GraphvizImageBuilder.java#isOpalisable (:133-146)
 * @see ~/git/plantuml/.../svek/GraphvizImageBuilder.java:245-260
 */
function applyOpaleNote(
  geo: DescriptionEdgeGeo,
  link: DescriptiveLink,
  pts: Array<{ x: number; y: number }>,
  allLinks: readonly DescriptiveLink[],
  m: EdgeMapping,
): void {
  const fromNode = m.geoIndex.get(link.from);
  const toNode = m.geoIndex.get(link.to);
  const noteNode = fromNode?.symbol === 'note' ? fromNode : toNode?.symbol === 'note' ? toNode : undefined;
  if (noteNode === undefined) return;
  const otherNode = noteNode === fromNode ? toNode : fromNode;
  if (otherNode === undefined || otherNode.symbol === 'note') return;
  // `GraphvizImageBuilder.java:245-259`: `setOpaleLine`/`line.setOpale(true)` only `if (other != null)`,
  // `other = Bibliotekon#getNode(entity)` (`Bibliotekon.java:120-122`) -- `nodeMap` holds leaf nodes, so
  // a cluster has none. The note is then drawn by `EntityImageNote#drawNormal` (:272-286) and its
  // dashed link by `SvekEdge#drawU` (:833).
  if (otherNode.children.length > 0) return;
  const touchingLinks = allLinks.filter((l) => l.from === noteNode.id || l.to === noteNode.id);
  if (touchingLinks.length !== 1) return;
  const origin = { x: noteNode.x + m.dx, y: noteNode.y + m.dy };
  const resolved = resolveOpaleConnector({ width: noteNode.width, height: noteNode.height }, origin, pts);
  if (resolved === undefined) return;
  geo.consumedByOpaleNote = true;
  geo.opale = resolved;
}

export function buildEdgeGeos(
  links: readonly DescriptiveLink[],
  resultEdges: ResultEdge[],
  m: EdgeMapping,
  hidden: ReadonlySet<string> = new Set(),
): DescriptionEdgeGeo[] {
  const byIdx = new Map<number, DescriptionEdgeGeo>();
  // `DotStringFactory#solve` walks `allLines()` in link-creation order
  // (`:465-466`), and each line's `manageEntryExitPoint` mutates the cluster
  // rectangle the next line clips against -- so the loop runs in link order,
  // not in graphviz's edge order (lgm T1b).
  const solve = new DescriptionSolveRects(m.geoIndex);
  const inLinkOrder = resultEdges
    .map((re) => ({ re, linkIdx: m.dotEdgeToLinkIdx.get(re.id) }))
    .filter((e): e is { re: ResultEdge; linkIdx: number } => e.linkIdx !== undefined)
    .sort((a, b) => a.linkIdx - b.linkIdx);
  for (const { re, linkIdx } of inLinkOrder) {
    const link = links[linkIdx];
    if (link === undefined) continue;
    const clipped = clipEdgePoints(re.points, m.edgeContainerEndpoints.get(re.id), m.geoIndex, solve);
    const pts = clipped.map((p) => ({ x: p.x + m.dx, y: p.y + m.dy }));
    const geo = assembleEdgeGeo(linkIdx, link, pts, hidden, m.namespaceSeparator);
    addEdgeLabel(geo, link, re, m);
    applyOpaleNote(geo, link, pts, links, m);
    byIdx.set(linkIdx, geo);
  }
  return [...byIdx.entries()].sort(([a], [b]) => a - b).map(([, g]) => g);
}

// ── Phase 6: total dimensions ──

function scanNodeDims(g: DescriptionNodeGeo, ref: { w: number; h: number }): void {
  const rw = g.x + g.width + LAYOUT_MARGIN;
  const rh = g.y + g.height + LAYOUT_MARGIN;
  if (rw > ref.w) ref.w = rw;
  if (rh > ref.h) ref.h = rh;
  for (const c of g.children) scanNodeDims(c, ref);
}

/**
 * @deprecated (G0/T3, journaled — write-set-boundary doc-comment-only
 * note; do NOT delete in this task) NO LONGER the source of the
 * description engine's SVG document dimensions. `renderer.ts#
 * renderDescription` used to feed this function's output
 * (`geo.totalWidth`/`totalHeight`) straight into `SvgOption#minDim`; as
 * of G0/T3 it computes `minDim` via the `SvekResult` recipe instead
 * (`renderer-ink-extent.ts#computeDocumentDims` — a `LimitFinder` ink
 * walk + the `CucaDiagram` outer margin; see that module's doc comment
 * for the full upstream chain and the F4 "document dimensions 1px
 * short" defect this replaced it for). This function's only remaining
 * caller is `layout.ts#layoutDescription`, which still populates
 * `DescriptionGeometry#totalWidth`/`totalHeight` from it — that field
 * remains part of the public geometry shape (exercised by
 * `tests/unit/description/layout.test.ts`) and MAY still be a
 * reasonable "content bounding box" approximation for callers that are
 * not the SVG renderer; it is simply no longer authoritative for the
 * emitted document's `width`/`height`/`viewBox`.
 */
export function computeTotalDimensions(
  nodes: readonly DescriptionNodeGeo[],
  edges: readonly DescriptionEdgeGeo[],
): { totalWidth: number; totalHeight: number } {
  const ref = { w: 0, h: 0 };
  for (const n of nodes) scanNodeDims(n, ref);
  for (const e of edges) {
    for (const p of e.points) {
      if (p.x + LAYOUT_MARGIN > ref.w) ref.w = p.x + LAYOUT_MARGIN;
      if (p.y + LAYOUT_MARGIN > ref.h) ref.h = p.y + LAYOUT_MARGIN;
    }
  }
  return { totalWidth: ref.w, totalHeight: ref.h };
}
