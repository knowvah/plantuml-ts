/**
 * While-loop layout for the activity diagram layout engine
 * (see `layout.old.ts`).
 */

import type { ActivityWhile } from './ast.js';
import type {
  ActivityEdgeGeo,
  ActivityNodeGeo,
  BranchResult,
  LayoutCtx,
} from './activity-layout-types.js';
import { NODE_MARGIN_X, NODE_MARGIN_Y } from './activity-layout-constants.js';
import { diamondSize, nextId, nodeCenterX, orthogonalPoints, repeatCondSize } from './activity-layout-helpers.js';

interface WhileHeaderInfo {
  headerId: string;
  headerGeo: ActivityNodeGeo;
  headerBottomY: number;
  headerCenterY: number;
}

interface WhileExitParams {
  headerGeo: ActivityNodeGeo;
  leftX: number;
  headerCenterY: number;
  loopBottomY: number;
  centerX: number;
  exitLabel: string | undefined;
  ctx: LayoutCtx;
}

interface WhileExitInfo {
  exitId: string;
  exitGeo: ActivityNodeGeo;
  exitEdge: ActivityEdgeGeo;
}

interface WhileWiringParams {
  node: ActivityWhile;
  centerX: number;
  headerGeo: ActivityNodeGeo;
  headerBottomY: number;
  headerCenterY: number;
  bodyResult: BranchResult;
  ctx: LayoutCtx;
}

interface WhileWiringResult {
  outEdges: ActivityEdgeGeo[];
  leftX: number;
  rightX: number;
  loopBottomY: number;
  exitId: string;
  exitGeo: ActivityNodeGeo;
}

function buildWhileHeaderGeo(
  node: ActivityWhile,
  startY: number,
  centerX: number,
  ctx: LayoutCtx,
): WhileHeaderInfo {
  const headerId = nextId(ctx, 'while-header');
  const headerSz =
    node.condition !== ''
      ? repeatCondSize(node.condition, ctx)
      : { width: diamondSize('', ctx), height: diamondSize('', ctx) };
  const headerGeo: ActivityNodeGeo = {
    id: headerId,
    kind: 'while-header',
    label: node.condition,
    x: centerX - headerSz.width / 2,
    y: startY,
    width: headerSz.width,
    height: headerSz.height,
  };
  return {
    headerId,
    headerGeo,
    headerBottomY: startY + headerSz.height,
    headerCenterY: startY + headerSz.height / 2,
  };
}

/** Header → body ("yes" path, straight down from header bottom). */
function buildWhileEntryEdge(
  bodyResult: BranchResult,
  centerX: number,
  headerBottomY: number,
  yesLabel: string | undefined,
): ActivityEdgeGeo | undefined {
  if (bodyResult.firstId === undefined) return undefined;
  const firstNode = bodyResult.nodes.find((n) => n.id === bodyResult.firstId);
  if (firstNode === undefined) return undefined;
  return {
    points: orthogonalPoints(centerX, headerBottomY, firstNode.x + firstNode.width / 2, firstNode.y),
    ...(yesLabel !== undefined && yesLabel !== '' ? { label: yesLabel } : {}),
  };
}

/**
 * Routing margins: left/right boundaries for the back-edge and exit path.
 * Match GtileWhile: back-edge uses right boundary, exit uses left boundary.
 */
function computeWhileRouting(
  headerWidth: number,
  bodyWidth: number,
  centerX: number,
): { leftX: number; rightX: number } {
  const halfW = Math.max(headerWidth, bodyWidth) / 2;
  return {
    leftX: centerX - halfW - NODE_MARGIN_X,
    rightX: centerX + halfW + NODE_MARGIN_X,
  };
}

/**
 * Back-edge: body bottom → down 10px → right boundary → up → header east
 * vertex. Mirrors GConnectionVerticalDownThenBack with xright = total tile
 * width.
 */
function buildWhileBackEdge(
  bodyResult: BranchResult,
  rightX: number,
  headerCenterY: number,
  headerGeo: ActivityNodeGeo,
): ActivityEdgeGeo | undefined {
  if (bodyResult.lastId === undefined) return undefined;
  const lastNode = bodyResult.nodes.find((n) => n.id === bodyResult.lastId);
  if (lastNode === undefined) return undefined;
  const lastCX = lastNode.x + lastNode.width / 2;
  const lastBottom = lastNode.y + lastNode.height;
  return {
    points: [
      { x: lastCX, y: lastBottom },
      { x: lastCX, y: lastBottom + 10 },
      { x: rightX, y: lastBottom + 10 },
      { x: rightX, y: headerCenterY },
      { x: headerGeo.x + headerGeo.width, y: headerCenterY },
    ],
  };
}

/**
 * "no" exit: header west vertex → left boundary → down → center at loop
 * bottom. Mirrors GConnectionSideThenVerticalThenSide with xleft = 0.
 * A synthetic zero-height if-merge node is placed at the exit point so
 * that layoutSequence can auto-wire the next node without a separate
 * exit edge.
 */
function buildWhileExit(params: WhileExitParams): WhileExitInfo {
  const { headerGeo, leftX, headerCenterY, loopBottomY, centerX, exitLabel, ctx } = params;
  const exitId = nextId(ctx, 'if-merge');
  const exitGeo: ActivityNodeGeo = {
    id: exitId,
    kind: 'if-merge',
    label: '',
    x: centerX,
    y: loopBottomY,
    width: 0,
    height: 0,
  };
  const exitEdge: ActivityEdgeGeo = {
    points: [
      { x: headerGeo.x, y: headerCenterY },
      { x: leftX, y: headerCenterY },
      { x: leftX, y: loopBottomY },
      { x: centerX, y: loopBottomY },
    ],
    ...(exitLabel !== undefined && exitLabel !== '' ? { label: exitLabel } : {}),
  };
  return { exitId, exitGeo, exitEdge };
}

/** Assembles the entry, back, and exit edges plus the exit node for a while loop. */
function buildWhileWiring(params: WhileWiringParams): WhileWiringResult {
  const { node, centerX, headerGeo, headerBottomY, headerCenterY, bodyResult, ctx } = params;
  const outEdges: ActivityEdgeGeo[] = [...bodyResult.edges];
  const entryEdge = buildWhileEntryEdge(bodyResult, centerX, headerBottomY, node.yesLabel);
  if (entryEdge !== undefined) outEdges.push(entryEdge);

  const { leftX, rightX } = computeWhileRouting(headerGeo.width, bodyResult.width, centerX);
  const backEdge = buildWhileBackEdge(bodyResult, rightX, headerCenterY, headerGeo);
  if (backEdge !== undefined) outEdges.push(backEdge);

  const loopBottomY = bodyResult.bottomY + NODE_MARGIN_Y;
  const { exitId, exitGeo, exitEdge } = buildWhileExit({
    headerGeo,
    leftX,
    headerCenterY,
    loopBottomY,
    centerX,
    exitLabel: node.exitLabel,
    ctx,
  });
  outEdges.push(exitEdge);

  return { outEdges, leftX, rightX, loopBottomY, exitId, exitGeo };
}

export function layoutWhile(
  node: ActivityWhile,
  startY: number,
  centerX: number,
  ctx: LayoutCtx,
): BranchResult {
  centerX = nodeCenterX(node.swimlane, centerX, ctx);
  const { headerId, headerGeo, headerBottomY, headerCenterY } = buildWhileHeaderGeo(node, startY, centerX, ctx);
  const bodyStartY = headerBottomY + NODE_MARGIN_Y;
  const bodyResult = ctx.layoutSequenceFn(node.body, bodyStartY, centerX, ctx);

  const wiring = buildWhileWiring({ node, centerX, headerGeo, headerBottomY, headerCenterY, bodyResult, ctx });

  return {
    nodes: [headerGeo, ...bodyResult.nodes, wiring.exitGeo],
    edges: wiring.outEdges,
    bottomY: wiring.loopBottomY,
    width: wiring.rightX - wiring.leftX,
    firstId: headerId,
    lastId: wiring.exitId,
  };
}
