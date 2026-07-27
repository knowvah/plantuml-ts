/**
 * Activity diagram layout engine.
 *
 * Produces geometry for all nodes and edges in an activity diagram AST.
 * Layout proceeds top-to-bottom with sequential placement. Composite nodes
 * (if/fork/while/repeat) are expanded inline and their children placed in
 * side-by-side columns.
 *
 * This file is the public entry point (`layoutActivity`) and re-exports the
 * geometry types. The layout algorithm itself is split across sibling
 * modules in this directory to stay under the file-size and per-function
 * complexity limits:
 *  - `activity-layout-types.ts`     geometry/context/result types
 *  - `activity-layout-constants.ts` layout constants
 *  - `activity-layout-helpers.ts`   small geometry/measurement helpers
 *  - `activity-layout-measure.ts`   subtree width measurement
 *  - `activity-layout-leaf.ts`      start/stop/action/break layouts
 *  - `activity-layout-if.ts`        if/else-if/else layout
 *  - `activity-layout-fork.ts`      fork/split (parallel branch) layout
 *  - `activity-layout-while.ts`     while-loop layout
 *  - `activity-layout-repeat.ts`    repeat-loop layout
 *  - `activity-layout-sequence.ts`  sequential layout + per-node dispatch
 *  - `activity-layout-swimlane.ts`  swimlane context setup
 */

import type { ActivityArrowLabel, ActivityDiagramAST } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type {
  ActivityEdgeGeo,
  ActivityGeometry,
  ActivityNodeGeo,
  LayoutCtx,
} from './activity-layout-types.js';
import { DEFAULT_WIDTH, LAYOUT_MARGIN, SWIMLANE_HEADER_H } from './activity-layout-constants.js';
import { measureSubtreeWidth } from './activity-layout-measure.js';
import { layoutSequence } from './activity-layout-sequence.js';
import { buildSwimlaneCtx, buildSwimlaneGeos } from './activity-layout-swimlane.js';

export type {
  ActivityNodeGeo,
  ActivityEdgeGeo,
  SwimlaneGeo,
  ActivityGeometry,
} from './activity-layout-types.js';

// Re-export ActivityArrowLabel so consumers can use it without importing ast.ts directly.
export type { ActivityArrowLabel };

function buildActivityLayoutCtx(
  ast: ActivityDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
): { ctx: LayoutCtx; startY: number } {
  const baseCtx = {
    theme,
    measurer,
    counters: new Map<string, number>(),
    layoutSequenceFn: layoutSequence,
  };

  const hasSwimlanes = ast.swimlanes.length > 0;
  const startY = LAYOUT_MARGIN + (hasSwimlanes ? SWIMLANE_HEADER_H : 0);

  if (hasSwimlanes) {
    return { ctx: buildSwimlaneCtx(ast.swimlanes, baseCtx), startY };
  }

  // Pre-measure total content width so canvas fits the diagram
  const tempCtx: LayoutCtx = { ...baseCtx, laneX: new Map(), laneWidth: 0, canvasWidth: DEFAULT_WIDTH };
  const rootWidth = measureSubtreeWidth(ast.nodes, tempCtx);
  const canvasWidth = rootWidth + LAYOUT_MARGIN * 2;
  return { ctx: { ...baseCtx, laneX: new Map(), laneWidth: 0, canvasWidth }, startY };
}

/**
 * Compute total bounds from actual placed nodes AND edge routing points.
 * Edge routing (while back-edge, no-exit paths) can extend beyond node bounds.
 */
function computeActivityGeometryBounds(
  nodes: readonly ActivityNodeGeo[],
  edges: readonly ActivityEdgeGeo[],
): { minLeft: number; maxRight: number; maxBottom: number } {
  let maxRight = 0;
  let minLeft = Infinity;
  let maxBottom = 0;
  for (const n of nodes) {
    if (n.x < minLeft) minLeft = n.x;
    if (n.x + n.width > maxRight) maxRight = n.x + n.width;
    if (n.y + n.height > maxBottom) maxBottom = n.y + n.height;
  }
  for (const e of edges) {
    for (const pt of e.points) {
      if (pt.x < minLeft) minLeft = pt.x;
      if (pt.x > maxRight) maxRight = pt.x;
      if (pt.y > maxBottom) maxBottom = pt.y;
    }
  }
  return { minLeft, maxRight, maxBottom };
}

/** If routing extends left of LAYOUT_MARGIN, shifts all geometry right so it fits. */
function shiftActivityGeometry(
  nodes: ActivityNodeGeo[],
  edges: ActivityEdgeGeo[],
  minLeft: number,
): number {
  const shiftX = minLeft < LAYOUT_MARGIN ? LAYOUT_MARGIN - minLeft : 0;
  if (shiftX > 0) {
    for (const n of nodes) {
      n.x += shiftX;
    }
    for (const e of edges) {
      for (const pt of e.points) {
        pt.x += shiftX;
      }
    }
  }
  return shiftX;
}

export function layoutActivity(
  ast: ActivityDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
): ActivityGeometry {
  if (ast.nodes.length === 0) {
    return { totalWidth: 0, totalHeight: 0, nodes: [], edges: [], swimlanes: [] };
  }

  const { ctx, startY } = buildActivityLayoutCtx(ast, theme, measurer);
  const centerX = ctx.canvasWidth / 2;
  const result = layoutSequence(ast.nodes, startY, centerX, ctx);
  const swimlaneGeos = buildSwimlaneGeos(ast.swimlanes, ctx);

  const bounds = computeActivityGeometryBounds(result.nodes, result.edges);
  const shiftX = shiftActivityGeometry(result.nodes, result.edges, bounds.minLeft);

  return {
    totalWidth: Math.max(bounds.maxRight + shiftX + LAYOUT_MARGIN, ctx.canvasWidth + shiftX),
    totalHeight: bounds.maxBottom + LAYOUT_MARGIN,
    nodes: result.nodes,
    edges: result.edges,
    swimlanes: swimlaneGeos,
  };
}
