import { expect, it } from 'vitest';
import type { HeaderPiece } from '../../../../../src/diagrams/gantt/draw/header/HeaderPiece.js';

it('is implementable with an opaque context (HeaderPiece.java:42-44)', () => {
  const seen: unknown[] = [];
  const h: HeaderPiece = { getHeight: (ctx) => Number(ctx), drawU: (_ug, ctx) => void seen.push(ctx) };
  h.drawU({} as never, 'c');
  expect([h.getHeight(5), seen]).toEqual([5, ['c']]);
});
