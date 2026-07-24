/**
 * `FrontierCalculator` port (mission G6 T9,
 * plans/g6-cluster-geometry/batch-4/withlabel-derivation.md §2c) — the
 * post-layout box-correction jar applies to a border-point (`<<entrypoint>>`
 * /`<<exitpoint>>`-child, `portRanksLabelOnEe`) cluster instead of using
 * graphviz's own raw cluster polygon directly. Small, closed-form, no
 * approximation: a faithful whole-file port, not a re-derivation. Verified
 * correct by hand-tracing every step against jar's real values on all 3
 * fixtures T8's derivation named, and re-confirmed against the real
 * `@knowvah/dot-engine` layout call by "Paper gate v5" (G7 T19).
 *
 * WIRED (G7 T14b) into `state-composite-geo.ts#materializeCluster`, gated on
 * `GeoSpec`'s `borderPointMemberIds` (set only for `hasBorderPointChildren`
 * composites, `state-composite-cluster.ts#resolveClusterComposite`). The two
 * gaps this module's doc previously named as blocking (`addClusters` never
 * reading `portRanks`/`portAnchorId` at all; no `${id}i` wrapper) are BOTH
 * closed — the former by G8/T1b + this task's own dedicated border-point
 * branch (`graph-layout-build.ts#addClusters`), the latter by this task's
 * `borderPointAncestorWrap`-gated `${outerName}i` nesting (same file).
 *
 * Pure functions, unchanged by this wiring — `materializeCluster` supplies
 * the already-laid-out boxes; no production call site duplicates this
 * arithmetic.
 *
 * @see ~/git/plantuml/.../svek/FrontierCalculator.java (whole file, 169 lines)
 * @see ~/git/plantuml/.../svek/Cluster.java#manageEntryExitPoint (:410-436)
 */

import { BORDER_POINT_SIZE } from './state-entity-position.js';

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/** `EntityPosition.RADIUS` — half a border-point node's own fixed 12px box
 *  (`state-entity-position.ts`'s `BORDER_POINT_SIZE`), NOT re-declared as an
 *  independent literal. */
const RADIUS = BORDER_POINT_SIZE / 2;
/** `FrontierCalculator`'s own push-detection corner radius, `3 * RADIUS`. */
const DELTA = 3 * RADIUS;

interface Rect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function toRect(b: Box): Rect {
  return { minX: b.x, minY: b.y, maxX: b.x + b.width, maxY: b.y + b.height };
}

function toBox(r: Rect): Box {
  return { x: r.minX, y: r.minY, width: r.maxX - r.minX, height: r.maxY - r.minY };
}

function unionRect(a: Rect, b: Rect): Rect {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

function mergePoint(r: Rect, p: Point): Rect {
  return {
    minX: Math.min(r.minX, p.x),
    minY: Math.min(r.minY, p.y),
    maxX: Math.max(r.maxX, p.x),
    maxY: Math.max(r.maxY, p.y),
  };
}

/**
 * Port of `FrontierCalculator`'s constructor + implicit box computation.
 * `initial` is graphviz's own raw cluster polygon (`DotLayoutResult
 * .clusters[id]`, the fallback/starting frame — jar's `Cluster
 * .getRectangleArea()` pre-correction). `insides` are the direct NORMAL-
 * position member boxes (leaves + already-corrected nested clusters);
 * `points` are the direct border-point member CENTERS. `rankdir` selects
 * which axis step 5's corner-exclusion test applies to (state diagrams:
 * always `'TB'` in every fixture verified this iteration — `'LR'` is ported
 * faithfully but has zero fixture coverage, withlabel-derivation.md §6.3).
 */
export function frontierCalculator(
  initial: Box,
  insides: readonly Box[],
  points: readonly Point[],
  rankdir: 'TB' | 'LR',
): Box {
  const initialRect = toRect(initial);

  // 1. seed `core`: bbox-union of insides, or a degenerate 2x2 box centered
  //    on `initial` when there are no normal-position direct members.
  let core: Rect;
  if (insides.length === 0) {
    const cx = (initialRect.minX + initialRect.maxX) / 2;
    const cy = (initialRect.minY + initialRect.maxY) / 2;
    core = { minX: cx - 1, minY: cy - 1, maxX: cx + 1, maxY: cy + 1 };
  } else {
    core = insides.map(toRect).reduce(unionRect);
  }

  // 2. extend to cover every border-point center.
  for (const p of points) core = mergePoint(core, p);

  // 3. touch/fallback: an axis-extreme boundary keeps its `core` value ONLY
  //    if some point sits exactly on it; otherwise it resets to `initial`'s
  //    corresponding boundary. All four checks read the SAME post-merge
  //    `core` snapshot (order between the four resets does not matter, each
  //    reads/writes only its own axis).
  const touchesMinX = points.some((p) => p.x === core.minX);
  const touchesMaxX = points.some((p) => p.x === core.maxX);
  const touchesMinY = points.some((p) => p.y === core.minY);
  const touchesMaxY = points.some((p) => p.y === core.maxY);
  core = {
    minX: touchesMinX ? core.minX : initialRect.minX,
    maxX: touchesMaxX ? core.maxX : initialRect.maxX,
    minY: touchesMinY ? core.minY : initialRect.minY,
    maxY: touchesMaxY ? core.maxY : initialRect.maxY,
  };

  // 4. push detection (DELTA-radius corner test) against the post-fallback core.
  let pushMinX = false;
  let pushMaxX = false;
  let pushMinY = false;
  let pushMaxY = false;
  for (const p of points) {
    if (p.y === core.minY || p.y === core.maxY) {
      if (Math.abs(p.x - core.maxX) < DELTA) pushMaxX = true;
      if (Math.abs(p.x - core.minX) < DELTA) pushMinX = true;
    }
    if (p.x === core.minX || p.x === core.maxX) {
      if (Math.abs(p.y - core.maxY) < DELTA) pushMaxY = true;
      if (Math.abs(p.y - core.minY) < DELTA) pushMinY = true;
    }
  }

  // 5. corner exclusion (rankdir-dependent) — a point sitting exactly on a
  //    corner cancels the push on the axis rankdir treats as the "primary"
  //    (flow) direction.
  for (const p of points) {
    if (rankdir === 'LR') {
      if (p.x === core.minX && (p.y === core.minY || p.y === core.maxY)) pushMinX = false;
      if (p.x === core.maxX && (p.y === core.minY || p.y === core.maxY)) pushMaxX = false;
    } else {
      if (p.y === core.minY && (p.x === core.minX || p.x === core.maxX)) pushMinY = false;
      if (p.y === core.maxY && (p.x === core.minX || p.x === core.maxX)) pushMaxY = false;
    }
  }

  // 6. apply pushes.
  core = {
    minX: pushMinX ? core.minX - DELTA : core.minX,
    maxX: pushMaxX ? core.maxX + DELTA : core.maxX,
    minY: pushMinY ? core.minY - DELTA : core.minY,
    maxY: pushMaxY ? core.maxY + DELTA : core.maxY,
  };

  return toBox(core);
  // #lizard forgives -- faithful whole-file port of FrontierCalculator.java
  // (169 lines, no upstream ambiguity, withlabel-derivation.md §2c's own
  // note: "small, closed-form, no approximation possible/needed"); each
  // numbered block above is one independently-conditional algorithm STEP
  // from the jar source, not decision complexity to simplify -- splitting
  // it across helper functions would only obscure the step-by-step mapping
  // this port's own porting discipline (CLAUDE.md) requires staying
  // traceable to the Java.
}

/**
 * `Cluster#manageEntryExitPoint`'s trailing
 * `frontierCalculator.ensureMinWidth(getTitleAndAttributeWidth() + 10)` call
 * (`Cluster.java:427-428`) — widens (and, if necessary, re-centers toward
 * `initial`'s own left edge) `core` so it never ends up narrower than the
 * title/attribute table plus its 10px pad.
 *
 * @see ~/git/plantuml/.../svek/FrontierCalculator.java#ensureMinWidth (:154-167)
 */
export function ensureMinWidth(core: Box, minWidth: number, initial: Box): Box {
  const r = toRect(core);
  const delta = r.maxX - r.minX - minWidth;
  if (delta >= 0) return core;
  let newMinX = r.minX + delta / 2;
  let newMaxX = r.maxX - delta / 2;
  const error = newMinX - initial.x;
  if (error < 0) {
    newMinX -= error;
    newMaxX -= error;
  }
  return toBox({ ...r, minX: newMinX, maxX: newMaxX });
}
