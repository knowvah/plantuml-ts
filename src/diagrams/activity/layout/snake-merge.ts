/**
 * `UGraphicForSnake`'s two-pass connector-merge mechanism (D1, T1b),
 * ported as a pure function over the lane-pass-ordered edge list `assign-
 * coordinates-full.ts` builds AFTER `placeSwimlanes` but BEFORE
 * `compressGeometry` runs: merging reads raw, pre-compression coordinates
 * (decisions.md D1), in the SAME order the jar feeds `Snake`s to
 * `UGraphicForSnake.draw` (edge-draw-order.ts's own `lanePassOrder`).
 *
 * @see net/sourceforge/plantuml/svek/UGraphicForSnake.java:126-176
 *   -- `addPendingSnake` (pass 1: merge into the first pending snake that
 *   accepts, replacing it in place; else append) and `flushUg` (pass 2:
 *   `removeEndDecorationIfTouches` against the full pending list, then
 *   draw) -- ported below as {@link mergeSnakes}'s two loops.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Snake.java:291-337
 *   -- `cannotBeTouched`/`same`/`merge`/`touches`.
 */

import type { ActivityEdgeGeo } from '../activity-geometry.types.js';
import type { EdgeMeta } from './swimlane-placement.js';
import { wormMerge } from './snake-merge-worm.js';
import type { MergeStrategy } from './snake-merge-worm.js';

/** `Snake.same` (`Snake.java:299-301`): exact-ish coordinate equality. */
const SAME_EPSILON = 0.001;

type Point = { readonly x: number; readonly y: number };

function same(p1: Point, p2: Point): boolean {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y) < SAME_EPSILON;
}

function strategyOf(edge: ActivityEdgeGeo): MergeStrategy {
  return edge.mergeable ?? 'FULL';
}

/** `MergeStrategy.max` (`MergeStrategy.java:42-45`): the MORE restrictive
 *  of the pair (`FULL < LIMITED < NONE`, by ordinal). */
function maxStrategy(a: MergeStrategy, b: MergeStrategy): MergeStrategy {
  const order: readonly MergeStrategy[] = ['FULL', 'LIMITED', 'NONE'];
  const rank = Math.max(order.indexOf(a), order.indexOf(b));
  return order[rank]!;
}

/** `Text#hasText` via `TextBlockUtils.isEmpty` -- our `label` surrogate's
 *  own empty/undefined states both count as "no text" (`ActivityEdgeGeo`
 *  models one label, never `Snake.texts`' list, so no list-of-texts
 *  guard is needed here). */
function hasText(label: string | undefined): boolean {
  return label !== undefined && label.trim() !== '';
}

/** `Worm#isPureHorizontal` (`Worm.java:100-102`). */
function isPureHorizontal(points: readonly Point[]): boolean {
  return points.length === 2 && points[0]!.y === points[1]!.y;
}

/** `Snake#cannotBeTouched` (`Snake.java:291-293`). */
function cannotBeTouched(edge: ActivityEdgeGeo): boolean {
  return strategyOf(edge) !== 'FULL' || isPureHorizontal(edge.points);
}

/**
 * The merged decoration (`Snake.java:313`'s `oneOf`): the LATER-drawn
 * side's end decoration wins, falling back to the earlier side's only
 * when the later side has none. `a` is always the earlier-pushed/head
 * side, `b` the later-pushed/tail side, regardless of which join
 * direction {@link mergeTwo} took.
 */
function mergedArrowhead(a: ActivityEdgeGeo, b: ActivityEdgeGeo): false | undefined {
  return b.arrowhead === false ? a.arrowhead : b.arrowhead;
}

/**
 * Builds the merged edge for one join direction: `a`'s points run first,
 * `b`'s run after (`Snake.java:317-320`'s own field order). The text
 * guard applies to `b` only (`Snake.merge`'s `for (Text text : other.texts)`,
 * `:308-310`) -- `a`'s own text always survives untouched into the
 * result (`mergeTexts`), since a successful merge requires `b` to carry
 * none.
 */
function joinOrdered(a: ActivityEdgeGeo, b: ActivityEdgeGeo, strategy: MergeStrategy): ActivityEdgeGeo | null {
  if (hasText(b.label)) return null;
  const points = wormMerge(a.points, b.points, strategy);
  const arrowhead = mergedArrowhead(a, b);
  const emphasize = a.emphasize ?? b.emphasize;
  const midArrowAt = a.midArrowAt ?? b.midArrowAt;
  return {
    points,
    mergeable: strategy,
    ...(a.label !== undefined ? { label: a.label } : {}),
    ...(a.color !== undefined ? { color: a.color } : {}),
    ...(emphasize !== undefined ? { emphasize } : {}),
    ...(midArrowAt !== undefined ? { midArrowAt } : {}),
    ...(arrowhead === false ? { arrowhead: false as const } : {}),
  };
}

/**
 * `Snake#merge` (`Snake.java:303-327`). `head` is the earlier-pending
 * snake ("this" in `PendingSnake.merge(newItem)`,
 * `UGraphicForSnake.java:117`), `tail` the newly pushed one ("other").
 * End-to-start only, tried in both directions (`:312,323-324`) -- EITHER
 * snake may end up first in the output, as long as one's last point
 * touches the other's first.
 */
function mergeTwo(head: ActivityEdgeGeo, tail: ActivityEdgeGeo): ActivityEdgeGeo | null {
  const strategy = maxStrategy(strategyOf(head), strategyOf(tail));
  if (strategy === 'NONE') return null;

  const headPts = head.points;
  const tailPts = tail.points;
  if (same(headPts[headPts.length - 1]!, tailPts[0]!)) return joinOrdered(head, tail, strategy);
  if (same(headPts[0]!, tailPts[tailPts.length - 1]!)) return joinOrdered(tail, head, strategy);
  return null;
}

interface PendingEntry {
  readonly edge: ActivityEdgeGeo;
  readonly meta: EdgeMeta;
}

/**
 * `addPendingSnake` (`UGraphicForSnake.java:146-156`): try every already-
 * pending entry IN ORDER, replace the first that accepts; else append.
 * Scoped to `FtileGroup`/`partition` boundaries (D1) -- a pending entry
 * outside the new edge's own scope is never even offered a merge, the
 * same way a nested `UGraphicForSnake`'s pending list is never visible
 * to its outer one.
 */
function addToPending(pending: PendingEntry[], entry: PendingEntry): void {
  for (let i = 0; i < pending.length; i++) {
    if (pending[i]!.meta.scope !== entry.meta.scope) continue;
    const merged = mergeTwo(pending[i]!.edge, entry.edge);
    if (merged !== null) {
      pending[i] = { edge: merged, meta: pending[i]!.meta };
      return;
    }
  }
  pending.push(entry);
}

/** `PendingSnake#touchesOther` (`UGraphicForSnake.java:92-100`): no text
 *  guard, and only `other`'s own strategy/shape gates it -- NOT `entry`'s. */
function touchesOther(entry: PendingEntry, other: PendingEntry): boolean {
  if (cannotBeTouched(other.edge)) return false;
  const entryPts = entry.edge.points;
  return same(entryPts[entryPts.length - 1]!, other.edge.points[0]!);
}

/**
 * `flushUg`'s own pass (`UGraphicForSnake.java:158-165`,
 * `removeEndDecorationIfTouches` at `:81-88`): for each pending entry,
 * drop its end decoration if ANY other entry in the SAME scope (including
 * itself -- harmless, `connection-census.md` §5) is untouchable-as-a-
 * target and still touches it.
 */
function removeEndDecorationIfTouches(pending: readonly PendingEntry[]): PendingEntry[] {
  return pending.map((entry) => {
    const touches = pending.some((other) => other.meta.scope === entry.meta.scope && touchesOther(entry, other));
    if (!touches) return entry;
    return { edge: { ...entry.edge, arrowhead: false as const }, meta: entry.meta };
  });
}

export interface MergedEdges {
  readonly edges: ActivityEdgeGeo[];
  readonly edgeMeta: EdgeMeta[];
}

/**
 * The full two-pass mechanism: `edges`/`edgeMeta` must already be in the
 * jar's own draw order (`edge-draw-order.ts#lanePassOrder`, applied by
 * the caller) -- this function never reorders its input, only shrinks it
 * (one entry per surviving pending snake) and may flip an `arrowhead` to
 * `false`.
 */
export function mergeSnakes(edges: readonly ActivityEdgeGeo[], edgeMeta: readonly EdgeMeta[]): MergedEdges {
  const pending: PendingEntry[] = [];
  for (let i = 0; i < edges.length; i++) {
    addToPending(pending, { edge: edges[i]!, meta: edgeMeta[i]! });
  }
  const flushed = removeEndDecorationIfTouches(pending);
  return { edges: flushed.map((p) => p.edge), edgeMeta: flushed.map((p) => p.meta) };
}
