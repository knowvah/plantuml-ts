/**
 * Unit tests for `state-composite-frontier.ts` — the state engine's `Box`
 * adapter over `core/svek/FrontierCalculator.ts` (mission shared-seam-
 * extraction T5). The algorithm itself is exercised exhaustively by
 * `tests/unit/core/svek/FrontierCalculator.test.ts`; this suite covers only
 * the `Box`<->`RectangleArea` conversion this adapter adds.
 */
import { describe, test, expect } from 'vitest';
import { toRect, fromRect, type Box } from '../../../src/diagrams/state/state-composite-frontier.js';

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
