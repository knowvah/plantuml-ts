/**
 * placement-strategies.test.ts — SI1/T4: unit coverage for the ported
 * klimt/geom placement-strategy family (`PlacementStrategy`,
 * `AbstractPlacementStrategy`, and the six concrete strategies). Every
 * expected coordinate below is derived by hand from the corresponding
 * Java `getPositions` arithmetic (file:line in each describe block) —
 * no fitted constants.
 */
import { describe, expect, it } from 'vitest';
import type { TextBlock } from '../../../../../src/core/klimt/shape/TextBlock.js';
import type { StringBounder } from '../../../../../src/core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../../../../src/core/klimt/geom/XDimension2D.js';
import type { XPoint2D } from '../../../../../src/core/klimt/geom/XPoint2D.js';
import { PlacementStrategyVisibility } from '../../../../../src/core/klimt/geom/PlacementStrategyVisibility.js';
import { PlacementStrategyY1Y2 } from '../../../../../src/core/klimt/geom/PlacementStrategyY1Y2.js';
import { PlacementStrategyY1Y2Center } from '../../../../../src/core/klimt/geom/PlacementStrategyY1Y2Center.js';
import { PlacementStrategyY1Y2Left } from '../../../../../src/core/klimt/geom/PlacementStrategyY1Y2Left.js';
import { PlacementStrategyY1Y2Right } from '../../../../../src/core/klimt/geom/PlacementStrategyY1Y2Right.js';
import { PlacementStrategyX1Y2Y3 } from '../../../../../src/core/klimt/geom/PlacementStrategyX1Y2Y3.js';
import { PlacementStrategyX1X2 } from '../../../../../src/core/klimt/geom/PlacementStrategyX1X2.js';

const stubStringBounder: StringBounder = { calculateDimension: () => new XDimension2D(0, 0) };

/** A TextBlock stub with a fixed dimension, independent of the bounder. */
function block(width: number, height: number): TextBlock {
  return {
    calculateDimension: () => new XDimension2D(width, height),
    drawU: () => undefined,
  };
}

function pos(positions: Map<TextBlock, XPoint2D>, key: TextBlock): { x: number; y: number } {
  const p = positions.get(key);
  if (p === undefined) throw new Error('block not placed');
  return { x: p.getX(), y: p.getY() };
}

// Shared fixture for the Y1Y2 family: A(10x5), B(20x10) in a 40x27 area.
// usedHeight = 15; space = (27 - 15) / (2 + 1) = 4; yA = 4, yB = 4+5+4 = 13.
const WIDTH = 40;
const HEIGHT = 27;

describe('PlacementStrategyY1Y2 (klimt/geom/PlacementStrategyY1Y2.java:50-64)', () => {
  it('centers each block horizontally and spreads vertical slack evenly', () => {
    const a = block(10, 5);
    const b = block(20, 10);
    const strategy = new PlacementStrategyY1Y2(stubStringBounder);
    strategy.add(a);
    strategy.add(b);
    const positions = strategy.getPositions(WIDTH, HEIGHT);
    expect(pos(positions, a)).toEqual({ x: 15, y: 4 });
    expect(pos(positions, b)).toEqual({ x: 10, y: 13 });
  });
});

describe('PlacementStrategyY1Y2Center (klimt/geom/PlacementStrategyY1Y2Center.java:51-65)', () => {
  it('matches PlacementStrategyY1Y2 arithmetic (upstream duplicate body)', () => {
    const a = block(10, 5);
    const b = block(20, 10);
    const strategy = new PlacementStrategyY1Y2Center(stubStringBounder);
    strategy.add(a);
    strategy.add(b);
    const positions = strategy.getPositions(WIDTH, HEIGHT);
    expect(pos(positions, a)).toEqual({ x: 15, y: 4 });
    expect(pos(positions, b)).toEqual({ x: 10, y: 13 });
  });
});

describe('PlacementStrategyY1Y2Left (klimt/geom/PlacementStrategyY1Y2Left.java:50-64)', () => {
  it('pins x=0 and spreads vertical slack evenly', () => {
    const a = block(10, 5);
    const b = block(20, 10);
    const strategy = new PlacementStrategyY1Y2Left(stubStringBounder);
    strategy.add(a);
    strategy.add(b);
    const positions = strategy.getPositions(WIDTH, HEIGHT);
    expect(pos(positions, a)).toEqual({ x: 0, y: 4 });
    expect(pos(positions, b)).toEqual({ x: 0, y: 13 });
  });
});

describe('PlacementStrategyY1Y2Right (klimt/geom/PlacementStrategyY1Y2Right.java:50-63)', () => {
  it('right-aligns each block and spreads vertical slack evenly', () => {
    const a = block(10, 5);
    const b = block(20, 10);
    const strategy = new PlacementStrategyY1Y2Right(stubStringBounder);
    strategy.add(a);
    strategy.add(b);
    const positions = strategy.getPositions(WIDTH, HEIGHT);
    expect(pos(positions, a)).toEqual({ x: 30, y: 4 });
    expect(pos(positions, b)).toEqual({ x: 20, y: 13 });
  });
});

describe('PlacementStrategyX1X2 (klimt/geom/PlacementStrategyX1X2.java:51-65)', () => {
  it('centers each block vertically and spreads horizontal slack evenly', () => {
    // A(10x5), B(20x10) in 40x12: usedWidth=30, space=(40-30)/3=10/3.
    // xA = 10/3, yA = (12-5)/2 = 3.5; xB = 10/3+10+10/3 = 50/3, yB = 1.
    const a = block(10, 5);
    const b = block(20, 10);
    const strategy = new PlacementStrategyX1X2(stubStringBounder);
    strategy.add(a);
    strategy.add(b);
    const positions = strategy.getPositions(40, 12);
    expect(pos(positions, a).x).toBeCloseTo(10 / 3, 10);
    expect(pos(positions, a).y).toBe(3.5);
    expect(pos(positions, b).x).toBeCloseTo(50 / 3, 10);
    expect(pos(positions, b).y).toBe(1);
  });
});

describe('PlacementStrategyVisibility (klimt/geom/PlacementStrategyVisibility.java:55-72)', () => {
  it('lays out (icon, member) pairs: icon at x=0 with +2 y bias, member at col2', () => {
    // col2=12; pairs (v1 3x4, t1 10x8) and (v2 3x6, t2 10x2).
    // Pair 1: maxH=8 -> v1 (0, 2+0+(8-4)/2)=(0,4); t1 (12, 0+(8-8)/2)=(12,0); y->8.
    // Pair 2: maxH=6 -> v2 (0, 2+8+(6-6)/2)=(0,10); t2 (12, 8+(6-2)/2)=(12,10).
    const v1 = block(3, 4);
    const t1 = block(10, 8);
    const v2 = block(3, 6);
    const t2 = block(10, 2);
    const strategy = new PlacementStrategyVisibility(stubStringBounder, 12);
    for (const b of [v1, t1, v2, t2]) strategy.add(b);
    const positions = strategy.getPositions(100, 100);
    expect(pos(positions, v1)).toEqual({ x: 0, y: 4 });
    expect(pos(positions, t1)).toEqual({ x: 12, y: 0 });
    expect(pos(positions, v2)).toEqual({ x: 0, y: 10 });
    expect(pos(positions, t2)).toEqual({ x: 12, y: 10 });
  });

  it('throws on an odd number of blocks (Java NoSuchElementException)', () => {
    const strategy = new PlacementStrategyVisibility(stubStringBounder, 12);
    strategy.add(block(3, 4));
    expect(() => strategy.getPositions(100, 100)).toThrow();
  });
});

describe('PlacementStrategyX1Y2Y3 (klimt/geom/PlacementStrategyX1Y2Y3.java:53-80)', () => {
  it('centers the first block vertically, stacks the rest centered in their column', () => {
    // first(10x20), b2(6x4), b3(8x6) in 30x24:
    // maxWidthButFirst=8, sumHeightButFirst=10, space=(30-10-8)/3=4.
    // first: (4, (24-20)/2)=(4,2). y=(24-10)/2=7.
    // b2: x=2*4+10+(8-6)/2=19 -> (19,7); y->11. b3: x=8+10+0=18 -> (18,11).
    const first = block(10, 20);
    const b2 = block(6, 4);
    const b3 = block(8, 6);
    const strategy = new PlacementStrategyX1Y2Y3(stubStringBounder);
    for (const b of [first, b2, b3]) strategy.add(b);
    const positions = strategy.getPositions(30, 24);
    expect(pos(positions, first)).toEqual({ x: 4, y: 2 });
    expect(pos(positions, b2)).toEqual({ x: 19, y: 7 });
    expect(pos(positions, b3)).toEqual({ x: 18, y: 11 });
  });
});

describe('AbstractPlacementStrategy#add (klimt/geom/AbstractPlacementStrategy.java:54-56)', () => {
  it('measures each block through the constructor StringBounder', () => {
    const seen: StringBounder[] = [];
    const measured: TextBlock = {
      calculateDimension: (sb) => {
        seen.push(sb);
        return new XDimension2D(1, 1);
      },
      drawU: () => undefined,
    };
    const strategy = new PlacementStrategyY1Y2Left(stubStringBounder);
    strategy.add(measured);
    expect(seen).toEqual([stubStringBounder]);
  });
});
