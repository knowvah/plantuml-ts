/**
 * If/else-if/else layout for the activity diagram layout engine
 * (see `layout.old.ts`). Includes the two-branch terminal-only
 * short-circuit optimization (route a lone stop/end/kill branch
 * horizontally instead of stacking it below the diamond).
 */

import type { ActivityIf, ActivityNode } from './ast.js';
import type {
  ActivityEdgeGeo,
  ActivityNodeGeo,
  BranchResult,
  LayoutCtx,
} from './activity-layout-types.js';
import { NODE_MARGIN_X, NODE_MARGIN_Y, STOP_OUTER_RADIUS } from './activity-layout-constants.js';
import { diamondSize, nextId, nodeCenterX, repeatCondSize } from './activity-layout-helpers.js';
import { measureSubtreeWidth } from './activity-layout-measure.js';

const IF_TERMINAL_KINDS = new Set(['stop', 'end', 'kill']);

interface IfBranchEntry {
  nodes: readonly ActivityNode[];
  label?: string;
}

interface IfSplitInfo {
  splitId: string;
  splitGeo: ActivityNodeGeo;
  splitBottomY: number;
  splitCenterY: number;
}

interface IfShortCircuitTarget {
  mainBranch: IfBranchEntry;
  termBranch: IfBranchEntry;
}

interface IfShortCircuitParams {
  mainBranch: IfBranchEntry;
  termBranch: IfBranchEntry;
  splitId: string;
  splitGeo: ActivityNodeGeo;
  splitBottomY: number;
  splitCenterY: number;
  centerX: number;
  ctx: LayoutCtx;
}

interface IfShortCircuitBranches {
  mainResult: BranchResult;
  termResult: BranchResult;
  hexRightX: number;
  termCX: number;
  branchStartY: number;
}

interface IfBranchesParams {
  allBranches: IfBranchEntry[];
  splitGeo: ActivityNodeGeo;
  splitId: string;
  splitBottomY: number;
  centerX: number;
  ctx: LayoutCtx;
}

interface IfBranchPlacement {
  firstId: string | undefined;
  lastId: string | undefined;
  exitIds: string[] | undefined;
  nodes: ActivityNodeGeo[];
  edges: ActivityEdgeGeo[];
  breakGeos: ActivityNodeGeo[];
  bottomY: number;
}

interface IfBranchColumnsResult {
  colWidths: number[];
  totalBranchWidth: number;
  branchStartY: number;
  allBranchNodes: ActivityNodeGeo[];
  allBranchEdges: ActivityEdgeGeo[];
  branchFirstIds: (string | undefined)[];
  branchLastIds: (string | undefined)[];
  branchSubExitIds: (string[] | undefined)[];
  allBreakGeos: ActivityNodeGeo[];
  maxBranchBottom: number;
}

interface IfBranchEdgePointsParams {
  firstId: string | undefined;
  allBranchNodes: ActivityNodeGeo[];
  colCenterX: number;
  branchStartY: number;
  splitBottomY: number;
  centerX: number;
}

// ---------------------------------------------------------------------------
// Split diamond + branch-entry setup
// ---------------------------------------------------------------------------

function buildIfSplitGeo(
  node: ActivityIf,
  startY: number,
  centerX: number,
  ctx: LayoutCtx,
): IfSplitInfo {
  const splitId = nextId(ctx, 'if-split');
  // Labeled conditions render as hexagons; unlabeled merge points as diamonds.
  const splitSz =
    node.condition !== ''
      ? repeatCondSize(node.condition, ctx)
      : { width: diamondSize('', ctx), height: diamondSize('', ctx) };
  const splitGeo: ActivityNodeGeo = {
    id: splitId,
    kind: 'if-split',
    label: node.condition,
    x: centerX - splitSz.width / 2,
    y: startY,
    width: splitSz.width,
    height: splitSz.height,
  };
  return {
    splitId,
    splitGeo,
    splitBottomY: startY + splitSz.height,
    splitCenterY: startY + splitSz.height / 2,
  };
}

function buildIfBranchEntries(node: ActivityIf): IfBranchEntry[] {
  const thenEntry: IfBranchEntry = {
    nodes: node.thenBranch,
    ...(node.thenLabel !== undefined ? { label: node.thenLabel } : {}),
  };
  const elseEntry: IfBranchEntry = {
    nodes: node.elseBranch,
    ...(node.elseLabel !== undefined ? { label: node.elseLabel } : {}),
  };
  const elseIfEntries: IfBranchEntry[] = node.elseIfBranches.map((eif) => ({
    nodes: eif.body,
    label: eif.label ?? eif.condition,
  }));
  return [thenEntry, ...elseIfEntries, elseEntry];
}

// ---------------------------------------------------------------------------
// Two-branch terminal-only short-circuit
// ---------------------------------------------------------------------------

function isTerminalOnlyBranch(nodes: readonly ActivityNode[]): boolean {
  return nodes.length === 1 && IF_TERMINAL_KINDS.has((nodes[0]! as { kind: string }).kind);
}

/**
 * When exactly one branch of a 2-branch if is terminal-only (end/stop/kill),
 * returns which branch is the terminal one and which is the main flow.
 * Returns undefined when the short-circuit doesn't apply.
 */
function detectIfShortCircuit(
  elseIfCount: number,
  allBranches: IfBranchEntry[],
): IfShortCircuitTarget | undefined {
  if (allBranches.length !== 2 || elseIfCount !== 0) return undefined;
  const thenIsTerminal = isTerminalOnlyBranch(allBranches[0]!.nodes);
  const elseIsTerminal = isTerminalOnlyBranch(allBranches[1]!.nodes);
  if (!thenIsTerminal && !elseIsTerminal) return undefined;
  const mainIdx = thenIsTerminal ? 1 : 0;
  const shortIdx = thenIsTerminal ? 0 : 1;
  return { mainBranch: allBranches[mainIdx]!, termBranch: allBranches[shortIdx]! };
}

function computeIfShortCircuitBranches(params: IfShortCircuitParams): IfShortCircuitBranches {
  const { mainBranch, termBranch, splitGeo, splitBottomY, splitCenterY, centerX, ctx } = params;
  const branchStartY = splitBottomY + NODE_MARGIN_Y;
  const mainResult = ctx.layoutSequenceFn(mainBranch.nodes, branchStartY, centerX, ctx);

  // Terminal node sits at hexagon mid-height, to the right
  const hexRightX = centerX + splitGeo.width / 2;
  const termCX = hexRightX + NODE_MARGIN_X + STOP_OUTER_RADIUS;
  const termResult = ctx.layoutSequenceFn(
    termBranch.nodes,
    splitCenterY - STOP_OUTER_RADIUS,
    termCX,
    ctx,
  );

  return { mainResult, termResult, hexRightX, termCX, branchStartY };
}

function buildIfShortCircuitEdges(
  params: IfShortCircuitParams,
  branches: IfShortCircuitBranches,
): ActivityEdgeGeo[] {
  const { mainBranch, termBranch, splitBottomY, splitCenterY, centerX } = params;
  const { mainResult, termResult, hexRightX, termCX, branchStartY } = branches;

  const outEdges: ActivityEdgeGeo[] = [...mainResult.edges, ...termResult.edges];

  // Hexagon bottom → main branch first node
  const mainFirstNode = mainResult.nodes.find((n) => n.id === mainResult.firstId);
  const mainEdge: ActivityEdgeGeo = {
    points:
      mainFirstNode !== undefined
        ? [{ x: centerX, y: splitBottomY }, { x: centerX, y: mainFirstNode.y }]
        : [{ x: centerX, y: splitBottomY }, { x: centerX, y: branchStartY }],
  };
  if (mainBranch.label !== undefined) mainEdge.label = mainBranch.label;
  outEdges.push(mainEdge);

  // Hexagon right point → terminal node (horizontal)
  const termFirstNode = termResult.nodes.find((n) => n.id === termResult.firstId);
  const termEdge: ActivityEdgeGeo = {
    points: [
      { x: hexRightX, y: splitCenterY },
      { x: termFirstNode !== undefined ? termFirstNode.x : termCX - STOP_OUTER_RADIUS, y: splitCenterY },
    ],
  };
  if (termBranch.label !== undefined) termEdge.label = termBranch.label;
  outEdges.push(termEdge);

  return outEdges;
}

function computeIfShortCircuitExit(mainResult: BranchResult): {
  exitIds: string[];
  singleLastId: string | undefined;
  breakGeos: ActivityNodeGeo[] | undefined;
} {
  // Exit IDs come only from the main branch
  const exitIds: string[] = [];
  if (mainResult.exitIds !== undefined && mainResult.exitIds.length > 0) {
    exitIds.push(...mainResult.exitIds);
  } else if (mainResult.lastId !== undefined) {
    const lastNode = mainResult.nodes.find((n) => n.id === mainResult.lastId);
    if (lastNode !== undefined && !IF_TERMINAL_KINDS.has(lastNode.kind)) {
      exitIds.push(mainResult.lastId);
    }
  }
  const breakGeos =
    mainResult.breakGeos !== undefined && mainResult.breakGeos.length > 0
      ? mainResult.breakGeos
      : undefined;
  const singleLastId = exitIds.length === 1 ? exitIds[0] : undefined;
  return { exitIds, singleLastId, breakGeos };
}

function layoutIfShortCircuit(params: IfShortCircuitParams): BranchResult {
  const { splitGeo, splitId, centerX } = params;
  const branches = computeIfShortCircuitBranches(params);
  const { mainResult, termResult, termCX } = branches;
  const outEdges = buildIfShortCircuitEdges(params, branches);
  const { exitIds, singleLastId, breakGeos } = computeIfShortCircuitExit(mainResult);

  const totalWidth = termCX + STOP_OUTER_RADIUS - (centerX - splitGeo.width / 2);
  return {
    nodes: [splitGeo, ...mainResult.nodes, ...termResult.nodes],
    edges: outEdges,
    bottomY: mainResult.bottomY,
    width: totalWidth,
    firstId: splitId,
    lastId: singleLastId,
    ...(exitIds.length > 1 ? { exitIds } : {}),
    ...(breakGeos !== undefined ? { breakGeos } : {}),
  };
}

// ---------------------------------------------------------------------------
// General (N-branch, or non-short-circuit two-branch) layout
// ---------------------------------------------------------------------------

function placeOneIfBranch(
  branch: IfBranchEntry,
  colCenterX: number,
  branchStartY: number,
  ctx: LayoutCtx,
): IfBranchPlacement {
  const result = ctx.layoutSequenceFn(branch.nodes, branchStartY, colCenterX, ctx);
  return {
    firstId: result.firstId,
    lastId: result.lastId,
    exitIds: result.exitIds,
    nodes: result.nodes,
    edges: result.edges,
    breakGeos: result.breakGeos ?? [],
    bottomY: result.bottomY,
  };
}

function accumulateIfBranchColumn(placement: IfBranchPlacement, columns: IfBranchColumnsResult): void {
  columns.branchFirstIds.push(placement.firstId);
  columns.branchLastIds.push(placement.lastId);
  columns.branchSubExitIds.push(placement.exitIds);
  columns.allBranchNodes.push(...placement.nodes);
  columns.allBranchEdges.push(...placement.edges);
  if (placement.breakGeos.length > 0) columns.allBreakGeos.push(...placement.breakGeos);
  if (placement.bottomY > columns.maxBranchBottom) columns.maxBranchBottom = placement.bottomY;
}

function placeIfBranchColumns(params: IfBranchesParams): IfBranchColumnsResult {
  const { allBranches, splitBottomY, centerX, ctx } = params;
  const colWidths = allBranches.map((b) => measureSubtreeWidth(b.nodes, ctx));
  const totalBranchWidth =
    colWidths.reduce((s, w) => s + w, 0) + NODE_MARGIN_X * (allBranches.length - 1);
  const branchStartY = splitBottomY + NODE_MARGIN_Y;

  const columns: IfBranchColumnsResult = {
    colWidths,
    totalBranchWidth,
    branchStartY,
    allBranchNodes: [],
    allBranchEdges: [],
    branchFirstIds: [],
    branchLastIds: [],
    branchSubExitIds: [],
    allBreakGeos: [],
    maxBranchBottom: branchStartY,
  };

  let colLeft = centerX - totalBranchWidth / 2;
  for (let i = 0; i < allBranches.length; i++) {
    const colWidth = colWidths[i]!;
    const placement = placeOneIfBranch(allBranches[i]!, colLeft + colWidth / 2, branchStartY, ctx);
    accumulateIfBranchColumn(placement, columns);
    colLeft += colWidth + NODE_MARGIN_X;
  }

  return columns;
}

function computeIfBranchEdgePoints(params: IfBranchEdgePointsParams): Array<{ x: number; y: number }> {
  const { firstId, allBranchNodes, colCenterX, branchStartY, splitBottomY, centerX } = params;
  if (firstId === undefined) {
    // Empty branch stub
    return [
      { x: centerX, y: splitBottomY },
      { x: colCenterX, y: splitBottomY },
      { x: colCenterX, y: branchStartY },
    ];
  }
  const firstNode = allBranchNodes.find((n) => n.id === firstId);
  const targetX = firstNode !== undefined ? firstNode.x + firstNode.width / 2 : colCenterX;
  const targetY = firstNode !== undefined ? firstNode.y : branchStartY;
  // Horizontal at diamond level, then straight down to branch first node
  return Math.abs(targetX - centerX) < 1
    ? [{ x: centerX, y: splitBottomY }, { x: targetX, y: targetY }]
    : [
        { x: centerX, y: splitBottomY },
        { x: targetX, y: splitBottomY },
        { x: targetX, y: targetY },
      ];
}

function buildIfSplitToBranchEdges(
  allBranches: IfBranchEntry[],
  columns: IfBranchColumnsResult,
  splitBottomY: number,
  centerX: number,
): ActivityEdgeGeo[] {
  const { colWidths, totalBranchWidth, branchStartY, allBranchNodes, branchFirstIds } = columns;
  const outEdges: ActivityEdgeGeo[] = [];
  let colLeft = centerX - totalBranchWidth / 2;
  for (let i = 0; i < allBranches.length; i++) {
    const colWidth = colWidths[i]!;
    const colCenterX = colLeft + colWidth / 2;
    const branch = allBranches[i]!;
    const points = computeIfBranchEdgePoints({
      firstId: branchFirstIds[i],
      allBranchNodes,
      colCenterX,
      branchStartY,
      splitBottomY,
      centerX,
    });
    const edgeGeo: ActivityEdgeGeo = { points };
    if (branch.label !== undefined) edgeGeo.label = branch.label;
    if (edgeGeo.points.length >= 2) outEdges.push(edgeGeo);
    colLeft += colWidth + NODE_MARGIN_X;
  }
  return outEdges;
}

function computeIfBranchExitIds(
  allBranches: IfBranchEntry[],
  columns: IfBranchColumnsResult,
): string[] {
  const { allBranchNodes, branchLastIds, branchSubExitIds } = columns;
  const exitIds: string[] = [];
  for (let i = 0; i < allBranches.length; i++) {
    const subExits = branchSubExitIds[i];
    if (subExits !== undefined && subExits.length > 0) {
      exitIds.push(...subExits);
    } else {
      const lastId = branchLastIds[i];
      if (lastId !== undefined) {
        const lastNode = allBranchNodes.find((n) => n.id === lastId);
        if (lastNode !== undefined && !IF_TERMINAL_KINDS.has(lastNode.kind)) {
          exitIds.push(lastId);
        }
      }
    }
  }
  return exitIds;
}

function layoutIfBranches(params: IfBranchesParams): BranchResult {
  const { allBranches, splitGeo, splitId, splitBottomY, centerX } = params;
  const columns = placeIfBranchColumns(params);
  const outEdges = [
    ...columns.allBranchEdges,
    ...buildIfSplitToBranchEdges(allBranches, columns, splitBottomY, centerX),
  ];
  const exitIds = computeIfBranchExitIds(allBranches, columns);
  const singleLastId = exitIds.length === 1 ? exitIds[0] : undefined;

  return {
    nodes: [splitGeo, ...columns.allBranchNodes],
    edges: outEdges,
    bottomY: columns.maxBranchBottom,
    width: columns.totalBranchWidth,
    firstId: splitId,
    lastId: singleLastId,
    ...(exitIds.length > 1 ? { exitIds } : {}),
    ...(columns.allBreakGeos.length > 0 ? { breakGeos: columns.allBreakGeos } : {}),
  };
}

// ---------------------------------------------------------------------------
// Public entry
// ---------------------------------------------------------------------------

export function layoutIf(
  node: ActivityIf,
  startY: number,
  centerX: number,
  ctx: LayoutCtx,
): BranchResult {
  centerX = nodeCenterX(node.swimlane, centerX, ctx);
  const { splitId, splitGeo, splitBottomY, splitCenterY } = buildIfSplitGeo(node, startY, centerX, ctx);
  const allBranches = buildIfBranchEntries(node);

  const shortCircuitTarget = detectIfShortCircuit(node.elseIfBranches.length, allBranches);
  if (shortCircuitTarget !== undefined) {
    return layoutIfShortCircuit({
      mainBranch: shortCircuitTarget.mainBranch,
      termBranch: shortCircuitTarget.termBranch,
      splitId,
      splitGeo,
      splitBottomY,
      splitCenterY,
      centerX,
      ctx,
    });
  }

  return layoutIfBranches({ allBranches, splitGeo, splitId, splitBottomY, centerX, ctx });
}
