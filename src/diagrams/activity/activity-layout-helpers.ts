/**
 * Small geometry/measurement helpers shared across the activity diagram
 * layout engine (see `layout.old.ts`).
 */

import type { FontSpec } from '../../core/measurer.js';
import { measureNodeLabel } from '../../core/latex.js';
import type { LayoutCtx } from './activity-layout-types.js';
import {
  ACTION_HEIGHT,
  ACTION_H_PAD,
  DIAMOND_LABEL_PAD,
  DIAMOND_MIN,
  NOTE_FOLD,
} from './activity-layout-constants.js';

export function nextId(ctx: LayoutCtx, prefix: string): string {
  const current = ctx.counters.get(prefix) ?? 0;
  ctx.counters.set(prefix, current + 1);
  return `${prefix}-${current}`;
}

/**
 * Compute the half-size of a decision diamond to fit its label text.
 * A rotated square with half-size s can contain text W×H when W/2 + H/2 ≤ s.
 */
export function diamondSize(label: string, ctx: LayoutCtx): number {
  if (label === '') return DIAMOND_MIN;
  const font: FontSpec = { family: ctx.theme.fontFamily, size: ctx.theme.fontSize - 2 };
  const m = ctx.measurer.measure(label, font);
  return Math.max(DIAMOND_MIN, Math.round((m.width + m.height) / 2) + DIAMOND_LABEL_PAD);
}

export function repeatCondSize(label: string, ctx: LayoutCtx): { width: number; height: number } {
  const font: FontSpec = { family: ctx.theme.fontFamily, size: ctx.theme.fontSize };
  const m = ctx.measurer.measure(label, font);
  const h = ACTION_HEIGHT;
  // Hexagon dent = h/2 on each side, so total bounding box width = textWidth + h.
  // No extra padding: the hexagon body is exactly as wide as the label text.
  return { width: m.width + h, height: h };
}

export function actionSize(
  label: string,
  ctx: LayoutCtx,
): { width: number; height: number } {
  const font: FontSpec = { family: ctx.theme.fontFamily, size: ctx.theme.fontSize };
  if (label.includes('<latex>')) {
    const measured = measureNodeLabel(label, ctx.measurer, font);
    return { width: measured.width, height: Math.max(ACTION_HEIGHT, measured.height) };
  }
  const lines = label.split('\n');
  const lineHeight = ctx.theme.fontSize * 1.4;
  const maxWidth = Math.max(...lines.map((ln) => ctx.measurer.measure(ln, font).width));
  return {
    width: maxWidth + ACTION_H_PAD * 2,
    height: Math.max(ACTION_HEIGHT, lines.length * lineHeight),
  };
}

export function parallelogramSize(
  label: string,
  ctx: LayoutCtx,
): { width: number; height: number } {
  const font: FontSpec = { family: ctx.theme.fontFamily, size: ctx.theme.fontSize };
  const measured = measureNodeLabel(label, ctx.measurer, font);
  const h = Math.max(ACTION_HEIGHT, measured.height);
  return { width: measured.width, height: h };
}

export function noteSize(
  label: string,
  ctx: LayoutCtx,
): { width: number; height: number } {
  const font: FontSpec = { family: ctx.theme.fontFamily, size: ctx.theme.fontSize };
  const lines = label.split('\n');
  const lineHeight = ctx.theme.fontSize * 1.4;
  const maxWidth = Math.max(...lines.map((ln) => ctx.measurer.measure(ln, font).width));
  const textHeight = lines.length * lineHeight;
  return {
    width: maxWidth + ACTION_H_PAD * 2,
    height: Math.max(ACTION_HEIGHT, NOTE_FOLD * 2 + textHeight),
  };
}

/**
 * Builds orthogonal (right-angle) waypoints from (fromX, fromY) to (toX, toY).
 * If the x positions match, returns a direct vertical line.
 * Otherwise returns a Z-shaped path: down to midY, horizontal, down to target.
 */
export function orthogonalPoints(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): Array<{ x: number; y: number }> {
  if (Math.abs(fromX - toX) < 1) {
    return [
      { x: fromX, y: fromY },
      { x: toX, y: toY },
    ];
  }
  const midY = Math.round((fromY + toY) / 2);
  return [
    { x: fromX, y: fromY },
    { x: fromX, y: midY },
    { x: toX, y: midY },
    { x: toX, y: toY },
  ];
}

/**
 * Returns the x-center for a node given swimlane context.
 * When swimlanes are active and the node has a lane, uses that lane's center.
 * Otherwise uses the provided fallback center (branch-specific center).
 */
export function nodeCenterX(
  swimlane: string | undefined,
  fallbackCenterX: number,
  ctx: LayoutCtx,
): number {
  if (swimlane !== undefined && ctx.laneX.size > 0) {
    const lx = ctx.laneX.get(swimlane);
    if (lx !== undefined) {
      const laneCenter = lx + ctx.laneWidth / 2;
      // Use the explicit fallback x only when it lies strictly inside the
      // lane — this happens when a fork/split column has positioned a
      // child off the lane's center. Otherwise (sequential flow that
      // inherited the canvas center, a column that overflowed the lane,
      // or a fallback that landed on a lane boundary) snap to the lane's
      // center.
      const margin = 1;
      if (
        fallbackCenterX > lx + margin &&
        fallbackCenterX < lx + ctx.laneWidth - margin
      ) {
        return fallbackCenterX;
      }
      return laneCenter;
    }
  }
  return fallbackCenterX;
}
