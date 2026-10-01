/**
 * Canvas origin (D2, mission `activity-divergence-drive` T1a): ports
 * `Recentred` + the document margin + `LimitFinder` -- replaces the flat
 * `LAYOUT_MARGIN` `assign-coordinates-full.ts#computeBounds` used to add on
 * top of its own maxX/maxY. Split out of that module only to keep it under
 * the 500-line hook (mission convention, "a sibling module when a file
 * would cross the hook"); `assign-coordinates-full.ts`'s `pass1Assemble`/
 * `compressAndAssemble` are the only callers of {@link finalizeGeometry}.
 * See `activity-layout-constants.ts` for the three numeric constants this
 * spends (`CANVAS_ORIGIN_SHIFT`, `CANVAS_PADDING_TOTAL`, `SVG_CANVAS_CEIL`)
 * and their own citations.
 *
 * Mechanism (journalled before any edit, per this task's own instructions):
 * upstream never bakes a margin into the Ftile tree -- the root Ftile's own
 * local coordinates start at 0 (`InstructionList#createFtile` returns the
 * bare root tile). The canvas origin is instead produced by THREE
 * independent steps, run in this order:
 *  1. `LimitFinder` (`klimt/drawing/LimitFinder.java:170-211`) computes the
 *     diagram's own ink `MinMax` by replaying every draw call -- but its
 *     per-shape dispatch is NOT uniform: `drawRectangle` records `x-1,y-1`
 *     (near) and `x+width-1,y+height-1` (far); `drawEllipse` records the
 *     near corner EXACTLY (`x,y`) but the same `-1` far corner;
 *     `drawUPolygon` additionally pads BOTH corners by its own
 *     `HACK_X_FOR_POLYGON = 10`, X ONLY (the Y corners are exact); `drawULine`
 *     /`drawUPath`/`drawDotPath` record both corners exactly. A node's
 *     `{ near, far }` fudge below is this dispatch, keyed by which upstream
 *     `Ftile` draws it as (confirmed per-kind against the oracle: a lone
 *     `start` circle measures ink at exactly its own `[0,20]` box --
 *     `kodiji-34-mofe202`, ellipse near=0; a lone `action` rect's own box
 *     measures one pixel further out on its near corner -- `rarodo-65-
 *     fudu505`, `t-partition`/`t-fork` oracle probes, rect near=1).
 *  2. `Recentred` (`activitydiagram3/Recentred.java:47-59`) re-draws that
 *     ink at a FIXED `(5, 5)` inner pad from its own (fudged) near corner,
 *     and reports its own size as the ink's fudged span PLUS a further 15
 *     on the far corner only (`enlarge(15, 15)`, far corner only -- the near
 *     corner, read by `drawU`'s translate, is untouched by `enlarge`).
 *  3. `TextBlockExporter` (`core/TextBlockExporter.java:172-173,199-202`)
 *     wraps that in the symmetric document margin, `same(10)`
 *     (`TitledDiagram.java:275`, confirmed no `root.document` style override
 *     in `plantuml.skin`) -- `+10` on every side.
 * Composing (1)+(2)'s translate+(3): a node's own near-corner coordinate
 * `p` ends up drawn at `p - m + 15` where `m` is the GLOBAL ink min (every
 * node/edge's own fudged near corner, reduced by `Math.min`) and `15 = 10
 * (margin) + 5 (Recentred's pad)` -- `CANVAS_ORIGIN_SHIFT`. The canvas's own
 * size is `(M - m) + 35` -- `35 = 15 (margin, both sides) + 15 (enlarge's
 * far pad only -- NOT doubled, `enlarge` never touches the near corner)` --
 * `CANVAS_PADDING_TOTAL`, THEN one further pixel from `SvgGraphics
 * #ensureVisible`'s own `(int)(x + 1)` cast (`klimt/drawing/svg/
 * SvgGraphics.java:129-136,142-143`), applied to `option.getMinDim()` (this
 * exact dimension) before any shape is drawn -- confirmed against
 * `kodiji-34-mofe202`: the formula above gives 54×54; the oracle renders
 * 55×55.
 */

import type { ActivityEdgeGeo, ActivityNodeGeo, SwimlaneGeo } from '../activity-geometry.types.js';
import type { Reservation } from './hexagon-reservations.js';
import { computeSwimlaneChrome } from './swimlane-placement.js';
import type { SwimlaneChrome } from './swimlane-placement.js';
import { CANVAS_ORIGIN_SHIFT, CANVAS_PADDING_TOTAL, SVG_CANVAS_CEIL } from '../activity-layout-constants.js';

/** A shape kind's own `{ near, far }` LimitFinder fudge (module doc above):
 *  `recordedMin = real.min - near`, `recordedMax = real.max + far`. */
interface ShapeFudge {
  readonly near: number;
  readonly far: number;
}

/** `drawRectangle` (`LimitFinder.java:185-189`). `style.getShadowing()`
 *  defaults to 0 (`root { Shadowing: 0.0; }`, `plantuml.skin:18`, no
 *  `action`/`group`/`partition`/bar-specific override), so the far corner's
 *  `+2*deltaShadow` term is omitted here. */
const RECT_FUDGE: ShapeFudge = { near: 1, far: -1 };
/** `drawEllipse` (`:206-210`): exact near corner, `drawRectangle`'s far. */
const ELLIPSE_FUDGE: ShapeFudge = { near: 0, far: -1 };
/** `drawUPolygon` (`:170-176`), X axis only -- `HACK_X_FOR_POLYGON = 10`. */
const POLYGON_FUDGE_X: ShapeFudge = { near: 10, far: 10 };
/** `drawULine`/`drawUPath`/`drawDotPath` (exact), and every kind this task
 *  has not yet verified against the oracle (`note`'s own `Opale` IS
 *  confirmed exact -- a `UPath`, `Opale.java:108` -- but shares this same
 *  zero fudge, so it is not called out as its own constant). */
const NO_FUDGE: ShapeFudge = { near: 0, far: 0 };

/** `FtileCircleStart`/`Stop`/`EndCross` + the connector spot -- all circles.
 * @see net/sourceforge/plantuml/svek/image/CircleStart.java:73-74 */
const ELLIPSE_KINDS = new Set(['start', 'stop', 'end', 'kill', 'spot']);
/** `action` is `FtileBox` (a real `URectangle`); `group`/`partition`'s own
 *  outer box is too (confirmed: the oracle's `t-partition` probe places its
 *  rect at the SAME fudged offset as a bare action box); `fork-bar`/
 *  `join-bar` are `FtileBlackBlock`'s solid `URectangle`
 *  (`compress-geometry.ts#RECT_WIDTH_KINDS` already treats them as such for
 *  the unrelated compression transform). */
const RECT_KINDS = new Set(['action', 'group', 'partition', 'fork-bar', 'join-bar']);
/** Every diamond/hexagon condition node -- `Hexagon.asPolygon`/`FtileDiamond`
 *  both draw a `UPolygon` (`Hexagon.java:48-66`). X only (`POLYGON_FUDGE_X`'s
 *  own doc). */
const POLYGON_X_KINDS = new Set(['diamond', 'if-split', 'if-merge', 'while-header', 'repeat-cond', 'repeat-start']);

/** `break` draws no glyph at all (`activity-renderer-shapes.ts`'s own
 *  `case 'break'` returns `''`) -- excluded from the ink scan entirely,
 *  rather than assigned a fudge, so an all-break diagram never collapses
 *  the min/max reduction onto a phantom shape. */
function isInkless(kind: string): boolean {
  return kind === 'break';
}

function fudgeX(kind: string): ShapeFudge {
  if (ELLIPSE_KINDS.has(kind)) return ELLIPSE_FUDGE;
  if (RECT_KINDS.has(kind)) return RECT_FUDGE;
  if (POLYGON_X_KINDS.has(kind)) return POLYGON_FUDGE_X;
  return NO_FUDGE;
}

function fudgeY(kind: string): ShapeFudge {
  if (ELLIPSE_KINDS.has(kind)) return ELLIPSE_FUDGE;
  if (RECT_KINDS.has(kind)) return RECT_FUDGE;
  return NO_FUDGE; // polygon fudge is X-only; every other kind is exact.
}

interface MutableInkBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function extendForNode(acc: MutableInkBounds, node: ActivityNodeGeo): void {
  if (isInkless(node.kind)) return;
  const fx = fudgeX(node.kind);
  const fy = fudgeY(node.kind);
  acc.minX = Math.min(acc.minX, node.x - fx.near);
  acc.maxX = Math.max(acc.maxX, node.x + node.width + fx.far);
  acc.minY = Math.min(acc.minY, node.y - fy.near);
  acc.maxY = Math.max(acc.maxY, node.y + node.height + fy.far);
}

function extendForEdge(acc: MutableInkBounds, edge: ActivityEdgeGeo): void {
  // `ULine` segments only (`LimitFinder#drawULine`, exact) -- the terminal
  // arrowhead `UPolygon` this edge draws is a renderer-level concern not
  // modelled in `ActivityEdgeGeo` (T1b); deferred, open mechanism (report).
  for (const p of edge.points) {
    acc.minX = Math.min(acc.minX, p.x);
    acc.maxX = Math.max(acc.maxX, p.x);
    acc.minY = Math.min(acc.minY, p.y);
    acc.maxY = Math.max(acc.maxY, p.y);
  }
}

function extendForSwimlane(acc: MutableInkBounds, lane: SwimlaneGeo): void {
  acc.minX = Math.min(acc.minX, lane.x);
  acc.maxX = Math.max(acc.maxX, lane.x + lane.width);
}

interface CanvasOrigin {
  readonly shiftX: number;
  readonly shiftY: number;
  readonly totalWidth: number;
  readonly totalHeight: number;
}

/** The module doc's mechanism, applied: reduces every node/edge/swimlane's
 *  own (fudged) span into one global ink `MinMax`, then derives the uniform
 *  near-corner shift and the final (ceiled) canvas size from it. */
function computeCanvasOrigin(
  nodes: readonly ActivityNodeGeo[],
  edges: readonly ActivityEdgeGeo[],
  swimlanes: readonly SwimlaneGeo[],
): CanvasOrigin {
  const acc: MutableInkBounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const n of nodes) extendForNode(acc, n);
  for (const e of edges) extendForEdge(acc, e);
  for (const s of swimlanes) extendForSwimlane(acc, s);
  if (!Number.isFinite(acc.minX)) {
    acc.minX = 0;
    acc.minY = 0;
    acc.maxX = 0;
    acc.maxY = 0;
  }
  return {
    shiftX: CANVAS_ORIGIN_SHIFT - acc.minX,
    shiftY: CANVAS_ORIGIN_SHIFT - acc.minY,
    totalWidth: Math.floor(acc.maxX - acc.minX + CANVAS_PADDING_TOTAL) + SVG_CANVAS_CEIL,
    totalHeight: Math.floor(acc.maxY - acc.minY + CANVAS_PADDING_TOTAL) + SVG_CANVAS_CEIL,
  };
}

function shiftNodeGeo(node: ActivityNodeGeo, dx: number, dy: number): ActivityNodeGeo {
  const next: ActivityNodeGeo = { ...node, x: node.x + dx, y: node.y + dy };
  if (node.spikeTip !== undefined) next.spikeTip = { x: node.spikeTip.x + dx, y: node.spikeTip.y + dy };
  return next;
}

function shiftEdgeGeo(edge: ActivityEdgeGeo, dx: number, dy: number): ActivityEdgeGeo {
  const next: ActivityEdgeGeo = { ...edge, points: edge.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
  if (edge.midArrowAt !== undefined) {
    next.midArrowAt = { ...edge.midArrowAt, x: edge.midArrowAt.x + dx, y: edge.midArrowAt.y + dy };
  }
  return next;
}

/** `contentMinX` is deliberately NOT shifted here, for the same reason
 *  `compress-geometry.ts#transformLane`'s own doc gives: it is measured
 *  lane-LOCAL, before the lane's own absolute translate is applied
 *  (`Swimlanes.java:416-431`) -- this canvas-origin shift is simply a
 *  further layer of the same kind of absolute translate `contentMinX`
 *  already excludes. */
function shiftSwimlaneGeo(lane: SwimlaneGeo, dx: number): SwimlaneGeo {
  const next: SwimlaneGeo = { ...lane, x: lane.x + dx };
  if (lane.contentX !== undefined) next.contentX = lane.contentX + dx;
  return next;
}

function shiftReservation(r: Reservation, dx: number, dy: number): Reservation {
  return { ...r, x: r.x + dx, y: r.y + dy };
}

/** Bundles {@link computeCanvasOrigin} + the shift it implies into one
 *  finishing pass, shared by `assign-coordinates-full.ts`'s `pass1Assemble`
 *  and `compressAndAssemble` so the mechanism is written once. */
export interface FinalizeInput {
  nodes: ActivityNodeGeo[];
  edges: ActivityEdgeGeo[];
  swimlanes: SwimlaneGeo[];
  reservations: Reservation[];
  bounds: { maxX: number; maxY: number };
  baseY: number;
  titlesHeight: number;
}

export interface FinalizedGeometry {
  totalWidth: number;
  totalHeight: number;
  nodes: ActivityNodeGeo[];
  edges: ActivityEdgeGeo[];
  swimlanes: SwimlaneGeo[];
  reservations: Reservation[];
  chrome: Partial<SwimlaneChrome>;
}

export function finalizeGeometry(input: FinalizeInput): FinalizedGeometry {
  const { nodes, edges, swimlanes, reservations, bounds, baseY, titlesHeight } = input;
  const origin = computeCanvasOrigin(nodes, edges, swimlanes);
  const shiftedNodes = nodes.map((n) => shiftNodeGeo(n, origin.shiftX, origin.shiftY));
  const shiftedEdges = edges.map((e) => shiftEdgeGeo(e, origin.shiftX, origin.shiftY));
  const shiftedSwimlanes = swimlanes.map((s) => shiftSwimlaneGeo(s, origin.shiftX));
  const shiftedReservations = reservations.map((r) => shiftReservation(r, origin.shiftX, origin.shiftY));
  const chrome = computeSwimlaneChrome(
    shiftedSwimlanes,
    baseY + origin.shiftY,
    titlesHeight,
    bounds.maxY + origin.shiftY,
  );
  return {
    totalWidth: origin.totalWidth,
    totalHeight: origin.totalHeight,
    nodes: shiftedNodes,
    edges: shiftedEdges,
    swimlanes: shiftedSwimlanes,
    reservations: shiftedReservations,
    chrome,
  };
}
