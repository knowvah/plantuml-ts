/**
 * `compressGeometry` -- `klimt/compress/CompressionXorYBuilder.java:52-69`
 * and `UGraphicCompressOnXorY.java:86-135`, ported over `ActivityGeometry`
 * instead of a live `UGraphic` redraw (D1). Runs ON_X, applies it, then runs
 * ON_Y on the X-compressed result (`ActivityDiagram3.java:209-210`, D4).
 * `Recentred` (`:212`) is NOT ported here -- filed as
 * `activity-canvas-margin` (mission `activity-klimt-compress` README).
 *
 * Not yet wired to any call site (T5, mission `activity-klimt-compress`
 * batch 4) -- the aggregate `weightedScore` MUST stay unmoved by this file
 * (mission README, stop condition 6) until it is.
 *
 * @see net/sourceforge/plantuml/klimt/compress/CompressionXorYBuilder.java:52-69
 * @see net/sourceforge/plantuml/klimt/compress/UGraphicCompressOnXorY.java:86-135
 * @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagram3.java:205-213
 */

import type { ActivityEdgeGeo, ActivityNodeGeo } from '../../layout.old.js';
import type { SwimlaneGeo, SwimlaneBandGeo } from '../../activity-layout-types.js';
import type { EdgeMeta } from '../swimlane-placement.js';
import type { Reservation } from '../hexagon-reservations.js';
import type { StringBounder } from '../../tiles/tile.js';
import type { Theme } from '../../../../core/theme.js';
import type { CompressionMode } from './slot.js';
import { shapesOf } from './shapes-of.js';
import { collectSlots } from './slot-finder.js';
import { CompressionTransform, type PiecewiseAffineTransform } from './compression-transform.js';

export interface CompressInput {
  nodes: ActivityNodeGeo[];
  edges: ActivityEdgeGeo[];
  edgeMeta: readonly EdgeMeta[];
  swimlanes: SwimlaneGeo[];
  reservations: readonly Reservation[];
  bounds: { maxX: number; maxY: number };
  bounder: StringBounder;
  theme: Theme;
}

export interface CompressResult {
  nodes: ActivityNodeGeo[];
  edges: ActivityEdgeGeo[];
  swimlanes: SwimlaneGeo[];
  reservations: Reservation[];
  bounds: { maxX: number; maxY: number };
  removed: { x: number; y: number };
}

/**
 * `action` (a real `URectangle` box) and all four bar kinds get the true
 * `x' = ct(x), w' = ct(x + w) - ct(x)` width recompute on X
 * (`UGraphicCompressOnXorY.java:90-96`). `fork-bar`/`join-bar` are genuine
 * 2-D `URectangle`s (`FtileBlackBlock.java:101-102`); `split-bar`/
 * `split-join-bar` are a horizontal `ULine` (`FtileThinSplit.java:87-96`),
 * but `ULine`'s own transform (`drawLine`, both endpoints through `ct`)
 * produces the IDENTICAL formula for a purely horizontal segment -- see
 * {@link RECT_HEIGHT_KINDS} for why the two families diverge on Y.
 */
const RECT_WIDTH_KINDS = new Set(['action', 'fork-bar', 'join-bar', 'split-bar', 'split-join-bar']);

/**
 * On Y, only `action`/`fork-bar`/`join-bar` are true 2-D `URectangle`s and
 * get `y' = ct(y), h' = ct(y + h) - ct(y)`. `split-bar`/`split-join-bar`
 * are a `ULine` with `dy = 0` (a flat horizontal line,
 * `activity-renderer-bars.ts#renderSplitLine` never reads `node.height`):
 * `drawLine`'s Y-mode branch (`ct(y), x + dx, ct(y + dy)`) collapses to
 * `ct(y)` for BOTH endpoints when `dy = 0`, i.e. a plain translate with the
 * line's zero extent preserved -- not the rect-style height recompute. The
 * bookkeeping `height` field these two kinds carry (`t.barHeight`, unread
 * by the renderer) is therefore kept as-is, like any other translate-only
 * shape, rather than being run through a formula that would fabricate a
 * new value for a dimension nothing draws.
 * @see net/sourceforge/plantuml/klimt/compress/UGraphicCompressOnXorY.java:122-127
 */
const RECT_HEIGHT_KINDS = new Set(['action', 'fork-bar', 'join-bar']);

/**
 * A `Reservation` with either ignore flag set is modelled as a `'rect'`
 * `CompressShape` (`shapes-of.ts#shapeForReservation`) -- i.e. it is a real
 * `URectangle` in the Java (the swimlane title band,
 * `Swimlanes.java:358-367`) and gets the full width/height recompute on
 * BOTH axes regardless of which specific flag is set ("ignore flags
 * notwithstanding", `UGraphicCompressOnXorY.java:90`). A reservation with
 * neither flag is a `UEmpty` (a hexagon or divider reservation,
 * `FtileWhile.java:272`, `LaneDivider.java:91`) -- `UEmpty` is not a
 * `URectangle`, so it falls to the plain translate-and-keep-size branch,
 * same as {@link RECT_HEIGHT_KINDS}'s reasoning for a line.
 */
function isRectReservation(r: Reservation): boolean {
  return r.ignoreX === true || r.ignoreY === true;
}

/**
 * The one `Reservation` upstream draws as a `URectangle` rather than a
 * `UEmpty` is the swimlane title band (`withBandReservation`,
 * `assign-coordinates-full.ts`, the only call site that ever sets BOTH
 * `ignoreX` and `ignoreY`). `shapesOf`'s own `swimlaneBand` parameter needs
 * exactly this rect back as a `SwimlaneBandGeo` for {@link titleShapes}'s
 * Y-axis title occupancy -- derived here from `reservations` (the one
 * `CompressInput` field that already carries it) rather than added as a
 * second, independently-suppliable field that could drift out of sync with
 * it; `CompressResult` does not return a transformed band for the same
 * reason `CompressInput` does not accept one -- T5 recomputes the band and
 * divider fresh from the transformed `swimlanes` and `bounds.maxY` via
 * `computeSwimlaneChrome`, which is the only place `swimlaneBand`'s OWN
 * `y`/`height` are produced (mission task instructions; `swimlane-
 * placement.ts#computeSwimlaneChrome`).
 */
function findSwimlaneBand(reservations: readonly Reservation[]): SwimlaneBandGeo | undefined {
  const band = reservations.find((r) => r.ignoreX === true && r.ignoreY === true);
  if (band === undefined) return undefined;
  return { x: band.x, y: band.y, width: band.width, height: band.height };
}

/** @see UGraphicCompressOnXorY.java:90-96 (rect); the fallthrough
 *  translate-and-keep-size branch (`:107-108`) for every other node kind. */
function transformNode(node: ActivityNodeGeo, ct: PiecewiseAffineTransform, mode: CompressionMode): ActivityNodeGeo {
  const next: ActivityNodeGeo = { ...node };
  const spikeTip = node.spikeTip === undefined ? undefined : { ...node.spikeTip };
  if (mode === 'x') {
    next.x = ct.transform(node.x);
    next.width = RECT_WIDTH_KINDS.has(node.kind) ? ct.transform(node.x + node.width) - next.x : node.width;
    if (spikeTip !== undefined) spikeTip.x = ct.transform(spikeTip.x);
  } else {
    next.y = ct.transform(node.y);
    next.height = RECT_HEIGHT_KINDS.has(node.kind) ? ct.transform(node.y + node.height) - next.y : node.height;
    if (spikeTip !== undefined) spikeTip.y = ct.transform(spikeTip.y);
  }
  if (spikeTip !== undefined) next.spikeTip = spikeTip;
  return next;
}

/** A `ULine` per segment endpoint -- every point moves independently on
 *  its own axis (`UGraphicCompressOnXorY.java:122-127`, both endpoints). */
function transformEdge(edge: ActivityEdgeGeo, ct: PiecewiseAffineTransform, mode: CompressionMode): ActivityEdgeGeo {
  const points = edge.points.map((p) =>
    mode === 'x' ? { ...p, x: ct.transform(p.x) } : { ...p, y: ct.transform(p.y) },
  );
  return { ...edge, points };
}

/** @see isRectReservation */
function transformReservation(r: Reservation, ct: PiecewiseAffineTransform, mode: CompressionMode): Reservation {
  const next: Reservation = { ...r };
  const isRect = isRectReservation(r);
  if (mode === 'x') {
    next.x = ct.transform(r.x);
    next.width = isRect ? ct.transform(r.x + r.width) - next.x : r.width;
  } else {
    next.y = ct.transform(r.y);
    next.height = isRect ? ct.transform(r.y + r.height) - next.y : r.height;
  }
  return next;
}

/**
 * D7: `x`, `x + width`, `contentX`, `contentX + contentWidth` all pass
 * through `ct` -- only ever called on the X pass (a lane has no `y` field
 * of its own, decisions.md D7 / this task's own instructions).
 *
 * `contentMinX` is deliberately left UNCHANGED. It is `Swimlane
 * #getMinMax().getMinX()` (`Swimlanes.java:416-431`) -- a `MinMax` measured
 * by drawing the lane's OWN untranslated subtree into a `MinMaxUGraphic`
 * BEFORE `computeSizeInternal` computes `xx`, the one-time translate that
 * places that subtree at its final absolute position (`:423-425`). By the
 * time `ActivityNodeGeo.x` exists at all, `contentMinX` has already been
 * fully consumed by that translate -- it describes an offset in the tile's
 * own PRE-translate local frame, not a point on the page `ct` operates on.
 * Feeding it through `ct` would apply an absolute-coordinate compression
 * function to a small tile-local number that has no correspondence to that
 * coordinate system, which is not what upstream does (upstream never
 * revisits `getMinMax()` post-compression at all).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:416-431
 */
function transformSwimlane(s: SwimlaneGeo, ct: PiecewiseAffineTransform): SwimlaneGeo {
  const next: SwimlaneGeo = { ...s };
  const x = ct.transform(s.x);
  next.x = x;
  next.width = ct.transform(s.x + s.width) - x;
  if (s.contentX !== undefined) {
    const contentX = ct.transform(s.contentX);
    next.contentX = contentX;
    if (s.contentWidth !== undefined) next.contentWidth = ct.transform(s.contentX + s.contentWidth) - contentX;
  }
  return next;
}

interface AxisResult {
  next: CompressInput;
  removed: number;
}

/**
 * One `CompressionXorYBuilder` pass: `shapesOf` -> `collectSlots` ->
 * `reverse().smaller(5)` (`CompressionXorYBuilder.java:56` -- the `5` is
 * this exact citation, never fitted) -> `CompressionTransform`, applied to
 * every field the task lists.
 */
function compressAxis(input: CompressInput, mode: CompressionMode): AxisResult {
  const shapes = shapesOf({
    nodes: input.nodes,
    edges: input.edges,
    edgeMeta: input.edgeMeta,
    swimlanes: input.swimlanes,
    reservations: input.reservations,
    swimlaneBand: findSwimlaneBand(input.reservations),
    bounder: input.bounder,
    theme: input.theme,
  });
  const slotSet = collectSlots(shapes, mode).reverse().smaller(5);
  const ct = new CompressionTransform(slotSet);
  const removed = slotSet.slots().reduce((acc, s) => acc + s.size(), 0);

  const nodes = input.nodes.map((n) => transformNode(n, ct, mode));
  const edges = input.edges.map((e) => transformEdge(e, ct, mode));
  const reservations = input.reservations.map((r) => transformReservation(r, ct, mode));
  const swimlanes = mode === 'x' ? input.swimlanes.map((s) => transformSwimlane(s, ct)) : input.swimlanes;
  const bounds =
    mode === 'x'
      ? { maxX: ct.transform(input.bounds.maxX), maxY: input.bounds.maxY }
      : { maxX: input.bounds.maxX, maxY: ct.transform(input.bounds.maxY) };

  return { next: { ...input, nodes, edges, reservations, swimlanes, bounds }, removed };
}

/**
 * D1/D4: ON_X then ON_Y, the latter over the former's own output
 * (`ActivityDiagram3.java:209-210`). Never mutates `input`.
 */
export function compressGeometry(input: CompressInput): CompressResult {
  const x = compressAxis(input, 'x');
  const y = compressAxis(x.next, 'y');
  const { nodes, edges, swimlanes, reservations, bounds } = y.next;
  return { nodes, edges, swimlanes, reservations: [...reservations], bounds, removed: { x: x.removed, y: y.removed } };
}
