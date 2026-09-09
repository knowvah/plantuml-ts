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

/** A single placed item bucketed into a lane by its `swimlane` field. */
export interface LaneItem {
  readonly swimlane?: string;
  readonly x: number;
  readonly width: number;
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
 *   pass this diverges from per D1 (our own geometry, not draw
 *   interception -- our engine already holds every node's coordinates).
 */
export function measureLaneExtents(items: readonly LaneItem[], laneNames: readonly string[]): Map<string, LaneExtent> {
  const extents = new Map<string, LaneExtent>();
  for (const name of laneNames) {
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    for (const item of items) {
      if (item.swimlane !== name) continue;
      minX = Math.min(minX, item.x);
      maxX = Math.max(maxX, item.x + item.width);
    }
    extents.set(name, minX === Number.POSITIVE_INFINITY ? { minX: 0, maxX: 0 } : { minX, maxX });
  }
  return extents;
}

// ---------------------------------------------------------------------------
// Lane widths
// ---------------------------------------------------------------------------

/**
 * `ISkinParam.SWIMLANE_WIDTH_SAME` -- the `skinparam swimlaneWidth same`
 * sentinel `SkinParam#swimlaneWidth()` returns for the string `"same"`.
 * Not yet wired to the parser (no `swimlanewidth` skinparam key exists in
 * `skinparam-key-handlers-table-*.ts`); modeled here so the arithmetic is
 * correct once that follow-on lands.
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
