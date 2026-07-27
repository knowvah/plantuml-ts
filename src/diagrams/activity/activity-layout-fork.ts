/**
 * Fork/split (parallel-branch) layout for the activity diagram layout
 * engine (see `layout.old.ts`).
 */

import type { ActivityFork, ActivityNode, ActivitySplit } from './ast.js';
import type {
  ActivityEdgeGeo,
  ActivityNodeGeo,
  BranchResult,
  LayoutCtx,
} from './activity-layout-types.js';
import { BAR_HEIGHT, NODE_MARGIN_X, NODE_MARGIN_Y } from './activity-layout-constants.js';
import { nextId, nodeCenterX, orthogonalPoints } from './activity-layout-helpers.js';
import { measureSubtreeWidth } from './activity-layout-measure.js';

interface ForkColumnsParams {
  branches: readonly (readonly ActivityNode[])[];
  colWidths: number[];
  totalBranchWidth: number;
  branchStartY: number;
  centerX: number;
  ctx: LayoutCtx;
}

interface ForkBranchPlacement {
  firstId: string | undefined;
  lastId: string | undefined;
  nodes: ActivityNodeGeo[];
  edges: ActivityEdgeGeo[];
  bottomY: number;
}

interface ForkColumnsResult {
  colWidths: number[];
  branchStartY: number;
  allBranchNodes: ActivityNodeGeo[];
  allBranchEdges: ActivityEdgeGeo[];
  branchFirstIds: (string | undefined)[];
  branchLastIds: (string | undefined)[];
  maxBranchBottom: number;
}

interface ForkBarEdgesParams {
  branches: readonly (readonly ActivityNode[])[];
  colWidths: number[];
  totalBranchWidth: number;
  centerX: number;
  forkBarBottomY: number;
  branchFirstIds: (string | undefined)[];
  allBranchNodes: ActivityNodeGeo[];
}

interface JoinBarEdgesParams {
  branches: readonly (readonly ActivityNode[])[];
  colWidths: number[];
  totalBranchWidth: number;
  centerX: number;
  joinBarY: number;
  branchLastIds: (string | undefined)[];
  allBranchNodes: ActivityNodeGeo[];
}

interface ForkAllEdgesParams {
  branches: readonly (readonly ActivityNode[])[];
  colWidths: number[];
  totalBranchWidth: number;
  centerX: number;
  forkBarBottomY: number;
  joinBarY: number;
  columns: ForkColumnsResult;
}

function buildForkBarGeo(
  barKind: 'fork' | 'split',
  branches: readonly (readonly ActivityNode[])[],
  startY: number,
  centerX: number,
  ctx: LayoutCtx,
): {
  colWidths: number[];
  totalBranchWidth: number;
  forkBarGeo: ActivityNodeGeo;
  forkBarId: string;
  forkBarBottomY: number;
} {
  const colWidths = branches.map((b) => measureSubtreeWidth(b, ctx));
  const totalBranchWidth =
    colWidths.reduce((s, w) => s + w, 0) + NODE_MARGIN_X * Math.max(branches.length - 1, 0);
  const forkBarKind = barKind === 'fork' ? 'fork-bar' : 'split-bar';
  const forkBarId = nextId(ctx, forkBarKind);
  const forkBarGeo: ActivityNodeGeo = {
    id: forkBarId,
    kind: forkBarKind,
    x: centerX - totalBranchWidth / 2,
    y: startY,
    width: totalBranchWidth,
    height: BAR_HEIGHT,
  };
  return { colWidths, totalBranchWidth, forkBarGeo, forkBarId, forkBarBottomY: startY + BAR_HEIGHT };
}

function placeOneForkBranch(
  branch: readonly ActivityNode[],
  colCenterX: number,
  branchStartY: number,
  ctx: LayoutCtx,
): ForkBranchPlacement {
  const result = ctx.layoutSequenceFn(branch, branchStartY, colCenterX, ctx);
  return {
    firstId: result.firstId,
    lastId: result.lastId,
    nodes: result.nodes,
    edges: result.edges,
    bottomY: result.bottomY,
  };
}

function accumulateForkBranchColumn(placement: ForkBranchPlacement, columns: ForkColumnsResult): void {
  columns.branchFirstIds.push(placement.firstId);
  columns.branchLastIds.push(placement.lastId);
  columns.allBranchNodes.push(...placement.nodes);
  columns.allBranchEdges.push(...placement.edges);
  if (placement.bottomY > columns.maxBranchBottom) columns.maxBranchBottom = placement.bottomY;
}

function placeForkBranchColumns(params: ForkColumnsParams): ForkColumnsResult {
  const { branches, colWidths, totalBranchWidth, branchStartY, centerX, ctx } = params;
  const columns: ForkColumnsResult = {
    colWidths,
    branchStartY,
    allBranchNodes: [],
    allBranchEdges: [],
    branchFirstIds: [],
    branchLastIds: [],
    maxBranchBottom: branchStartY,
  };

  let colLeft = centerX - totalBranchWidth / 2;
  for (let i = 0; i < branches.length; i++) {
    const colWidth = colWidths[i]!;
    const placement = placeOneForkBranch(branches[i]!, colLeft + colWidth / 2, branchStartY, ctx);
    accumulateForkBranchColumn(placement, columns);
    colLeft += colWidth + NODE_MARGIN_X;
  }

  return columns;
}

function buildForkBarToBranchEdges(params: ForkBarEdgesParams): ActivityEdgeGeo[] {
  const { branches, colWidths, totalBranchWidth, centerX, forkBarBottomY, branchFirstIds, allBranchNodes } = params;
  const outEdges: ActivityEdgeGeo[] = [];
  let colLeft = centerX - totalBranchWidth / 2;
  for (let i = 0; i < branches.length; i++) {
    const colWidth = colWidths[i]!;
    const colCenterX = colLeft + colWidth / 2;
    const firstId = branchFirstIds[i];

    if (firstId !== undefined) {
      const firstNode = allBranchNodes.find((n) => n.id === firstId);
      if (firstNode !== undefined) {
        outEdges.push({
          points: orthogonalPoints(colCenterX, forkBarBottomY, firstNode.x + firstNode.width / 2, firstNode.y),
        });
      }
    }
    colLeft += colWidth + NODE_MARGIN_X;
  }
  return outEdges;
}

function buildBranchToJoinBarEdges(params: JoinBarEdgesParams): ActivityEdgeGeo[] {
  const { branches, colWidths, totalBranchWidth, centerX, joinBarY, branchLastIds, allBranchNodes } = params;
  const outEdges: ActivityEdgeGeo[] = [];
  let colLeft = centerX - totalBranchWidth / 2;
  for (let i = 0; i < branches.length; i++) {
    const colWidth = colWidths[i]!;
    const colCenterX = colLeft + colWidth / 2;
    const lastId = branchLastIds[i];

    if (lastId !== undefined) {
      const lastNode = allBranchNodes.find((n) => n.id === lastId);
      if (lastNode !== undefined) {
        outEdges.push({
          points: orthogonalPoints(
            lastNode.x + lastNode.width / 2,
            lastNode.y + lastNode.height,
            colCenterX,
            joinBarY,
          ),
        });
      }
    }
    colLeft += colWidth + NODE_MARGIN_X;
  }
  return outEdges;
}

function buildForkJoinBarGeo(
  centerX: number,
  totalBranchWidth: number,
  joinBarY: number,
  ctx: LayoutCtx,
): { joinBarId: string; joinBarGeo: ActivityNodeGeo } {
  const joinBarId = nextId(ctx, 'join-bar');
  const joinBarGeo: ActivityNodeGeo = {
    id: joinBarId,
    kind: 'join-bar',
    x: centerX - totalBranchWidth / 2,
    y: joinBarY,
    width: totalBranchWidth,
    height: BAR_HEIGHT,
  };
  return { joinBarId, joinBarGeo };
}

function buildForkAllEdges(params: ForkAllEdgesParams): ActivityEdgeGeo[] {
  const { branches, colWidths, totalBranchWidth, centerX, forkBarBottomY, joinBarY, columns } = params;
  return [
    ...columns.allBranchEdges,
    ...buildForkBarToBranchEdges({
      branches,
      colWidths,
      totalBranchWidth,
      centerX,
      forkBarBottomY,
      branchFirstIds: columns.branchFirstIds,
      allBranchNodes: columns.allBranchNodes,
    }),
    ...buildBranchToJoinBarEdges({
      branches,
      colWidths,
      totalBranchWidth,
      centerX,
      joinBarY,
      branchLastIds: columns.branchLastIds,
      allBranchNodes: columns.allBranchNodes,
    }),
  ];
}

function layoutParallelBranches(
  barKind: 'fork' | 'split',
  branches: readonly (readonly ActivityNode[])[],
  startY: number,
  centerX: number,
  ctx: LayoutCtx,
): BranchResult {
  const { colWidths, totalBranchWidth, forkBarGeo, forkBarId, forkBarBottomY } =
    buildForkBarGeo(barKind, branches, startY, centerX, ctx);
  const branchStartY = forkBarBottomY + NODE_MARGIN_Y;
  const columns = placeForkBranchColumns({ branches, colWidths, totalBranchWidth, branchStartY, centerX, ctx });

  const joinBarY = columns.maxBranchBottom + NODE_MARGIN_Y;
  const { joinBarId, joinBarGeo } = buildForkJoinBarGeo(centerX, totalBranchWidth, joinBarY, ctx);
  const outEdges = buildForkAllEdges({
    branches,
    colWidths,
    totalBranchWidth,
    centerX,
    forkBarBottomY,
    joinBarY,
    columns,
  });

  return {
    nodes: [forkBarGeo, ...columns.allBranchNodes, joinBarGeo],
    edges: outEdges,
    bottomY: joinBarY + BAR_HEIGHT,
    width: totalBranchWidth,
    firstId: forkBarId,
    lastId: joinBarId,
  };
}

export function layoutFork(
  node: ActivityFork,
  startY: number,
  centerX: number,
  ctx: LayoutCtx,
): BranchResult {
  const cx = nodeCenterX(node.swimlane, centerX, ctx);
  return layoutParallelBranches('fork', node.branches, startY, cx, ctx);
}

export function layoutSplit(
  node: ActivitySplit,
  startY: number,
  centerX: number,
  ctx: LayoutCtx,
): BranchResult {
  const cx = nodeCenterX(node.swimlane, centerX, ctx);
  return layoutParallelBranches('split', node.branches, startY, cx, ctx);
}
