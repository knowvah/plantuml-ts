/**
 * Translation-fidelity tests for T1p-e's cross-swimlane switch shapes:
 * each case hand-evaluates the Java expression
 * (`FtileSwitchWithManyLinks.java:318-339,363-393`) at the SAME inputs and
 * asserts the TS port returns the identical numbers -- not a fixture
 * comparison (these shapes are not yet wired into the render path; see
 * `switch-cross-shapes.ts`'s own doc and this task's handback report).
 */

import { describe, expect, it } from 'vitest';
import {
  routeSwitchHorizontalThenVerticalCross,
  routeSwitchVerticalThenHorizontalCross,
} from '../../../../src/diagrams/activity/layout/switch-cross-shapes.js';

describe('routeSwitchHorizontalThenVerticalCross', () => {
  it('offsets left (mp1a.x - halfWidth) when mp1a is RIGHT of mp2b (:330-331)', () => {
    // mp1a=(100,50), mp2b=(20,150), diamond1 halfWidth=12, halfHeight=8.
    // Java: mp1a.x(100) > mp2b.x(20) -> addPoint(100-12, 50-8) = (88,42);
    // addPoint(20, 42); addPoint(mp2b) = (20,150).
    const points = routeSwitchHorizontalThenVerticalCross(
      { x: 100, y: 50 },
      { x: 20, y: 150 },
      { halfWidth: 12, halfHeight: 8 },
    );
    expect(points).toEqual([
      { x: 88, y: 42 },
      { x: 20, y: 42 },
      { x: 20, y: 150 },
    ]);
  });

  it('offsets right (mp1a.x + halfWidth) when mp1a is LEFT of mp2b (:333)', () => {
    // mp1a=(20,50), mp2b=(100,150), diamond1 halfWidth=12, halfHeight=8.
    // Java: mp1a.x(20) <= mp2b.x(100) -> addPoint(20+12, 50-8) = (32,42);
    // addPoint(100, 42); addPoint(mp2b) = (100,150).
    const points = routeSwitchHorizontalThenVerticalCross(
      { x: 20, y: 50 },
      { x: 100, y: 150 },
      { halfWidth: 12, halfHeight: 8 },
    );
    expect(points).toEqual([
      { x: 32, y: 42 },
      { x: 100, y: 42 },
      { x: 100, y: 150 },
    ]);
  });
});

describe('routeSwitchVerticalThenHorizontalCross', () => {
  it('direction LEFT, enters diamond2 from its right edge (mp2b.x + halfWidth) when mp1a is RIGHT of mp2b', () => {
    // mp1a=(150,30), mp2b=(50,120), diamond2 halfWidth=15, halfHeight=10.
    // Java: mp1a.x(150) > mp2b.x(50) -> direction=LEFT;
    // addPoint(mp1a)=(150,30); addPoint(150, 120+10=130);
    // direction==LEFT -> addPoint(50+15=65, 130).
    const result = routeSwitchVerticalThenHorizontalCross(
      { x: 150, y: 30 },
      { x: 50, y: 120 },
      { halfWidth: 15, halfHeight: 10 },
    );
    expect(result.direction).toBe('left');
    expect(result.points).toEqual([
      { x: 150, y: 30 },
      { x: 150, y: 130 },
      { x: 65, y: 130 },
    ]);
  });

  it('direction RIGHT, enters diamond2 from its left edge (mp2b.x - halfWidth) when mp1a is LEFT of mp2b', () => {
    // mp1a=(50,30), mp2b=(150,120), diamond2 halfWidth=15, halfHeight=10.
    // Java: mp1a.x(50) <= mp2b.x(150) -> direction=RIGHT;
    // addPoint(mp1a)=(50,30); addPoint(50, 120+10=130);
    // direction==RIGHT -> addPoint(150-15=135, 130).
    const result = routeSwitchVerticalThenHorizontalCross(
      { x: 50, y: 30 },
      { x: 150, y: 120 },
      { halfWidth: 15, halfHeight: 10 },
    );
    expect(result.direction).toBe('right');
    expect(result.points).toEqual([
      { x: 50, y: 30 },
      { x: 50, y: 130 },
      { x: 135, y: 130 },
    ]);
  });
});
