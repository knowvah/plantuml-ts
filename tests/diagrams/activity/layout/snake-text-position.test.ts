/**
 * Unit tests for `layout/snake-text-position.ts`, the pure port of
 * `Snake#getTextBlockPosition` (`ftile/Snake.java:244-270`). One test
 * per upstream branch, in the SAME order the Java `if`/`else if` chain
 * checks them -- default, `BOTTOM`, `CENTER` (vertical), zigzag
 * `CENTER`, zigzag `RIGHT`, `RD`, `LD` -- plus `directionsCode` and
 * `snakeMaxX` (`Snake#getMaxX`, `Snake.java:234-242`) directly.
 *
 * mission `activity-divergence-drive-3` T1b.
 */
import { describe, expect, it } from 'vitest';
import {
  directionsCode,
  getTextBlockPosition,
  snakeMaxX,
} from '../../../../src/diagrams/activity/layout/snake-text-position.js';

const DIM = { width: 20, height: 16 };

describe('directionsCode (Worm#getDirectionsCode, Worm.java:285-292)', () => {
  it('one letter per segment, R/L/D/U', () => {
    expect(
      directionsCode([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
        { x: 0, y: 0 },
      ]),
    ).toBe('RDLU');
  });
});

describe('getTextBlockPosition -- default branch (Snake.java:248,250)', () => {
  it('x = max(pt1.x, pt2.x) + 4; y = midpoint of pt1/pt2 minus half height', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0, y: 20 },
    ];
    expect(getTextBlockPosition(points, DIM, undefined)).toEqual({ x: 4, y: 2 });
  });

  it('{horizontal: LEFT} with no zigzag and no RD/LD code also falls to default', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0, y: 20 },
    ];
    expect(getTextBlockPosition(points, DIM, { horizontal: 'LEFT' })).toEqual({ x: 4, y: 2 });
  });
});

describe('getTextBlockPosition -- VerticalAlignment.BOTTOM (Snake.java:251-253)', () => {
  it('x = worm.getMinX(); y = worm.getMaxY(), over EVERY point, not just endpoints', () => {
    const points = [
      { x: 5, y: 0 },
      { x: 5, y: 10 },
      { x: 20, y: 10 },
      { x: 20, y: 30 },
    ];
    expect(getTextBlockPosition(points, DIM, { vertical: 'BOTTOM' })).toEqual({ x: 5, y: 30 });
  });
});

describe('getTextBlockPosition -- VerticalAlignment.CENTER (Snake.java:254-256)', () => {
  it('x = worm.getMinX(); y = (first.y + last.y - 10)/2 - dim.height/2', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0, y: 40 },
    ];
    expect(getTextBlockPosition(points, DIM, { vertical: 'CENTER' })).toEqual({ x: 0, y: 7 });
  });
});

describe('getTextBlockPosition -- zigzag HorizontalAlignment.CENTER (Snake.java:257-259)', () => {
  // code = DRD (down, right, down) -- `startsWith('DRD')`.
  const points = [
    { x: 0, y: 0 },
    { x: 0, y: 10 },
    { x: 10, y: 10 },
    { x: 10, y: 20 },
  ];

  it('directionsCode is DRD (zigzag)', () => {
    expect(directionsCode(points)).toBe('DRD');
  });

  it('x = (pt2.x + pt3.x)/2 - dim.width/2; y stays the default estimate', () => {
    expect(getTextBlockPosition(points, DIM, { horizontal: 'CENTER' })).toEqual({ x: -5, y: -3 });
  });
});

describe('getTextBlockPosition -- zigzag HorizontalAlignment.RIGHT (Snake.java:260-261)', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 0, y: 10 },
    { x: 10, y: 10 },
    { x: 10, y: 20 },
  ];

  it('x = max(pt1.x, pt2.x) - dim.width - 4; y stays the default estimate', () => {
    expect(getTextBlockPosition(points, DIM, { horizontal: 'RIGHT' })).toEqual({ x: -24, y: -3 });
  });
});

describe('getTextBlockPosition -- directionsCode "RD" (Snake.java:262-264)', () => {
  // Reached regardless of `horizontal` (upstream's own `else if` chain
  // checks the direction code unconditionally once CENTER/RIGHT+zigzag
  // have both failed to match) -- exercised here with LEFT to prove it.
  const points = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
  ];

  it('code is RD', () => {
    expect(directionsCode(points)).toBe('RD');
  });

  it('x = max(pt1.x, pt2.x); y = (pt1.y + pt3.y)/2 - dim.height/2', () => {
    expect(getTextBlockPosition(points, DIM, { horizontal: 'LEFT' })).toEqual({ x: 10, y: -3 });
  });
});

describe('getTextBlockPosition -- directionsCode "LD" (Snake.java:265-267)', () => {
  const points = [
    { x: 0, y: 0 },
    { x: -10, y: 0 },
    { x: -10, y: 10 },
  ];

  it('code is LD', () => {
    expect(directionsCode(points)).toBe('LD');
  });

  it('x = min(pt1.x, pt2.x); y = (pt1.y + pt3.y)/2 - dim.height/2', () => {
    expect(getTextBlockPosition(points, DIM, { horizontal: 'LEFT' })).toEqual({ x: -10, y: -3 });
  });
});

describe('snakeMaxX (Snake#getMaxX, Snake.java:234-242)', () => {
  it('widens past worm.getMaxX() when the label hangs further right', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0, y: 20 },
    ];
    // wormMaxX = 0; default position.x = 4; 4 + dim.width(20) = 24.
    expect(snakeMaxX(points, DIM, undefined)).toBe(24);
  });

  it('stays at worm.getMaxX() when the line already extends past the label', () => {
    // A later elbow (200) reaches further right than the first segment
    // (0) the default-branch label position is anchored to.
    const points = [
      { x: 0, y: 0 },
      { x: 0, y: 5 },
      { x: 200, y: 5 },
      { x: 200, y: 20 },
    ];
    expect(snakeMaxX(points, DIM, undefined)).toBe(200);
  });
});
