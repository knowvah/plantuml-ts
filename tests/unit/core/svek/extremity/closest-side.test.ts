/**
 * Direct unit tests for `getClosestSide` — the port of `RectangleArea
 * #getClosestSide` (`klimt/geom/RectangleArea.java:209-227`). The NORTH/
 * EAST cases below use the real jar-rendered geometry from `medosa-71-
 * ligu412` (`plans/class-divergence-drive/measurements/out/
 * medosa-71-ligu412.jar.svg`, mechanism C-11,
 * `plans/class-divergence-drive-3/diagnosis/C.md`): `foo2`'s rect
 * (`<rect x="54" y="115" width="59.213" height="48">`) and each crowfoot's
 * contact point (the `<path>`'s end point the wing lines fan out from).
 */
import { describe, it, expect } from 'vitest';
import { getClosestSide } from '../../../../../src/core/svek/extremity/closest-side.js';
import { Side } from '../../../../../src/core/svek/extremity/Side.js';

const FOO2_RECT = { x: 54, y: 115, width: 59.213, height: 48 };

describe('getClosestSide (RectangleArea.java:209-227)', () => {
  it('returns NORTH for foo1->foo2 contact point (medosa lnk4, y2=114.79 wing evidence)', () => {
    // jar: <path d="M46.92,55.26 C...,70.077,107.477" .../> — the crowfoot's
    // contact point on foo2 is the path's own end point (70.077, 107.477).
    expect(getClosestSide(FOO2_RECT, { x: 70.077, y: 107.477 })).toBe(Side.NORTH);
  });

  it('returns NORTH for foo0->foo2 contact point (medosa lnk6, y2=114.79 wing evidence)', () => {
    // jar: <path d="M120.29,55.26 C...,97.143,107.477" .../>
    expect(getClosestSide(FOO2_RECT, { x: 97.143, y: 107.477 })).toBe(Side.NORTH);
  });

  it('returns EAST for the foo2}-foo3 contact point on foo2 (medosa lnk7)', () => {
    // jar: <path id="foo2-backto-foo3" d="M121.35,139 C...,147.74,139" .../>
    // — the crowfoot's contact point on foo2 is the path's own start point.
    expect(getClosestSide(FOO2_RECT, { x: 121.35, y: 139 })).toBe(Side.EAST);
  });

  it('returns SOUTH when the point sits closest to the bottom edge', () => {
    const rect = { x: 0, y: 0, width: 10, height: 10 };
    expect(getClosestSide(rect, { x: 5, y: 9 })).toBe(Side.SOUTH);
  });

  it('returns WEST when the point sits closest to the left edge', () => {
    const rect = { x: 0, y: 0, width: 10, height: 10 };
    expect(getClosestSide(rect, { x: 1, y: 5 })).toBe(Side.WEST);
  });

  it('prefers NORTH on a four-way tie (RectangleArea.java:214 checks NORTH first)', () => {
    const rect = { x: 0, y: 0, width: 10, height: 10 };
    expect(getClosestSide(rect, { x: 5, y: 5 })).toBe(Side.NORTH);
  });
});
