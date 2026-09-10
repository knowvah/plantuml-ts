import { describe, expect, it } from 'vitest';

import { collectSlots, overlaps } from '../../../../../src/diagrams/activity/layout/compress/slot-finder.js';
import type { CompressShape } from '../../../../../src/diagrams/activity/layout/compress/shapes-of.js';

describe('collectSlots — fork/join bar (rect, ignoreX)', () => {
  const bar: CompressShape = { kind: 'rect', x: 12, y: 55, width: 103.4, height: 6, ignoreX: true };

  it('on x: two 2-wide slots at each end, none across the middle', () => {
    const slots = collectSlots([bar], 'x').slots();
    expect(slots).toHaveLength(2);
    const starts = slots.map((s) => [s.start, s.end]).sort((a, b) => a[0]! - b[0]!);
    expect(starts).toEqual([
      [12, 14],
      [113.4, 115.4],
    ]);
    // Nothing covers the middle of the bar.
    expect(slots.some((s) => s.contains(60))).toBe(false);
  });

  it('on y: one slot over the full height (ignoreY is not set)', () => {
    const slots = collectSlots([bar], 'y').slots();
    expect(slots).toHaveLength(1);
    expect(slots[0]!.start).toBe(55);
    expect(slots[0]!.end).toBe(61);
  });
});

describe('collectSlots — swimlane title band (rect, ignoreX AND ignoreY)', () => {
  const band: CompressShape = { kind: 'rect', x: 20, y: 0, width: 349.275, height: 18, ignoreX: true, ignoreY: true };

  it('reserves 2px slots at each end on x', () => {
    const slots = collectSlots([band], 'x').slots();
    expect(slots.map((s) => [s.start, s.end])).toEqual([
      [20, 22],
      [367.275, 369.275],
    ]);
  });

  it('reserves 2px slots at each end on y', () => {
    const slots = collectSlots([band], 'y').slots();
    expect(slots.map((s) => [s.start, s.end])).toEqual([
      [0, 2],
      [16, 18],
    ]);
  });
});

describe('collectSlots — cross-lane arrowhead (polygon, polygonSkipMode: x)', () => {
  const head: CompressShape = { kind: 'polygon', x: 262.425, y: 100, width: 8, height: 10, polygonSkipMode: 'x' };

  it('contributes no x slot', () => {
    expect(collectSlots([head], 'x').slots()).toHaveLength(0);
  });

  it('still contributes a y slot', () => {
    const slots = collectSlots([head], 'y').slots();
    expect(slots).toEqual([expect.objectContaining({ start: 100, end: 110 })]);
  });
});

describe('collectSlots — plain polygon (no skip mode)', () => {
  it('occupies on both axes', () => {
    const poly: CompressShape = { kind: 'polygon', x: 10, y: 20, width: 40, height: 30 };
    expect(collectSlots([poly], 'x').slots()[0]).toMatchObject({ start: 10, end: 50 });
    expect(collectSlots([poly], 'y').slots()[0]).toMatchObject({ start: 20, end: 50 });
  });
});

describe('collectSlots — text (TextLimitFinder shift)', () => {
  const t: CompressShape = { kind: 'text', x: 4, y: 16, width: 12, height: 11 };

  it('x occupies [x, x+width]', () => {
    expect(collectSlots([t], 'x').slots()).toEqual([expect.objectContaining({ start: 4, end: 16 })]);
  });

  it('y occupies [y - height + 1.5, y + 1.5]', () => {
    expect(collectSlots([t], 'y').slots()).toEqual([expect.objectContaining({ start: 6.5, end: 17.5 })]);
  });
});

describe('collectSlots — empty (divider/hexagon reservation)', () => {
  it('a divider empty occupies x1+x2 wide, unconditionally', () => {
    const divider: CompressShape = { kind: 'empty', x: 15, y: 0, width: 10, height: 1 };
    expect(collectSlots([divider], 'x').slots()).toEqual([expect.objectContaining({ start: 15, end: 25 })]);
  });

  it('a hexagon reservation is 5 wide x 12 tall', () => {
    const hex: CompressShape = { kind: 'empty', x: 100, y: 200, width: 5, height: 12 };
    expect(collectSlots([hex], 'x').slots()).toEqual([expect.objectContaining({ start: 100, end: 105 })]);
    expect(collectSlots([hex], 'y').slots()).toEqual([expect.objectContaining({ start: 200, end: 212 })]);
  });
});

describe('collectSlots — ellipse behaves like a box', () => {
  it('occupies [x, x+width] on x', () => {
    const e: CompressShape = { kind: 'ellipse', x: 0, y: 0, width: 20, height: 20 };
    expect(collectSlots([e], 'x').slots()).toEqual([expect.objectContaining({ start: 0, end: 20 })]);
  });
});

describe('overlaps', () => {
  it('returns the index pair for two intersecting boxes', () => {
    const a: CompressShape = { kind: 'rect', x: 0, y: 0, width: 10, height: 10 };
    const b: CompressShape = { kind: 'rect', x: 5, y: 5, width: 10, height: 10 };
    expect(overlaps([a, b])).toEqual([[0, 1]]);
  });

  it('returns nothing for two disjoint boxes', () => {
    const a: CompressShape = { kind: 'rect', x: 0, y: 0, width: 10, height: 10 };
    const b: CompressShape = { kind: 'rect', x: 20, y: 20, width: 10, height: 10 };
    expect(overlaps([a, b])).toEqual([]);
  });

  it('includes ignored/empty shapes by their full box, ignoring compression flags', () => {
    const bar: CompressShape = { kind: 'rect', x: 0, y: 0, width: 10, height: 10, ignoreX: true };
    const empty: CompressShape = { kind: 'empty', x: 5, y: 5, width: 4, height: 4 };
    expect(overlaps([bar, empty])).toEqual([[0, 1]]);
  });
});
