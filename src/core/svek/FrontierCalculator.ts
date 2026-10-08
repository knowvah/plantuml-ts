/**
 * FrontierCalculator — the post-layout box-correction jar applies to a
 * cluster's own graphviz-assigned rectangle before drawing it, whenever the
 * cluster carries `<<entrypoint>>`/`<<exitpoint>>` (port) members alongside
 * or instead of normal-position members. Every cuca-family cluster (svek/
 * `Cluster.java`, used by description/component/usecase AND state diagrams)
 * routes through this ONE calculator; this file is that ONE shared port —
 * previously duplicated as `diagrams/description/frontier-calculator.ts` and
 * `diagrams/state/state-composite-frontier.ts` (mission shared-seam-
 * extraction T5; D1 — shared code lives in `core/`, never in one engine for
 * another to import).
 *
 * Upstream splits a cluster's member `SvekNode`s into `insides` (normal-
 * position entities — full `RectangleArea` merged into the boundary) vs
 * `points` (entry/exit-point ports, `isNormalPosition==false` — only their
 * CENTER point merged), then `FrontierCalculator` computes the cluster's
 * real drawn rectangle: when `insides` is EMPTY (a port-only container),
 * `core` falls back to a 2x2 box centered on the cluster's OWN graphviz-
 * assigned rectangle (`initial`), merges each port's center, then a push
 * step (`DELTA = 3 * EntityPosition.RADIUS = 18`, java:47,97-146) expands
 * the boundary by `DELTA` on whichever edge a port's center sits within
 * `DELTA` of, except the rankdir-perpendicular corner case.
 *
 * Both former ports independently hand-traced every Java line (the
 * description port additionally cross-checked jar's raw graphviz-native
 * (y-up) numbers AND jar's final SVG (y-down) numbers for `component/
 * gafegu-06-nito976`, confirming the algorithm is orientation-agnostic — its
 * touch/push logic is exact-equality based and depends only on callers
 * staying internally consistent about which frame `initial`/`insides`/
 * `points` are all expressed in) and produced textually different but
 * ALGORITHMICALLY IDENTICAL implementations (one step-by-step immutable
 * `RectangleArea`, one batched-`Rect`-with-a-`Box`-adapter) — the Java fully
 * settles every branch, so this merge is a pure textual unification, not a
 * behavioural choice between the two (shared-seam-extraction T5, README
 * stop 5 does not apply).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/FrontierCalculator.java (whole file, 169 lines)
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java#manageEntryExitPoint (:410-436)
 */

/**
 * Mirrors upstream `klimt/geom/RectangleArea` (the axis-aligned-box subset
 * `FrontierCalculator` actually uses — `core/klimt/geom/` has no port of the
 * full class yet, so this declares only that subset rather than redefining
 * `RectangleArea`'s unrelated members). Immutable — every mutator below
 * returns a new value, matching `RectangleArea`'s own immutable `with*`/
 * `add*`/`merge` methods.
 */
export interface RectangleArea {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** `EntityPosition.RADIUS` (abel/EntityPosition.java:56). */
export const ENTITY_POSITION_RADIUS = 6;
/** `FrontierCalculator.DELTA` (svek/FrontierCalculator.java:47). */
const DELTA = 3 * ENTITY_POSITION_RADIUS;

function buildRect(minX: number, minY: number, maxX: number, maxY: number): RectangleArea {
  return { minX, minY, maxX, maxY };
}

/** `RectangleArea#merge(RectangleArea)`. */
function mergeRect(a: RectangleArea, b: RectangleArea): RectangleArea {
  return buildRect(
    Math.min(a.minX, b.minX),
    Math.min(a.minY, b.minY),
    Math.max(a.maxX, b.maxX),
    Math.max(a.maxY, b.maxY),
  );
}

/** `RectangleArea#merge(XPoint2D)`. */
function mergePoint(a: RectangleArea, p: Point): RectangleArea {
  return buildRect(Math.min(a.minX, p.x), Math.min(a.minY, p.y), Math.max(a.maxX, p.x), Math.max(a.maxY, p.y));
}

function withMinX(r: RectangleArea, d: number): RectangleArea {
  return { ...r, minX: d };
}
function withMaxX(r: RectangleArea, d: number): RectangleArea {
  return { ...r, maxX: d };
}
function withMinY(r: RectangleArea, d: number): RectangleArea {
  return { ...r, minY: d };
}
function withMaxY(r: RectangleArea, d: number): RectangleArea {
  return { ...r, maxY: d };
}
function addMinX(r: RectangleArea, d: number): RectangleArea {
  return { ...r, minX: r.minX + d };
}
function addMaxX(r: RectangleArea, d: number): RectangleArea {
  return { ...r, maxX: r.maxX + d };
}
function addMinY(r: RectangleArea, d: number): RectangleArea {
  return { ...r, minY: r.minY + d };
}
function addMaxY(r: RectangleArea, d: number): RectangleArea {
  return { ...r, maxY: r.maxY + d };
}

/** `DotStringFactory`'s `Rankdir` — only the two values `FrontierCalculator`
 *  branches on (svek/FrontierCalculator.java:120). */
export type FrontierRankdir = 'TB' | 'LR';

/** Seed `core` when `insides` is empty: `FrontierCalculator`'s constructor,
 *  java:60-63 — a 2x2 box centered on `initial`'s own center point. */
function seedCore(initial: RectangleArea): RectangleArea {
  const cx = (initial.minX + initial.maxX) / 2;
  const cy = (initial.minY + initial.maxY) / 2;
  return buildRect(cx - 1, cy - 1, cx + 1, cy + 1);
}

/**
 * Faithful port of `FrontierCalculator`'s constructor + `getSuggestedPosition`
 * (svek/FrontierCalculator.java:51-152) — computes the cluster's real drawn
 * rectangle from its graphviz-assigned `initial` rect, its normal-position
 * member rects (`insides`), and its port center points (`points`). Callers
 * needing `ensureMinWidth` (java:154-167) apply it to this function's result
 * separately (mirrors `Cluster#manageEntryExitPoint`'s own two-call
 * sequence, java:425-430).
 */
export function frontierCalculator(
  initial: RectangleArea,
  insides: readonly RectangleArea[],
  points: readonly Point[],
  rankdir: FrontierRankdir,
): RectangleArea {
  let core: RectangleArea | undefined;
  for (const inside of insides) core = core === undefined ? inside : mergeRect(core, inside);
  if (core === undefined) core = seedCore(initial);
  for (const p of points) core = mergePoint(core, p);

  let touchMinX = false;
  let touchMaxX = false;
  let touchMinY = false;
  let touchMaxY = false;
  for (const p of points) {
    if (p.x === core.minX) touchMinX = true;
    if (p.x === core.maxX) touchMaxX = true;
    if (p.y === core.minY) touchMinY = true;
    if (p.y === core.maxY) touchMaxY = true;
  }
  if (!touchMinX) core = withMinX(core, initial.minX);
  if (!touchMaxX) core = withMaxX(core, initial.maxX);
  if (!touchMinY) core = withMinY(core, initial.minY);
  if (!touchMaxY) core = withMaxY(core, initial.maxY);

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
  for (const p of points) {
    if (rankdir === 'LR') {
      if (p.x === core.minX && (p.y === core.minY || p.y === core.maxY)) pushMinX = false;
      if (p.x === core.maxX && (p.y === core.minY || p.y === core.maxY)) pushMaxX = false;
    } else {
      if (p.y === core.minY && (p.x === core.minX || p.x === core.maxX)) pushMinY = false;
      if (p.y === core.maxY && (p.x === core.minX || p.x === core.maxX)) pushMaxY = false;
    }
  }
  if (pushMaxX) core = addMaxX(core, DELTA);
  if (pushMinX) core = addMinX(core, -DELTA);
  if (pushMaxY) core = addMaxY(core, DELTA);
  if (pushMinY) core = addMinY(core, -DELTA);

  // #lizard forgives -- faithful port of FrontierCalculator's constructor
  // (svek/FrontierCalculator.java:51-148); branch count mirrors upstream's
  // own touch/push/corner-exclusion cases.
  return core;
}

/** Faithful port of `FrontierCalculator#ensureMinWidth`
 *  (svek/FrontierCalculator.java:154-167). */
export function ensureMinWidth(core: RectangleArea, initial: RectangleArea, minWidth: number): RectangleArea {
  const delta = core.maxX - core.minX - minWidth;
  if (delta >= 0) return core;
  let newMinX = core.minX + delta / 2;
  let newMaxX = core.maxX - delta / 2;
  const error = newMinX - initial.minX;
  if (error < 0) {
    newMinX -= error;
    newMaxX -= error;
  }
  return withMaxX(withMinX(core, newMinX), newMaxX);
}

/**
 * The inputs `Cluster#manageEntryExitPoint` reads off ONE cluster
 * (`svek/Cluster.java:410-436`), expressed in the layout frame. Built once per
 * layout result by the engine; the cluster's own current rectangle is NOT
 * part of it — that is the mutable state {@link ClusterRectangles} owns.
 */
export interface ProjectionClusterSpec {
  readonly id: string;
  /** `sh.getRectangleArea()` of every NORMAL-position `SvekNode` in
   *  `Cluster.nodes` (`Cluster.java:413-415`). */
  readonly insides: readonly RectangleArea[];
  /** `sh.getRectangleArea().getPointCenter()` of every other node in
   *  `Cluster.nodes` (`Cluster.java:416-417`). */
  readonly points: readonly Point[];
  /** `Cluster.children` — the ids of the direct child clusters
   *  (`Cluster.java:419-423`). */
  readonly childIds: readonly string[];
  /** `skinParam.getRankdir()` (`Cluster.java:426`). */
  readonly rankdir: FrontierRankdir;
  /** `getTitleAndAttributeWidth()` / `getTitleAndAttributeHeight()`
   *  (`Cluster.java:261-268`); `ensureMinWidth` runs only when both are
   *  positive (`Cluster.java:427-428`). */
  readonly titleAndAttributeWidth: number;
  readonly titleAndAttributeHeight: number;
}

/** The `+ 10` of `ensureMinWidth(getTitleAndAttributeWidth() + 10)`
 *  (`Cluster.java:428`). */
const TITLE_MIN_WIDTH_MARGIN = 10;

/**
 * `Cluster#manageEntryExitPoint`'s rectangle (`Cluster.java:410-430`): the
 * `FrontierCalculator` seeded with the cluster's CURRENT rectangle `current`
 * (`getRectangleArea()`, `:425` — graphviz's polygon the first time, the
 * previous call's result on every later one) and `ensureMinWidth(
 * getTitleAndAttributeWidth() + 10)` when the cluster is titled. A child
 * cluster with no rectangle is skipped (`:420-421` prints "Frontier null" and
 * adds nothing).
 */
export function entryExitPointRect(
  spec: ProjectionClusterSpec,
  current: RectangleArea,
  rectOf: (clusterId: string) => RectangleArea | undefined,
): RectangleArea {
  const insides = [...spec.insides];
  for (const childId of spec.childIds) {
    const child = rectOf(childId);
    if (child !== undefined) insides.push(child);
  }
  const core = frontierCalculator(current, insides, spec.points, spec.rankdir);
  if (spec.titleAndAttributeWidth > 0 && spec.titleAndAttributeHeight > 0) {
    return ensureMinWidth(core, current, spec.titleAndAttributeWidth + TITLE_MIN_WIDTH_MARGIN);
  }
  return core;
}

/**
 * Every cluster's `Cluster.rectangleArea` for ONE layout result, with the
 * mutation `SvekEdge#solveLine` performs on it.
 *
 * `DotStringFactory#solve` first `setPosition`s each cluster to graphviz's
 * polygon (`DotStringFactory.java:432-441`, `Cluster.java:511-512`), then runs
 * `line.solveLine(svgResult)` over `allLines()` in order (`:465-466`). A line
 * whose `projectionCluster` is set (`ClusterDotString.java:101-105`) calls
 * `projectionCluster.manageEntryExitPoint(stringBounder)` BEFORE its
 * `simulateCompound` (`SvekEdge.java:660-663,671-672`), and that call
 * REASSIGNS the cluster's rectangle (`Cluster.java:430`). The rectangle is
 * shared, mutable state: a later line clipping against the same cluster — or
 * a parent cluster whose `insides` include it — reads what the earlier call
 * left. This class is that state; callers drive it in the jar's line order.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java#solveLine (:660-672)
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java#manageEntryExitPoint (:410-436)
 */
export class ClusterRectangles {
  private readonly rects: Map<string, RectangleArea>;
  private readonly adjusted = new Set<string>();

  constructor(
    graphvizRects: ReadonlyMap<string, RectangleArea>,
    private readonly specs: ReadonlyMap<string, ProjectionClusterSpec>,
  ) {
    this.rects = new Map(graphvizRects);
  }

  /** `Cluster#getRectangleArea()`. */
  rectangleAreaOf(clusterId: string): RectangleArea | undefined {
    return this.rects.get(clusterId);
  }

  /** True once `manageEntryExitPoint` has reassigned the rectangle, i.e. it is
   *  no longer graphviz's own polygon. */
  isAdjusted(clusterId: string): boolean {
    return this.adjusted.has(clusterId);
  }

  /** `Cluster#manageEntryExitPoint`: reassigns the cluster's rectangle. A
   *  cluster with no spec (no border-point child) is never a
   *  `projectionCluster`, so the call is a no-op. */
  manageEntryExitPoint(clusterId: string): void {
    const spec = this.specs.get(clusterId);
    const current = this.rects.get(clusterId);
    if (spec === undefined || current === undefined) return;
    this.rects.set(
      clusterId,
      entryExitPointRect(spec, current, (id) => this.rects.get(id)),
    );
    this.adjusted.add(clusterId);
  }
}

/**
 * The `SvekEdge#projectionCluster` of one line: `ClusterDotString#printInternal`
 * calls `line.setProjectionCluster(cluster)` for every line with
 * `line.isLinkFromOrTo(cluster.getGroup())` while printing each cluster that
 * has a non-normal member (`ClusterDotString.java:101-105`), in print order,
 * so the LAST such cluster wins (`SvekEdge.java:1278-1281`).
 *
 * @param touchedGroupIds the groups the line's two entities are
 * @param projectionOrder the ids of the clusters with non-normal members, in
 *        the order `printInternal` visits them (parents before children)
 */
export function projectionClusterOf(
  touchedGroupIds: ReadonlySet<string>,
  projectionOrder: readonly string[],
): string | undefined {
  let found: string | undefined;
  for (const id of projectionOrder) if (touchedGroupIds.has(id)) found = id;
  return found;
}
