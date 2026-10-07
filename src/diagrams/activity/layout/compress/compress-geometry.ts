/**
 * `compressGeometry` -- `klimt/compress/CompressionXorYBuilder.java:52-69`
 * and `UGraphicCompressOnXorY.java:86-135`, ported over `ActivityGeometry`
 * instead of a live `UGraphic` redraw (D1). Runs ON_X, applies it, then runs
 * ON_Y on the X-compressed result (`ActivityDiagram3.java:209-210`, D4).
 * `Recentred` (`:212`) is NOT ported here -- filed as
 * `activity-canvas-margin` (mission `activity-klimt-compress` README).
 *
 * Wired in by T5 (mission `activity-klimt-compress` batch 4) at
 * `assign-coordinates-full.ts#compressAndAssemble`, the one call site.
 *
 * @see net/sourceforge/plantuml/klimt/compress/CompressionXorYBuilder.java:52-69
 * @see net/sourceforge/plantuml/klimt/compress/UGraphicCompressOnXorY.java:86-135
 * @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagram3.java:205-213
 */

import type { ActivityEdgeGeo, ActivityNodeGeo, SwimlaneGeo, SwimlaneBandGeo } from '../../activity-geometry.types.js';
import type { EdgeMeta } from '../swimlane-placement.js';
import type { Reservation } from '../hexagon-reservations.js';
import type { StringBounder } from '../../tiles/tile.js';
import type { Theme } from '../../../../core/theme.js';
import type { CompressionMode } from './slot.js';
import { shapesOf } from './shapes-of.js';
import { collectSlots } from './slot-finder.js';
import { CompressionTransform, type PiecewiseAffineTransform } from './compression-transform.js';
import { arrowDirection } from '../../arrows-regular.js';
import { labelAnchors, transformAnchors, withLabelDeltas } from './edge-label-anchor.js';

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
 *
 * T3i: `group`/`partition` joined this set -- `USymbolFrame#drawFrame`'s
 * own frame box is ALSO a real `URectangle` (`USymbolFrame.java:70-71`),
 * and `UGraphicCompressOnXorY.java:90`'s rect branch applies "ignore
 * flags notwithstanding" (`isRectReservation`'s own doc cites the same
 * line) -- `ignoreForCompressionOnX/Y` only changes what counts as
 * OCCUPIED for finding removable gaps, never whether a rect's own drawn
 * box gets resized once a gap through it is actually removed.
 */
const RECT_WIDTH_KINDS = new Set([
  'action',
  'fork-bar',
  'join-bar',
  'split-bar',
  'split-join-bar',
  'group',
  'partition',
]);

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
 * new value for a dimension nothing draws. `group`/`partition` (T3i) join
 * this set too, same `USymbolFrame` rect, same "ignore flags
 * notwithstanding" rule as {@link RECT_WIDTH_KINDS}'s own doc.
 * @see net/sourceforge/plantuml/klimt/compress/UGraphicCompressOnXorY.java:122-127
 */
const RECT_HEIGHT_KINDS = new Set(['action', 'fork-bar', 'join-bar', 'group', 'partition']);

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

/**
 * A `ULine` per segment endpoint -- every point moves independently on its
 * own axis (`UGraphicCompressOnXorY.java:122-127`, both endpoints).
 *
 * D4/T1b (`stop-1-edgemeta-zip.md` addendum): `midArrowAt` is an absolute
 * point drawn through the SAME compressing `UGraphic` as the snake
 * (`ug.apply(new UTranslate(xx, (y1 + y2) / 2)).draw(asToUp)`,
 * `FtileWhile.java:307`), so it transforms exactly as one of `edge.points`
 * would on the matching axis -- never left at its pre-compression value.
 *
 * b3/T3a (family C/EMMID): `emphasizeAt` (`withEmphasizeAnchor`'s own doc)
 * is the SAME kind of absolute anchor point and transforms the same way --
 * `Worm#drawLine`'s mid-arrow draw (`ftile/Worm.java:178-182`) reaches the
 * identical `draw(UShape)` non-`ULine` branch `midArrowAt`'s `FtileWhile`
 * draw does.
 */
function transformEdge(edge: ActivityEdgeGeo, ct: PiecewiseAffineTransform, mode: CompressionMode): ActivityEdgeGeo {
  const points = edge.points.map((p) =>
    mode === 'x' ? { ...p, x: ct.transform(p.x) } : { ...p, y: ct.transform(p.y) },
  );
  const next: ActivityEdgeGeo = { ...edge, points };
  if (edge.midArrowAt !== undefined) {
    next.midArrowAt =
      mode === 'x'
        ? { ...edge.midArrowAt, x: ct.transform(edge.midArrowAt.x) }
        : { ...edge.midArrowAt, y: ct.transform(edge.midArrowAt.y) };
  }
  if (edge.emphasizeAt !== undefined) {
    next.emphasizeAt =
      mode === 'x'
        ? { ...edge.emphasizeAt, x: ct.transform(edge.emphasizeAt.x) }
        : { ...edge.emphasizeAt, y: ct.transform(edge.emphasizeAt.y) };
  }
  return next;
}

/**
 * SUPERSEDED by add4-T3a (`edge-label-anchor.ts`): the reading below is
 * wrong. `Worm#getPoint` resolves a point through the Worm's own `tr` (its
 * `move` translate, `ftile/Worm.java:65-79,326-330`), not through the
 * compressing `UGraphic`, so the label position is computed on the RAW
 * worm and only its `UText` draw point passes through `ct()`. Kept as the
 * record of the earlier claim:
 *
 * T1b (`activity-divergence-drive-3`, D1 verification): an edge LABEL's
 * position needs no anchor-carry field analogous to {@link
 * ActivityEdgeGeo.emphasizeAt}/`midArrowAt` above. `Snake#getTextBlockPosition`
 * (`ftile/Snake.java:244-270`) reads `worm.getPoint(i)`
 * (`ftile/Worm.java:322-324`), which resolves every point through the
 * compressing `UGraphic`'s own translate (`:326-329`, `resolve`/`tr`) --
 * i.e. upstream computes the label position AT DRAW TIME, on the SAME
 * already-compressed points `drawInternalOneColor` draws (both are
 * called from `Snake#drawInternal`, `Snake.java:189-198`, in the same
 * pass). This port's `layout/snake-text-position.ts#getTextBlockPosition`
 * mirrors that by running at RENDER time (`renderer.ts#renderEdgeLabel`)
 * over `edge.points` -- already carried through both `transformEdge`
 * passes above by the time `renderer.ts` ever sees them. `emphasizeAt`/
 * `midArrowAt` needed a carry only because their own (pre-this-mission)
 * render-time computation ran a direction-match SEARCH that upstream
 * runs pre-compression (`Worm#drawInternalOneColor`'s loop, `:134-143`)
 * -- a label's position has no such pre-compression-only computation to
 * preserve.
 */

/**
 * b3/T3a (family C/EMMID): populates {@link ActivityEdgeGeo.emphasizeAt}
 * from the edge's OWN pre-compression `points` -- run once, before the X
 * compression pass, so every subsequent `transformEdge` call (X then Y)
 * carries it through exactly like `midArrowAt`. Mirrors `renderer.ts`'s
 * (pre-this-fix) `renderEdgeSegments` search for the first segment whose
 * direction matches `emphasize` -- same search, run here instead, over the
 * UNCOMPRESSED points.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Worm.java:134-143,178-182
 */
function withEmphasizeAnchor(edges: readonly ActivityEdgeGeo[]): ActivityEdgeGeo[] {
  return edges.map((edge) => {
    if (edge.emphasize === undefined) return edge;
    const { points } = edge;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i]!;
      const p2 = points[i + 1]!;
      if (arrowDirection(p2.x - p1.x, p2.y - p1.y) === edge.emphasize) {
        return { ...edge, emphasizeAt: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 } };
      }
    }
    return edge;
  });
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
  ct: PiecewiseAffineTransform;
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

  return { next: { ...input, nodes, edges, reservations, swimlanes, bounds }, removed, ct };
}

/**
 * D1/D4: ON_X then ON_Y, the latter over the former's own output
 * (`ActivityDiagram3.java:209-210`). Never mutates `input`. Edge labels are
 * anchored on the raw points and their anchor mapped through each pass's
 * `ct` (`edge-label-anchor.ts`); the X-pass deltas are set before the Y
 * pass so its slot finder sees the label at `(ctX(x), y)`, as the ON_Y
 * builder's `SlotFinder` does (`CompressionXorYBuilder.java:62-68`).
 */
export function compressGeometry(input: CompressInput): CompressResult {
  const withAnchors = { ...input, edges: withEmphasizeAnchor(input.edges) };
  const rawLabels = labelAnchors(input.edges, input.theme);
  const x = compressAxis(withAnchors, 'x');
  const xLabels = transformAnchors(rawLabels, x.ct, 'x');
  const xNext = { ...x.next, edges: withLabelDeltas(x.next.edges, xLabels, input.theme) };
  const y = compressAxis(xNext, 'y');
  const yLabels = transformAnchors(xLabels, y.ct, 'y');
  const edges = withLabelDeltas(y.next.edges, yLabels, input.theme);
  const { nodes, swimlanes, reservations, bounds } = y.next;
  return { nodes, edges, swimlanes, reservations: [...reservations], bounds, removed: { x: x.removed, y: y.removed } };
}
