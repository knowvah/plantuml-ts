/**
 * Unit tests for `state-composite-frontier.ts` — the state engine's `Box`
 * adapter over `core/svek/FrontierCalculator.ts` (mission shared-seam-
 * extraction T5). The algorithm itself is exercised exhaustively by
 * `tests/unit/core/svek/FrontierCalculator.test.ts`; this suite covers only
 * the `Box`<->`RectangleArea` conversion this adapter adds.
 */
import { describe, test, expect } from 'vitest';
import {
  frontierCalculator, ensureMinWidth, toRect, fromRect, type Box,
} from '../../../src/diagrams/state/state-composite-frontier.js';

describe('toRect / fromRect', () => {
  test('toRect converts x/y/width/height to minX/minY/maxX/maxY', () => {
    const box: Box = { x: 10, y: 20, width: 30, height: 40 };
    expect(toRect(box)).toEqual({ minX: 10, minY: 20, maxX: 40, maxY: 60 });
  });

  test('fromRect is the inverse of toRect', () => {
    const box: Box = { x: 10, y: 20, width: 30, height: 40 };
    expect(fromRect(toRect(box))).toEqual(box);
  });
});

describe('frontierCalculator (Box adapter)', () => {
  test('round-trips a degenerate case (insides/points empty) back to the initial Box', () => {
    const initial: Box = { x: 10, y: 20, width: 30, height: 40 };
    const result = frontierCalculator(initial, [], [], 'TB');
    expect(result).toEqual(initial);
  });

  test('unions insides Boxes when non-empty, falling back to initial on every untouched axis', () => {
    const initial: Box = { x: 0, y: 0, width: 100, height: 100 };
    const insides: Box[] = [
      { x: 20, y: 20, width: 10, height: 10 },
      { x: 40, y: 25, width: 10, height: 5 },
    ];
    const result = frontierCalculator(initial, insides, [], 'TB');
    expect(result).toEqual(initial);
  });
});

describe('ensureMinWidth (Box adapter)', () => {
  test('is a no-op when core is already at least as wide as minWidth', () => {
    const core: Box = { x: 0, y: 0, width: 50, height: 20 };
    const initial: Box = { x: -10, y: -10, width: 70, height: 40 };
    expect(ensureMinWidth(core, 40, initial)).toEqual(core);
  });

  test('widens symmetrically around the current center when narrower than minWidth', () => {
    const core: Box = { x: 0, y: 0, width: 10, height: 5 };
    const initial: Box = { x: -100, y: 0, width: 300, height: 5 };
    const result = ensureMinWidth(core, 20, initial);
    expect(result.x).toBeCloseTo(-5, 6);
    expect(result.width).toBeCloseTo(20, 6);
    expect(result.y).toBe(0);
    expect(result.height).toBe(5);
  });
});
