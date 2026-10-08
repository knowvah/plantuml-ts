import { describe, expect, it } from 'vitest';

import {
  edgeDecorationVector,
  terminalDecorationVector,
} from '../../../../../src/diagrams/activity/layout/compress/shapes-of-terminal.js';

describe('terminalDecorationVector', () => {
  it('is the last segment when it has length', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 0, y: 30 },
      { x: 20, y: 30 },
    ];
    expect(terminalDecorationVector(pts)).toEqual({ dx: 20, dy: 0 });
  });

  it('skips a zero-length last segment and takes the segment before it', () => {
    // `ConnectionVerticalThenHorizontal`, DOWN branch
    // (`FtileSwitchWithManyLinks.java:167-170,178-186`): p1, (x1, y2), ptA
    // with ptA.x === x1. The end decoration is `asToDown()` and is drawn
    // anyway (`Worm.java:161-168`).
    const pts = [
      { x: 106.525, y: 143 },
      { x: 106.525, y: 193 },
      { x: 106.525, y: 193 },
    ];
    expect(terminalDecorationVector(pts)).toEqual({ dx: 0, dy: 50 });
  });

  it('is undefined when every segment is zero-length', () => {
    const pts = [
      { x: 5, y: 5 },
      { x: 5, y: 5 },
    ];
    expect(terminalDecorationVector(pts)).toBeUndefined();
  });

  it('is undefined for fewer than two points', () => {
    expect(terminalDecorationVector([{ x: 1, y: 1 }])).toBeUndefined();
  });
});

describe('edgeDecorationVector (add4-T1f R1)', () => {
  const shortRight = [
    { x: 0, y: 0 },
    { x: 0, y: 50 },
    { x: 3, y: 50 },
  ];

  it('an edge endDirection wins over the last segment (asToDown on a short horizontal tail)', () => {
    expect(edgeDecorationVector({ points: shortRight, endDirection: 'down' })).toEqual({ dx: 0, dy: 1 });
  });

  it('each direction maps to its unit vector', () => {
    expect(
      ['up', 'left', 'right'].map((d) => edgeDecorationVector({ points: shortRight, endDirection: d as 'up' })),
    ).toEqual([
      { dx: 0, dy: -1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ]);
  });

  it('without endDirection it falls back to terminalDecorationVector', () => {
    expect(edgeDecorationVector({ points: shortRight })).toEqual({ dx: 3, dy: 0 });
  });
});
