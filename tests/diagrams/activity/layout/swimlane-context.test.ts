import { describe, expect, it } from 'vitest';
import {
  buildSwimlaneContexts,
  computeLaneWidths,
  halfMissingSpace,
  measureLaneExtents,
  resolveSwimlaneMinWidth,
  SWIMLANE_HALF_MISSING_SPACE,
  SWIMLANE_WIDTH_SAME,
  type LaneItem,
} from '../../../../src/diagrams/activity/layout/swimlane-context.js';

describe('buildSwimlaneContexts — unchanged', () => {
  it('still builds equal-width contexts from a start x', () => {
    const contexts = buildSwimlaneContexts(['A', 'B'], 12, 120);
    expect(contexts).toEqual([
      { name: 'A', x: 12, width: 120 },
      { name: 'B', x: 132, width: 120 },
    ]);
  });
});

describe('SWIMLANE_HALF_MISSING_SPACE', () => {
  it('is the literal 5 from Swimlanes.java:438,444', () => {
    expect(SWIMLANE_HALF_MISSING_SPACE).toBe(5);
  });
});

describe('measureLaneExtents', () => {
  it('computes minX/maxX per lane from assigned items', () => {
    const items: LaneItem[] = [
      { swimlane: 'A', x: 10, width: 20 }, // 10..30
      { swimlane: 'A', x: 40, width: 5 }, // 40..45
      { swimlane: 'B', x: 100, width: 50 }, // 100..150
    ];
    const extents = measureLaneExtents(items, ['A', 'B']);
    expect(extents.get('A')).toEqual({ minX: 10, maxX: 45 });
    expect(extents.get('B')).toEqual({ minX: 100, maxX: 150 });
  });

  it('excludes items with no swimlane from every lane extent', () => {
    const items: LaneItem[] = [
      { x: 0, width: 1000 }, // no swimlane -- must not pollute A or B
      { swimlane: 'A', x: 10, width: 20 },
    ];
    const extents = measureLaneExtents(items, ['A', 'B']);
    expect(extents.get('A')).toEqual({ minX: 10, maxX: 30 });
    expect(extents.get('B')).toEqual({ minX: 0, maxX: 0 });
  });

  it('excludes items assigned to a lane not in laneNames', () => {
    const items: LaneItem[] = [{ swimlane: 'ghost', x: 10, width: 20 }];
    const extents = measureLaneExtents(items, ['A']);
    expect(extents.get('A')).toEqual({ minX: 0, maxX: 0 });
  });

  it('reports an empty lane as { minX: 0, maxX: 0 }, mirroring MinMax.getEmpty(true)', () => {
    const extents = measureLaneExtents([], ['A']);
    expect(extents.get('A')).toEqual({ minX: 0, maxX: 0 });
  });

  it('returns an empty map for no lanes and no items, without throwing', () => {
    expect(() => measureLaneExtents([], [])).not.toThrow();
    expect(measureLaneExtents([], []).size).toBe(0);
  });
});

describe('resolveSwimlaneMinWidth', () => {
  it('passes a non-sentinel min through unchanged', () => {
    expect(resolveSwimlaneMinWidth([10, 400], 250)).toBe(250);
  });

  it('resolves SWIMLANE_WIDTH_SAME to the max content width', () => {
    expect(resolveSwimlaneMinWidth([10, 400, 55], SWIMLANE_WIDTH_SAME)).toBe(400);
  });
});

describe('computeLaneWidths', () => {
  it('a lane whose body is wider than its title: width === content width', () => {
    const extents = new Map([['A', { minX: 0, maxX: 100 }]]);
    const titleWidths = new Map([['A', 20]]);
    const widths = computeLaneWidths(extents, titleWidths, 0);
    expect(widths.get('A')).toEqual({ contentWidth: 100, contentMinX: 0, titleWidth: 20, width: 100 });
  });

  it('a lane whose title is wider than its body: width STAYS the content width', () => {
    // Swimlanes.java:409 -- the title never enters swimlaneActualWidth's
    // max; it only widens the adjacent dividers (see halfMissingSpace).
    const extents = new Map([['A', { minX: 0, maxX: 26.675 }]]);
    const titleWidths = new Map([['A', 300.937]]);
    const widths = computeLaneWidths(extents, titleWidths, 0);
    expect(widths.get('A')!.width).toBe(26.675);
  });

  it('min = -1 (same): every lane width is the max content width', () => {
    const extents = new Map([
      ['A', { minX: 0, maxX: 30 }],
      ['B', { minX: 0, maxX: 90 }],
    ]);
    const titleWidths = new Map<string, number>();
    const widths = computeLaneWidths(extents, titleWidths, SWIMLANE_WIDTH_SAME);
    expect(widths.get('A')!.width).toBe(90);
    expect(widths.get('B')!.width).toBe(90);
  });

  it('min = 400: every lane width is at least 400', () => {
    const extents = new Map([
      ['A', { minX: 0, maxX: 30 }],
      ['B', { minX: 0, maxX: 500 }],
    ]);
    const widths = computeLaneWidths(extents, new Map(), 400);
    expect(widths.get('A')!.width).toBe(400);
    expect(widths.get('B')!.width).toBe(500);
  });

  it('an empty lane: width falls back to min, no throw', () => {
    const extents = new Map([['A', { minX: 0, maxX: 0 }]]);
    const widths = computeLaneWidths(extents, new Map(), 0);
    expect(widths.get('A')).toEqual({ contentWidth: 0, contentMinX: 0, titleWidth: 0, width: 0 });
  });
});

describe('halfMissingSpace', () => {
  const lanes = [
    { contentWidth: 26.675, titleWidth: 28.338 }, // title overflows
    { contentWidth: 26.675, titleWidth: 300.937 }, // title overflows far more
  ];

  it('the outer edge before the first lane is always SWIMLANE_HALF_MISSING_SPACE', () => {
    expect(halfMissingSpace(0, lanes, 0)).toBe(SWIMLANE_HALF_MISSING_SPACE);
  });

  it('the outer edge after the last lane is always SWIMLANE_HALF_MISSING_SPACE', () => {
    // n lanes produce n + 1 dividers, i in [0, n]. i = n + 1 is one past
    // the last divider -- upstream's "i > swimlanesSpecial().size()" fast
    // path (mirrored here without modeling the phantom trailing lane,
    // whose own title is always empty and so always resolves to 5 too).
    // i === lanes.length (the LAST divider, adjacent to the last real
    // lane) is exercised by the "half-space grows" test below -- that
    // lane's own title CAN overflow, so it is not an outer edge.
    expect(halfMissingSpace(lanes.length + 1, lanes, 0)).toBe(SWIMLANE_HALF_MISSING_SPACE);
  });

  it('a lane whose body is wider than its title: half-space stays 5', () => {
    const notOverflowing = [{ contentWidth: 120, titleWidth: 20 }];
    expect(halfMissingSpace(1, notOverflowing, 0)).toBe(SWIMLANE_HALF_MISSING_SPACE);
  });

  it('a lane whose title overflows: half-space grows by (titleWidth - width) / 2', () => {
    // Hand-checked against pakema-21-xema183's jar (oracle/goldens/
    // svg-activity/swimlane-baseline.json): lane B's textLength=300.937
    // matches this titleWidth exactly, and the derived half-space of
    // 142.131 reproduces the jar's divider span of 310.937 for that lane.
    const result = halfMissingSpace(2, lanes, 0);
    expect(result).toBeCloseTo(5 + (300.937 - 26.675) / 2, 5);
  });

  it('references the lane adjacent to divider i (1-indexed, i - 1)', () => {
    const laneA = { contentWidth: 26.675, titleWidth: 28.338 };
    const result = halfMissingSpace(1, [laneA], 0);
    expect(result).toBeCloseTo(5 + (28.338 - 26.675) / 2, 5);
  });
});

describe('no swimlanes / empty diagram', () => {
  it('measureLaneExtents and computeLaneWidths compute nothing for an empty diagram', () => {
    const extents = measureLaneExtents([], []);
    const widths = computeLaneWidths(extents, new Map(), 0);
    expect(extents.size).toBe(0);
    expect(widths.size).toBe(0);
  });
});
