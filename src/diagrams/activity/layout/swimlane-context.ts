/**
 * Per-lane content-extent measurement and content-fitted swimlane sizing.
 *
 * Phase one of D1's two-phase split (`plans/activity-swimlane-rendering
 * /decisions.md#d1`): measure content extents and compute widths here;
 * T5 assigns lane origins and places nodes from the results
 * (`tile-coordinates.ts`).
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java
 */

import { edgeInkX } from './canvas-origin.js';
import { isInkless, nodeFudge } from './canvas-origin-fudge.js';
import type { CompositeUSymbol } from '../activity-geometry.types.js';
import type { ActivityEdgeGeo } from '../activity-geometry.types.js';

export interface SwimlaneContext {
  name: string;
  x: number;
  width: number;
}

export function buildSwimlaneContexts(laneNames: string[], startX: number, laneWidth: number): SwimlaneContext[] {
  return laneNames.map((name, i) => ({
    name,
    x: startX + i * laneWidth,
    width: laneWidth,
  }));
}

// ---------------------------------------------------------------------------
// Content extents
// ---------------------------------------------------------------------------

/**
 * A single placed item bucketed into a lane by its `swimlane` field.
 * `kind` (T3i, mirrors `ActivityNodeGeo.kind`) selects the SAME per-shape
 * `LimitFinder` fudge {@link measureLaneExtents} applies -- optional so
 * existing call sites/tests that pass a bare box (no fudge, matching the
 * pre-T3i behavior) are unaffected; every production caller
 * (`swimlane-placement.ts#measureLanes`) supplies it.
 */
export interface LaneItem {
  readonly swimlane?: string;
  readonly kind?: string;
  readonly x: number;
  readonly width: number;
  /** add4-T3c: the node's own `usymbol`/`label`, so a lane measures the
   *  SAME node-aware ink as the canvas scan (`canvas-origin-fudge.ts
   *  #nodeFudge`: a package's polygon, a card's or a ruled action's
   *  full-width `ULine`). */
  readonly usymbol?: CompositeUSymbol;
  readonly label?: string;
}

/**
 * One same-lane edge (T3i): both endpoints resolve to the SAME lane, so
 * its arrowhead ink widens exactly that lane's own extent -- mirrors
 * `Swimlanes#computeDrawingWidths`'s per-lane `LimitFinder` seeing every
 * draw call a lane's own content makes, edges included. A cross-lane edge
 * is never passed here: upstream draws those through the SEPARATE `Cross`
 * class (`Swimlanes.java:184-212`) AFTER `computeDrawingWidths` has
 * already run, so it contributes to no lane's own `getMinMax()`.
 */
export interface LaneEdge {
  readonly swimlane: string;
  readonly edge: ActivityEdgeGeo;
}

/**
 * A lane's content extent in lane-local coordinates. A lane with no
 * assigned items is `{ minX: 0, maxX: 0 }` -- upstream's own empty-lane
 * sentinel, `MinMax.getEmpty(true)` (`klimt/geom/MinMax.java:71-74`), zero-
 * initializes rather than using +/-Infinity, and this mirrors that so an
 * empty lane reports `contentWidth === 0`, not `NaN` or `-Infinity`.
 */
export interface LaneExtent {
  readonly minX: number;
  readonly maxX: number;
}

/** `{ minX, maxX }` accumulation starting point -- a pure identity value
 *  for {@link mergeExtent} so each contributor pass reduces the same way. */
const EMPTY_EXTENT: LaneExtent = { minX: Number.POSITIVE_INFINITY, maxX: Number.NEGATIVE_INFINITY };

function mergeExtent(acc: LaneExtent, next: LaneExtent): LaneExtent {
  return { minX: Math.min(acc.minX, next.minX), maxX: Math.max(acc.maxX, next.maxX) };
}

/** This lane's own items' extent, fudged per `nodeFudge`. Split from
 *  {@link laneExtentOf} only to keep that function's own complexity under
 *  the file's limit (T3i added the sibling edge pass). */
function itemsExtentOf(name: string, items: readonly LaneItem[]): LaneExtent {
  let acc = EMPTY_EXTENT;
  for (const item of items) {
    if (item.swimlane !== name || isInkless(item.kind ?? '')) continue;
    const fudge = nodeFudge({ ...item, kind: item.kind ?? '' }).x;
    acc = mergeExtent(acc, { minX: item.x - fudge.near, maxX: item.x + item.width + fudge.far });
  }
  return acc;
}

/** This lane's own same-lane edges' extent (T3i, {@link LaneEdge}'s own
 *  doc). Split from {@link laneExtentOf} for the same reason as
 *  {@link itemsExtentOf}. */
function edgesExtentOf(name: string, edges: readonly LaneEdge[]): LaneExtent {
  let acc = EMPTY_EXTENT;
  for (const laneEdge of edges) {
    if (laneEdge.swimlane !== name) continue;
    acc = mergeExtent(acc, edgeInkX(laneEdge.edge));
  }
  return acc;
}

/** One lane's extent over its own items plus its own same-lane edges,
 *  split from {@link measureLaneExtents} only to keep that function's own
 *  complexity under the file's limit (T3i added the edge pass). */
function laneExtentOf(name: string, items: readonly LaneItem[], edges: readonly LaneEdge[]): LaneExtent {
  const merged = mergeExtent(itemsExtentOf(name, items), edgesExtentOf(name, edges));
  return merged.minX === Number.POSITIVE_INFINITY ? { minX: 0, maxX: 0 } : merged;
}

/**
 * Measures each named lane's content extent from a flat list of placed
 * items (nodes today; edges/labels are a listed follow-on). An item whose
 * `swimlane` does not name a lane in `laneNames` -- including an item with
 * no `swimlane` at all -- is excluded from every lane's extent: a
 * multi-lane upstream diagram has no such item, every node is parsed
 * inside exactly one `|lane|` block.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:379-395
 *   -- `computeDrawingWidths`, the LimitFinder-per-lane draw-interception
 *   pass. D1 diverged from this (our own geometry, not draw interception --
 *   our engine already holds every node's coordinates), but a lane's own
 *   `getMinMax()` is populated by the SAME `LimitFinder` class the whole-
 *   canvas scan uses (`klimt/drawing/LimitFinder.java:170-211`), so its
 *   per-shape fudge (`canvas-origin-fudge.ts#nodeFudge`) applies here too -- a raw
 *   node box is 1-2px off every lane whose boundary item is a
 *   rect/ellipse/polygon kind (T3i, `jakuco-69-dari135`/`sikino-19-
 *   vuca111`/others: box content landed exactly `RECT_FUDGE.near` too far
 *   left because this function read the raw box edge, not its ink). A
 *   same-lane edge's own arrowhead `UPolygon` ink ({@link LaneEdge},
 *   `canvas-origin.ts#edgeInkX`) can ALSO widen a lane beyond its node
 *   boxes (T3i, `pakema-21-xema183` lane `A`: box ink `[25, 51.675]`,
 *   arrowhead ink (`POLYGON_FUDGE_X` +-10) `[25.338, 53.338]` -- the
 *   arrowhead's far corner wins, widening the lane's own content span by
 *   1.663 to exactly match the jar).
 */
export function measureLaneExtents(
  items: readonly LaneItem[],
  edges: readonly LaneEdge[],
  laneNames: readonly string[],
): Map<string, LaneExtent> {
  const extents = new Map<string, LaneExtent>();
  for (const name of laneNames) extents.set(name, laneExtentOf(name, items, edges));
  return extents;
}

/**
 * add4-T2c: how one drawn node is MEASURED when that differs from its own
 * box in its own lane. `computeDrawingWidths` runs one
 * `UGraphicInterceptorAllSwimlanes` pass (`Swimlanes.java:379-395`) whose
 * per-lane `LimitFinder`s see every primitive a lane's content draws.
 *
 * - `lanes`: an `Ftile`'s primitives go to every lane still active after
 *   narrowing to `tile.getSwimlanes()` (`UGraphicInterceptorAllSwimlanes
 *   .java:88-101,160-168`). `FtileWithNoteOpale#getSwimlanes` is the
 *   wrapped tile's lanes plus `swimlaneNote` (`FtileWithNoteOpale.java
 *   :92-99`) and `drawU` draws the Opale ungated outside a one-lane
 *   interceptor (`:217`), so a note captured in another lane is measured
 *   into BOTH -- while the content pass draws it in `swimlaneNote` alone.
 * - `marginX`: a stacked note is `TextBlockUtils.withMargin(opale, 10, 10)`
 *   (`FtileWithNotes.java:134`), whose `drawU` draws `UEmpty.create(dim)`
 *   over the margin-inclusive box (`TextBlockMarged.java:79-86`);
 *   `LimitFinder#drawEmpty` adds both corners unfudged (`LimitFinder.java
 *   :159-162`), so the lane spans the note plus `marginX` on each side.
 *
 * Keyed by the node object the walk pushes (`placeSwimlanes` receives
 * those same references); a `WeakMap`, never an own property, so no lane
 * copy or public geometry ever carries it. Read against the node's
 * CURRENT `x`/`width`, never a snapshot.
 */
export interface MeasureSpec {
  readonly lanes?: readonly string[];
  readonly marginX?: number;
}

const MEASURE_SPECS = new WeakMap<object, MeasureSpec>();

/** Records `spec` as `node`'s measurement spec (see {@link MeasureSpec}). */
export function markMeasureSpec(node: object, spec: MeasureSpec): void {
  MEASURE_SPECS.set(node, spec);
}

/** `node`'s measurement spec, or `undefined` when it measures as its own
 *  box in its own `swimlane`. */
export function measureSpecOf(node: object): MeasureSpec | undefined {
  return MEASURE_SPECS.get(node);
}

/** A {@link MeasureSpec}'d node's lane items: per lane, its own (fudged)
 *  box plus, with `marginX`, the unfudged `UEmpty` margin box. */
export function specLaneItems(
  node: { readonly swimlane?: string; readonly kind: string; readonly x: number; readonly width: number },
  spec: MeasureSpec,
): LaneItem[] {
  const lanes = spec.lanes ?? (node.swimlane !== undefined ? [node.swimlane] : []);
  const m = spec.marginX;
  return lanes.flatMap((lane) => {
    const own: LaneItem = { swimlane: lane, kind: node.kind, x: node.x, width: node.width };
    return m === undefined ? [own] : [own, { swimlane: lane, x: node.x - m, width: node.width + 2 * m }];
  });
}

// ---------------------------------------------------------------------------
// Lane widths
// ---------------------------------------------------------------------------

/**
 * `ISkinParam.SWIMLANE_WIDTH_SAME` -- the `skinparam swimlaneWidth same`
 * sentinel `SkinParam#swimlaneWidth()` returns for the string `"same"`
 * (parsed by `core/skinparam-key-handlers-table-c.ts`'s `swimlanewidth`
 * handler into `Theme.swimlaneWidth`, add4-T1b).
 * @see net/sourceforge/plantuml/style/ISkinParam.java:71
 * @see net/sourceforge/plantuml/skin/SkinParam.java:1121-1129
 */
export const SWIMLANE_WIDTH_SAME = -1;

/**
 * The literal padding `getHalfMissingSpace` returns on each side of a
 * divider when a lane's title does not overflow that lane's width. Two
 * source sites share the value: the `i === 0` / `i > lanes.length` outer-
 * edge case, and the `titleWidth <= laneWidth` non-overflow case.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:438
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:444
 */
export const SWIMLANE_HALF_MISSING_SPACE = 5;

/** Per-lane inputs `computeLaneWidths` and `halfMissingSpace` need. */
export interface LaneWidthInput {
  readonly contentWidth: number;
  readonly titleWidth: number;
}

/** Per-lane output of `computeLaneWidths` -- feeds `SwimlaneGeo`. */
export interface LaneWidth {
  readonly contentWidth: number;
  readonly contentMinX: number;
  readonly titleWidth: number;
  readonly width: number;
}

/**
 * Resolves `skinparam swimlaneWidth`'s `min` to a concrete number. The
 * `SWIMLANE_WIDTH_SAME` sentinel becomes the max content width over all
 * lanes, folded starting from `min` itself (`-1`) exactly as upstream's
 * loop does, not from `0` -- a distinction with no visible effect while
 * every content width is non-negative, but faithful to the source.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:399-403
 */
export function resolveSwimlaneMinWidth(contentWidths: Iterable<number>, min: number): number {
  if (min !== SWIMLANE_WIDTH_SAME) return min;
  let resolved = min;
  for (const width of contentWidths) resolved = Math.max(resolved, width);
  return resolved;
}

/**
 * Computes each lane's content-fitted width: `max(min, contentWidth)`.
 * The title is deliberately NOT part of this max -- upstream's title
 * never widens the lane itself, only the adjacent divider half-spaces
 * (see {@link halfMissingSpace}).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:398-409
 */
export function computeLaneWidths(
  extents: ReadonlyMap<string, LaneExtent>,
  titleWidths: ReadonlyMap<string, number>,
  min: number,
): Map<string, LaneWidth> {
  const contentWidths = new Map<string, number>();
  for (const [name, extent] of extents) contentWidths.set(name, extent.maxX - extent.minX);

  const resolvedMin = resolveSwimlaneMinWidth(contentWidths.values(), min);

  const widths = new Map<string, LaneWidth>();
  for (const [name, extent] of extents) {
    const contentWidth = contentWidths.get(name) ?? 0;
    widths.set(name, {
      contentWidth,
      contentMinX: extent.minX,
      titleWidth: titleWidths.get(name) ?? 0,
      width: Math.max(resolvedMin, contentWidth),
    });
  }
  return widths;
}

/**
 * The half-width of padding a divider contributes on the side facing lane
 * `i - 1` (1-indexed against `lanes`), for `i` in `[0, lanes.length]` --
 * `lanes.length + 1` dividers for `lanes.length` lanes, one before the
 * first lane and one after the last. `i === 0` and `i > lanes.length` are
 * those two outer edges and are always {@link SWIMLANE_HALF_MISSING_SPACE}.
 * Every other divider grows only when ITS adjacent lane's own title
 * overflows that lane's width -- upstream widens the divider, never the
 * lane (see {@link computeLaneWidths}).
 *
 * `min` must already be resolved (a plain number, never the `-1` "same"
 * sentinel) -- upstream resolves `min` once in `computeSizeInternal` and
 * reuses that resolved value for both lane widths and this call; pass the
 * same value {@link resolveSwimlaneMinWidth} (or `computeLaneWidths`)
 * used.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:436-449
 */
export function halfMissingSpace(i: number, lanes: readonly LaneWidthInput[], min: number): number {
  if (i === 0 || i > lanes.length) return SWIMLANE_HALF_MISSING_SPACE;
  const lane = lanes[i - 1]!;
  const laneWidth = Math.max(min, lane.contentWidth);
  if (lane.titleWidth <= laneWidth) return SWIMLANE_HALF_MISSING_SPACE;
  return Math.max(SWIMLANE_HALF_MISSING_SPACE, SWIMLANE_HALF_MISSING_SPACE + (lane.titleWidth - laneWidth) / 2);
}
