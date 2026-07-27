/**
 * Leaf-node layouts (start/stop/end/kill/action/break) for the activity
 * diagram layout engine (see `layout.old.ts`).
 */

import type { ActivityBreak } from './ast.js';
import type {
  ActivityNodeGeo,
  BranchResult,
  BranchResultInternal,
  LayoutCtx,
} from './activity-layout-types.js';
import { DIAMOND_MIN, START_STOP_RADIUS, STOP_OUTER_RADIUS } from './activity-layout-constants.js';
import { actionSize, nextId, nodeCenterX, parallelogramSize } from './activity-layout-helpers.js';

export interface LayoutActionParams {
  label: string;
  color: string | undefined;
  stereotype: string | undefined;
  swimlane: string | undefined;
  startY: number;
  centerX: number;
  ctx: LayoutCtx;
}

export function layoutStart(
  swimlane: string | undefined,
  startY: number,
  centerX: number,
  ctx: LayoutCtx,
): BranchResult {
  const cx = nodeCenterX(swimlane, centerX, ctx);
  const diameter = START_STOP_RADIUS * 2;
  const id = 'start';
  const geo: ActivityNodeGeo = {
    id,
    kind: 'start',
    x: cx - START_STOP_RADIUS,
    y: startY,
    width: diameter,
    height: diameter,
  };
  return {
    nodes: [geo],
    edges: [],
    bottomY: startY + diameter,
    width: diameter,
    firstId: id,
    lastId: id,
  };
}

export function layoutStop(
  kind: 'stop' | 'end' | 'kill',
  swimlane: string | undefined,
  startY: number,
  centerX: number,
  ctx: LayoutCtx,
): BranchResult {
  const cx = nodeCenterX(swimlane, centerX, ctx);
  const diameter = STOP_OUTER_RADIUS * 2;
  const id = nextId(ctx, kind);
  const geo: ActivityNodeGeo = {
    id,
    kind,
    x: cx - STOP_OUTER_RADIUS,
    y: startY,
    width: diameter,
    height: diameter,
  };
  return {
    nodes: [geo],
    edges: [],
    bottomY: startY + diameter,
    width: diameter,
    firstId: id,
    lastId: id,
  };
}

export function layoutAction(params: LayoutActionParams): BranchResult {
  const { label, color, stereotype, swimlane, startY, centerX, ctx } = params;
  const cx = nodeCenterX(swimlane, centerX, ctx);
  const sz = stereotype === 'save' ? parallelogramSize(label, ctx) : actionSize(label, ctx);
  const id = nextId(ctx, 'action');
  const geo: ActivityNodeGeo = {
    id,
    kind: 'action',
    label,
    x: cx - sz.width / 2,
    y: startY,
    width: sz.width,
    height: sz.height,
  };
  if (color !== undefined) {
    geo.color = color;
  }
  if (stereotype !== undefined) {
    geo.stereotype = stereotype;
  }
  return {
    nodes: [geo],
    edges: [],
    bottomY: startY + sz.height,
    width: sz.width,
    firstId: id,
    lastId: id,
  };
}

export function layoutBreak(
  node: ActivityBreak,
  startY: number,
  centerX: number,
  ctx: LayoutCtx,
): BranchResultInternal {
  const cx = nodeCenterX(node.swimlane, centerX, ctx);
  const id = nextId(ctx, 'break');
  const size = DIAMOND_MIN;
  const geo: ActivityNodeGeo = {
    id,
    kind: 'break',
    x: cx - size / 2,
    y: startY,
    width: size,
    height: size,
  };
  return {
    nodes: [geo],
    edges: [],
    bottomY: startY + size,
    width: size,
    firstId: id,
    // lastId is undefined: no outgoing flow edge from the break node
    lastId: undefined,
    breakGeos: [geo],
    // Signal to layoutSequence that this is a break-stop, not a regular node
    kind: 'break-stop',
  };
}
