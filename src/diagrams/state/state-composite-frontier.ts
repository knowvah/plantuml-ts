/**
 * `Box` ({x,y,width,height}) <-> `RectangleArea` conversion for the state
 * engine (`StateNodeGeo`/`DotLayoutResult['clusters']` entries use `Box`;
 * `core/svek/FrontierCalculator.ts` operates in upstream's `RectangleArea`
 * shape). The frontier algorithm itself, `Cluster.java#manageEntryExitPoint`
 * (:410-436), lives once in the core module and is driven for the drawn box by
 * `state-composite-drawn-rects.ts` (lgm-T1d).
 */

import type { RectangleArea } from '../../core/svek/FrontierCalculator.js';

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function toRect(b: Box): RectangleArea {
  return { minX: b.x, minY: b.y, maxX: b.x + b.width, maxY: b.y + b.height };
}

export function fromRect(r: RectangleArea): Box {
  return { x: r.minX, y: r.minY, width: r.maxX - r.minX, height: r.maxY - r.minY };
}
