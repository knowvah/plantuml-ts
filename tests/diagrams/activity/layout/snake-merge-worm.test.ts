/**
 * `layout/snake-merge-worm.ts` -- `Worm#merge`'s corner-collapse fixed
 * point, tested directly over hand-built point lists shaped like the
 * Java's own corner patterns (`Worm.java:361-550`). `wormMerge`'s own
 * caller (`snake-merge.ts#joinOrdered`) always passes a `head`/`tail`
 * pair whose join point is already confirmed `same()` -- these fixtures
 * mirror that (head's last === tail's first) even though `wormMerge`
 * itself has no precondition check (its one caller already enforces it,
 * same contract `Worm#merge`'s own `IllegalArgumentException` guards,
 * just not re-asserted at this internal call site).
 */
import { describe, expect, it } from 'vitest';
import { wormMerge } from '../../../../src/diagrams/activity/layout/snake-merge-worm.js';

describe('wormMerge — removeNullVector/removeRedondantDirection', () => {
  it('collapses two collinear DOWN segments into one straight line', () => {
    const result = wormMerge(
      [{ x: 0, y: 0 }, { x: 0, y: 10 }],
      [{ x: 0, y: 10 }, { x: 0, y: 20 }],
      'FULL',
    );
    expect(result).toEqual([{ x: 0, y: 0 }, { x: 0, y: 20 }]);
  });

  it('throws on a near-but-not-exactly-zero-length segment (EXACT equality, matching Direction.fromVector)', () => {
    // `Direction.fromVector` (`utils/Direction.java:110-130`) uses EXACT
    // `==`, same as this port's `directionOf` -- a point pair that is
    // merely CLOSE (not bit-identical) is a diagonal segment, not a null
    // vector, and throws exactly as the Java would. The real upstream
    // geometry defect this stress-tested (pixako-75-kumi821, a
    // `pushTopDownSiblingEdge` summation-order mismatch) was fixed at
    // its origin in `tile-coordinates.ts`, not tolerated here.
    expect(() =>
      wormMerge([{ x: 0, y: 0 }, { x: 0, y: 10 }], [{ x: 0.0000001, y: 10 }, { x: 0, y: 20 }], 'FULL'),
    ).toThrow(/not a horizontal or vertical line/);
  });

  it('keeps a genuine corner (not collinear, not redundant)', () => {
    const result = wormMerge(
      [{ x: 0, y: 0 }, { x: 0, y: 10 }],
      [{ x: 0, y: 10 }, { x: 10, y: 10 }],
      'FULL',
    );
    expect(result).toEqual([{ x: 0, y: 0 }, { x: 0, y: 10 }, { x: 10, y: 10 }]);
  });
});

describe('wormMerge — removePattern6 (forward-and-backward)', () => {
  it('collapses a there-and-back bounce (RIGHT then LEFT) to the original endpoint', () => {
    const result = wormMerge(
      [{ x: 0, y: 0 }, { x: 10, y: 0 }],
      [{ x: 10, y: 0 }, { x: 15, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 20 }],
      'FULL',
    );
    // The RIGHT(10->15)/LEFT(15->10) bounce collapses away entirely,
    // leaving the straight DOWN run from (0,0) through (10,0) to (10,20)
    // -- which `removeRedondantDirection` then further folds (both
    // (0,0)->(10,0) and the surviving (10,0)->(10,20) are NOT the same
    // direction, so only the bounce itself collapses).
    expect(result).toEqual([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 20 }]);
  });
});

describe('wormMerge — removePattern1 (DOWN,LEFT,DOWN,RIGHT corner)', () => {
  it('collapses a staggered S-step, then its own follow-on collapse', () => {
    // `removePattern1`'s own loop (`Worm.java:420`, `i < size() - 5`) needs
    // 6 points, one more than the 4-point pattern itself reads -- a
    // 5-point list never even reaches the `i=0` check.
    const result = wormMerge(
      [{ x: 10, y: 0 }, { x: 10, y: 10 }],
      [{ x: 10, y: 10 }, { x: 0, y: 10 }, { x: 0, y: 20 }, { x: 10, y: 20 }, { x: 10, y: 30 }],
      'FULL',
    );
    // Pattern at i=0: DOWN(10,0->10,10), LEFT(10,10->0,10), DOWN(0,10->0,20),
    // RIGHT(0,20->10,20) -- `removePattern1` replaces points[1..3] with one
    // corner at (x=points[1].x, y=points[3].y) = (10, 20), landing exactly
    // on the surviving (10,20)->(10,30) point -- `removeNullVector` then
    // `removeRedondantDirection` fold the rest to a straight line.
    expect(result).toEqual([{ x: 10, y: 0 }, { x: 10, y: 30 }]);
  });
});

describe('wormMerge — removePattern2 (RIGHT,DOWN,RIGHT,UP corner)', () => {
  it('collapses a step-up zigzag into one corner point', () => {
    // Same 6-point floor as `removePattern1` (`Worm.java:453`) -- the
    // trailing segment turns RIGHT (not UP again), so no earlier pass
    // (`removeRedondantDirection`) collapses the list before this one's
    // own loop gets its turn.
    const result = wormMerge(
      [{ x: 0, y: 20 }, { x: 10, y: 20 }],
      [{ x: 10, y: 20 }, { x: 10, y: 30 }, { x: 20, y: 30 }, { x: 20, y: 10 }, { x: 30, y: 10 }],
      'FULL',
    );
    // Pattern at i=0: RIGHT, DOWN, RIGHT, UP -- replaces points[1..3] with
    // (x=points[3].x, y=points[1].y) = (20, 20).
    expect(result).toEqual([{ x: 0, y: 20 }, { x: 20, y: 20 }, { x: 20, y: 10 }, { x: 30, y: 10 }]);
  });
});

describe('wormMerge — removePattern3 (DOWN,RIGHT,DOWN,RIGHT corner)', () => {
  it('collapses a double-right staircase into one corner', () => {
    const result = wormMerge(
      [{ x: 0, y: 0 }, { x: 0, y: 10 }],
      [{ x: 0, y: 10 }, { x: 10, y: 10 }, { x: 10, y: 20 }, { x: 20, y: 20 }],
      'FULL',
    );
    // Pattern at i=0: DOWN, RIGHT, DOWN, RIGHT -- replaces points[1..3]
    // with (x=points[1].x, y=points[3].y) = (0, 20).
    expect(result).toEqual([{ x: 0, y: 0 }, { x: 0, y: 20 }, { x: 20, y: 20 }]);
  });
});

describe('wormMerge — removePattern4 (DOWN,LEFT,DOWN,RIGHT at the LAST 5 points, gated)', () => {
  it('collapses when the gate (p4.x > p1.x) holds', () => {
    const result = wormMerge(
      [{ x: 0, y: 0 }, { x: 0, y: 10 }],
      [{ x: 0, y: 10 }, { x: -10, y: 10 }, { x: -10, y: 20 }, { x: 5, y: 20 }],
      'FULL',
    );
    expect(result).toEqual([{ x: 0, y: 0 }, { x: 0, y: 20 }, { x: 5, y: 20 }]);
  });

  it('does NOT fire when the gate fails (p4.x <= p1.x)', () => {
    const result = wormMerge(
      [{ x: 0, y: 0 }, { x: 0, y: 10 }],
      [{ x: 0, y: 10 }, { x: -10, y: 10 }, { x: -10, y: 20 }, { x: 0, y: 20 }],
      'FULL',
    );
    expect(result).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: -10, y: 10 },
      { x: -10, y: 20 },
      { x: 0, y: 20 },
    ]);
  });
});

describe('wormMerge — removePattern5 (DOWN,RIGHT,DOWN,LEFT at the LAST 5 points, gated)', () => {
  it('collapses when the gate (p4.x + 4 < p1.x) holds', () => {
    const result = wormMerge(
      [{ x: 0, y: 0 }, { x: 0, y: 10 }],
      [{ x: 0, y: 10 }, { x: 10, y: 10 }, { x: 10, y: 20 }, { x: -10, y: 20 }],
      'FULL',
    );
    expect(result).toEqual([{ x: 0, y: 0 }, { x: 0, y: 20 }, { x: -10, y: 20 }]);
  });

  it('does NOT fire when the gate fails (p4.x + 4 >= p1.x)', () => {
    const result = wormMerge(
      [{ x: 0, y: 0 }, { x: 0, y: 10 }],
      [{ x: 0, y: 10 }, { x: 10, y: 10 }, { x: 10, y: 20 }, { x: 0, y: 20 }],
      'FULL',
    );
    expect(result).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 10, y: 10 },
      { x: 10, y: 20 },
      { x: 0, y: 20 },
    ]);
  });
});

describe('wormMerge — removePattern7 (RIGHT,DOWN,LEFT,DOWN at the FIRST position)', () => {
  it('collapses a leading notch into a 2-point corner, gated on p3.x > p0.x', () => {
    const result = wormMerge(
      [{ x: 0, y: 0 }, { x: 10, y: 0 }],
      [{ x: 10, y: 0 }, { x: 10, y: 10 }, { x: 5, y: 10 }, { x: 5, y: 20 }],
      'FULL',
    );
    // Pattern at i=0: RIGHT, DOWN, LEFT, DOWN with p3.x(5) > p0.x(0) --
    // `removePattern7` replaces points[1..2] with (x=p3.x, y=p0.y) =
    // (5, 0), a 2-point replace (not 3, unlike every other pattern here).
    expect(result).toEqual([{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 20 }]);
  });

  it('does NOT fire when p3.x <= p0.x (the gate)', () => {
    const result = wormMerge(
      [{ x: 10, y: 0 }, { x: 20, y: 0 }],
      [{ x: 20, y: 0 }, { x: 20, y: 10 }, { x: 5, y: 10 }, { x: 5, y: 20 }],
      'FULL',
    );
    // p3.x(5) <= p0.x(10) -- `removePattern7` must not fire; the points
    // survive untouched (no other pattern matches this shape either).
    expect(result).toEqual([
      { x: 10, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 10 },
      { x: 5, y: 10 },
      { x: 5, y: 20 },
    ]);
  });
});

describe('wormMerge — removePattern8 (FULL only, LIMITED preserves the corner)', () => {
  const headPts = [{ x: 0, y: 0 }, { x: 10, y: 0 }];
  const tailPts = [
    { x: 10, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 10 },
    { x: 10, y: 10 },
  ];

  it('FULL collapses a LEFT,DOWN,LEFT,DOWN run into one corner', () => {
    const result = wormMerge(headPts, tailPts, 'FULL');
    // The RIGHT(0,0->10,0) then LEFT(10,0->0,0) bounce collapses first
    // (`removePattern6`), leaving (0,0),(0,10),(10,10) -- already a
    // simple corner, nothing left for `removePattern8` to do on THIS
    // shape once pattern6 runs first in upstream's own order. Confirms
    // pattern6 (checked before 8) wins when both could apply.
    expect(result).toEqual([{ x: 0, y: 0 }, { x: 0, y: 10 }, { x: 10, y: 10 }]);
  });

  it('decisions.md D2: LIMITED skips removePattern8 specifically', () => {
    // A shape where ONLY removePattern8 (not 6) could collapse it:
    // LEFT, DOWN, LEFT, DOWN with no reversing bounce.
    const result = wormMerge(
      [{ x: 20, y: 0 }, { x: 10, y: 0 }],
      [{ x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 0, y: 20 }],
      'LIMITED',
    );
    expect(result).toEqual([
      { x: 20, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 0, y: 20 },
    ]);
  });

  it('the SAME shape collapses under FULL (removePattern8 runs)', () => {
    const result = wormMerge(
      [{ x: 20, y: 0 }, { x: 10, y: 0 }],
      [{ x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 0, y: 20 }],
      'FULL',
    );
    // LEFT, DOWN, LEFT, DOWN -- replaces points[1..3] with
    // (x=points[3].x, y=points[1].y) = (0, 0).
    expect(result).toEqual([{ x: 20, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 20 }]);
  });
});

describe('wormMerge — diagonal segment throws (axis-aligned geometry only)', () => {
  it('throws when a segment is neither horizontal nor vertical', () => {
    expect(() => wormMerge([{ x: 0, y: 0 }], [{ x: 10, y: 10 }], 'FULL')).toThrow(
      /not a horizontal or vertical line/,
    );
  });
});
