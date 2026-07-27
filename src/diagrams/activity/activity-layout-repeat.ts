/**
 * Repeat-loop layout for the activity diagram layout engine
 * (see `layout.old.ts`).
 */

import type { ActivityRepeat } from './ast.js';
import type {
  ActivityEdgeGeo,
  ActivityNodeGeo,
  BranchResult,
  LayoutCtx,
} from './activity-layout-types.js';
import { DIAMOND_MIN, NODE_MARGIN_X, NODE_MARGIN_Y } from './activity-layout-constants.js';
import { nextId, nodeCenterX, orthogonalPoints, repeatCondSize } from './activity-layout-helpers.js';

interface RepeatStartInfo {
  repeatStartId: string;
  repeatStartGeo: ActivityNodeGeo;
  dStart: number;
}

interface RepeatCondInfo {
  condId: string;
  condGeo: ActivityNodeGeo;
  condY: number;
  condW: number;
  condH: number;
}

interface RepeatBreakExitInfo {
  breakExitId: string;
  breakExitGeo: ActivityNodeGeo;
  edges: ActivityEdgeGeo[];
  breakExitY: number;
}

function buildRepeatStartGeo(startY: number, centerX: number, ctx: LayoutCtx): RepeatStartInfo {
  const repeatStartId = nextId(ctx, 'repeat-start');
  const dStart = DIAMOND_MIN;
  const repeatStartGeo: ActivityNodeGeo = {
    id: repeatStartId,
    kind: 'repeat-start',
    x: centerX - dStart / 2,
    y: startY,
    width: dStart,
    height: dStart,
  };
  return { repeatStartId, repeatStartGeo, dStart };
}

function buildRepeatCondGeo(
  condition: string,
  bodyBottomY: number,
  centerX: number,
  ctx: LayoutCtx,
): RepeatCondInfo {
  const condY = bodyBottomY + NODE_MARGIN_Y;
  const condId = nextId(ctx, 'repeat-cond');
  const { width: condW, height: condH } = repeatCondSize(condition, ctx);
  const condGeo: ActivityNodeGeo = {
    id: condId,
    kind: 'repeat-cond',
    label: condition,
    x: centerX - condW / 2,
    y: condY,
    width: condW,
    height: condH,
  };
  return { condId, condGeo, condY, condW, condH };
}

/** repeat-start → body first. */
function buildRepeatEntryEdge(
  bodyResult: BranchResult,
  centerX: number,
  entryY: number,
): ActivityEdgeGeo | undefined {
  if (bodyResult.firstId === undefined) return undefined;
  const firstNode = bodyResult.nodes.find((n) => n.id === bodyResult.firstId);
  if (firstNode === undefined) return undefined;
  return { points: orthogonalPoints(centerX, entryY, firstNode.x + firstNode.width / 2, firstNode.y) };
}

/** body last → condition. */
function buildRepeatBodyToCondEdge(
  bodyResult: BranchResult,
  centerX: number,
  condY: number,
): ActivityEdgeGeo | undefined {
  if (bodyResult.lastId === undefined) return undefined;
  const lastNode = bodyResult.nodes.find((n) => n.id === bodyResult.lastId);
  if (lastNode === undefined) return undefined;
  return {
    points: orthogonalPoints(lastNode.x + lastNode.width / 2, lastNode.y + lastNode.height, centerX, condY),
  };
}

/**
 * Condition back edge → repeat-start: exits right vertex of condition
 * hexagon, routes right, up the right side (midArrow at midpoint), then
 * left to arrive at the left vertex of the repeat-start diamond (terminal
 * arrowhead points left).
 */
function buildRepeatBackEdge(
  centerX: number,
  bodyWidth: number,
  cond: RepeatCondInfo,
  start: RepeatStartInfo,
  startY: number,
): ActivityEdgeGeo {
  const rightX = centerX + bodyWidth / 2 + NODE_MARGIN_X;
  return {
    points: [
      { x: centerX + cond.condW / 2, y: cond.condY + cond.condH / 2 },
      { x: rightX, y: cond.condY + cond.condH / 2 },
      { x: rightX, y: startY + start.dStart / 2 },
      { x: centerX + start.dStart / 2, y: startY + start.dStart / 2 },
    ],
    midArrow: true,
  };
}

/** Drains break geos from the body and creates a break-exit diamond wired to each. */
function buildRepeatBreakExit(
  breakGeos: ActivityNodeGeo[],
  cond: RepeatCondInfo,
  centerX: number,
  ctx: LayoutCtx,
): RepeatBreakExitInfo {
  const breakExitY = cond.condY + cond.condH + NODE_MARGIN_Y;
  const breakExitId = nextId(ctx, 'while-header');
  const breakExitGeo: ActivityNodeGeo = {
    id: breakExitId,
    kind: 'while-header',
    x: centerX - DIAMOND_MIN / 2,
    y: breakExitY,
    width: DIAMOND_MIN,
    height: DIAMOND_MIN,
  };
  const edges = breakGeos.map((breakGeo) => ({
    points: orthogonalPoints(breakGeo.x + breakGeo.width / 2, breakGeo.y + breakGeo.height, centerX, breakExitY),
  }));
  return { breakExitId, breakExitGeo, edges, breakExitY };
}

function assembleRepeatResult(
  start: RepeatStartInfo,
  bodyResult: BranchResult,
  cond: RepeatCondInfo,
  outEdges: ActivityEdgeGeo[],
  breakExit: RepeatBreakExitInfo | undefined,
): BranchResult {
  if (breakExit !== undefined) {
    // Expose the break-exit diamond as lastId so layoutSequence wires
    // the post-repeat node to it.
    return {
      nodes: [start.repeatStartGeo, ...bodyResult.nodes, cond.condGeo, breakExit.breakExitGeo],
      edges: outEdges,
      bottomY: breakExit.breakExitY + DIAMOND_MIN,
      width: bodyResult.width,
      firstId: start.repeatStartId,
      lastId: breakExit.breakExitId,
    };
  }
  return {
    nodes: [start.repeatStartGeo, ...bodyResult.nodes, cond.condGeo],
    edges: outEdges,
    bottomY: cond.condY + cond.condH,
    width: bodyResult.width,
    firstId: start.repeatStartId,
    lastId: cond.condId,
  };
}

export function layoutRepeat(
  node: ActivityRepeat,
  startY: number,
  centerX: number,
  ctx: LayoutCtx,
): BranchResult {
  centerX = nodeCenterX(node.swimlane, centerX, ctx);
  const start = buildRepeatStartGeo(startY, centerX, ctx);

  const bodyStartY = startY + start.dStart + NODE_MARGIN_Y;
  const bodyResult = ctx.layoutSequenceFn(node.body, bodyStartY, centerX, ctx);
  const cond = buildRepeatCondGeo(node.condition, bodyResult.bottomY, centerX, ctx);

  const outEdges: ActivityEdgeGeo[] = [...bodyResult.edges];
  const entryEdge = buildRepeatEntryEdge(bodyResult, centerX, startY + start.dStart);
  if (entryEdge !== undefined) outEdges.push(entryEdge);
  const bodyToCondEdge = buildRepeatBodyToCondEdge(bodyResult, centerX, cond.condY);
  if (bodyToCondEdge !== undefined) outEdges.push(bodyToCondEdge);
  outEdges.push(buildRepeatBackEdge(centerX, bodyResult.width, cond, start, startY));

  const breakGeos = bodyResult.breakGeos;
  const breakExit =
    breakGeos !== undefined && breakGeos.length > 0
      ? buildRepeatBreakExit(breakGeos, cond, centerX, ctx)
      : undefined;
  if (breakExit !== undefined) outEdges.push(...breakExit.edges);

  return assembleRepeatResult(start, bodyResult, cond, outEdges, breakExit);
}
