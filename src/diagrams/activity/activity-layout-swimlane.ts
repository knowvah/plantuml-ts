/**
 * Swimlane context setup for the activity diagram layout engine
 * (see `layout.old.ts`).
 */

import type { LayoutCtx, SwimlaneGeo } from './activity-layout-types.js';
import { DEFAULT_WIDTH, SWIMLANE_MIN_WIDTH } from './activity-layout-constants.js';

export function buildSwimlaneCtx(
  swimlanes: readonly string[],
  base: Omit<LayoutCtx, 'laneX' | 'laneWidth' | 'canvasWidth'>,
): LayoutCtx {
  if (swimlanes.length === 0) {
    return {
      ...base,
      laneX: new Map(),
      laneWidth: 0,
      canvasWidth: DEFAULT_WIDTH,
    };
  }

  const laneWidth = SWIMLANE_MIN_WIDTH;
  const laneX = new Map<string, number>();
  for (let i = 0; i < swimlanes.length; i++) {
    laneX.set(swimlanes[i]!, i * laneWidth);
  }

  return {
    ...base,
    laneX,
    laneWidth,
    canvasWidth: swimlanes.length * laneWidth,
  };
}

export function buildSwimlaneGeos(
  swimlanes: readonly string[],
  ctx: LayoutCtx,
): SwimlaneGeo[] {
  if (swimlanes.length === 0) return [];
  return swimlanes.map((name) => ({
    name,
    x: ctx.laneX.get(name) ?? 0,
    width: ctx.laneWidth,
  }));
}
