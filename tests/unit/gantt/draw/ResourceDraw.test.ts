import { expect, it } from 'vitest';
import type { StringBounder } from '../../../../src/core/klimt/font/StringBounder.js';
import type { ResourceDraw } from '../../../../src/diagrams/gantt/draw/ResourceDraw.js';

it('is implementable with height, y and drawU (ResourceDraw.java:43-45)', () => {
  const drawn: number[] = [];
  const r: ResourceDraw = { getHeight: () => 12, getY: () => 7, drawU: () => void drawn.push(1) };
  r.drawU({} as never);
  expect([r.getHeight({} as StringBounder), r.getY(), drawn]).toEqual([12, 7, [1]]);
});
